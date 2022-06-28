const mysql = require('mysql');
const lambda = require('../../../../src/handlers/invitation/respond/get-invitation');

var event, context, callback;

jest.mock('mysql', () => ({
    state: 'disconnected',
    createConnection: () => {},
    connect: jest.fn().mockImplementation((error) => jest.fn()),
    format: jest.fn(),
    query: jest.fn().mockImplementation((query, callback) => callback(null, [
        {
            user_id: 'user_id',
            full_name: 'full_name',
            email_address: 'email_address',
            mobile_number: 'mobile_number',
            username: 'username',
            date_of_birth: 'date_of_birth',
            date_created: 'date_created',
            date_modified: 'date_modified',
            signed_up_via_social: true
        }
    ])),
    end: jest.fn()
}));

describe('Test getInvitationHandler', () => {
    
    beforeEach( () => jest.resetModules() );
    
    it('should not accept PUT method', async done => {
        event = {
            httpMethod: 'PUT',
            pathParameters: {
                response_id: 'response_id'
            }
        };
        
        const result = await lambda.getInvitationHandler(event, context, callback, mysql);
        
        const expectedResult = {
            statusCode: 400,
            message: 'Bad request',
            reason: 'getInvitationHandler only accepts GET method, you tried: PUT'
        }
        
        expect(result).toEqual(expectedResult);
        
        done();
    });
    
    it('should not accept POST method', async done => {
        event = {
            httpMethod: 'POST',
            pathParameters: {
                response_id: 'user_id'
            }
        };
        
        const result = await lambda.getInvitationHandler(event, context, callback, mysql);
        
        const expectedResult = {
            statusCode: 400,
            message: 'Bad request',
            reason: 'getInvitationHandler only accepts GET method, you tried: POST'
        }
        
        expect(result).toEqual(expectedResult);
        
        done();
    });
    
    it('should fail with a suitable error when no response_id provided', async done => {
        
        event = {
            httpMethod: 'GET',
            pathParameters: {
                response_id: ''
            }
        };
        
        const result = await lambda.getInvitationHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request",
            "reason": "No invitation id provided",
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
        
        done();
    });
    
    it('should successfully get game response details', async done => {
        
        mysql.connect = jest.fn().mockImplementation((callback) => callback());
        mysql.query = jest.fn().mockImplementation((query, callback) => callback(null, [
            {
                response_id: 'response_id',
                date_responded: 'date_responded',
                can_play: true,
                date_modified: 'date_modified',
                organised_game_id: 'organised_game_id',
                user_id: 'user_id'
            }
        ])),
        
        event = {
            httpMethod: 'GET',
            pathParameters: {
                id: 'response_id'
            }
        };
        
        const result = await lambda.getInvitationHandler(event, context, callback, mysql);
        
        const expectedResult = {
            statusCode: 200,
            body: {
                results: {
                    response_id: 'response_id',
                    date_responded: 'date_responded',
                    can_play: true,
                    date_modified: 'date_modified',
                    organised_game_id: 'organised_game_id',
                    user_id: 'user_id'
                }
            }
        }
        
        expectedResult.body = JSON.stringify(expectedResult.body);
        
        expect(result).toEqual(expectedResult);
        done();
    });
    
});