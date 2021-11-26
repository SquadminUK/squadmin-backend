const mysql = require('mysql');
const lambda = require('../../../../src/handlers/invitation/respond/put-invitation');

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

describe('Test putInvitationHandler', () => {
    
    beforeEach( () => jest.resetModules() );
    
    it('should not accept GET method', async done => {
        event = {
            httpMethod: 'GET',
            pathParameters: {
                user_id: 'user_id'
            }
        };
        
        const result = await lambda.putInvitationHandler(event, context, callback, mysql);
        
        const expectedResult = {
            statusCode: 400,
            message: 'Bad request',
            reason: 'putInvitationHandler only accepts PUT method, you tried: GET'
        }
        
        expect(result).toEqual(expectedResult);
        
        done();
    });
    
    it('should not accept POST method', async done => {
        event = {
            httpMethod: 'POST',
            pathParameters: {
                invitation_id: 'user_id'
            }
        };
        
        const result = await lambda.putInvitationHandler(event, context, callback, mysql);
        
        const expectedResult = {
            statusCode: 400,
            message: 'Bad request',
            reason: 'putInvitationHandler only accepts PUT method, you tried: POST'
        }
        
        expect(result).toEqual(expectedResult);
        
        done();
    });
    
    it('should fail with a suitable error when no response_id provided', async done => {
        
        event = {
            httpMethod: 'PUT',
            pathParameters: {
                invitation_id: ''
            }
        };
        
        const result = await lambda.putInvitationHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request",
            "reason": "No invitation id provided",
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
        
        done();
    });
    
    it('should successfully update game response', async done => {
        
        mysql.connect = jest.fn().mockImplementation((callback) => callback());
        mysql.query = jest.fn().mockImplementation((query, callback) => callback(null, [
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

        event = {
            httpMethod: 'PUT',
            pathParameters: {
                invitation_id: 'response_id'
            },
            body: {
                response_id: 'response_id',
                can_play: true,
                date_modified: 'date_modified'
            }
        };
        
        const result = await lambda.putInvitationHandler(event, context, callback, mysql);
        
        const expectedResult = {
            statusCode: 200,
            body: {
                results: {
                    response_id: 'response_id',
                    can_play: true,
                    date_modified: 'date_modified'
                }
            }
        }
        
        expectedResult.body = JSON.stringify(expectedResult.body);

        expect(result).toEqual(expectedResult);
        done();
    });
    
});