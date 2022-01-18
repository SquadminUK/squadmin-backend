const mysql = require('mysql');
const lambda = require('../../../../src/handlers/game/put-game');

var event, context, callback;

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
    
    it('should find the game and mark all the invited players as uninvited', async done => {
        event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: 'game_id'
            }
        };
        
        const result = await lambda.putGameByIdHandler(event, context, callback, mysql);

        const expectedResult = {
            statusCode: 201,
            body: {
                results: {
                    game: {

                    },
                    invitedPlayers: [
                        {

                        }
                    ]
                }
            }
        }

        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);
    });

});