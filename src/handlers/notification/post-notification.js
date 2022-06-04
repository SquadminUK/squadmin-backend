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
        body: {
            message: "Unsupported operation"
        }
    };

    const badRequest = {
        statusCode: 400,
        body: {
            message: "Bad request"
        }
    }

    try {
        const {httpMethod} = event;
        if (httpMethod !== 'POST') {
            throw new Error(`getGamesHandler only accepts POST method, you tried: ${httpMethod}`);
        }

        event.body = JSON.parse(event.body);

    } catch (exception) {
        response = unsupportedOperation;
        response.body = JSON.stringify(response.body);
        return response;
    }

    const client = new OneSignal.DefaultApi(configuration);
    const notification = new OneSignal.Notification();
    notification.app_id = 'c8937e94-0548-48d4-b757-4c859cf6d722';
    notification.channel_for_external_user_ids = "push"

    let notificationTitle = '';
    let notificationSubtitle = '';
    let externalUserIds = [];


    switch (event.body.notification_type) {
        case "invitation_response": {
            notificationTitle = 'Invitation response!';
            let canOrCant = event.body.response.can_play ? "can" : "can't";
            notificationSubtitle = `${event.body.response.player_name} has confirmed they ${canOrCant} play`;
            externalUserIds.push(event.body.inviting_player.inviting_player_id);
            break;
        }
        case "organised_game": {
            notificationTitle = `${event.body.inviting_player.name} has invited you to a game`;
            notificationSubtitle = "Let them know if you can make it";
            if (event.body.invited_players !== undefined) {
                event.body.invited_players.forEach(function (value, index, array) {
                    externalUserIds.push(value.invited_player_id);
                });
            }
            break;
        }
    }

    notification.contents = {
        en: notificationTitle
    }
    notification.headings = {
        en: notificationTitle
    };
    notification.subtitle = {
        en: notificationSubtitle
    };
    notification.include_external_user_ids = externalUserIds;

    await client.createNotification(notification);

    response.body = JSON.stringify(response.body);
    return response;
}