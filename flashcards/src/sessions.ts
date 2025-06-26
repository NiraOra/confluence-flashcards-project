import { storage } from '@forge/api';
import { ResolverRequest, Card, Deck, DynamicData, QuizSessionCardStatus,
         QuizResult, StudyResult, QuizSession, StudySession } from './types';
import { generateId, initUserData } from './helpers'


/**
 * Starts a new quiz session for a specified deck.
 *
 * @param {ResolverRequest} req - The request object containing the payload and context.
 * @param {object} req.payload - The request payload.
 * @param {string} req.payload.deckId - The ID of the deck to start the quiz session for.
 * @param {object} req.context - The context object.
 * @param {string} req.context.accountId - The account ID of the user.
 * @returns {Promise<object>} A response object containing the quiz session details.
 */
export const startQuizSession = async (req: ResolverRequest) => {
  const { deckId } = req.payload;
  const accountId = req.context.accountId;

  const user = await initUserData(accountId);
  if (!(deckId in user.data)) {
    const newDynamicDataObj: DynamicData = {
      dynamicDeck: await storage.get(deckId),
      quizSessions: [],
      studySessions: [],
      numTimesAttempted: 0
    }
    user.data[deckId] = newDynamicDataObj;
  }
  await storage.set(`u-${accountId}`, user);

  const quizDeck : Deck = user.data[deckId].dynamicDeck;
  if (!quizDeck) {
    return {
      success: false,
      error: 'Deck not found.',
    };
  }
  const newDeck = await storage.get(deckId) as Deck | undefined;
  if (!newDeck) {
    return {
      success: false,
      error: 'Deck not found.',
    }
  }

  const newDeckCardIdSet = new Set(newDeck.cards.map(card => card.id));
  quizDeck.cards = quizDeck.cards.filter(card => newDeckCardIdSet.has(card.id));
  const quizDeckCardIdSet = new Set(quizDeck.cards.map(card => card.id));

  // loop through new deck and add cards not in quiz
  for (const newCard of newDeck.cards) {
    if (!quizDeckCardIdSet.has(newCard.id)) {
      quizDeck.cards.push(newCard);
      quizDeckCardIdSet.add(newCard.id);
    }
  }

  const totalCards = quizDeck.cards.length;
  if (totalCards == 0) {
    return {
      success: false,
      error: 'No cards in deck'
    }
  }

  const statusPerCardArray: QuizSessionCardStatus[] = Array(totalCards).fill(QuizSessionCardStatus.Incomplete);
  const initialHintArray: boolean[] = Array(totalCards).fill(false);

  // create a new quiz session
  const sessionId = `q-${generateId()}`;
  const newSession: QuizSession = {
    deckInSession: quizDeck,
    totalCardCount: totalCards,
    currentCardIndex: 0,
    statusPerCard: statusPerCardArray,
    hintArray: initialHintArray,
    sessionStartTime: Date.now()
  }

  await storage.set(sessionId, newSession);

  return {
    success: true,
    session: newSession,
    sessionId: sessionId,
    cards: quizDeck.cards,
    firstIndex: 0
  }
};


/**
 * Updates the status of a card during an ongoing quiz session.
 *
 * @param {ResolverRequest} req - The request object containing the payload and context.
 * @param {object} req.payload - The request payload.
 * @param {number} req.payload.currentIndex - The index of the current card in the quiz session.
 * @param {string} req.payload.status - The status to update ('skip', 'hint', 'correct', 'incorrect').
 * @param {string} req.payload.sessionId - The ID of the quiz session.
 * @returns {Promise<object>} A response object with the updated session details or an error message.
 */
export const updateCardStatusQuiz = async (req: ResolverRequest) => {
  const { currentIndex, status, sessionId } = req.payload;

  const session = await storage.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: `No session found with id: ${sessionId}`
      };
    }

  if (currentIndex >= session.totalCardCount) {
    return {
      success: false,
      error: 'Index beyond bounds'
    }
  }

  if (status == 'skip') {
    session.statusPerCard[currentIndex] = QuizSessionCardStatus.Skip;
  } else if (status == 'hint') {
    session.hintArray[currentIndex] = true;
  } else if (status == 'correct') {
    session.statusPerCard[currentIndex] = QuizSessionCardStatus.Correct;
  } else if (status == 'incorrect') {
    session.statusPerCard[currentIndex] = QuizSessionCardStatus.Incorrect;
  }
  
  await storage.set(sessionId, session);

  // complete quiz or send next card in deck
  let newIndex = currentIndex + 1;
  if (newIndex == session.totalCardCount && status != 'hint') {
    return {
      success: true,
      message: 'Quiz complete'
    }
  } else {
    if (status == 'hint') {
      newIndex = newIndex - 1;
    }
    session.currentCardIndex = newIndex;

    await storage.set(sessionId, session);

    return {
      success: true,
      nextIndex: newIndex,
      nextCardId: session.deckInSession.cards?.[newIndex].id,
      sessionId: sessionId,
      session: session,
      state: status
    }
  }
};


/**
 * Ends an ongoing quiz session and archives the session results.
 *
 * @param {ResolverRequest} req - The request object containing the payload and context.
 * @param {object} req.payload - The request payload.
 * @param {string} req.payload.sessionId - The ID of the quiz session to end.
 * @returns {Promise<object>} A response object containing the archived session results.
 */
export const endQuizSession = async (req: ResolverRequest) => {
  const { sessionId } = req.payload;

  const session = await storage.get(sessionId);
  if (!session) {
    return {
      success: false,
      error: `No session found with id: ${sessionId}`
    };
  }

  const currentDate: Date = new Date();
  const dateString: string = currentDate.toDateString();

  // create a new quiz result
  const newQuizResult: QuizResult = {
    date: dateString,
    sessionId: sessionId,  
    deckInArchive: session.deckInSession,
    statusPerCard: session.statusPerCard,
    countCards: session.totalCardCount,
    countIncomplete: session.statusPerCard.filter((status: QuizSessionCardStatus) => status === QuizSessionCardStatus.Incomplete).length,
    countIncorrect: session.statusPerCard.filter((status: QuizSessionCardStatus) => status === QuizSessionCardStatus.Incorrect).length,
    countCorrect: session.statusPerCard.filter((status: QuizSessionCardStatus) => status === QuizSessionCardStatus.Correct).length,
    countHints: session.hintArray.filter((element: boolean) => element === true).length,
    countSkip: session.statusPerCard.filter((status: QuizSessionCardStatus) => status === QuizSessionCardStatus.Skip).length,
  }

  const accountId = req.context.accountId;
  if (!accountId) {
      return {
          success: false,
          message: 'No user',
      };
  }
  
  const user = await initUserData(accountId);
  const deckId = session.deckInSession.id;
  if (!(deckId in user.data)) {
    const newDynamicDeck: DynamicData = {
      dynamicDeck: session.deckInSession,
      quizSessions: [],
      studySessions: [],
      numTimesAttempted: 0
    }
    user.data[deckId] = newDynamicDeck
  }

  user.data[deckId].quizSessions.push(newQuizResult);
  if (!session.deckInSession.cards) {
    return {
      success: false,
      error: 'Deck not found'
    }
  }

  // sort deck by card status
  session.deckInSession.cards.sort((a: Card, b: Card) => {
    const indexA = session.deckInSession.cards.findIndex((card: Card) => card.id === a.id);
    const indexB = session.deckInSession.cards.findIndex((card: Card) => card.id === b.id);
    const hintA = session.hintArray[indexA];
    const hintB = session.hintArray[indexB];
    const statusA = session.statusPerCard[indexA] as QuizSessionCardStatus;
    const statusB = session.statusPerCard[indexB] as QuizSessionCardStatus;
    if (statusA !== statusB) {
      return statusB - statusA;
    }
    if (hintA !== hintB) {
      return hintB - hintA;
    }
    return indexA - indexB;
  });

  // retrieve sorted deck when user starts new session
  user.data[deckId].dynamicDeck = session.deckInSession;
  user.data[deckId].numTimesAttempted += 1;

  await storage.delete(sessionId);
  await storage.set(`u-${accountId}`, user);

  return {
    success: true,
    session: session,
    message: 'successful',
    num_attempt: user.data[deckId].numTimesAttempted,
    cards: session.deckInSession.cards,
    countCorrect: newQuizResult.countCorrect,
    countIncorrect: newQuizResult.countIncorrect,
    countSkip: newQuizResult.countSkip,
    countHint: newQuizResult.countHints
  }
};


/**
 * Retrieves the results of a past quiz session for a specific deck and index.
 *
 * @param {ResolverRequest} req - The request object containing the payload and context.
 * @param {object} req.payload - The request payload.
 * @param {string} req.payload.deckId - The ID of the deck whose quiz results are requested.
 * @param {number} req.payload.index - The index of the quiz session in the deck's session history.
 * @returns {Promise<object>} A response object containing the quiz session results.
 */
export const viewQuizResults = async(req: ResolverRequest) => {
  const { deckId, index } = req.payload;
  const accountId = req.context.accountId;
  const user = await initUserData(accountId);

  if (!user.data || !user.data[deckId]) {
    return {
      success: false,
      error: 'No quiz completed'
    }
  }

  if (!user.data[deckId].quizSessions || user.data[deckId].quizSessions.length === 0) {
    return {
      success: false,
      error: 'Session not accessible'
    }
  }

  if (index >= user.data[deckId].quizSessions.length) {
    return {
      success: false,
      error: 'Index beyond bounds'
    }
  }

  const quizResultArray: QuizResult[] = user.data[deckId].quizSessions;
  const quiz: QuizResult = quizResultArray[index];

  return {
    success: true,
    date: quiz.date,
    numCorrect: quiz.countCorrect,
    numIncorrect: quiz.countIncorrect,
    numHint: quiz.countHints,
    numSkip: quiz.countSkip
  }
};


/**
 * Starts a new study session for a specified deck.
 *
 * @param {ResolverRequest} req - The request object containing the payload and context.
 * @param {object} req.payload - The request payload.
 * @param {string} req.payload.deckId - The ID of the deck to start the study session for.
 * @returns {Promise<object>} A response object containing the study session details.
 */
export const startStudySession = async (req: ResolverRequest) => {
  const { deckId } = req.payload;
  const accountId = req.context.accountId;

  const user = await initUserData(accountId);
  if (!(deckId in user.data)) {
    const newDynamicDataObj: DynamicData = {
      dynamicDeck: await storage.get(deckId),
      quizSessions: [],
      studySessions: [],
      numTimesAttempted: 0
    }
    user.data[deckId] = newDynamicDataObj;
  }

  await storage.set(`u-${accountId}`, user);

  const studyDeck = user.data[deckId].dynamicDeck;
  if (!studyDeck) {
    return {
        success: false,
        error: 'Deck not found',
    };
  }

  const totalCards = studyDeck.cards.length;
  if (totalCards == 0) {
    return {
      success: false, 
      error: 'No cards in deck'
    }
  }

  const sessionId = `ss-${generateId()}`;
  const newStudySession: StudySession = {
    deckInSession: studyDeck,
    totalCardCount: totalCards,
    currentCardIndex: 0,
    sessionStartTime: Date.now()
  }

  await storage.set(sessionId, newStudySession);

  return {
    success: true,
    sessionId: sessionId,
    session: newStudySession,
    firstCardId: studyDeck.cards?.[0].id,
    firstIndex: 0,
    cards: studyDeck.cards,
  }
};


/**
 * Moves to the next card in a study session.
 *
 * @param {ResolverRequest} req - The request object containing the payload and context.
 * @param {object} req.payload - The request payload.
 * @param {number} req.payload.currentIndex - The index of the current card in the study session.
 * @param {string} req.payload.sessionId - The ID of the study session.
 * @returns {Promise<object>} A response object with the index of the next card.
 */
export const nextCardStudy = async (req: ResolverRequest) => {
  const { currentIndex, sessionId } = req.payload;

  const session = await storage.get(sessionId);
  if (!session) {
    return {
      success: false,
      error: `No session found with id: ${sessionId}`
    };
  }

  if (currentIndex >= session.totalCardCount) {
    return {
      success: false,
      error: 'Index beyond bounds'
    }
  }

  let newIndex = currentIndex + 1
  if (newIndex == session.totalCardCount) {
    newIndex = 0;
  }
  session.currentCardIndex = newIndex;

  await storage.set(sessionId, session);

  return {
    success: true,
    newIndex: newIndex,
  }
};


/**
 * Moves to the previous card in a study session.
 *
 * @param {ResolverRequest} req - The request object containing the payload and context.
 * @param {object} req.payload - The request payload.
 * @param {number} req.payload.currentIndex - The index of the current card in the study session.
 * @param {string} req.payload.sessionId - The ID of the study session.
 * @returns {Promise<object>} A response object with the index of the previous card.
 */
export const prevCardStudy = async (req: ResolverRequest) => {
  const { currentIndex, sessionId } = req.payload;

  const session = await storage.get(sessionId);
  if (!session) {
    return {
      success: false,
      error: `No session found with id: ${sessionId}`
    };
  }

  if (currentIndex >= session.totalCardCount) {
    return {
      success: false,
      error: 'Index beyond bounds'
    }
  }

  let newIndex = currentIndex - 1
  if (newIndex < 0) {
    newIndex = session.totalCardCount - 1;
  }
  session.currentCardIndex = newIndex;
  
  await storage.set(sessionId, session);

  return {
    success: true,
    newIndex: newIndex,
  }
};


/**
 * Ends an ongoing study session and archives the session results.
 *
 * @param {ResolverRequest} req - The request object containing the payload and context.
 * @param {object} req.payload - The request payload.
 * @param {string} req.payload.sessionId - The ID of the study session to end.
 * @returns {Promise<object>} A response object containing the archived session results.
 */
export const endStudySession = async (req: ResolverRequest) => {
  const { sessionId } = req.payload

  const session = await storage.get(sessionId);
  if (!session) {
    return {
      success: false,
      error: `No session found with id: ${sessionId}`
    };
  }
  
  const newStudyResult: StudyResult = {
    session: session,  
    deckInArchive: session.deckInSession,
  }

  const accountId = req.context.accountId;
  if (!accountId) {
      return {
          success: false,
          message: 'No user',
      };
  }

  const user = await initUserData(accountId);
  
  const deckId = session.deckInSession.id;
  if (!(deckId in user.data)) {
    const newDynamicDeck: DynamicData = {
      dynamicDeck: session.deckInSession,
      quizSessions: [],
      studySessions: [],
      numTimesAttempted: 0
    }
    user.data[deckId] = newDynamicDeck
  } else {
    user.data[deckId].dynamicDeck = session.deckInSession
  }
  user.data[deckId].studySessions.push(newStudyResult);

  await storage.set(`u-${accountId}`, user);
  await storage.delete(sessionId);

  return {
    success: true,
    session: session
  }
};
