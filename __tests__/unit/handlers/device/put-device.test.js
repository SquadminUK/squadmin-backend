const { IoT1ClickDevicesService } = require('aws-sdk');
const mysql = require('mysql');
const lambda = require('../../../../src/handlers/device/put-device');

var event, context, callback;

jest.mock('mysql', () => ({
    state: 'disconnected',
    createConnection: () => {},
    connect: jest.fn().mockImplementation((error) => jest.fn()),
    format: jest.fn(),
    query: jest.fn().mockImplementation((query, callback) => callback(null, 
        [{ 
            device_id: 'device_id', device_make: 'device_make', device_model: 'device_model', ios_push_notification_token: 'ios_push', android_push_notification_token: 'android_push'
        }]
        )),
        end: jest.fn()
    }));

describe('Test putDeviceHandler', () => {
    
    it('should not accept the GET http method', async () => {
        event = {
            httpMethod: 'GET'
        };

        const result = await lambda.putDeviceHandler(event, context, callback, mysql);

        const expectedResult = {
            "message": "Bad request",
            "reason": "putDeviceHandler only accepts PUT method, you tried: GET", 
            "statusCode": 400
        };

        expect(result).toEqual(expectedResult);
    });

    it('should not accept the POST http method', async () => {
        event = {
            httpMethod: 'POST'
        };

        const result = await lambda.putDeviceHandler(event, context, callback, mysql);

        const expectedResult = {
            "message": "Bad request",
            "reason": "putDeviceHandler only accepts PUT method, you tried: POST", 
            "statusCode": 400
        };

        expect(result).toEqual(expectedResult);
    });

    it('should error when no userId provided in path and attempting to update device details', async () => {
        event = {
            httpMethod: 'PUT'
        };

        const result = await lambda.putDeviceHandler(event, context, callback, mysql);

        const expectedResult = {
            "message": "Bad request",
            "reason": "No user id provided",
            "statusCode": 400
        };

        expect(result).toEqual(expectedResult);
    });

    it('should successfully update device details', async () => {
        event = {
            httpMethod: 'PUT',
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

        const result = await lambda.putDeviceHandler(event, context, callback, mysql);

        const expectedResult = {
            statusCode: 200,
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