import { startsWith, storage } from '@forge/api';
import { ResolverRequest, Card, Deck, Tag } from './types';
import { generateId, getUserName, initUserData, 
         queryDecksById, queryTagsById, queryStorage } from './helpers'


/**
 * Creates a new flashcard.
 *
 * @param {ResolverRequest} req - The request containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.front - The front text of the flashcard.
 * @param {string} req.payload.back - The back text of the flashcard.
 * @param {string} [req.payload.hint] - An optional hint for the flashcard.
 * @param {boolean} req.payload.locked - Whether the flashcard is locked.
 * @param {object} req.context - The request context.
 * @param {string} req.context.accountId - The account ID of the user.
 * @returns {Promise<object>} The created flashcard and success status.
 */
export const createFlashcard = async (req: ResolverRequest) => {
  const { front, back, hint, locked } = req.payload;
  const accountId = req.context.accountId;
  if (!front || !back) {
    return {
      success: false,
      error: 'Invalid input: front and back required',
    };
  }

  initUserData(accountId);
  const name = await getUserName(accountId);

  const cardId = `c-${generateId()}`;
  const card = {
    id: cardId,
    owner: accountId,
    name: name,
    front,
    back,
    hint,
    locked,
  };

  await storage.set(cardId, card);

  return {
    success: true,
    id: cardId,
    card: card,
  };
};


/**
 * Updates an existing flashcard.
 *
 * @param {ResolverRequest} req - The request containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.id - The ID of the flashcard to update.
 * @param {string} req.payload.front - The updated front text of the flashcard.
 * @param {string} req.payload.back - The updated back text of the flashcard.
 * @param {string} [req.payload.hint] - The updated hint for the flashcard.
 * @param {string} req.payload.owner - The owner ID of the flashcard.
 * @param {boolean} req.payload.locked - Whether the flashcard is locked.
 * @param {object} req.context - The request context.
 * @returns {Promise<object>} The updated flashcard and success status.
 */
export const updateFlashcard = async (req: ResolverRequest) => {
  const { id, front, back, hint, owner, locked } = req.payload as Card;

  const existingCard = await storage.get(id) as Card | undefined;
  if (!existingCard) {
    return {
      success: false,
      error: 'Card not found'
    };
  }

  if (req.context.accountId && req.context.accountId != existingCard.owner && existingCard.locked) {
    return {
      success: false,
      error: "Only owner can edit"
    }
  }

  if (!front || !back) {
    return {
      success: false,
      error: 'Invalid input: front and back required',
    };
  }

  const updatedCard: Card = {
    ...existingCard,
    front: front || existingCard.front,
    back: back || existingCard.back,
    hint: hint || existingCard.hint,
  };

  await storage.set(id, updatedCard);

  const decksResult = await storage.query().where('key', startsWith('d-')).getMany();
  if (!decksResult) {
    return {
      success: true,
      card: updatedCard,
    };
  }

  for (const { value } of decksResult.results) {
    const deck = value as Deck;
    const cardIndex = deck.cards?.findIndex(c => c.id === id);
    if (cardIndex !== undefined && cardIndex >= 0 && deck.cards) {
      deck.cards[cardIndex] = updatedCard;
      await storage.set(deck.id, deck);
    }
  }

  return {
    success: true,
    card: updatedCard
  };
};


/**
 * Deletes a flashcard.
 *
 * @param {ResolverRequest} req - The request containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.cardId - The ID of the flashcard to delete.
 * @param {object} req.context - The request context.
 * @param {string} req.context.accountId - The account ID of the user.
 * @returns {Promise<object>} Success status and deletion message.
 */
export const deleteFlashcard = async (req: ResolverRequest) => {
  const { cardId } = req.payload;

  const card = await storage.get(cardId);
  if (!card) {
    return {
      success: false,
      error: `No card found with id: ${cardId}`
    };
  }

  if (req.context.accountId && req.context.accountId != card.owner && card.locked) {
    return {
      success: false,
      error: "Only owner can delete"
    }
  }

  const decks = await queryDecksById(card.deckIds || []);
  for (const deck of decks) {
    deck.cardIds = deck.cardIds.filter(id => id !== cardId);
    await storage.set(deck.id, deck);
  }

  const tags = await queryTagsById(card.tagIds || []);
  for (const tag of tags) {
    tag.cardIds = tag.cardIds.filter(id => id !== cardId);
    await storage.set(tag.id, tag);
  }

  const user = await storage.get(card.owner);
  if (user) {
    user.cardIds = user.cardIds.filter((id: string) => id !== cardId);
    await storage.set(user.id, user);
  }

  await storage.delete(cardId);

  return {
    success: true,
    message: `Deleted card with id: ${cardId}`
  };
};


/**
 * Retrieves a single flashcard by its ID.
 *
 * @param {ResolverRequest} req - The request containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.cardId - The ID of the flashcard to fetch.
 * @returns {Promise<object>} The flashcard data and success status.
 */
export const getFlashcard = async (req: ResolverRequest) => {
  const { cardId } = req.payload;

  const card = await storage.get(cardId) as Card | undefined;
  if (!card) {
    return {
      success: false,
      error: `No card found with id: ${cardId}`
    };
  }

  return {
    success: true,
    card
  };
};


/**
 * Retrieves all flashcards and their associated tags.
 *
 * @param {ResolverRequest} req - The request object.
 * @returns {Promise<object>} All flashcards, their tags, and success status.
 */
export const getAllFlashcards = async (req: ResolverRequest) => {
  const allCards = await queryStorage('c-') as Card[];
  const allTags = await queryStorage('t-') as Tag[];

  const mapTags: Record<string, Tag[]> = {};
  allTags.forEach(tag => {
    tag.cardIds.forEach(cardId => {
      if (!mapTags[cardId]) {
        mapTags[cardId] = [];
      }
      mapTags[cardId].push(tag);
    });
  });

  return {
    success: true,
    cards: allCards,
    tags: mapTags
  };
};
