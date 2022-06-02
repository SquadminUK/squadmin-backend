const OneSignal = require('@onesignal/node-onesignal');

exports.postNotificationHandler = async (event, context, callback) => {

    const app_key_provider = {
        getToken() {
            return process.env.ONE_SIGNAL_API_KEY;
        }
    };
    const user_key_provider = {
        getToken() {
            return process.env.ONE_SIGNAL_AUTH_KEY;
        }
    };

    console.log(`OneSignal API_KEY: ${process.env.ONE_SIGNAL_API_KEY}`);
    console.log(`OneSignal AUTH_KEY: ${process.env.ONE_SIGNAL_AUTH_KEY}`);

    const configuration = OneSignal.createConfiguration({
        authMethods: {
            user_key: {
                tokenProvider: user_key_provider
            },
            app_key: {
                tokenProvider: app_key_provider
            }
        }
    });

    let response = {
        statusCode: 200,
        body: {
            results: {
                message: "Successful request made"
            }
        }
    };

    const unsupportedOperation = {
        statusCode: 400,
        body:{
            message: "Unsupported operation"
        }
    };
    try {
        const { httpMethod } = event;
        if (httpMethod !== 'POST') {
            throw new Error(`getGamesHandler only accepts POST method, you tried: ${httpMethod}`);
        }
    } catch (exception) {
        response = unsupportedOperation;
    }

    const client = new OneSignal.DefaultApi(configuration);
    const notification = new OneSignal.Notification();
    notification.app_id = 'c8937e94-0548-48d4-b757-4c859cf6d722';
    notification.channel_for_external_user_ids = "push"
    notification.contents = {
        en: "This is a push notification from lambda"
    };

    // required for Huawei
    notification.headings = {
        en: ""
    };
    notification.include_external_user_ids = ['892d7e81-a90f-48e4-85b4-11d0d80c51dc'];
    await client.createNotification(notification);

    response.body = JSON.stringify(response.body);
    return response;
}