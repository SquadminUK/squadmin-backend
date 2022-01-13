const mysql = require('mysql');
var lamda = require('../../../../src/handlers/games/get-games');

var event, context, callback;

jest.mock('mysql', () => ({
    state: 'disconnected',
    createConnection: () => {},
    connect: jest.fn().mockImplementation((callback) => callback()),
    format: jest.fn(),
    query: jest.fn().mockImplementation((query, callback) => callback(null, [])),
    end: jest.fn()
}));

describe('Test getGamesHandler', () => {
    
    beforeEach( () => jest.resetModules() );
    
    it('should not accept the PUT http method', async done => {
        
        
        event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: 'user_id'
            }
        };
        
        const result = await lamda.getGamesHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request", 
            "reason": "getGamesHandler only accepts GET method, you tried: PUT", 
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should not accept the POST http method', async done => {
        
        event = {
            httpMethod: 'POST',
            pathParameters: {
                id: 'user_id'
            }
        };

        const result = await lamda.getGamesHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request", 
            "reason": "getGamesHandler only accepts GET method, you tried: POST", 
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should fetch the organised and invited to games', async done => {

        event = {
            httpMethod: 'GET',
            pathParameters: {
                'id': 'user_id'
            }
        };

        const result = await lamda.getGamesHandler(event, context, callback, mysql);

        const expectedResult = {
            statusCode: 200,
            body: {
                results: {
                    organisedGames: {},
                    invitedToGames: {}
                }
            }
        }


        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);

        done();
    });
});