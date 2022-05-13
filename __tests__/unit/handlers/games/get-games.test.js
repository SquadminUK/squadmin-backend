const mysql = require('mysql');
var lamda = require('../../../../src/handlers/games/get-games');

var event, context, callback;

jest.mock('mysql', () => ({
    state: 'disconnected',
    createConnection: () => {},
    connect: jest.fn().mockImplementation((callback) => callback()),
    format: jest.fn(),
    query: jest.fn().mockImplementation((query, callback) => callback(null, [])),
    end: jest.fn()
}));

describe('Test getGamesHandler', () => {
    
    beforeEach( () => jest.resetModules() );
    
    it('should not accept the PUT http method', async done => {
        
        
        event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: 'user_id'
            }
        };
        
        const result = await lamda.getGamesHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request", 
            "reason": "getGamesHandler only accepts GET method, you tried: PUT", 
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should not accept the POST http method', async done => {
        
        event = {
            httpMethod: 'POST',
            pathParameters: {
                id: 'user_id'
            }
        };
        
        const result = await lamda.getGamesHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request", 
            "reason": "getGamesHandler only accepts GET method, you tried: POST", 
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should fetch the organised and invited to games', async done => {
        
        mysql.query = jest.fn().mockImplementation((query, callback) => callback(null, [
            {
                Game: {
                    id: 'id',
                    game_id: "game_id",
                    venue: null,
                    location: "location",
                    event_date: 'event_date',
                    date_created: 'date_created',
                    date_modified: 'date_modified',
                    organising_player: "organising_player"
                },
                Invitation: {
                    id: 'id',
                    response_id: 'response_id',
                    date_responded: 'date_responded',
                    can_play: 'can_play',
                    date_modified: 'date_modified',
                    organised_game_id: 'game_id',
                    user_id: 'user_id',
                },
                userTable: {
                    id: 'id',
                    user_id: 'user_id',
                    full_name: 'full_name',
                    email_address: 'email_address',
                    mobile_number: 'mobile_number',
                    username: 'username'
                }
            }
        ]));
        
        mysql.query = jest.fn().mockImplementation((query, callback) => callback(null, [
            {
                Game: {
                    id: 'id',
                    game_id: 'game_id',
                    venue: null,
                    location: 'location',
                    event_date: 'event_date',
                    date_created: 'date_created',
                    date_modified: null,
                    organising_player: 'organising_player',
                },
                Invitation: {
                    id: 'id',
                    response_id: 'response_id',
                    date_responded: null,
                    can_play: 'can_play',
                    date_modified: 'date_modified',
                    organised_game_id: 'game_id',
                    user_id: 'user_id',
                },
                userTable: {
                    id: 'id',
                    user_id: 'user_id',
                    full_name: 'full_name',
                    email_address: 'email_address',
                    mobile_number: 'mobile_number',
                    username: 'username'
                }
            }
        ]));
        
        event = {
            httpMethod: 'GET',
            pathParameters: {
                'id': 'user_id'
            }
        };
        
        const result = await lamda.getGamesHandler(event, context, callback, mysql);
        
        const expectedResult = {
            statusCode: 200,
            body: {
                results: {
                    organisedGames: [{
                        "id": "id",
                        "game_id": "game_id",
                        "venue": null,
                        "location": "location",
                        "event_date": "event_date",
                        "date_created": "date_created",
                        "date_modified": null,
                        "organising_player": "organising_player",
                        "invitedPlayers":[{
                            "id": "id",
                            "response_id": "response_id",
                            "date_responded": null,
                            "can_play": "can_play",
                            "date_modified": "date_modified",
                            "organised_game_id": "game_id",
                            "user_id": "user_id"  
                        }]
                    }],
                    invitedToGames: [
                        {
                            "id": "id",
                            "game_id": "game_id",
                            "venue": null,
                            "location": "location",
                            "event_date": "event_date",
                            "date_created": "date_created",
                            "date_modified": null,
                            "organising_player": "organising_player",
                            "invitation": {
                                "id": "id",
                                "response_id": "response_id",
                                "date_responded": null,
                                "can_play": "can_play",
                                "date_modified": "date_modified",
                                "organised_game_id": "game_id",
                                "user_id": "user_id",
                                "user_details": {
                                    "id": "id",
                                    "user_id": "user_id",
                                    "full_name": "full_name",
                                    "email_address": "email_address",
                                    "mobile_number": "mobile_number",
                                    "username": "username"
                                }
                            }
                        }
                    ]
                }
            }
        }
        
        
        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);
        
        done();
    });
});