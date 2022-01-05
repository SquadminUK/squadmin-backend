const mysql = require('mysql');
const lambda = require('../../../../src/handlers/game/post-game');


var event, context, callback;

jest.mock('mysql', () => ({
    state: 'disconnected',
    createConnection: () => {},
    connect: jest.fn().mockImplementation((callback) => callback()),
    format: jest.fn(),
    query: jest.fn().mockImplementation((query, callback) => callback(null, [])),
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
    
    it('should create a game and insert all the new players to the system', async done => {
        mysql.query = jest.fn()
        .mockImplementationOnce((query, callback) => callback(null, []))
        .mockImplementationOnce((query, callback) => callback(null, []));
        
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
                        mobile_number: '+44 7931 123 457',
                    },
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '07931 123456',

                    },
                ]
            }
        }
        
        event.body = JSON.stringify(event.body);

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
                            mobile_number: '+447931123457',
                        },
                        {
                            organised_game_id: 'organised_game_id',
                            response_id: 'response_id',
                            mobile_number: '+447931123456',
    
                        },
                    ]
                }
            }
        }
        
        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should recognise one player isnt in the database and insert them', async done => {
        mysql.query = jest.fn().mockImplementationOnce((query, callback) => callback(null, [{
            user_id: 'user_id',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931123457',
                username: 'username',
                has_registered_via_client: false,
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true
        }]))
        .mockImplementationOnce((query, callback) => callback(null, []));
        
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
                        mobile_number: '+44 7931 123 457',
                    },
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '07931 123456',
                    },
                ]
            }
        }

        event.body = JSON.stringify(event.body);
        
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
                            mobile_number: '+447931123457',
                        },
                        {
                            organised_game_id: 'organised_game_id',
                            response_id: 'response_id',
                            mobile_number: '+447931123456',
                        },
                    ]
                }
            }
        }
        
        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);
        done();
    });

    it('should recognise all invited players and invite them', async done => {
        mysql.query = jest.fn().mockImplementationOnce((query, callback) => callback(null, [
            {
                user_id: 'user_id',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931123457',
                username: 'username',
                has_registered_via_client: false,
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true
            },
            {
                user_id: 'user_id',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931123456',
                username: 'username',
                has_registered_via_client: false,
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true
            }
            
            ]))
        .mockImplementationOnce((query, callback) => callback(null, []));
        
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
                        mobile_number: '+44 7931 123 457',
                    },
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '07931 123456',
                    },
                ]
            }
        }

        event.body = JSON.stringify(event.body);
        
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
                            mobile_number: '+447931123457',
                        },
                        {
                            organised_game_id: 'organised_game_id',
                            response_id: 'response_id',
                            mobile_number: '+447931123456',
                        },
                    ]
                }
            }
        }
        
        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);
        done();
    });
    
});