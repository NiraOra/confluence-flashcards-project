import { storage } from '@forge/api';
import { createTag, updateTag, deleteTag, getTag, getAllTags,
         addTagToCard, addTagToDeck, removeTagFromDeck, removeTagFromCard } from '../tagResolvers';

         
const getMany = jest.fn();

jest.mock('@forge/api', () => ({
  storage: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    query: jest.fn(() => ({
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          getMany: getMany,
        })),
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
  queryStorage: jest.fn(() => Promise.resolve([])),
  queryCardsById: jest.fn(() => Promise.resolve([])),
}));


describe('Tag Resolver Functions', () => {

  describe('Create Tag', () => {
    it('Test 1 - add tag successful', async() => {
        const req = {
                    payload: { title: 'math', 
                            colour: 'red', 
                            cardIds: [], 
                            deckIds: [],
                            tagIds: []
                            },
                    context: { accountId: '123' },
                    };
        const result = await createTag(req);
        const jestTagId = `t-${12345}`;
        const createdTag = {
            id: jestTagId,
            title: 'math',
            colour: 'red',
            cardIds: [],
            deckIds: [],
            tagIds: [],
            owner: '123',
        }
        expect(result.success).toBe(true);
        expect(result.tag).toEqual(createdTag);
    });

    it('Test 2 - add tag unsuccessful', async() => {
        const req = {
                    payload: { title: '', 
                            colour: 'red', 
                            cardIds: [], 
                            deckIds: [],
                            tagIds: []
                            },
                    context: { accountId: '123' },
                    };
        const result = await createTag(req);
        expect(result.success).toBe(false);
        expect(result.error).toEqual("Tag title is required");
    });
  });


  describe('Update Tag', () => {
    it('Test 1 - successful update', async() => {
      const jestTagId = `t-${12345}`;

      const oldTag = {
        id: jestTagId,
        title: 'math',
        colour: 'red',
        cardIds: [],
        deckIds: [],
        tagIds: [],
        owner: '123',
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(oldTag); // replicating storage get

      const updatedTag = {
        ...oldTag,
        title: 'Arithmetic'
      }

      const req = {
        payload: { ...updatedTag },
        context: { accountId: '123' },
      }

      const result = await updateTag(req);

      expect(storage.set).toHaveBeenCalledWith(jestTagId, updatedTag);
      expect(result.success).toBe(true);
      expect(result.tag).toEqual(updatedTag);
    });

    it('Test 2 - unsuccessful update - missing title', async() => {
      const jestTagId = `t-${12345}`;

      const oldTag = {
        id: jestTagId,
        title: 'math',
        colour: 'red',
        cardIds: [],
        deckIds: [],
        tagIds: [],
        owner: '123',
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(oldTag); // replicating storage get

      const updatedTag = {
        ...oldTag,
        title: ''
      }

      const req = {
        payload: { ...updatedTag },
        context: { accountId: '123' },
      }

      const result = await updateTag(req);

      expect(result.success).toBe(false);
      expect(result.error).toEqual('Tag title is required');
    });
  });


  describe('Delete Tag', () => {
    it('Test 1 - successful delete', async() => {
      const jestTagId = `t-${12345}`;

      const tag = {
        id: jestTagId,
        title: 'math',
        colour: 'red',
        cardIds: [],
        deckIds: [],
        tagIds: [],
        owner: '123',
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(tag); // replicating storage get

      const req = {
        payload: { tagId: tag.id },
        context: { accountId: '123' },
      }

      const result = await deleteTag(req);

      expect(storage.delete).toHaveBeenCalledWith(jestTagId);
      expect(result.success).toBe(true);
      expect(result.message).toEqual(`Deleted tag with id: ${jestTagId}`);
    });
  });


  describe('Get Tag', () => {
    it('Test 1 - successful get tag', async() => {
      const jestTagId = `t-${12345}`;

      const tag = {
        id: jestTagId,
        title: 'math',
        colour: 'red',
        cardIds: [],
        deckIds: [],
        tagIds: [],
        owner: '123',
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(tag); // replicating storage get

      const req = {
        payload: { tagId: tag.id },
        context: { accountId: '123' },
      }

      const result = await getTag(req);

      expect(result.success).toBe(true);
      expect(result.tag).toEqual(tag);
    });
  });


  describe('Add Tag to Card', () => {
    it('Test 1 - successful add tag to card', async() => {
      const jestTagId = `t-${12345}`;

      const tag = {
        id: jestTagId,
        title: 'math',
        colour: 'red',
        cardIds: [],
        deckIds: [],
        tagIds: [],
        owner: '123',
      };

      const jestCardId = `c-${12345}`;

      const card = {
        id: jestCardId,
        front: '1+1',
        back: '3',
        hint: 'use addition',
        owner: '123',
        name: 'Freddie',
        locked: true,
        deckIds: []
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(card);
      (storage.get as jest.Mock).mockResolvedValueOnce(tag); // replicating storage get

      const req = {
        payload: { tagId: tag.id, cardId: card.id },
        context: { accountId: '123' },
      }

      const result = await addTagToCard(req);

      expect(result.success).toEqual(true);
      expect(result.message).toEqual("Added tag to card")
    });

    it('Test 2 - unsuccessful add tag to card - tag already exists', async() => {
      const jestTagId = `t-${12345}`;
      const jestCardId = `c-${12345}`;

      const tag = {
        id: jestTagId,
        title: 'math',
        colour: 'red',
        cardIds: [jestCardId],
        deckIds: [],
        tagIds: [],
        owner: '123',
      };

      const card = {
        id: jestCardId,
        front: '1+1',
        back: '3',
        hint: 'use addition',
        owner: '123',
        name: 'Freddie',
        locked: true,
        deckIds: []
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(card);
      (storage.get as jest.Mock).mockResolvedValueOnce(tag); // replicating storage get

      const req = {
        payload: { tagId: tag.id, cardId: card.id },
        context: { accountId: '123' },
      }

      const result = await addTagToCard(req);

      expect(result.success).toEqual(false);
      expect(result.error).toEqual("Item already included")
    });
  });


  describe('Add Tag to Deck', () => {
    it('Test 1 - successful add tag to deck', async() => {
      const jestTagId = `t-${12345}`;

      const tag = {
        id: jestTagId,
        title: 'math',
        colour: 'red',
        cardIds: [],
        deckIds: [],
        tagIds: [],
        owner: '123',
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

      (storage.get as jest.Mock).mockResolvedValueOnce(deck);
      (storage.get as jest.Mock).mockResolvedValueOnce(tag); // replicating storage get

      const req = {
        payload: { tagId: tag.id, deckId: deck.id },
        context: { accountId: '123' },
      }

      const result = await addTagToDeck(req);

      expect(result.success).toEqual(true);
      expect(result.message).toEqual("Added tag to deck")
    });
    it('Test 2 - unsuccessful add tag to deck - tag already exists', async() => {
      const jestTagId = `t-${12345}`;
      const jestDeckId = `d-${12345}`;

      const tag = {
        id: jestTagId,
        title: 'math',
        colour: 'red',
        cardIds: [],
        deckIds: [jestDeckId],
        tagIds: [],
        owner: '123',
      };

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
      (storage.get as jest.Mock).mockResolvedValueOnce(tag); // replicating storage get

      const req = {
        payload: { tagId: tag.id, deckId: deck.id },
        context: { accountId: '123' },
      }

      const result = await addTagToDeck(req);

      expect(result.success).toEqual(false);
      expect(result.error).toEqual("Item already included")
    });
  });


  describe('Remove Tag from Card', () => {
    it('Test 1 - successful removal tag from card', async() => {
      const jestTagId = `t-${12345}`;
      const jestCardId = `c-${12345}`;

      const tag = {
        id: jestTagId,
        title: 'math',
        colour: 'red',
        cardIds: [jestCardId],
        deckIds: [],
        tagIds: [],
        owner: '123',
      };

      const card = {
        id: jestCardId,
        front: '1+1',
        back: '3',
        hint: 'use addition',
        owner: '123',
        name: 'Freddie',
        locked: true,
        deckIds: []
      };

      (storage.get as jest.Mock).mockResolvedValueOnce(card);
      (storage.get as jest.Mock).mockResolvedValueOnce(tag); // replicating storage get

      const req = {
        payload: { tagId: tag.id, cardId: card.id },
        context: { accountId: '123' },
      }

      const result = await removeTagFromCard(req);

      expect(result.success).toEqual(true);
      expect(result.message).toEqual("Removed tag from card")
    });
  });


  describe('Remove Tag from Deck', () => {
    it('Test 1 - successful removal tag from deck', async() => {
      const jestTagId = `t-${12345}`;
      const jestDeckId = `d-${12345}`;

      const tag = {
        id: jestTagId,
        title: 'math',
        colour: 'red',
        cardIds: [],
        deckIds: [jestDeckId],
        tagIds: [],
        owner: '123',
      };

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
      (storage.get as jest.Mock).mockResolvedValueOnce(tag); // replicating storage get

      const req = {
        payload: { tagId: tag.id, deckId: deck.id },
        context: { accountId: '123' },
      }

      const result = await removeTagFromDeck(req);

      expect(result.success).toEqual(true);
      expect(result.message).toEqual("Tag removed from deck")
    });
  });


  describe('Get all Tags', () => {
    it('Test 1 - successful get all tags', async () => {
      const jestTagId = `t-${12345}`;
      const jestTagId2 = `t-${123456}`;

      const tag = {
        id: jestTagId,
        title: 'math',
        colour: 'red',
        cardIds: [],
        deckIds: [],
        tagIds: [],
        owner: '123',
      };

      const tag2 = {
        id: jestTagId2,
        title: 'math',
        colour: 'blue',
        cardIds: [],
        deckIds: [],
        tagIds: [],
        owner: '123',
      };

      const tagList = [tag, tag2];
    
      getMany.mockResolvedValueOnce({
        results: tagList.map((tag) => ({ value: tag })),
      });
    
      const result = await getAllTags();
    
      expect(result.success).toBe(true);
      expect(result.tags).toEqual(tagList);
    });
  });
});

