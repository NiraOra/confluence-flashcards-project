
import Resolver from '@forge/resolver';

export type ResolverFunction = Parameters<Resolver['define']>[1];
export type ResolverRequest = Parameters<ResolverFunction>[0];

///////////////////////////////////////////////////////

export interface GenFlashcardsPair {
    question: string,
    answer: string
}

export interface ParagraphType {
    text: string
}

///////////////////////////////////////////////////////

export interface Card {
    id: string;
    owner: string;
    name?: string;
    front: string;
    back: string;
    hint: string;
    deckIds: string[];
    locked: boolean;
}

export interface Deck {
    id: string;
    title: string;
    description?: string;
    owner: string;
    name?: string;
    cards: Card[];      // 
    cardIds: string[];
    size: number;
    locked: boolean
}

export interface Tag {
    id: string;
    title: string;
    colour: string;
    owner: string;
    name?: string;
    cardIds: string[];
    deckIds: string[];
    tagIds: string[];
}

export interface User {
    id: string;
    name: string;
    cardIds: string[];
    deckIds: string[];
    tagIds: string[];
    data: { deckId: DynamicData };
}

///////////////////////////////////////////////////////

export interface DynamicData {
    dynamicDeck: Deck;
    quizSessions: QuizResult[];
    studySessions: StudyResult[];
    numTimesAttempted: number;
}

export interface QuizResult {
    date: string
    sessionId: string;
    deckInArchive: Deck;
    statusPerCard: QuizSessionCardStatus[];
    countCards: number;
    countIncomplete: number;
    countCorrect: number;
    countIncorrect: number;
    countSkip: number;
    countHints: number;
}

export interface StudyResult {
    session: string;
    deckInArchive: Deck;
}

///////////////////////////////////////////////////////

export interface SpaceSessions {
    quizSessions: string[];
    studySessions: string[];
}

export interface QuizSession {
    deckInSession: Deck;
    statusPerCard: QuizSessionCardStatus[];
    totalCardCount: number;
    currentCardIndex: number;
    sessionStartTime: number;
    hintArray: boolean[]
}

export interface StudySession {
    deckInSession: Deck;
    totalCardCount: number;
    currentCardIndex: number;
    sessionStartTime: number;
}

///////////////////////////////////////////////////////

export enum QuizSessionCardStatus {
    Incomplete = 0,
    Correct = 1,
    Incorrect = 2,
    Skip = 3,
}

export enum StudySessionCardStatus {
    Positive,
    Negative,
    Incomplete
}
