import { storage } from '@forge/api';
import { ResolverRequest, User, Card, Deck, Tag } from '../types';
import { fetchUserCards, fetchUserDecks, fetchUserTags } from '../userResolvers';
import { queryCardsById, queryDecksById, queryTagsById } from '../helpers';


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
    queryCardsById: jest.fn(() => Promise.resolve([])),
    queryDecksById: jest.fn(() => Promise.resolve([])),
    queryTagsById: jest.fn(() => Promise.resolve([])),
    queryStorage: jest.fn(() => Promise.resolve([])),
}));


describe('User Resolvers', () => {
    describe('fetchUserCards', () => {
        it('return error when accountId is missing', async () => {
            const req: ResolverRequest = { 
                context: {},
                payload: {},
            }; 
            const result = await fetchUserCards(req);
    
            expect(result).toEqual({
                success: false,
                message: 'Error!',
            });
        });
    
        it('return error when no user data is found', async () => {
            (storage.get as jest.Mock).mockResolvedValueOnce(null);
    
            const req: ResolverRequest = { 
                context: { accountId: 'u-123' },
                payload: {},
            }; 
            const result = await fetchUserCards(req);
    
            expect(storage.get).toHaveBeenCalledWith('u-123');
            expect(result).toEqual({
                success: false,
                message: 'No card data for user',
            });
        });
    
        it('fetch cards successfully when user data is valid', async () => {
            const mockUser: User = { cardIds: ['c-1', 'c-2'] } as User;
            const mockCards: Card[] = [
                { id: 'c-1', owner: '', front: '', back: '', hint: '', deckIds: [], locked: false },
                { id: 'c-2', owner: '', front: '', back: '', hint: '', deckIds: [], locked: false }
            ];
    
            (storage.get as jest.Mock).mockResolvedValueOnce(mockUser);
            (queryCardsById as jest.Mock).mockResolvedValueOnce(mockCards);
    
            const req: ResolverRequest = { 
                context: { accountId: 'u-123' },
                payload: {},
            }; 
            const result = await fetchUserCards(req);
    
            expect(storage.get).toHaveBeenCalledWith('u-123');
            expect(queryCardsById).toHaveBeenCalledWith(['c-1', 'c-2']);
            expect(result).toEqual({
                success: true,
                cards: mockCards,
            });
        });
    });

    describe('fetchUserDecks', () => {
        it('return error when accountId is missing', async () => {
            const req: ResolverRequest = {
                context: {},
                payload: {}
            };
            const result = await fetchUserDecks(req);

            expect(result).toEqual({
                success: false,
                message: 'Error!',
            });
        });

        it('return error when no user data is found', async () => {
            (storage.get as jest.Mock).mockResolvedValueOnce(null);

            const req: ResolverRequest = {
                context: { accountId: 'u-123' },
                payload: {}
            };
            const result = await fetchUserDecks(req);

            expect(storage.get).toHaveBeenCalledWith('u-123');
            expect(result).toEqual({
                success: false,
                message: 'No deck data for user',
            });
        });

        it('fetch decks successfully when user data is valid', async () => {
            const mockUser: User = { deckIds: ['d-1', 'd-2'] } as User;
            const mockDecks: Deck[] = [
                { id: 'd-1', title: '', owner: '', cards: [], cardIds: [], size: 0, locked: false },
                { id: 'd-2', title: '', owner: '', cards: [], cardIds: [], size: 0, locked: false }
            ];

            (storage.get as jest.Mock).mockResolvedValueOnce(mockUser);
            (queryDecksById as jest.Mock).mockResolvedValueOnce(mockDecks);

            const req: ResolverRequest = {
                context: { accountId: 'u-123' },
                payload: {}
            };
            const result = await fetchUserDecks(req);

            expect(storage.get).toHaveBeenCalledWith('u-123');
            expect(queryDecksById).toHaveBeenCalledWith(['d-1', 'd-2']);
            expect(result).toEqual({
                success: true,
                decks: mockDecks,
            });
        });
    });

    describe('fetchUserTags', () => {
        it('return error when accountId is missing', async () => {
            const req: ResolverRequest = {
                context: {},
                payload: {}
            };
            const result = await fetchUserTags(req);

            expect(result).toEqual({
                success: false,
                message: 'Error!',
            });
        });

        it('return error when no user data is found', async () => {
            (storage.get as jest.Mock).mockResolvedValueOnce(null);

            const req: ResolverRequest = {
                context: { accountId: 'u-123' },
                payload: {}
            };
            const result = await fetchUserTags(req);

            expect(storage.get).toHaveBeenCalledWith('u-123');
            expect(result).toEqual({
                success: false,
                message: 'No tag data for user',
            });
        });

        it('fetch tags successfully when user data is valid', async () => {
            const mockUser: User = { tagIds: ['t-1', 't-2'] } as User;
            const mockTags: Tag[] = [
                { id: 't-1', title: '', owner: '', colour: '', cardIds: [], deckIds: [], tagIds: [] },
                { id: 't-2', title: '', owner: '', colour: '', cardIds: [], deckIds: [], tagIds: [] }
            ];

            (storage.get as jest.Mock).mockResolvedValueOnce(mockUser);
            (queryTagsById as jest.Mock).mockResolvedValueOnce(mockTags);

            const req: ResolverRequest = {
                context: { accountId: 'u-123' },
                payload: {}
            };
            const result = await fetchUserTags(req);

            expect(storage.get).toHaveBeenCalledWith('u-123');
            expect(queryTagsById).toHaveBeenCalledWith(['t-1', 't-2']);
            expect(result).toEqual({
                success: true,
                tags: mockTags,
            });
        });
    });
});
