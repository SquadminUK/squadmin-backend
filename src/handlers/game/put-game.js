const mysql = require('mysql');

exports.putGameByIdHandler = async (event, context, callback, connection) => {
    
    var response = {
        statusCode: 201,
        body: {
            results: {
                game: {},
                invitedPlayers: []
            }
        }
    };
    
    var badRequest = {
        statusCode: 400,
        message: "Bad request",
        reason: null
    };
    
    function badRequest(message) {
        if (message) {
            badRequest.reason = message
        }
        
        return badRequest;
    }
    
    var gameId = undefined;
    
    async function updateGameDetails() {
        try {
            return new Promise((resolve, reject) => {
                var getGameDetailsSql = "UPDATE OrganisedGame set location = ?, event_date = ?, date_modified = now(), is_active = ? WHERE game_id = ?";
                var updateGameParams = [event.body.location, event.body.event_date, event.body.is_active, gameId];
                const formattedGetGameQuery = mysql.format(getGameDetailsSql, updateGameParams);
                
                connection.query(formattedGetGameQuery, function (err, results) {
                    if (err) {
                        throw new Error('There was an issue with the GetGame SQL query');
                    }
                    response.body.results.game = event.body.game;
                    resolve();
                    
                });
            });
        } catch (exception) {
            return badRequest(exception.message);            
        }
    }
    
    if (connection === undefined) {
        connection = mysql.createConnection({
            connectionLimit: 10,
            host: process.env.RDS_HOSTNAME,
            user: process.env.RDS_USERNAME,
            password: process.env.RDS_PASSWORD,
            port: process.env.RDS_PORT,
            database: process.env.RDS_DATABASE,
            multipleStatements: true
        });            
    }
    
    try {
        const { httpMethod } = event;
        gameId = event.pathParameters.id;
        if (httpMethod !== 'PUT') {
            throw new Error(`putGameHandlerById only accepts PUT method, you tried: ${httpMethod}`);
        }
        
        if (gameId === undefined || gameId === '') {
            throw new Error('No game id provided');
        }
        
        if (typeof event.body === 'string') {
            event.body = JSON.parse(event.body);
        }
        
    } catch(exception) {
        badRequest.reason = exception.message;
        return badRequest;
    }
    try {
        if (connection.state === 'disconnected') {
            await new Promise((resolve, reject) => {
                connection.connect(function (err) {
                    if (err) {
                        throw new Error('Failed to connect');    
                    }
                    resolve();
                });
            });

            await new Promise((resolve, reject) => {
                updateGameDetails().then(() => {
                    resolve();
                });
            });
        }
        
    } catch (exception) {
        connection.end();
        response = badRequest;
        response.reason = exception.message;
        return response;
    }
    
    response.body = JSON.stringify(response.body);
    return response;
    
}