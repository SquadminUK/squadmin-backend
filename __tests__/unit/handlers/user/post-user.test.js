const mysql = require('mysql');
const lambda = require('../../../../src/handlers/user/post-user');

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

describe('Test postUserHandler', () => {
    
    beforeEach( () => jest.resetModules() );
    
    it('should not accept GET method', async done => {
        event = {
            httpMethod: 'GET',
            pathParameters: {
                user_id: 'user_id'
            }
        };
        
        const result = await lambda.postUserHandler(event, context, callback, mysql);
        
        const expectedResult = {
            statusCode: 400,
            message: 'Bad request',
            reason: 'postUserHandler only accepts POST method, you tried: GET'
        }
        
        expect(result).toEqual(expectedResult);
        
        done();
    });
    
    it('should not accept PUT method', async done => {
        event = {
            httpMethod: 'PUT'
        };
        
        const result = await lambda.postUserHandler(event, context, callback, mysql);
        
        const expectedResult = {
            statusCode: 400,
            message: 'Bad request',
            reason: 'postUserHandler only accepts POST method, you tried: PUT'
        }
        
        expect(result).toEqual(expectedResult);
        
        done();
    });
    
    it('should successfully insert user details', async done => {
        
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
            httpMethod: 'POST',
            body: {
                user_id: 'user_id',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: 'mobile_number',
                username: 'username',
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                signed_up_via_social: true
            }
        };
        
        const result = await lambda.postUserHandler(event, context, callback, mysql);
        
        const expectedResult = {
            statusCode: 200,
            body: {
                results: {
                    user_id: 'user_id',
                    full_name: 'full_name',
                    email_address: 'email_address',
                    mobile_number: 'mobile_number',
                    username: 'username',
                    date_of_birth: 'date_of_birth',
                    date_created: 'date_created',
                    signed_up_via_social: true
                }
            }
        }
        
        expectedResult.body = JSON.stringify(expectedResult.body);

        expect(result).toEqual(expectedResult);
        done();
    });
    
});