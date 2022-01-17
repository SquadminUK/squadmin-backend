const mysql = require('mysql');
const lambda = require('../../../../src/handlers/users/get-registration-status');

var event, context, callback;

jest.mock('mysql', () => ({
    state: 'disconnected',
    createConnection: () => {},
    connect: jest.fn().mockImplementation((callback) => callback()),
    format: jest.fn(),
    query: jest.fn().mockImplementation((query, callback) => callback(null, [
        {
            user_id: 'user_id',
            full_name: 'full_name',
            email_address: 'email_address',
            mobile_number: 'mobile_number',
            username: 'username',
            has_registered_via_client: true,
            date_of_birth: 'date_of_birth',
            date_created: 'date_created',
            date_modified: 'date_modified',
            signed_up_via_social: true
        },
    ])),
    end: jest.fn()
}));

describe('Test getUsersRegistrationStatusHandler', () => {

    beforeEach( () => jest.resetModules() );

    it('should not accept the POST http method', async done => {
        event = {
            httpMethod: 'POST',
            pathParameters: {
                id: ''
            }
        };
        
        const result = await lambda.getUsersRegistrationStatusHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request",
            "reason": "getUsersRegistrationStatusHandler only accepts GET method, you tried: POST", 
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should not accept the PUT http method', async done => {
        event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: ''
            }
        };
        
        const result = await lambda.getUsersRegistrationStatusHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request",
            "reason": "getUsersRegistrationStatusHandler only accepts GET method, you tried: PUT", 
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
        done();
    });

    it('should return empty array when no users found', async done => {
        mysql.query = jest.fn().mockImplementation((query, callback) => callback(null, []));
        event = {
            httpMethod: 'GET',
            multiValueQueryStringParameters: {
                user_ids: ['user_id_1', 'user_id_2']
            }
        };

        const result = await lambda.getUsersRegistrationStatusHandler(event, context, callback, mysql);

        const expectedResult = {
            statusCode: 200,
            body: {
                results: {
                    users: []
                }
            }
        };

        expectedResult.body = JSON.stringify(expectedResult.body);

        expect(result).toEqual(expectedResult);
        done();
    });

    it('should return users and their registration status', async done => {

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
        ]));
        event = {
            httpMethod: 'GET',
            multiValueQueryStringParameters: {
                "user_ids": [
                    "user_id_1", 
                    "user_id_2" 
                ]
            } 
        };

        const result = await lambda.getUsersRegistrationStatusHandler(event, context, callback, mysql);

        const expectedResult = {
            statusCode: 200,
            body: {
                results: {
                    users: [{
                        user_id: 'user_id',
                        full_name: 'full_name',
                        email_address: 'email_address',
                        mobile_number: 'mobile_number',
                        username: 'username',
                        date_of_birth: 'date_of_birth',
                        date_created: 'date_created',
                        date_modified: 'date_modified',
                        signed_up_via_social: true
                    }]
                }
            }
        };

        expectedResult.body = JSON.stringify(expectedResult.body);

        expect(result).toEqual(expectedResult);
        done();
    });

});