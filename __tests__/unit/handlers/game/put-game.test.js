const mysql = require('mysql');
const lambda = require('../../../../src/handlers/game/put-game');

var event, context, callback;

jest.mock('mysql', () => ({
    state: 'disconnected',
    createConnection: () => {},
    connect: jest.fn().mockImplementation((callback) => callback()),
    format: jest.fn(),
    query: jest.fn().mockImplementation((query, callback) => callback(null, [])),
    end: jest.fn()
}));

describe('Test putGameHandlerById', () => {
    it('should not accept the POST http method', async done => {
        event = {
            httpMethod: 'POST',
            pathParameters: {
                id: 'game_id'
            }
        };
        
        const result = await lambda.putGameByIdHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request",
            "reason": "putGameHandlerById only accepts PUT method, you tried: POST",
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should not accept the GET http method', async done => {
        event = {
            httpMethod: 'GET',
            pathParameters: {
                id: 'game_id'
            }
        };
        
        const result = await lambda.putGameByIdHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request",
            "reason": "putGameHandlerById only accepts PUT method, you tried: GET",
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should update game details', async done => {
        
        event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: 'game_id'
            },
            body: {
                game: {
                    location: "location",
                    event_date: "event_date",
                    is_active: true
                },
                invitedPlayers:[]
            }
        };
        
        const result = await lambda.putGameByIdHandler(event, context, callback, mysql);
        
        const expectedResult = {
            statusCode: 201,
            body: {
                results: {
                    game: {                        
                        location: "location",
                        event_date: "event_date",
                        is_active: true
                    },
                    invitedPlayers: []
                }
            }
        };
        
        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should update the invitation details', async done => {
        event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: 'game_id'
            },
            body: {
                game: {
                    location: "location",
                    event_date: "event_date",
                    is_active: true                    
                },
                invitedPlayers: [
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 123 456',
                    },
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 123 457'
                    },
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 654 321'
                    }
                ]
            }
        };
        
        const result = await lambda.putGameByIdHandler(event, context, callback, mysql);
        
        const expectedResult = {
            statusCode: 201,
            game: {

            },
            invitedPlayers: [
                {

                },
                {

                },
                {
                    
                }
            ]
        }
        
        done();
    });
    
});