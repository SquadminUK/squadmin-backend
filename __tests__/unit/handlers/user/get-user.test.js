const mysql = require('mysql');
const lambda = require('../../../../src/handlers/user/get-user');

var event, context, callback;

jest.mock('mysql', () => ({
    state: 'disconnected',
    createConnection: () => {},
    connect: jest.fn().mockImplementation((error) => jest.fn()),
    format: jest.fn(),
    query: jest.fn().mockImplementation((query, callback) => callback(null, [])),
    end: jest.fn()
}));

describe('Test getUserHandler', () => {

    beforeEach( () => jest.resetModules() );

    it('should not accept PUT method', async done => {
        event = {
            httpMethod: 'PUT',
            pathParameters: {
                user_id: 'user_id'
            }
        };

        const result = await lambda.getUserHandler(event, context, callback, mysql);

        const expectedResult = {
            statusCode: 400,
            message: 'Bad request',
            reason: 'getDeviceHandler only accepts GET method, you tried: PUT'
        }

        expect(result).toEqual(expectedResult);

        done();
    });

    // it('should not accept POST method', async done => {

    //     done();
    // });

    // it('should fail with a suitable error when no user_id provided', async done => {

    //     done();
    // });
});