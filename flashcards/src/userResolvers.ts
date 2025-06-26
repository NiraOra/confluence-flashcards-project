import { storage } from '@forge/api';
import { ResolverRequest } from './types'
import { queryCardsById, queryDecksById, queryTagsById } from './helpers'


/**
 * Fetches all cards associated with the user identified by the account ID.
 *
 * @param {ResolverRequest} req - The request object containing payload and context.
 * @param {object} req.context - The request context.
 * @param {string} req.context.accountId - The account ID of the user.
 * @returns {Promise<object>} A response object indicating success or failure.
 *                            On success, includes an array of user cards.
 */
export const fetchUserCards = async (req: ResolverRequest) => {
    const { accountId } = req.context;
    if (!accountId) {
        return {
            success: false,
            message: 'Error!',
        };
    }

    const user = await storage.get(accountId);
    if (!user || !user.cardIds) {
        return {
            success: false,
            message: 'No card data for user',
        };
    }

    const cards = await queryCardsById(user.cardIds);
    return {
        success: true,
        cards
    };
};


/**
 * Fetches all decks associated with the user identified by the account ID.
 *
 * @param {ResolverRequest} req - The request object containing payload and context.
 * @param {object} req.context - The request context.
 * @param {string} req.context.accountId - The account ID of the user.
 * @returns {Promise<object>} A response object indicating success or failure.
 *                            On success, includes an array of user decks.
 */
export const fetchUserDecks = async (req: ResolverRequest) => {
    const { accountId } = req.context;
    if (!accountId) {
        return {
            success: false,
            message: 'Error!',
        };
    }

    const user = await storage.get(accountId);
    if (!user || !user.deckIds) {
        return {
            success: false,
            message: 'No deck data for user',
        };
    }

    const decks = await queryDecksById(user.deckIds);
    return {
        success: true,
        decks
    };
};


/**
 * Fetches all tags associated with the user identified by the account ID.
 *
 * @param {ResolverRequest} req - The request object containing payload and context.
 * @param {object} req.context - The request context.
 * @param {string} req.context.accountId - The account ID of the user.
 * @returns {Promise<object>} A response object indicating success or failure.
 *                            On success, includes an array of user tags.
 */
export const fetchUserTags = async (req: ResolverRequest) => {
    const { accountId } = req.context;
    if (!accountId) {
        return {
            success: false,
            message: 'Error!',
        };
    }

    const user = await storage.get(accountId);
    if (!user || !user.tagIds) {
        return {
            success: false,
            message: 'No tag data for user',
        };
    }

    const tags = await queryTagsById(user.tagIds);
    return {
        success: true,
        tags
    };
};
