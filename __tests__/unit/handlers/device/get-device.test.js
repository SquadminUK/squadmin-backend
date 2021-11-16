const lambda = require('../../../../src/handlers/device/get-device');

describe('Test getDeviceHandler', () => {

    it('should get device details', async () => {
        
        const event = {
            httpMethod: 'GET',
            path: 'device_id'
        };

        const result = await lambda.getDeviceHandler(event);
        
        const expectedResult = {
            statusCode: 200,
            device: {
                device_id: 'device_id',
                device_make: 'device_make',
                device_model: 'device_model',
                ios_push_notification_token: 'ios_push',
                android_push_notification_token: 'android_push'
            }
        }

        expect(result).toEqual(expectedResult);
    });

});