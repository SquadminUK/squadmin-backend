const mysql = require('mysql');
const lambda = require('../../../../src/handlers/game/post-game');


var event, context, callback;

jest.mock('mysql', () => ({
    state: 'disconnected',
    createConnection: () => {},
    connect: jest.fn().mockImplementation((callback) => callback()),
    format: jest.fn(),
    query: jest.fn().mockImplementation((query, callback) => callback(null, 
        [{ 
            device_id: 'device_id', device_make: 'device_make', device_model: 'device_model', ios_push_notification_token: 'ios_push', android_push_notification_token: 'android_push'
        }]
        )),
        end: jest.fn()
    }));
    
    describe('Test postGameHandler', () => {
        
        beforeEach( () => jest.resetModules() );
        
        it('should not accept the PUT http method', async done => {
            event = {
                httpMethod: 'PUT'
            };
            
            const result = await lambda.postGameHandler(event, context, callback, mysql);
            const expectedResult = {"message": "Bad request", "reason": "postGameHandler only accepts POST method, you tried: PUT", "statusCode": 400}
            
            expect(result).toEqual(expectedResult);
            done();
        });
        
        it('should not accept the GET http method', async done => {
            event = {
                httpMethod: 'GET'
            };
            
            const result = await lambda.postGameHandler(event, context, callback, mysql);
            const expectedResult = {"message": "Bad request", "reason": "postGameHandler only accepts POST method, you tried: GET", "statusCode": 400}
            
            expect(result).toEqual(expectedResult);
            done();
        });
        
        it('should create and insert a game and the invited players', async done => {
            
            event = {
                httpMethod: 'POST',
                body: {
                    game: {
                        game_id: 'game_id',
                        venue: 'venue',
                        location: 'location',
                        date_created: 'date_created',
                        date_modified: 'date_modified',
                        organising_player: 'organising_player'
                    },
                    invitedPlayers: [
                        {
                            organised_game_id: 'organised_game_id',
                            response_id: 'response_id',
                            date_responded: 'date_responded',
                            can_play: 'can_play',
                            date_modified: 'date_modified',
                            user_id: 'user_id',
                            mobile_number: 'mobile_number 0',
                            email_address: 'email_address 0'
                        },
                        {
                            organised_game_id: 'organised_game_id',
                            response_id: 'response_id',
                            date_responded: 'date_responded',
                            can_play: 'can_play',
                            date_modified: 'date_modified',
                            user_id: 'user_id',
                            mobile_number: 'mobile_number 1',
                            email_address: 'email_address 1'
                        },
                    ]
                }
            }

            const result = await lambda.postGameHandler(event, context, callback, mysql);

            const expectedResult = {
                statusCode: 201,
                body: {
                    results: {
                        game: {
                            game_id: 'game_id',
                            venue: 'venue',
                            location: 'location',
                            date_created: 'date_created',
                            date_modified: 'date_modified',
                            organising_player: 'organising_player'
                        },
                        invitedPlayers: [
                            {
                                organised_game_id: 'organised_game_id',
                                response_id: 'response_id',
                                date_responded: 'date_responded',
                                can_play: 'can_play',
                                date_modified: 'date_modified',
                                user_id: 'user_id'
                            },
                            {
                                organised_game_id: 'organised_game_id',
                                response_id: 'response_id',
                                date_responded: 'date_responded',
                                can_play: 'can_play',
                                date_modified: 'date_modified',
                                user_id: 'user_id'
                            },
                        ]
                    }
                }
            }

        });
    });