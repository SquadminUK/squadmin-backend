const mysql = require('mysql');
const lambda = require('../../../../src/handlers/login/login-via-email');

var event, context, callback;

jest.mock('mysql', () => ({
    state: 'disconnected',
    createConnection: () => {},
    connect: jest.fn().mockImplementation((callback) => callback()),
    format: jest.fn(),
    query: jest.fn().mockImplementation((query, callback) => callback(null, jest.fn())),
    end: jest.fn()
}));

describe('Test postLoginViaEmailHandler', () => {
    
    beforeEach( () => jest.resetModules() );
    
    it('should not accept the PUT http method', async () => {
        event = {
            httpMethod: 'PUT'
        };
        
        const result = await lambda.postLoginViaEmailHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request", 
            "reason": "postLoginViaEmailHandler only accepts POST method, you tried: PUT", 
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
    });
    
    it('should not accept the GET http method', async done => {
        event = {
            httpMethod: 'GET'
        };
        
        const result = await lambda.postLoginViaEmailHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request", 
            "reason": "postLoginViaEmailHandler only accepts POST method, you tried: GET", 
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should return a suitable error message when login fails', async done => {
        mysql.query = jest.fn().mockImplementation((query, callback) => callback(null, [{user_id: 'user_id', password: 'non-matching password'}]));
        mysql.connect = jest.fn().mockImplementation((callback) => callback());
        
        event = {
            httpMethod: 'POST',
            body: {
                email: 'email',
                password: 'password'
            }
        };

       event.body = JSON.stringify(event.body);
        
        const result = await lambda.postLoginViaEmailHandler(event, context, callback, mysql);
        
        const expectedResult = {
            statusCode: 400,
            message: "Bad request",
            reason: "Failed to login"
        };
        
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should return user details when successfully logs in', async done => {
        mysql.query = jest.fn().mockImplementation((query, callback) => callback(null, [
            {
                user_id: 'user_id',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: 'mobile_number',
                password: 'password',
                username: 'username',
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true
            }]));
            
            event = {
                httpMethod: 'POST',
                body: {
                    email: 'email',
                    password: 'password'
                }
            };
            
            event.body = JSON.stringify(event.body);

            const result = await lambda.postLoginViaEmailHandler(event, context, callback, mysql);
            
            const expectedResult = {
                statusCode: 200,
                body: {
                    results: {
                        user_id: 'user_id',
                        full_name: 'full_name',
                        email_address: 'email_address',
                        mobile_number: 'mobile_number',
                        password: 'password',
                        username: 'username',
                        date_of_birth: 'date_of_birth',
                        date_created: 'date_created',
                        date_modified: 'date_modified',
                        signed_up_via_social: true
                    }
                }
            };
            expectedResult.body = JSON.stringify(expectedResult.body);
            
            expect(result).toEqual(expectedResult);
            
            done();
        });
        
        
    });