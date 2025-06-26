import api, { route, startsWith, storage } from '@forge/api';
import { Card, Deck, Tag, User } from './types';
import { v4 as uuidv4 } from 'uuid';


// Generates a unique identifier.
// No parameters. Returns a string UUID.
export const generateId = () => uuidv4();


// Clears all data from storage.
// No parameters. Returns nothing.
export const clearStorage = async (): Promise<void> => {
    let cursor = '';

    while (true) {
        const { results, nextCursor } = await storage
            .query()
            .limit(25)
            .cursor(cursor)
            .getMany();
        if (results.length === 0) {
            break;
        }
        for (const item of results) {
            await storage.delete(item.key);
            console.log(`Deleted key: ${item.key}`);
        }
        cursor = nextCursor ?? '';
        if (!nextCursor) {
            break;
        }
    }

    console.log(`Data cleared!`)
};


// Queries storage for items with keys matching a given prefix.
// Takes a string prefix. Returns an array of items (Card, Deck, Tag, User).
export const queryStorage = async (prefix: string): Promise<(Card | Deck | Tag | User)[]> => {
    let cursor = '';
    let result: (Card | Deck | Tag | User)[] = [];
    while (true) {
        const { results, nextCursor } = await storage
            .query()
            .where("key", startsWith(prefix))
            .limit(25)
            .cursor(cursor)
            .getMany();
        if (results.length === 0) {
            break;
        } else {
            cursor = nextCursor ?? '';
            result.push(...results.map(r => r.value as Card | Deck | Tag | User));
        }
    }
    return result;
};


// Retrieves the public name of a user from Confluence based on their account ID.
// Takes a string accountId. Returns a string username or "unknown".
export const getUserName = async (accountId: string) => {
    if (!accountId) {
        return "unknown";
    }

    const bodyData = JSON.stringify({
        accountIds: [accountId],
    });

    const response = await api.asApp().requestConfluence(route`/wiki/api/v2/users-bulk`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: bodyData
    });

    if (response.status === 200) {
        const data = await response.json();
        return data.results?.[0]?.publicName || "unknown";
    } else {
        return "unknown";
    }
};


// Initialises a user's data in storage if it does not already exist.
// Takes a string accountId. Returns the existing or created user object.
export const initUserData = async (accountId: string) => {
    const userDataKey = `u-${accountId}`;
    const existingUser = await storage.get(userDataKey);

    if (!existingUser) {
        const newUser = {
            id: userDataKey,
            name: getUserName,
            deckIds: [],
            cardIds: [],
            tagIds: [],
            data: {}
        };

        await storage.set(userDataKey, newUser);
        return newUser;
    }

    return existingUser;
};


// Retrieves cards from storage based on their IDs.
// Takes an array of string cardIds. Returns an array of Card objects.
export const queryCardsById = async (cardIds: string[]): Promise<Card[]> => {
    const cards: Card[] = [];

    for (const cardId of cardIds) {
        const card = await storage.get(cardId);
        if (card) {
            cards.push(card);
        }
    }

    return cards;
};


// Retrieves decks from storage based on their IDs.
// Takes an array of string deckIds. Returns an array of Deck objects.
export const queryDecksById = async (deckIds: string[]): Promise<Deck[]> => {
    const decks: Deck[] = [];

    for (const deckId of deckIds) {
        const deck = await storage.get(deckId);
        if (deck) {
            decks.push(deck);
        }
    }

    return decks;
};


// Retrieves tags from storage based on their IDs.
// Takes an array of string tagIds. Returns an array of Tag objects.
export const queryTagsById = async (tagIds: string[]): Promise<Tag[]> => {
    const tags: Tag[] = [];

    for (const tagId of tagIds) {
        const tag = await storage.get(tagId);
        if (tag) {
            tags.push(tag);
        }
    }

    return tags;
};


// Retrieves users from storage based on their IDs.
// Takes an array of string userIds. Returns an array of User objects.
export const queryUsersById = async (userIds: string[]): Promise<User[]> => {
    const users: User[] = [];

    for (const userId of userIds) {
        const user = await storage.get(userId);
        if (user) {
            users.push(user);
        }
    }

    return users;
};


// Filters tags associated with a specific item (card, deck, tag).
// Takes a string itemId and a string itemType ("card", "deck", "tag"). Returns an array of Tag objects.
export const queryTagsForItem = async (itemId: string, itemType: string) => {
    try {
        const allTags = await queryStorage('t-') as Tag[];
        const relTags = allTags.filter(tag =>
            (itemType === 'card' && tag.cardIds.includes(itemId)) ||
            (itemType === 'deck' && tag.deckIds.includes(itemId)) ||
            (itemType === 'tag' && tag.tagIds.includes(itemId))
        );
        return relTags;

    } catch (error) {
        console.error('Error querying tags: ', error);
        throw new Error('Error querying tags');
    }
};
