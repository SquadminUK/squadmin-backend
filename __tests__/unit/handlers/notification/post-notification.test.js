const lambda = require('../../../../src/handlers/notification/post-notification');
const oneSignal = require('@onesignal/node-onesignal');

let event, context, callback;

jest.mock('@onesignal/node-onesignal');

describe('Test postNotificationHandler', () => {

    beforeEach(() => {
        jest.resetModules();
        process.env = {
            ONE_SIGNAL_AUTH_KEY: "AUTH_KEY",
            ONE_SIGNAL_API_KEY: "API_KEY"
        };
    });

    it('should only accept a POST request', async done => {
        event = {
            httpMethod: 'PUT'
        }

        const result = await lambda.postNotificationHandler(event, context, callback, oneSignal);

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

    it('should post a notification to the organiser when a player response to an invite', async done => {
        event = {
            httpMethod: 'POST',
            body: {
                inviting_player: {
                    name: 'Inviting Player',
                    inviting_player_id: 'inviting_player_id'
                },
                response: {
                    response_id: 'response_id',
                    can_play: true,
                    player_name: 'player_name'
                },
                notification_type: 'invitation_response'
            }
        };

        event.body = JSON.stringify(event.body);
        const result = await lambda.postNotificationHandler(event, context, callback, oneSignal);

        const expectedResult = {
            statusCode: 200,
            body: {
                results: {
                    message: "Successful request made"
                }
            }
        };

        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);
        done();
    });

    it('should post a notification to all the players that have been invited to a game', async done => {
        event = {
            httpMethod: 'POST',
            body: {
                inviting_player: {
                    name: 'Inviting Player',
                    inviting_player_id: 'inviting_player_id'
                },
                invited_players: [
                    {
                        "invited_player_id": 'player_id'
                    },
                    {
                        "invited_player_id": 'player_id'
                    }
                ],
                notification_type: 'organised_game'
            }
        };


        event.body = JSON.stringify(event.body);
        const result = await lambda.postNotificationHandler(event, context, callback, oneSignal);

        const expectedResult = {
            statusCode: 200,
            body: {
                results: {
                    message: "Successful request made"
                }
            }
        };

        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);
        done();
    });
});