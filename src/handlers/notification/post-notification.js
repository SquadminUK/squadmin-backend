const OneSignal = require('@onesignal/node-onesignal');

exports.postNotificationHandler = async (event, context, callback) => {

    let response = {
        statusCode: 200,
        body: {
            results: {
                message: "Successful request made"
            }
        }
    }

    response.body = JSON.stringify(response.body);
    return response;
}