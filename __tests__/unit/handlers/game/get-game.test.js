const mysql = require('mysql');
const lambda = require('../../../../src/handlers/game/get-game');

var event, context, callback;

jest.mock('mysql', () => ({
    state: 'disconnected',
    createConnection: () => {},
    connect: jest.fn().mockImplementation((error) => jest.fn()),
    format: jest.fn(),
    query: jest.fn().mockImplementation((query, callback) => callback(null, 
        {game: [], invites: []}
        )),
        end: jest.fn()
    }));

describe('Test getGameHandler', () => {

    it('should not accept the POST http method', async () => {
        event = {
            httpMethod: 'POST'
        };

        const result = await lambda.getGameByIdHandler(event, context, callback, mysql);

        const expectedResult = {
            "message": "Bad request",
            "reason": "getGameHandlerById only accepts GET method, you tried: POST", 
            "statusCode": 400
        };

        expect(result).toEqual(expectedResult);
    });

    it('should not accept the PUT http method', async () => {
        event = {
            httpMethod: 'PUT'
        };

        const result = await lambda.getGameByIdHandler(event, context, callback, mysql);

        const expectedResult = {
            "message": "Bad request",
            "reason": "getGameHandlerById only accepts GET method, you tried: PUT", 
            "statusCode": 400
        };

        expect(result).toEqual(expectedResult);
    });

    it('should error when no gameid provided in path', async() => {
        event = {
            httpMethod: 'GET'
        };

        const result = await lambda.getGameByIdHandler(event, context, callback, mysql);

        const expectedResult = {
            "message": "Bad request",
            "reason": "No game id provided",
            "statusCode": 400
        };

        expect(result).toEqual(expectedResult);
    });

    // it('should get the game details by id', async() => {
    //     event = {
    //         httpMethod: 'GET',
    //         path: 'game_id'
    //     }

    //     const result = await lambda.getGameByIdHandler(event, context, callback, mysql);

    //     const expectedResult = {
    //         statusCode: 200,
    //         game: {
    //             game_id: '',
    //             venue: '',
    //             location: '',
    //             date_created: '',
    //             date_modified: '',
    //             organising_player: '',
    //             invitedPlayers: [
    //                 {
    //                     organised_game_id: '',
    //                     response_id: '',
    //                     date_responded: '',
    //                     can_play: '',
    //                     date_modified: '',
    //                     user_id: ''
    //                 }
    //             ]
    //         }
    //     }

    //     expect(result).toEqual(expectedResult);

    // });
});