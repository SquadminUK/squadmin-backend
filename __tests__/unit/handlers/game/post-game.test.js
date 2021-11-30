const mysql = require('mysql');
const lambda = require('../../../../src/handlers/game/post-game');


var event, context, callback;

describe('Test postGameHandler', () => {

    beforeEach( () => jest.resetModules() );

    it('should not accept the PUT http method', async done => {
        event = {
            httpMethod: 'PUT'
        };

        const result = await lambda.postGameHandler(event, context, callback, mysql);
        const expectedResult = {"message": "Bad request", "reason": "postGameHandler only accepts POST method, you tried: PUT", "statusCode": 400}

        expect(result).toEqual(expectedResult);
        done();
    });
});