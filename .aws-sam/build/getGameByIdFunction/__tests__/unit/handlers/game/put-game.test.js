const mysql = require('mysql');
const lambda = require('../../../../src/handlers/game/put-game');

var event, context, callback;

jest.mock('uuid', () => ({ v4: () => 'test_id'}));

jest.mock('mysql', () => ({
    state: 'disconnected',
    createConnection: () => {},
    connect: jest.fn().mockImplementation((callback) => callback()),
    format: jest.fn(),
    query: jest.fn().mockImplementation((query, callback) => callback(null, [])),
    end: jest.fn()
}));

describe('Test putGameHandlerById', () => {
    it('should not accept the POST http method', async done => {
        event = {
            httpMethod: 'POST',
            pathParameters: {
                id: 'game_id'
            }
        };
        
        const result = await lambda.putGameByIdHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request",
            "reason": "putGameHandlerById only accepts PUT method, you tried: POST",
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should not accept the GET http method', async done => {
        event = {
            httpMethod: 'GET',
            pathParameters: {
                id: 'game_id'
            }
        };
        
        const result = await lambda.putGameByIdHandler(event, context, callback, mysql);
        
        const expectedResult = {
            "message": "Bad request",
            "reason": "putGameHandlerById only accepts PUT method, you tried: GET",
            "statusCode": 400
        };
        
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should update game details', async done => {
        
        event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: 'game_id'
            },
            body: {
                game: {
                    location: "location",
                    event_date: "event_date",
                    is_active: true
                },
                invitedPlayers:[]
            }
        };
        
        const result = await lambda.putGameByIdHandler(event, context, callback, mysql);
        
        const expectedResult = {
            statusCode: 201,
            body: {
                results: {
                    game: {                        
                        location: "location",
                        event_date: "event_date",
                        is_active: true
                    },
                    invitedPlayers: []
                }
            }
        };
        
        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);
        done();
    });
    
    it('should update the invitation details', async done => {
        mysql.query = jest.fn()
        .mockImplementationOnce((query, callback) => callback(null, []))
        .mockImplementationOnce((query, callback) => callback(null, [
            {
                user_id: 'test_id',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931123456',
                username: 'username',
                has_registered_via_client: false,
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true
            }, {
                user_id: 'test_id',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931123457',
                username: 'username',
                has_registered_via_client: false,
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true
            }, {
                user_id: 'test_id',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931654321',
                username: 'username',
                has_registered_via_client: false,
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true
            }
        ]));
        event = {
            httpMethod: 'PUT',
            pathParameters: {
                id: 'game_id'
            },
            body: {
                game: {
                    location: "location",
                    event_date: "event_date",
                    is_active: true                    
                },
                invitedPlayers: [
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 123 456',
                    },
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 123 457'
                    },
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 654 321'
                    }
                ]
            }
        };
        
        const result = await lambda.putGameByIdHandler(event, context, callback, mysql);
        const expectedResult = {
            statusCode: 201,
            body: {
                results: {
                    game: {                        
                        location: "location",
                        event_date: "event_date",
                        is_active: true
                    },
                    invitedPlayers: [
                        {
                            "organised_game_id": "organised_game_id",
                            "response_id": "response_id",
                            "mobile_number": "+447931123456"
                        },
                        {
                            "organised_game_id": 'organised_game_id',
                            "response_id": 'response_id',
                            "mobile_number": '+447931123457'
                        },
                        {
                            "organised_game_id": 'organised_game_id',
                            "response_id": "response_id",
                            "mobile_number": "+447931654321"
                        }
                    ]
                }
            }
        }; 

        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);
        
        done();
    });

    it('should update the invitation details - 1 player has been uninvited', async done => {
        mysql.query = jest.fn()
        .mockImplementationOnce((query, callback) => callback(null, []))
        .mockImplementationOnce((query, callback) => callback(null, [
            {
                user_id: 'test_id',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931123456',
                username: 'username',
                has_registered_via_client: false,
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true
            }, {
                user_id: 'test_id',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931123457',
                username: 'username',
                has_registered_via_client: false,
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true
            }, {
                user_id: 'test_id',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931654321',
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
            httpMethod: 'PUT',
            pathParameters: {
                id: 'game_id'
            },
            body: {
                game: {
                    location: "location",
                    event_date: "event_date",
                    is_active: true                    
                },
                invitedPlayers: [
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 123 456',
                    },
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 123 457'
                    },
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 654 321',
                        has_been_uninvited: true
                    }
                ]
            }
        };
        
        const result = await lambda.putGameByIdHandler(event, context, callback, mysql);
        const expectedResult = {
            statusCode: 201,
            body: {
                results: {
                    game: {                        
                        location: "location",
                        event_date: "event_date",
                        is_active: true
                    },
                    invitedPlayers: [
                        {
                            "organised_game_id": "organised_game_id",
                            "response_id": "response_id",
                            "mobile_number": "+447931123456"
                        },
                        {
                            "organised_game_id": 'organised_game_id',
                            "response_id": 'response_id',
                            "mobile_number": '+447931123457'
                        }
                    ]
                }
            }
        }; 

        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);
        
        done();
    });

    it('should update the invitation details - 2 uninvited and 2 new (Non-existant in DB) added', async done => {
        mysql.query = jest.fn()
        .mockImplementationOnce((query, callback) => callback(null, []))
        .mockImplementationOnce((query, callback) => callback(null, [
            {
                user_id: 'test_id_1',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931123456',
                username: 'username',
                has_registered_via_client: false,
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true
            }, {
                user_id: 'test_id_2',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931123457',
                username: 'username',
                has_registered_via_client: false,
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true
            }, {
                user_id: 'test_id_3',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931654321',
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
            httpMethod: 'PUT',
            pathParameters: {
                id: 'game_id'
            },
            body: {
                game: {
                    location: "location",
                    event_date: "event_date",
                    is_active: true                    
                },
                invitedPlayers: [
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 123 456',
                    },
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 123 457',
                        has_been_uninvited: true
                    },
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 654 321',
                        has_been_uninvited: true
                    }, 
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 999 999',
                    },
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 111 111',
                    }
                ]
            }
        };
        
        const result = await lambda.putGameByIdHandler(event, context, callback, mysql);
        const expectedResult = {
            statusCode: 201,
            body: {
                results: {
                    game: {                        
                        location: "location",
                        event_date: "event_date",
                        is_active: true
                    },
                    invitedPlayers: [
                        {
                            "organised_game_id": "organised_game_id",
                            "response_id": "response_id",
                            "mobile_number": "+447931123456"
                        },
                        {
                            "organised_game_id": "organised_game_id",
                            "response_id": "response_id",
                            "mobile_number": "+447931999999"
                        },
                        {
                            "organised_game_id": "organised_game_id",
                            "response_id": "response_id",
                            "mobile_number": "+447931111111"
                        }
                    ]
                }
            }
        }; 

        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);
        
        done();
    });

    it('should update the invitation details - 2 uninvited and 2 new (existing in DB) added', async done => {
        mysql.query = jest.fn()
        .mockImplementationOnce((query, callback) => callback(null, []))
        .mockImplementationOnce((query, callback) => callback(null, [
            {
                user_id: 'test_id_1',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931111111',
                username: 'username',
                has_registered_via_client: false,
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true
            }, {
                user_id: 'test_id_2',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931123457',
                username: 'username',
                has_registered_via_client: false,
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true
            }, {
                user_id: 'test_id_3',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931654321',
                username: 'username',
                has_registered_via_client: false,
                date_of_birth: 'date_of_birth',
                date_created: 'date_created',
                date_modified: 'date_modified',
                signed_up_via_social: true
            },
            {
                user_id: 'test_id_4',
                full_name: 'full_name',
                email_address: 'email_address',
                mobile_number: '+447931999999',
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
            httpMethod: 'PUT',
            pathParameters: {
                id: 'game_id'
            },
            body: {
                game: {
                    location: "location",
                    event_date: "event_date",
                    is_active: true                    
                },
                invitedPlayers: [
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 123 457',
                        has_been_uninvited: true
                    },
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 654 321',
                        has_been_uninvited: true
                    }, 
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 999 999',
                    },
                    {
                        organised_game_id: 'organised_game_id',
                        response_id: 'response_id',
                        mobile_number: '+44 7931 111 111',
                    }
                ]
            }
        };
        
        const result = await lambda.putGameByIdHandler(event, context, callback, mysql);
        const expectedResult = {
            statusCode: 201,
            body: {
                results: {
                    game: {                        
                        location: "location",
                        event_date: "event_date",
                        is_active: true
                    },
                    invitedPlayers: [
                        {
                            "organised_game_id": "organised_game_id",
                            "response_id": "response_id",
                            "mobile_number": "+447931999999"
                        },
                        {
                            "organised_game_id": "organised_game_id",
                            "response_id": "response_id",
                            "mobile_number": "+447931111111"
                        }
                    ]
                }
            }
        }; 

        expectedResult.body = JSON.stringify(expectedResult.body);
        expect(result).toEqual(expectedResult);
        
        done();
    });
    
});