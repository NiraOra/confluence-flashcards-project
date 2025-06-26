import { storage } from '@forge/api';
import { ResolverRequest, Card, Deck, Tag } from './types';
import { generateId, getUserName, initUserData, queryTagsById, queryStorage } from './helpers'


/**
 * Creates a new deck.
 *
 * @param {ResolverRequest} req - The request object containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.title - The title of the deck.
 * @param {string} [req.payload.description] - An optional description for the deck.
 * @param {Card[]} [req.payload.cards] - Optional flashcards to include in the deck.
 * @param {boolean} req.payload.locked - Whether the deck is locked.
 * @param {object} req.context - The request context.
 * @param {string} req.context.accountId - The account ID of the user creating the deck.
 * @returns {Promise<object>} An object containing success status, deck ID, and the created deck.
 */
export const createDeck = async (req: ResolverRequest) => {
    const { title, description, cards: flashcards, locked } = req.payload as Omit<Deck, 'id'>;
    const accountId = req.context.accountId;

    if (!title || !accountId) {
        return {
            success: false,
            error: 'Invalid input: title required',
        };
    }

    initUserData(accountId);
    const user = await getUserName(accountId);

    const deckId = `d-${generateId()}`;
    const deck: Deck = {
        id: deckId,
        title,
        description,
        owner: accountId,
        name: user,
        cards: flashcards || [],
        cardIds: [],
        size: 0,
        locked
    };

    await storage.set(deckId, deck);

    return {
        success: true,
        id: deckId,
        deck: deck,
    };
};


/**
 * Updates an existing deck.
 *
 * @param {ResolverRequest} req - The request object containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.id - The ID of the deck to update.
 * @param {string} req.payload.title - The updated title of the deck.
 * @param {string} [req.payload.description] - The updated description of the deck.
 * @param {Card[]} [req.payload.cards] - The updated flashcards in the deck.
 * @param {string} req.payload.owner - The owner ID of the deck.
 * @returns {Promise<object>} An object containing success status and the updated deck.
 */

export const updateDeck = async (req: ResolverRequest) => {
    const { id, title, description, owner, cards } = req.payload as Deck;

    const existingDeck = await storage.get(id) as Deck | undefined;
    if (!existingDeck) {
        return {
            success: false,
            error: 'Deck Not found',
        };
    }

    if (req.context.accountId && req.context.accountId != existingDeck.owner && existingDeck.locked) {
        return {
            success: false,
            error: "Only owner can edit"
        }
    }

    if (!title) {
        return {
            success: false,
            error: 'Invalid input: title required',
        };
    }

    const updatedDeck: Deck = {
        ...existingDeck,
        title: title || existingDeck.title,
        description: description || existingDeck.description,
        cards: cards || existingDeck.cards
    };

    await storage.set(id, updatedDeck);

    return {
        success: true,
        deck: updatedDeck,
    };
};


/**
 * Deletes a deck.
 *
 * @param {ResolverRequest} req - The request object containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.deckId - The ID of the deck to delete.
 * @returns {Promise<object>} An object containing success status and a deletion message.
 */
export const deleteDeck = async (req: ResolverRequest) => {
    const { deckId } = req.payload;

    const deck = await storage.get(deckId);
    if (!deck) {
        return {
            success: false,
            error: `No deck found with id: ${deckId}`,
        };
    }

    if (req.context.accountId && req.context.accountId != deck.owner && deck.locked) {
        return {
            success: false,
            error: "Only owner can delete"
        }
    }

    const tags = await queryTagsById(deck.tagIds || []);
    for (const tag of tags) {
        tag.deckIds = tag.deckIds.filter(id => id !== deckId);
        await storage.set(tag.id, tag);
    }

    const user = await storage.get(deck.owner);
    if (user) {
        user.deckIds = user.deckIds.filter((id: string) => id !== deckId);
        await storage.set(user.id, user);
    }

    await storage.delete(deckId);

    return {
        success: true,
        message: `Deleted deck with id: ${deckId}`,
    };
};


/**
 * Retrieves a single deck by its ID.
 *
 * @param {ResolverRequest} req - The request object containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.deckId - The ID of the deck to retrieve.
 * @returns {Promise<object>} An object containing success status and the retrieved deck.
 */
export const getDeck = async (req: ResolverRequest) => {
    const { deckId } = req.payload;

    const deck = await storage.get(deckId) as Deck | undefined;
    if (!deck) {
        return {
            success: false,
            error: `No deck found with id: ${deckId}`,
        };
    }

    return {
        success: true,
        deck,
    };
};


/**
 * Retrieves all decks and their associated tags.
 *
 * @param {ResolverRequest} req - The request object.
 * @returns {Promise<object>} An object containing success status, all decks, and their tags.
 */
export const getAllDecks = async (req: ResolverRequest) => {
    const allDecks = await queryStorage('d-') as Deck[];
    const allTags = await queryStorage('t-') as Tag[];

    const mapTags: Record<string, Tag[]> = {};
    allTags.forEach(tag => {
        tag.deckIds.forEach(deckId => {
            if (!mapTags[deckId]) {
                mapTags[deckId] = [];
            }
            mapTags[deckId].push(tag);
        });
    });

    return {
        success: true,
        decks: allDecks,
        tags: mapTags
    };
};


/**
 * Adds a card to a specified deck.
 *
 * @param {ResolverRequest} req - The request object containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.deckId - The ID of the deck to add the card to.
 * @param {string} req.payload.cardId - The ID of the card to add to the deck.
 * @returns {Promise<object>} An object containing success status and a confirmation message.
 */
export const addCardToDeck = async (req: ResolverRequest) => {
    const { deckId, cardId } = req.payload;

    const deck = await storage.get(deckId) as Deck | undefined;
    const card = await storage.get(cardId) as Card | undefined;

    if (!deck || !card) {
        return {
            success: false,
            error: 'Item not found',
        };
    }

    if (deck.cardIds && deck.cardIds.includes(cardId)) {
        return {
            success: false,
            error: 'Item already included',
        };
    }

    if (req.context.accountId && req.context.accountId != deck.owner && deck.locked) {
        return {
            success: false,
            error: "Only owner can edit"
        }
    }

    deck.cards = [...(deck.cards || []), card];
    deck.cardIds = [...(deck.cardIds || []), cardId];
    card.deckIds = [...(card.deckIds || []), deckId];

    await storage.set(deckId, deck);

    return {
        success: true,
        message: 'Added card to deck',
    };
};


/**
 * Removes a card from a specified deck.
 *
 * @param {ResolverRequest} req - The request object containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.deckId - The ID of the deck to remove the card from.
 * @param {string} req.payload.cardId - The ID of the card to remove from the deck.
 * @returns {Promise<object>} An object containing success status and a confirmation message.
 */
export const removeCardFromDeck = async (req: ResolverRequest) => {
    const { deckId, cardId } = req.payload;

    const deck = await storage.get(deckId) as Deck | undefined;
    const card = await storage.get(cardId) as Card | undefined;

    if (!deck || !card) {
        return {
            success: false,
            error: 'Item not found',
        };
    }

    if (req.context.accountId && req.context.accountId != deck.owner && deck.locked) {
        return {
            success: false,
            error: "Only owner can edit"
        }
    }

    deck.cards = deck.cards?.filter(c => c.id !== cardId) || [];
    deck.cardIds = deck.cardIds?.filter(id => id !== cardId) || [];
    card.deckIds = card.deckIds?.filter(id => id !== deckId) || [];

    await storage.set(deckId, deck);

    return {
        success: true,
        message: 'Removed card from deck',
    };
};
