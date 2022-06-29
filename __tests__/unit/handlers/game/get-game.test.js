const mysql = require('mysql');
const lambda = require('../../../../src/handlers/game/get-game');

var event, context, callback;

jest.mock('mysql', () => ({
    state: 'disconnected',
    createConnection: () => {},
    connect: jest.fn().mockImplementation((callback) => callback()),
    format: jest.fn(),
    query: jest.fn().mockImplementation((query, callback) => callback(null, [
        {
            Game: {
                game_id: 'game_id',
                venue: 'venue',
                location: 'location',
                date_created: 'date_created',
                date_modified: 'date_modified',
                organising_player: 'organising_player',
            },
            Invitation: {
                organised_game_id: 'organised_game_id',
                response_id: 'response_id',
                date_responded: 'date_responded',
                can_play: 'can_play',
                date_modified: 'date_modified',
                user_id: 'user_id'
            }
        }
    ])),
    end: jest.fn()
}));

describe('Test getGameHandler', () => {
    
    beforeEach( () => jest.resetModules() );

    it('should not accept the POST http method', async done => {
        event = {
            httpMethod: 'POST',
            pathParameters: {
                id: ''
            }
        };
        
        const result = await lambda.getGameByIdHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request",
            "reason": "getGameHandlerById only accepts GET method, you tried: POST", 
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should not accept the PUT http method', async () => {
        event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: ''
            }
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
            httpMethod: 'GET',
            pathParameters: {
                id: ''
            }
        };
        
        const result = await lambda.getGameByIdHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request",
            "reason": "No game id provided",
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
    });
    
    it('should retrieve game details by id', async done => {

        mysql.query = jest.fn().mockImplementation((query, callback) => callback(null, [
            {
                Game: {
                    game_id: 'game_id',
                    venue: 'venue',
                    location: 'location',
                    date_created: 'date_created',
                    date_modified: 'date_modified',
                    organising_player: 'organising_player',
                },
                Invitation: {
                    organised_game_id: 'organised_game_id',
                    response_id: 'response_id_1',
                    date_responded: 'date_responded_1',
                    can_play: null,
                    date_modified: 'date_modified_1',
                    user_id: 'user_id_1'
                },
                UserTable: {
                    user_id: 'user_id_1',
                    full_name: 'full_name_1',
                    email_address: 'email_address_1',
                    mobile_number: 'mobile_number_1',
                    username: 'username_1',
                    date_of_birth: 'date_of_birth_1',
                    date_created: 'date_created_1',
                    date_modified: 'date_modified_1',
                    signed_up_via_social: true
                }
            },
            {  Game: {
                    game_id: 'game_id',
                    venue: 'venue',
                    location: 'location',
                    date_created: 'date_created',
                    date_modified: 'date_modified',
                    organising_player: 'organising_player',
                },
                Invitation: {
                    organised_game_id: 'organised_game_id',
                    response_id: 'response_id_2',
                    date_responded: 'date_responded_2',
                    can_play: true,
                    date_modified: 'date_modified_2',
                    user_id: 'user_id_2'
                },
                UserTable: {
                    user_id: 'user_id_2',
                    full_name: 'full_name_2',
                    email_address: 'email_address_2',
                    mobile_number: 'mobile_number_2',
                    username: 'username_2',
                    date_of_birth: 'date_of_birth_2',
                    date_created: 'date_created_2',
                    date_modified: 'date_modified_2',
                    signed_up_via_social: true
                }
            }
        ]));

        event = {
            httpMethod: 'GET',
            pathParameters: {
                id: 'game_id'
            }
        };
        
        const result = await lambda.getGameByIdHandler(event, context, callback, mysql);
        
        const expectingResult = {
            statusCode: 200,
            body: {
                results: {
                    game: {
                        game_id: 'game_id',
                        venue: 'venue',
                        location: 'location',
                        date_created: 'date_created',
                        date_modified: 'date_modified',
                        organising_player: 'organising_player',
                    },
                    invitedPlayers: [
                        {
                            organised_game_id: 'organised_game_id',
                            response_id: 'response_id_1',
                            date_responded: 'date_responded_1',
                            can_play: null,
                            date_modified: 'date_modified_1',
                            user_id: 'user_id_1',
                            user_details: {
                                user_id: 'user_id_1',
                                full_name: 'full_name_1',
                                email_address: 'email_address_1',
                                mobile_number: 'mobile_number_1',
                                username: 'username_1',
                                date_of_birth: 'date_of_birth_1',
                                date_created: 'date_created_1',
                                date_modified: 'date_modified_1',
                                signed_up_via_social: true
                            }
                        },
                        {
                            organised_game_id: 'organised_game_id',
                            response_id: 'response_id_2',
                            date_responded: 'date_responded_2',
                            can_play: true,
                            date_modified: 'date_modified_2',
                            user_id: 'user_id_2',
                            user_details: {
                                user_id: 'user_id_2',
                                full_name: 'full_name_2',
                                email_address: 'email_address_2',
                                mobile_number: 'mobile_number_2',
                                username: 'username_2',
                                date_of_birth: 'date_of_birth_2',
                                date_created: 'date_created_2',
                                date_modified: 'date_modified_2',
                                signed_up_via_social: true
                            }
                        }
                    ]
                }
            }
        };
        
        expectingResult.body = JSON.stringify(expectingResult.body);
        
        expect(result).toEqual(expectingResult);
        done();
    });
});