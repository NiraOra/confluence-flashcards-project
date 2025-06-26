import Resolver from '@forge/resolver';
import {
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
  getFlashcard,
  getAllFlashcards,
} from './cardResolvers';
import {
  createDeck,
  updateDeck,
  deleteDeck,
  getDeck,
  getAllDecks,
  addCardToDeck,
  removeCardFromDeck,
} from './deckResolvers';
import {
  createTag,
  updateTag,
  deleteTag,
  getTag,
  getAllTags,
  getTagsForItem,
  addTagToCard,
  addTagToDeck,
  removeTagFromCard,
  removeTagFromDeck,
} from './tagResolvers';
import {
  fetchUserCards,
  fetchUserDecks,
  fetchUserTags,
} from './userResolvers';
import {
  getAllContent,
  generateQA,
  addGeneratedFlashcards,
  getGeneratedDeckTitle,
} from './aiResolvers';
import {
  startQuizSession,
  endQuizSession,
  updateCardStatusQuiz,
  viewQuizResults,
  startStudySession,
  endStudySession,
  nextCardStudy,
  prevCardStudy,
} from './sessions';

///////////////////////////////////////////////////////////////////////////////////

const resolver = new Resolver();

resolver.define('getModule', async (req) => {
  const { moduleKey } = req.context;
  return { moduleKey };
});

resolver.define('createFlashcard', createFlashcard);
resolver.define('updateFlashcard', updateFlashcard);
resolver.define('deleteFlashcard', deleteFlashcard);
resolver.define('getFlashcard', getFlashcard);
resolver.define('getAllFlashcards', getAllFlashcards);

resolver.define('createDeck', createDeck);
resolver.define('updateDeck', updateDeck);
resolver.define('deleteDeck', deleteDeck);
resolver.define('getDeck', getDeck);
resolver.define('getAllDecks', getAllDecks);
resolver.define('addCardToDeck', addCardToDeck);
resolver.define('removeCardFromDeck', removeCardFromDeck);

resolver.define('createTag', createTag);
resolver.define('updateTag', updateTag);
resolver.define('deleteTag', deleteTag);
resolver.define('getTag', getTag);
resolver.define('getAllTags', getAllTags);
resolver.define('getTagsForItem', getTagsForItem);
resolver.define('addTagToCard', addTagToCard);
resolver.define('addTagToDeck', addTagToDeck);
resolver.define('removeTagFromCard', removeTagFromCard);
resolver.define('removeTagFromDeck', removeTagFromDeck);

resolver.define('fetchUserCards', fetchUserCards);
resolver.define('fetchUserDecks', fetchUserDecks);
resolver.define('fetchUserTags', fetchUserTags);

resolver.define('getAllContent', getAllContent);
resolver.define('generateQA', generateQA);
resolver.define('addGeneratedFlashcards', addGeneratedFlashcards);
resolver.define('getGeneratedDeckTitle', getGeneratedDeckTitle);

resolver.define('startQuizSession', startQuizSession);
resolver.define('endQuizSession', endQuizSession);
resolver.define('updateCardStatusQuiz',updateCardStatusQuiz);
resolver.define('viewQuizResults', viewQuizResults);

resolver.define('startStudySession', startStudySession);
resolver.define('endStudySession', endStudySession);
resolver.define('nextCardStudy', nextCardStudy);
resolver.define('prevCardStudy', prevCardStudy);

///////////////////////////////////////////////////////////////////////////////////

export const handler = resolver.getDefinitions();
