import api, { route, storage } from '@forge/api';
import { ResolverRequest, Deck, Tag, GenFlashcardsPair, ParagraphType } from './types';
import { getAllTags } from './tagResolvers';
import { generateId, getUserName } from './helpers';


export const url = "https://marlin-excited-gibbon.ngrok-free.app"


/**
 * Fetches content from a Confluence page and extracts paragraph text recursively.
 *
 * @param {ResolverRequest} req - The request object with payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.pageId - The ID of the Confluence page.
 * @param {string} req.payload.siteUrl - The base URL of the Confluence site.
 * @param {object} req.context - The request context.
 * @param {string} req.context.accountId - The ID of the user making the request.
 * @returns {Promise<object>} An object with success message, extracted text, page title, and source link.
 */
export const getAllContent = async (req: ResolverRequest): Promise<object> => {
    const { pageId, siteUrl } = req.payload;
    const { accountId } = req.context;
    if (!accountId) {
        return {
            success: false,
            message: 'No user',
        };
    }

    // load page info
    const response = await api.asUser().requestConfluence(route`/wiki/api/v2/pages/${pageId}?body-format=atlas_doc_format`, {
        headers: {
        'Accept': 'application/json'
        }
    });

    if (response.status == 200) {
        const data = await response.json();
        const doc = JSON.parse(data.body.atlas_doc_format.value);

        // recursively extract paragraph text
        const extractParagraphs = (content: any[]): string[] => {
            return content.flatMap(item => {
            if (item.type === 'paragraph' && item.content) {
                return item.content.map((paragraph: ParagraphType) => paragraph.text);
            } else if (item.content) {
                return extractParagraphs(item.content);
            }
            return [];
            });
        };

        // return all extracted content 
        const paragraphs = extractParagraphs(doc.content);
        const allText = paragraphs.join(' ');
        return {
            success: true,
            data: JSON.stringify(allText),
            title: data.title,
            url: `${siteUrl}/wiki/spaces/~${accountId}/pages/${pageId}`
        }
    }

    return {
        success: false,
        error: response.statusText
    };
};


/**
 * Generates a deck title from a given text input using an external service.
 *
 * @param {ResolverRequest} req - The request object with payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.text - The input text for generating the deck title.
 * @returns {Promise<object>} An object with success message and the generated deck title.
 */
export const getGeneratedDeckTitle = async (req: ResolverRequest) => {
    const { text } = req.payload;

    // call endpoint to generate deck title
    const response = await fetch(`${url}/generate_deck_title`, { 
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    const data = await response.json();
    if (!response.ok) {
        return {
            success: false,
            error: 'No deck title generated',
        };
    }

    return {
        success: true,
        title: data.title
    };
}


/**
 * Generates Q&A pairs (flashcards) from input text using an external service.
 *
 * @param {ResolverRequest} req - The request object with payload and context.
 * @param {object} req.payload - The payload data.
 * @param {string} req.payload.text - The input text for generating Q&A pairs.
 * @returns {Promise<object>} An object with success message and the generated Q&A pairs.
 */
export const generateQA = async (req: ResolverRequest) => {
    const { text } = req.payload;
    if (text.length <= 2) {
        return {
            success: false,
            error: 'Too few words; select more text to generate flashcards.'
        }
    }

    // call endpoint to generate flashcard data
    const response = await fetch(`${url}/generate_qa`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    const data = await response.json();
    if (!response.ok) {
        return {
            success: false,
            error: 'Failed to generate Q&A from text input',
        };
    }

    return {
        success: true,
        data: data
    };
};


/**
 * Adds generated flashcards (Q&A pairs) to a specific deck in storage.
 *
 * @param {ResolverRequest} req - The request object with payload and context.
 * @param {object} req.payload - The payload data.
 * @param {GenFlashcardsPair[]} req.payload.qAPairs - Array of Q&A pairs to add.
 * @param {string} req.payload.deckId - The ID of the deck for the flashcards.
 * @param {object} req.context - The request context.
 * @param {string} req.context.accountId - The ID of the user making the request.
 * @returns {Promise<object>} An object with success message, updated deck, and flashcard count.
 */
export const addGeneratedFlashcards = async (req: ResolverRequest) => {
    const { qAPairs, deckId } = req.payload;
    const accountId = req.context.accountId;

    // get data from storage
    const deck = await storage.get(deckId) as Deck | undefined;
    if (!deck) {
        return {
            success: false,
            error: 'Deck not found',
        };
    }
    const user = await getUserName(accountId);
    const tags = await getAllTags();

    // check tag for gen-ai content
    const autoTag = tags.tags.find(tag => tag.title === 'auto-generated') as Tag;
    if (!autoTag) {
        return {
            success: false,
            error: 'Tag not found',
        };
    }
    const cardIds: string[] = [];

    // map q-a pairs to promises for creating flashcards
    const flashcardPromises = qAPairs.map(async (pair: GenFlashcardsPair) => {
        const { question, answer } = pair;
        if (!question || !answer) {
            return { success: false, error: 'Cannot add flashcard as question or answer are missing' };
        }

        const cardId = `c-${generateId()}`;
        const newCard = {
            id: cardId,
            front: question,
            back: answer,
            hint: "",
            owner: accountId,
            name: user,
            locked: false
        };
        cardIds.push(cardId);
        autoTag.cardIds.push(cardId);

        await storage.set(autoTag.id, autoTag);
        await storage.set(cardId, newCard);
        return { success: true, id: cardId };
    });

    // wait until all flashcards created
    const results = await Promise.all(flashcardPromises);
    if (!deck.cards) {
        deck.cards = [];
    }

    // set data to storage
    for (const cardId of cardIds) {
        const flashcard = await storage.get(cardId);
        if (flashcard) {
            deck.cards.push(flashcard);
        }
    }
    await storage.set(deck.id, deck);

    return {
        success: true,
        createdDeck: deck,
        createdFlashcardsCount: results.filter(result => result.success).length,
    };
};
