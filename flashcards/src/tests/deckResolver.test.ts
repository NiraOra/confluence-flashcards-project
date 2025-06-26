import { storage } from '@forge/api';
import { createDeck, updateDeck, addCardToDeck, removeCardFromDeck,
         getAllDecks, getDeck, deleteDeck } from '../deckResolvers';
import { queryStorage } from '../helpers';


jest.mock('@forge/api', () => ({
    storage: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      query: jest.fn(() => ({
        where: jest.fn(() => ({
          getMany: jest.fn(),
        })),
      })),
    },
    startsWith: jest.fn((prefix) => prefix),
  }));
  
jest.mock('../helpers', () => ({
  generateId: jest.fn(() => '12345'),
  getUserName: jest.fn(() => 'Freddie'),
  initUserData: jest.fn(),
  queryDecksById: jest.fn(() => Promise.resolve([])),
  queryTagsById: jest.fn(() => Promise.resolve([])),
  queryStorage: jest.fn(() => Promise.resolve([]))
}));


describe('Deck Resolver Functions', () => {
  
  describe('Create Deck', () => {
    it('Test 1 - successful deck creation', async () => {
      const req = {
        payload: { title: 'Math', description: 'math deck', cards: [], locked: false },
        context: { accountId: '123' },
      };
      const jestDeckId = `d-${12345}`;

      const deck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: false
      };

      const result = await createDeck(req);

      expect(storage.set).toHaveBeenCalledWith(jestDeckId, deck);

      expect(result.success).toBe(true);
      expect(result.deck).toEqual(deck);
    });

    it('Test 2 - unsuccessful deck creation - missing title', async () => {
      const req = {
        payload: { title: '', description: 'math deck', cards: [], locked: false },
        context: { accountId: '123' },
      };
      const jestDeckId = `d-${12345}`;

      const deck = {
        id: jestDeckId,
        title: '',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: false
      };

      const result = await createDeck(req);

      expect(result.success).toBe(false);
      expect(result.error).toEqual("Invalid input: title required");
    });
  });


  describe('Update Deck', () => {
    it('Test 1 - successful update - unlocked deck - same user', async () => {
      const jestDeckId = `d-${12345}`;

      const oldDeck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: false
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(oldDeck);

      const updatedDeck = {
        ...oldDeck,
        description: 'arithmetic deck'
      }

      const req = {
        payload: { ...updatedDeck },
        context: { accountId: '123' },
      }

      const result = await updateDeck(req);

      expect(storage.set).toHaveBeenCalledWith(jestDeckId, updatedDeck);
      expect(result.success).toBe(true);
      expect(result.deck).toEqual(updatedDeck);
    });

    it('Test 2 - successful update - unlocked deck - different user', async () => {
      const jestDeckId = `d-${12345}`;

      const oldDeck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: false
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(oldDeck);

      const updatedDeck = {
        ...oldDeck,
        description: 'arithmetic deck'
      }

      const req = {
        payload: { ...updatedDeck },
        context: { accountId: '1234' },
      }

      const result = await updateDeck(req);

      expect(storage.set).toHaveBeenCalledWith(jestDeckId, updatedDeck);
      expect(result.success).toBe(true);
      expect(result.deck).toEqual(updatedDeck);
    });

    it('Test 3 - successful update - locked deck - same user', async () => {
      const jestDeckId = `d-${12345}`;

      const oldDeck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: true
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(oldDeck);

      const updatedDeck = {
        ...oldDeck,
        description: 'arithmetic deck'
      }

      const req = {
        payload: { ...updatedDeck },
        context: { accountId: '123' },
      }

      const result = await updateDeck(req);

      expect(storage.set).toHaveBeenCalledWith(jestDeckId, updatedDeck);
      expect(result.success).toBe(true);
      expect(result.deck).toEqual(updatedDeck);
    });

    it('Test 4 - unsuccessful update - locked deck - different user', async () => {
      const jestDeckId = `d-${12345}`;

      const oldDeck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: true
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(oldDeck);

      const updatedDeck = {
        ...oldDeck,
        description: 'arithmetic deck'
      }

      const req = {
        payload: { ...updatedDeck },
        context: { accountId: '1234' },
      }

      const result = await updateDeck(req);

      expect(result.success).toBe(false);
      expect(result.error).toEqual("Only owner can edit");
    });

    it('Test 5 - missing title', async () => {
      const jestDeckId = `d-${12345}`;

      const oldDeck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: true
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(oldDeck);

      const updatedDeck = {
        ...oldDeck,
        title: ''
      }

      const req = {
        payload: { ...updatedDeck },
        context: { accountId: '123' },
      }

      const result = await updateDeck(req);

      expect(result.success).toBe(false);
      expect(result.error).toEqual("Invalid input: title required");
    });
  });


  describe('Get Deck', () => {
    it('Test 1 - Get deck - same user - locked deck', async () => {
      const jestDeckId = `d-${12345}`;

      const deck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: true
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(deck);

      const req = {
        payload: { deckId: deck.id },
        context: { accountId: '123' },
      }

      const result = await getDeck(req);

      expect(result.success).toBe(true);
    });

    it('Test 2 - Get deck - different user - locked deck', async () => {
      const jestDeckId = `d-${12345}`;

      const deck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: true
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(deck);

      const req = {
        payload: { deckId: deck.id },
        context: { accountId: '123' },
      }

      const result = await getDeck(req);

      expect(result.success).toBe(true);
    });
  });


  describe('Delete Deck', () => {
    it('Test 1 - successful delete - unlocked deck - same user', async () => {
      const jestDeckId = `d-${12345}`;

      const deck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: false
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(deck);

      const req = {
        payload: { deckId: deck.id },
        context: { accountId: '123' },
      }

      const result = await deleteDeck(req);

      expect(storage.delete).toHaveBeenCalledWith(jestDeckId);
      expect(result.success).toBe(true);
      expect(result.message).toEqual(`Deleted deck with id: ${jestDeckId}`);
    });

    it('Test 2 - successful delete - unlocked deck - different user', async () => {
      const jestDeckId = `d-${12345}`;

      const deck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: false
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(deck);

      const req = {
        payload: { deckId: deck.id },
        context: { accountId: '1234' },
      }

      const result = await deleteDeck(req);

      expect(storage.delete).toHaveBeenCalledWith(jestDeckId);
      expect(result.success).toBe(true);
      expect(result.message).toEqual(`Deleted deck with id: ${jestDeckId}`);
    });

    it('Test 3 - successful delete - locked deck - same user', async () => {
      const jestDeckId = `d-${12345}`;

      const deck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: true
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(deck);

      const req = {
        payload: { deckId: deck.id },
        context: { accountId: '123' },
      }

      const result = await deleteDeck(req);

      expect(storage.delete).toHaveBeenCalledWith(jestDeckId);
      expect(result.success).toBe(true);
      expect(result.message).toEqual(`Deleted deck with id: ${jestDeckId}`);
    });

    it('Test 4 - unsuccessful delete - locked deck - different user', async () => {
      const jestDeckId = `d-${12345}`;

      const deck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: true
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(deck);

      const req = {
        payload: { deckId: deck.id },
        context: { accountId: '1234' },
      }

      const result = await deleteDeck(req);

      expect(result.success).toBe(false);
      expect(result.error).toEqual("Only owner can delete");
    });
  });


  describe('Add Card to Deck', () => {
    it('Test 1 - successful add card to deck', async() => {
      const jestDeckId = `d-${12345}`;
      const deck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: false
      };

      const jestCardId = `c-${12345}`;
      const card = {
        id: jestCardId,
        front: '1+1',
        back: '3',
        hint: 'use addition',
        owner: '123',
        name: 'Freddie',
        locked: false,
        deckIds: []
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(deck);
      (storage.get as jest.Mock).mockResolvedValueOnce(card);

      const req = {
        payload: {deckId: jestDeckId, cardId: jestCardId},
        context: {accountId: '123'}
      }

      const result = await addCardToDeck(req);

      const deckNew = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [card],
        cardIds: [jestCardId],
        size: 0,                 
        locked: false
      };

      expect(storage.set).toHaveBeenCalledWith(jestDeckId, deckNew);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Added card to deck")
    });

    it('Test 2 - unsuccessful add card to deck - locked deck - different user', async() => {
      const jestDeckId = `d-${12345}`;
      const deck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: true
      };

      const jestCardId = `c-${12345}`;
      const card = {
        id: jestCardId,
        front: '1+1',
        back: '3',
        hint: 'use addition',
        owner: '123',
        name: 'Freddie',
        locked: false,
        deckIds: []
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(deck);
      (storage.get as jest.Mock).mockResolvedValueOnce(card);

      const req = {
        payload: {deckId: jestDeckId, cardId: jestCardId},
        context: {accountId: '1234'},
      }

      const result = await addCardToDeck(req);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Only owner can edit")
    });

    it('Test 3 - unsuccessful add card to deck - deck already has card', async() => {
      const jestDeckId = `d-${12345}`;
      const jestCardId = `c-${12345}`;

      const deck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [jestCardId],
        size: 0,                 
        locked: true
      };

      const card = {
        id: jestCardId,
        front: '1+1',
        back: '3',
        hint: 'use addition',
        owner: '123',
        name: 'Freddie',
        locked: false,
        deckIds: []
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(deck);
      (storage.get as jest.Mock).mockResolvedValueOnce(card);

      const req = {
        payload: {deckId: jestDeckId, cardId: jestCardId},
        context: {accountId: '1234'},
      }

      const result = await addCardToDeck(req);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Item already included");
    });
  });


  describe('Remove card from Deck', () => {
    it('Test 1 - successful remove card from deck', async() => {
      const jestDeckId = `d-${12345}`;
      const jestCardId = `c-${12345}`;

      const card = {
        id: jestCardId,
        front: '1+1',
        back: '3',
        hint: 'use addition',
        owner: '123',
        name: 'Freddie',
        locked: false,
        deckIds: [jestDeckId]
      };

      const deck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [card],
        cardIds: [jestCardId],
        size: 0,                 
        locked: false
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(deck);
      (storage.get as jest.Mock).mockResolvedValueOnce(card);

      const req = {
        payload: {deckId: jestDeckId, cardId: jestCardId},
        context: {accountId: '123'}
      }

      const result = await removeCardFromDeck(req);

      const deckNew = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [],
        size: 0,                 
        locked: false
      };

      expect(storage.set).toHaveBeenCalledWith(jestDeckId, deckNew);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Removed card from deck")
    });

    it('Test 2 - unsuccessful remove card from deck - locked card', async() => {
      const jestDeckId = `d-${12345}`;
      const jestCardId = `c-${12345}`;

      const deck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [],
        cardIds: [jestCardId],
        size: 0,                 
        locked: true
      };

      const card = {
        id: jestCardId,
        front: '1+1',
        back: '3',
        hint: 'use addition',
        owner: '123',
        name: 'Freddie',
        locked: false,
        deckIds: [jestDeckId]
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(deck);
      (storage.get as jest.Mock).mockResolvedValueOnce(card);

      const req = {
        payload: {deckId: jestDeckId, cardId: jestCardId},
        context: {accountId: '1234'}
      }

      const result = await removeCardFromDeck(req);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Only owner can edit")
    });
  });


  describe('Get All Decks', () => {
    it('Test 1 - successful get all deck', async() => {
      const jestDeckId = `d-${12345}`;
      const jestCardId = `c-${12345}`;

      const card = {
        id: jestCardId,
        front: '1+1',
        back: '3',
        hint: 'use addition',
        owner: '123',
        name: 'Freddie',
        locked: false,
        deckIds: [jestDeckId]
      };

      const deck = {
        id: jestDeckId,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [card],
        cardIds: [jestCardId],
        size: 0,                 
        locked: true
      };

      const jestDeckId2 = `d-${123456}`;
      const jestCardId2 = `c-${123456}`;

      const card2 = {
        id: jestCardId2,
        front: '1+1',
        back: '2',
        hint: 'use addition',
        owner: '123',
        name: 'Freddie',
        locked: false,
        deckIds: [jestDeckId]
      };

      const deck2 = {
        id: jestDeckId2,
        title: 'Math',
        description: 'math deck',
        owner: '123',
        name: 'Freddie',
        cards: [card2],
        cardIds: [jestCardId2],
        size: 0,                 
        locked: true
      };

      const deckList = [deck, deck2];
      (queryStorage as jest.Mock).mockResolvedValueOnce(deckList);

      const req = {
        payload: {},
        context: {accountId: '123'}
      }

      const result = await getAllDecks(req);
      expect(result.success).toBe(true);
      expect(result.decks).toEqual(deckList);
    });
  });
});