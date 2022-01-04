var mysql = require('mysql');
const { from } = require('rxjs');
const { filter, first } = require('rxjs/operators');

exports.getGameByIdHandler = async (event, context, callback, connection) => {
    
    var response = {
        statusCode: 200,
        body: {
            results: {
                game: {
                },
                invitedPlayers: []
            }
        }
    }
    
    var badRequest = {
        statusCode: 400,
        message: "Bad request",
        reason: null
    };
    
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
    
    var gameId = undefined;
    try {
        const { httpMethod } = event;
        gameId = event.pathParameters.id;
        if (httpMethod !== 'GET') {
            throw new Error(`getGameHandlerById only accepts GET method, you tried: ${httpMethod}`);
        }
        
        if (gameId === undefined || gameId === '') {
            throw new Error('No game id provided');
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
                        response = badRequest;
                        new Error('Failed to connect');
                    }
                    resolve();
                });
            });
            
            try {
                var getGameDetailsSql = "SELECT * FROM OrganisedGame Game INNER JOIN GameInvitation Invitation ON Game.game_id = Invitation.organised_game_id WHERE Game.game_id = ?";
                var gameParams = gameId;
                var formattedGetGameQuery = mysql.format(getGameDetailsSql, gameParams);
                
                var options = {sql: formattedGetGameQuery, nestTables: true};
                
                await new Promise((resolve, reject) => {
                    connection.query(options, function(err, results) {
                        if (err) {
                            connection.end();
                            throw new Error('There was an issue with the SQL statement');
                        }

                        const retrievedDetails = from(results);
                        
                        const game = retrievedDetails.pipe(first()).subscribe((game) => response.body.results.game = game.Game);
                        const invites = retrievedDetails.pipe().subscribe((invitation) => { response.body.results.invitedPlayers.push(invitation.Invitation); });
                        
                        resolve();
                    });
                });
            } catch (exception) {
                connection.end();
                response = badRequest;
                response.reason = exception.message;
                return response;
            }
            
        }
    } catch (exception) {
        connection.end();
        badRequest.reason = exception.message;
        return badRequest;
    }
    
    connection.end();
    response.body = JSON.stringify(response.body);
    return response;
}