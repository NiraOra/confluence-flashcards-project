import { startsWith, storage } from '@forge/api';
import { ResolverRequest, Card, Deck, Tag } from './types';
import { generateId, initUserData, queryStorage, queryTagsForItem, 
         queryCardsById, queryDecksById, queryTagsById } from './helpers'


/**
 * Creates a new tag.
 *
 * @param {ResolverRequest} req - The request containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.title - The title of the tag.
 * @param {string} [req.payload.colour] - An optional colour for the tag.
 * @param {string[]} [req.payload.cardIds] - IDs of associated cards.
 * @param {string[]} [req.payload.deckIds] - IDs of associated decks.
 * @param {string[]} [req.payload.tagIds] - IDs of related tags.
 * @param {object} req.context - The request context.
 * @param {string} req.context.accountId - The account ID of the user creating the tag.
 * @returns {Promise<object>} An object containing success status and the created tag.
 */
export const createTag = async (req: ResolverRequest) => {
    const { title, colour, cardIds, deckIds, tagIds } = req.payload;
    const accountId = req.context.accountId;

    if (!title) {
        return {
            success: false,
            error: 'Tag title is required',
        };
    }

    initUserData(accountId);

    const tagId = `t-${generateId()}`;
    const tag: Tag = {
        id: tagId,
        title: title,
        colour: colour,
        cardIds: cardIds || [],
        deckIds: deckIds || [],
        tagIds: tagIds || [],
        owner: accountId,
    };

    await storage.set(tagId, tag);

    return {
        success: true,
        tag: tag
    };
};


/**
 * Updates an existing tag.
 *
 * @param {ResolverRequest} req - The request containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.id - The ID of the tag to update.
 * @param {string} req.payload.title - The updated title of the tag.
 * @param {string} [req.payload.colour] - The updated colour of the tag.
 * @param {string[]} [req.payload.cardIds] - The updated IDs of associated cards.
 * @param {string[]} [req.payload.deckIds] - The updated IDs of associated decks.
 * @returns {Promise<object>} An object containing success status and the updated tag.
 */
export const updateTag = async (req: ResolverRequest) => {
    const { id, title, colour, cardIds, deckIds } = req.payload;

    const existingTag = await storage.get(id);

    if (!existingTag) {
        return {
            success: false,
            error: 'Tag not found'
        };
    }

    if (!title) {
        return {
            success: false,
            error: 'Tag title is required',
        };
    }

    const updatedTag = {
        ...existingTag,
        title: title || existingTag.title,
        colour: colour || existingTag.colour,
        cardIds: cardIds || existingTag.flashcards,
        deckIds: deckIds || existingTag.decks
    };

    await storage.set(id, updatedTag);

    return {
        success: true,
        tag: updatedTag,
    };
};


/**
 * Deletes a tag.
 *
 * @param {ResolverRequest} req - The request containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.tagId - The ID of the tag to delete.
 * @returns {Promise<object>} An object containing success status and a deletion message.
 */
export const deleteTag = async (req: ResolverRequest) => {
    const { tagId } = req.payload;

    const tag = await storage.get(tagId);

    if (!tag) {
        return {
            success: false,
            error: `No tag found with id: ${tagId}`
        };
    }

    for (const relTagId of tag.tagIds) {
        const relTag = await storage.get(relTagId);
        if (relTag) {
            relTag.tagIds = relTag.tagIds.filter((id: string) => id !== tagId);
            await storage.set(relTagId, relTag);
        }
    }

    await storage.delete(tagId);

    return {
        success: true,
        message: `Deleted tag with id: ${tagId}`
    };
};


/**
 * Retrieves a tag by its ID, along with its associated cards, decks, and tags.
 *
 * @param {ResolverRequest} req - The request containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.tagId - The ID of the tag to retrieve.
 * @returns {Promise<object>} An object containing success status, the tag, and its associations.
 */
export const getTag = async (req: ResolverRequest) => {
    const { tagId } = req.payload;

    const tag = await storage.get(tagId);

    if (!tag) {
        return {
            success: false,
            error: `No tag found with id: ${tagId}`
        };
    }

    const cards = await queryCardsById(tag.cardIds);
    const decks = await queryDecksById(tag.deckIds);
    const tags = await queryTagsById(tag.tagIds);

    return {
        success: true,
        tag,
        cards,
        decks,
        tags,
    };
};


/**
 * Retrieves all tags, along with their relationships.
 *
 * @returns {Promise<object>} An object containing success status, all tags, and their relationships.
 */
export const getAllTags = async () => {
    const allTags = await queryStorage('t-') as Tag[];

    const tags: Tag[] = [];
    
    // FIXME
    const query = await storage.query().where('key', startsWith('t-')).limit(50).getMany();

    query.results.forEach(({ value }) => {
        tags.push(value as Tag);
    });


    const mapTags: Record<string, Tag[]> = {};
    allTags.forEach(tag => {
        tag.tagIds.forEach(subId => {
            if (!mapTags[subId]) {
                mapTags[subId] = [];
            }
            mapTags[subId].push(tag);
        });
    });

    return {
        success: true,
        tags,
        links: mapTags
    };
};


/**
 * Retrieves all tags associated with a specific item (card, deck, tag).
 *
 * @param {ResolverRequest} req - The request containing payload.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.itemId - The ID of the item to retrieve tags for.
 * @param {string} req.payload.itemType - The type of the item ("card", "deck", "tag").
 * @returns {Promise<object>} An object containing success status and the associated tags.
 */
export const getTagsForItem = async (req: ResolverRequest) => {
    const { itemId, itemType } = req.payload;
    try {
        const relTags = await queryTagsForItem(itemId, itemType);

        // Check if any tags were found and return them
        if (relTags.length > 0) {
            return { success: true, tags: relTags };
        } else {
            return { success: false, error: 'No tags found for this item.' };
        }
    } catch (error) {
        console.error('Error fetching tags:', error);
        return { success: false, error: 'Error fetching tags' };
    }
};


/**
 * Adds a tag to a specific card.
 *
 * @param {ResolverRequest} req - The request containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.cardId - The ID of the card to tag.
 * @param {string} req.payload.tagId - The ID of the tag to add to the card.
 * @returns {Promise<object>} An object containing success status and a confirmation message.
 */
export const addTagToCard = async (req: ResolverRequest) => {
    const { cardId, tagId } = req.payload;

    const card = await storage.get(cardId) as Card | undefined;
    const tag = await storage.get(tagId) as Tag | undefined;

    if (!card || !tag) {
        return {
            success: false,
            error: 'Item not found',
        };
    }

    if (tag.cardIds && tag.cardIds.includes(cardId)) {
        return {
            success: false,
            error: 'Item already included',
        };
    }

    tag.cardIds = [...(tag.cardIds || []), cardId];
    await storage.set(tagId, tag);

    return {
        success: true,
        message: 'Added tag to card',
    };
};


/**
 * Adds a tag to a specific deck.
 *
 * @param {ResolverRequest} req - The request containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.deckId - The ID of the deck to tag.
 * @param {string} req.payload.tagId - The ID of the tag to add to the deck.
 * @returns {Promise<object>} An object containing success status and a confirmation message.
 */
export const addTagToDeck = async (req: ResolverRequest) => {
    const { deckId, tagId } = req.payload;

    const deck = await storage.get(deckId) as Deck | undefined;
    const tag = await storage.get(tagId) as Tag | undefined;

    if (!deck || !tag) {
        return {
            success: false,
            error: 'Item not found',
        };
    }

    if (tag.deckIds && tag.deckIds.includes(deckId)) {
        return {
            success: false,
            error: 'Item already included',
        };
    }

    tag.deckIds = [...(tag.deckIds || []), deckId];
    await storage.set(tagId, tag);

    return {
        success: true,
        message: 'Added tag to deck',
    };
};


/**
 * Removes a tag from a specific card.
 *
 * @param {ResolverRequest} req - The request containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.cardId - The ID of the card to untag.
 * @param {string} req.payload.tagId - The ID of the tag to remove from the card.
 * @returns {Promise<object>} An object containing success status and a confirmation message.
 */
export const removeTagFromCard = async (req: ResolverRequest) => {
    const { cardId, tagId } = req.payload;

    const card = await storage.get(cardId) as Card | undefined;
    const tag = await storage.get(tagId) as Tag | undefined;

    if (!card || !tag) {
        return {
            success: false,
            error: 'Item not found',
        };
    }

    tag.cardIds = tag.cardIds?.filter((id: string) => id !== cardId) || [];

    await storage.set(tagId, tag);

    return {
        success: true,
        message: 'Removed tag from card',
    };
};


/**
 * Removes a tag from a specific deck.
 *
 * @param {ResolverRequest} req - The request containing payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.deckId - The ID of the deck to untag.
 * @param {string} req.payload.tagId - The ID of the tag to remove from the deck.
 * @returns {Promise<object>} An object containing success status and a confirmation message.
 */
export const removeTagFromDeck = async (req: ResolverRequest) => {
    const { deckId, tagId } = req.payload;

    const deck = await storage.get(deckId) as Deck | undefined;
    const tag = await storage.get(tagId) as Tag | undefined;

    if (!deck || !tag) {
        return {
            success: false,
            error: 'Item not found',
        };
    }

    tag.deckIds = tag.deckIds?.filter((id: string) => id !== deckId) || [];

    await storage.set(deckId, deck);

    return {
        success: true,
        message: 'Tag removed from deck',
    };
};
