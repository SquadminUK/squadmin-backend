const lambda = require('../../../../src/handlers/notification/post-notification');
let event, context, callback;

describe('Test postNotificationHandler', () => {
   it('should post a notification to OneSignal', async done => {

       const result = await lambda.postNotificationHandler(event, context, callback);

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