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
            path: 'user_id'
        };

        const result = await lambda.postDeviceHandler(event, context, callback, mysql);

        const expectedResult = {
            "message": "Bad request", 
            "reason": "postDeviceHandler only accepts POST method, you tried: PUT", 
            "statusCode": 400
        };

        expect(result).toEqual(expectedResult);
    });

    it('should not accept the GET http method', async () => {
        event = {
            httpMethod: 'GET',
            path: 'user_id'
        };

        const result = await lambda.postDeviceHandler(event, context, callback, mysql);

        const expectedResult = {
            "message": "Bad request", 
            "reason": "postDeviceHandler only accepts POST method, you tried: GET", 
            "statusCode": 400
        };

        expect(result).toEqual(expectedResult);
    });

    it('should error when no userId provided in path and attempting to create device details', async () => {
        event = {
            httpMethod: 'POST'
        };

        const result = await lambda.postDeviceHandler(event, context, callback, mysql);

        const expectedResult = {
            "message": "Bad request",
            "reason": "No user id provided",
            "statusCode": 400
        };

        expect(result).toEqual(expectedResult);
    });

    it('should successfully insert device details', async () => {

        event = {
            httpMethod: 'POST',
            path: 'user_id',
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
            results: {
                device_id: 'device_id',
                device_make: 'device_make',
                device_model: 'device_model',
                ios_push_notification_token: 'ios_push',
                android_push_notification_token: '',
                date_created: 'date'
            }
        };

        expect(result).toEqual(expectedResult);
    });
});