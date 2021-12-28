const mysql = require('mysql');
const lambda = require('../../../../src/handlers/device/post-device');

var event, context, callback;

jest.mock('mysql', () => ({
    state: 'disconnected',
    createConnection: () => {},
    connect: jest.fn().mockImplementation((error) => jest.fn()),
    format: jest.fn(),
    query: jest.fn().mockImplementation((query, callback) => callback(null, jest.fn())),
        end: jest.fn()
    }));

describe('Test postDeviceHandler', () => {
    it('should not accept the PUT http method', async () => {
        event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: "user_id"
            },
        };

        const result = await lambda.postDeviceHandler(event, context, callback, mysql);

        const expectedResult = {
            "message": "Bad request", 
            "reason": "postDeviceHandler only accepts POST method, you tried: PUT", 
            "statusCode": 400
        };

        expect(result).toEqual(expectedResult);
    });

    it('should not accept the GET http method', async done => {
        event = {
            httpMethod: 'GET',
            pathParameters: {
                id: "user_id"
            },
        };

        const result = await lambda.postDeviceHandler(event, context, callback, mysql);

        const expectedResult = {
            "message": "Bad request", 
            "reason": "postDeviceHandler only accepts POST method, you tried: GET", 
            "statusCode": 400
        };

        expect(result).toEqual(expectedResult);
        done();
    });

    it('should error when no userId provided in path and attempting to create device details', async done => {
        event = {
            httpMethod: 'POST',
            pathParameters: {
                id: ''
            }
        };

        const result = await lambda.postDeviceHandler(event, context, callback, mysql);

        const expectedResult = {
            "message": "Bad request",
            "reason": "No user id provided",
            "statusCode": 400
        };

        expect(result).toEqual(expectedResult);
        done();
    });

    it('should successfully insert device details', async done => {

        mysql.connect = jest.fn().mockImplementation((callback) => {
            callback();
        })

        event = {
            httpMethod: 'POST',
            pathParameters: {
                id: "user_id"
            },
            body: {
                device_id: 'device_id',
                device_make: 'device_make',
                device_model: 'device_model',
                ios_push_notification_token: 'ios_push',
                android_push_notification_token: '',
                date_created: 'date'
            }
        };

        const result = await lambda.postDeviceHandler(event, context, callback, mysql);

        const expectedResult = {
            statusCode: 201,
            body: {
                results: {
                    device_id: 'device_id',
                    device_make: 'device_make',
                    device_model: 'device_model',
                    ios_push_notification_token: 'ios_push',
                    android_push_notification_token: '',
                    date_created: 'date'
                }   
            }
        };

        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);
        done();
    });
});