const mysql = require('mysql');
const lambda = require('../../../../src/handlers/game/get-game');

var event, context, callback;

jest.mock('mysql', () => ({
    state: 'disconnected',
    createConnection: () => {},
    connect: jest.fn().mockImplementation((callback) => callback()),
    format: jest.fn(),
    query: jest.fn().mockImplementation((query, callback) => callback(null, [
        {
            Game: {
                game_id: 'game_id',
                venue: 'venue',
                location: 'location',
                date_created: 'date_created',
                date_modified: 'date_modified',
                organising_player: 'organising_player',
            },
            Invitation: {
                organised_game_id: 'organised_game_id',
                response_id: 'response_id',
                date_responded: 'date_responded',
                can_play: 'can_play',
                date_modified: 'date_modified',
                user_id: 'user_id'
            }
        }
    ])),
    end: jest.fn()
}));

describe('Test getGameHandler', () => {
    
    beforeEach( () => jest.resetModules() );

    it('should not accept the POST http method', async done => {
        event = {
            httpMethod: 'POST',
            pathParameters: {
                id: ''
            }
        };
        
        const result = await lambda.getGameByIdHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request",
            "reason": "getGameHandlerById only accepts GET method, you tried: POST", 
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should not accept the PUT http method', async () => {
        event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: ''
            }
        };
        
        const result = await lambda.getGameByIdHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request",
            "reason": "getGameHandlerById only accepts GET method, you tried: PUT", 
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
    });
    
    it('should error when no gameid provided in path', async() => {
        event = {
            httpMethod: 'GET',
            pathParameters: {
                id: ''
            }
        };
        
        const result = await lambda.getGameByIdHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request",
            "reason": "No game id provided",
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
    });
    
    it('should retrieve game details by id', async done => {
        event = {
            httpMethod: 'GET',
            pathParameters: {
                id: 'game_id'
            }
        };
        
        const result = await lambda.getGameByIdHandler(event, context, callback, mysql);
        
        const expectingResult = {
            statusCode: 200,
            body: {
                results: {
                    game: {
                        game_id: 'game_id',
                        venue: 'venue',
                        location: 'location',
                        date_created: 'date_created',
                        date_modified: 'date_modified',
                        organising_player: 'organising_player',
                    },
                    invitedPlayers: [
                        {
                            organised_game_id: 'organised_game_id',
                            response_id: 'response_id',
                            date_responded: 'date_responded',
                            can_play: 'can_play',
                            date_modified: 'date_modified',
                            user_id: 'user_id'
                        }
                    ]
                }
            }
        };
        
        expectingResult.body = JSON.stringify(expectingResult.body);
        
        expect(result).toEqual(expectingResult);
        done();
    });
});