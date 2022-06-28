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

    it(`should successfully insert user details when they're not registered`, async done => {
        mysql.connect = jest.fn().mockImplementation((callback) => callback());
        mysql.query = jest.fn()
            .mockImplementationOnce((query, callback) => callback(null, []))
            .mockImplementationOnce((query, callback) => callback(null, [
            {
                user_id: 'user_id',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: 'mobile_number',
                username: 'username',
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true,
                has_registered_via_client: true
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
                password: 'password',
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                signed_up_via_social: true,
                has_registered_via_client: true
            }
        };

        event.body = JSON.stringify(event.body);

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
                    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
                    signed_up_via_social: true,
                    has_registered_via_client: true
                }
            }
        }

        expectedResult.body = JSON.stringify(expectedResult.body);

        expect(result).toEqual(expectedResult);
        done();
    });

    it(`should update and return user details if they already exist (most likely from an invitation)`, async done => {
        mysql.connect = jest.fn().mockImplementation((callback) => callback());
        mysql.query = jest.fn()
            .mockImplementationOnce((query, callback) => callback(null, [
            {
                user_id: 'user_id',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: 'mobile_number',
                username: 'username',
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true,
                has_registered_via_client: true
            }
        ]))
            .mockImplementationOnce((query, callback) => callback(null, []))
            .mockImplementationOnce((query, callback) => callback(null, [
                {
                    user_id: 'user_id',
                    full_name: 'full_name',
                    email_address: 'email_address',
                    mobile_number: 'mobile_number',
                    username: 'username',
                    date_of_birth: 'date_of_birth',
                    date_created: 'date_created',
                    date_modified: 'date_modified',
                    signed_up_via_social: true,
                    has_registered_via_client: true,
                    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
                }
            ]))

        event = {
            httpMethod: 'POST',
            body: {
                user_id: 'user_id',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: 'mobile_number',
                username: 'username',
                password: 'password',
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                signed_up_via_social: true,
                has_registered_via_client: true
            }
        };
        event.body = JSON.stringify(event.body);

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
                    date_modified: 'date_modified',
                    signed_up_via_social: true,
                    has_registered_via_client: true,
                    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
                }
            }
        }

        expectedResult.body = JSON.stringify(expectedResult.body);

        expect(result).toEqual(expectedResult);
        done();
    });

    it(`should return user details if the person signing in uses apple sign up`, async done => {
       mysql.connect = jest.fn().mockImplementation((callback) => callback());
        mysql.query = jest.fn().mockImplementationOnce((query, callback) => callback(null, []))
            .mockImplementationOnce((query, callback) => callback(null, []))
            .mockImplementationOnce((query, callback) => callback(null, []))

        event = {
            httpMethod: 'POST',
            body: {
                user_id: 'user_id',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: null,
                username: null,
                password: null,
                date_modified: null,
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                signed_up_via_social: true,
                has_registered_via_client: true
            }
        };
        event.body = JSON.stringify(event.body);

        const result = await lambda.postUserHandler(event, context, callback, mysql);

        const expectedResult = {
            statusCode: 200,
            body: {
                results: {
                    user_id: 'user_id',
                    full_name: 'full_name',
                    email_address: 'email_address',
                    mobile_number: null,
                    username: null,
                    date_of_birth: 'date_of_birth',
                    date_created: 'date_created',
                    password: null,
                    date_modified: null,
                    signed_up_via_social: true,
                    has_registered_via_client: true,
                }
            }
        }

        expectedResult.body = JSON.stringify(expectedResult.body);

        expect(result).toEqual(expectedResult);
        done(); 
    });
});