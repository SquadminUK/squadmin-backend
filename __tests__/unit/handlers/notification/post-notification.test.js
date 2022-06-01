let event, context, callback;
const lambda = require('../../../../src/handlers/notification/post-notification');
const oneSignal = require('@onesignal/node-onesignal');
jest.mock('@onesignal/node-onesignal');

describe('Test postNotificationHandler', () => {

    it('should only accept a POST request', async done => {
        event = {
            httpMethod: 'PUT'
        }

        const result = await lambda.postNotificationHandler(event, context, callback, oneSignalMock);

        const expectedResult = {
            statusCode: 400,
            body: {
                message: "Unsupported operation"
            }
        }

        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);
        done();

    });

   it('should post a notification to OneSignal', async done => {

       event = {
           httpMethod: 'POST'
       }

       process.env.ONE_SIGNAL_API_KEY = "APIKEY"
       process.env.ONE_SIGNAL_AUTH_KEY = "AUTHKEY"

       const result = await lambda.postNotificationHandler(event, context, callback, oneSignal);

       const expectedResult = {
           statusCode: 200,
           body: {
               results: {
                   message: "Successful request made"
               }
           }
       }

       expectedResult.body = JSON.stringify(expectedResult.body);
       expect(result).toEqual(expectedResult);

       done();
   });
});