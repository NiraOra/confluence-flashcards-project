import { asUser, storage } from '@forge/api';
import { addGeneratedFlashcards, getAllContent, getGeneratedDeckTitle, generateQA } from '../aiResolvers';
import { getAllTags } from '../tagResolvers';


global.fetch = jest.fn() as jest.Mock;

jest.mock('@forge/api', () => ({
  storage: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    query: jest.fn(() => ({
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          getMany: jest.fn(() => ({
            results: [],
          })),
        })),
      })),
    })),
  },
  startsWith: jest.fn((prefix) => prefix),
  asUser: jest.fn().mockReturnValue({
    requestConfluence: jest.fn(),
  }),
  route: jest.fn(),
}));

jest.mock('../helpers', () => ({
  generateId: jest.fn(() => '12345'),
  getUserName: jest.fn(() => 'Freddie'),
  initUserData: jest.fn(),
  queryDecksById: jest.fn(() => Promise.resolve([])),
  queryTagsById: jest.fn(() => Promise.resolve([])),
  queryStorage: jest.fn(() => Promise.resolve([])) 
}));

jest.mock('../tagResolvers', () => ({
  getAllTags: jest.fn(),
}));


describe('Generating Deck Title Tests', () => {
  const req = {
    payload: { text: 'Sample text for generating deck title' },
    context: { accountId: '123' },
  };

  it('Test 1 - Should return the generated deck title when API responds successfully', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ title: 'Generated Deck Title' }),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await getGeneratedDeckTitle(req);

    expect(result).toEqual({ success: true, title: 'Generated Deck Title' });
  });

  it('Test 2 - should return an error if the API response is not 200 (OK)', async () => {
    const mockResponse = { ok: false, json: jest.fn().mockResolvedValue({}) };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await getGeneratedDeckTitle(req);

    expect(result).toEqual({ success: false, error: 'No deck title generated' });
  });
});


describe('Getting All Content Tests', () => {
  const req = {
    payload: { pageId: '123', siteUrl: 'https://example.atlassian.net' },
    context: { accountId: 'user123' },
  };

  it('Test 1 - should return an error if accountId is missing', async () => {
    const reqWithoutAccountId = { ...req, context: { accountId: null } };
    const result = await getAllContent(reqWithoutAccountId);

    expect(result).toEqual({ success: false, message: 'No user' });
  });

  it('Test 2 - should successfully fetch content and extract paragraphs', async () => {
    const mockResponse = {
      status: 200,
      json: jest.fn().mockResolvedValue({
        body: {
          atlas_doc_format: {
            value: JSON.stringify({
              content: [{ type: 'paragraph', content: [{ text: 'Test paragraph' }] }],
            }),
          },
        },
        title: 'Test Page',
      }),
    };
    (asUser().requestConfluence as jest.Mock).mockResolvedValue(mockResponse);

    const result = await getAllContent(req);

    expect(result).toEqual({
      success: true,
      data: '"Test paragraph"',
      title: 'Test Page',
      url: expect.any(String),
    });
  });
});


describe('Generating Q&A Tests', () => {
  const req = {
    payload: { text: 'Sample text' },
    context: { accountId: '123' },
  };

  it('Test 1 - should return an error for short text', async () => {
    const shortTextReq = { ...req, payload: { text: 'Hi' } };
    const result = await generateQA(shortTextReq);

    expect(result).toEqual({
      success: false,
      error: 'Too few words; select more text to generate flashcards.',
    });
  });

  it('Test 2 - should generate Q&A pairs successfully', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        qa_pairs: [{ question: 'What is AI?', answer: 'Artificial Intelligence' }],
      }),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await generateQA(req);

    expect(result).toEqual({
      success: true,
      data: { qa_pairs: expect.any(Array) },
    });
  });
});


describe('Adding Generated Flashcards Tests', () => {
  const req = {
    payload: {
      qAPairs: [{ question: 'Q1', answer: 'A1' }],
      deckId: 'deck-123',
    },
    context: { accountId: 'user123' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Test 1 - should return an error if deck is not found', async () => {
    (storage.get as jest.Mock).mockResolvedValue(undefined);

    const result = await addGeneratedFlashcards(req);

    expect(result).toEqual({ success: false, error: 'Deck not found' });
  });

  it('Test 2 - should add flashcards successfully', async () => {
    (storage.get as jest.Mock).mockResolvedValueOnce({
      id: 'deck-123',
      cards: [{ question: 'q1', answer: 'a1' }, { question: 'q2', answer: 'a2' }],
    });
  
    (getAllTags as jest.Mock).mockResolvedValue({
      tags: [{ title: 'auto-generated', id: 'tag-123', cardIds: [] }]
    });
  
    (storage.set as jest.Mock).mockResolvedValue(true);
    
    const req = {
      payload: {
        qAPairs: [
          { question: 'What is AI?', answer: 'Artificial Intelligence' },
          { question: 'What is ML?', answer: 'Machine Learning' },
        ],
        deckId: 'deck-123',
      },
      context: {
        accountId: 'account-123',
      },
    };
  
    const result = await addGeneratedFlashcards(req);
  
    expect(result.success).toBe(true);
    expect(result.createdFlashcardsCount).toBe(2);
  });
});
