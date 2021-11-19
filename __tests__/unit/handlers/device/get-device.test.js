const mysql = require('mysql');
const lambda = require('../../../../src/handlers/device/get-device');

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
    
    
    describe('Test getDeviceHandler', () => {
        
        beforeEach( () => jest.resetModules() );
        
        it('should throw an error and return that in a response when failing to connect', async () => {
            
            mysql.connect = jest.fn().mockImplementation((error) => error('error'));
            
            event = {
                httpMethod: 'GET',
                path: 'device_id'
            };
            const result = await lambda.getDeviceHandler(event, context, callback, mysql);
            
            const expectedResult = {
                statusCode: 400,
                message: "Bad request",
                reason: "Failed to connect"
            }
            
            expect(result).toEqual(expectedResult);
        });
        
        it('should get device details', async () => {
        
            mysql.connect = jest.fn().mockImplementation((error) => jest.fn())

            event = {
                httpMethod: 'GET',
                path: 'device_id',
                pathParameters: {
                    id: 'device_id'
                }
            };
        
            const result = await lambda.getDeviceHandler(event, context, callback, mysql);
        
            const expectedResult = {
                headers: "",
                isBase64Encoded: false,
                statusCode: 200,
                body: {
                    results: {
                        device_id: 'device_id',
                        device_make: 'device_make',
                        device_model: 'device_model',
                        ios_push_notification_token: 'ios_push',
                        android_push_notification_token: 'android_push'
                    }
                }
            }
        
            expect(result).toEqual(JSON.stringify(expectedResult));
        });

        it('should return an appropriate message when no devices found', async () => {
            mysql.query = jest.fn().mockImplementation((query, callback) => callback(null, []))

            event = {
                httpMethod: 'GET',
                pathParameters: {
                    id: 'device_id'
                }
            };

            const result = await lambda.getDeviceHandler(event, context, callback, mysql);

            const expectedResult = {
                statusCode: 200,
                results: [],
                message: 'No devices found'
            };

            expect(result).toEqual(expectedResult);
        });

        it('should not accept the PUT http method', async () => {
            event = {
                httpMethod: 'PUT',
                path: 'device_id'
            };

            const result = await lambda.getDeviceHandler(event, context, callback, mysql);
            const expectedResult = {"message": "Bad request", "reason": "getDeviceHandler only accepts GET method, you tried: PUT", "statusCode": 400}

            expect(result).toEqual(expectedResult);
        });
        
    });