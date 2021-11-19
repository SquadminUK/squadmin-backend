var mysql = require('mysql');

exports.getGameByIdHandler = async (event, context, callback, connection) => {
    
    if (connection === undefined) {
        connection = mysql.createConnection({
            connectionLimit: 10,
            host: process.env.RDS_HOSTNAME,
            user: process.env.RDS_USERNAME,
            password: process.env.RDS_PASSWORD,
            port: process.env.RDS_PORT,
            database: process.env.RDS_DATABASE,
            multipleStatements: true
        });;
    }

    var response = {
        statusCode: 200,
        game: {
            game_id: '',
            venue: '',
            location: '',
            date_created: '',
            date_modified: '',
            organising_player: '',
            invitedPlayers: [
                {
                    organised_game_id: '',
                    response_id: '',
                    date_responded: '',
                    can_play: '',
                    date_modified: '',
                    user_id: ''
                }
            ]
        }
    }
    
    var badRequest = {
        statusCode: 400,
        message: "Bad request",
        reason: null
    };
    
    var noDeviceFound = {
        statusCode: 200,
        results: [],
        message: ''
    };

    const { httpMethod, path } = event;
    try {
        if (httpMethod !== 'GET') {
            throw new Error(`getGameHandlerById only accepts GET method, you tried: ${httpMethod}`);
        }
        
        if (path === undefined || path === '') {
            throw new Error('No game id provided');
        }
    } catch(exception) {
        badRequest.reason = exception.message;
        return badRequest;
    }

    if (connection.state === 'disconnected') {
        try {
            await connection.connect(function (err) {
                if (err) {
                    throw new Error('Failed to connect');
                }
            });
            console.log("connected");
        } catch (exception) {
            connection.end();
            response = badRequest;
            response.reason = "Failed to connect";
            return response;
        }
        
        var getGameSql = "SELECT *  FROM OrganisedGame WHERE game_id = ?";
        var gameId = [path];
        var formattedGetGameQuery = mysql.format(getGameSql, gameId);

        var getInvitations = "SELECT * FROM GameResponse WHERE organised_game_id = ?";
        var formattedInvitationsQuery = mysql.format(getInvitations, gameId);

        try {
            var getGameByIdQuery = await connection.query(`${formattedGetGameQuery}; ${formattedInvitationsQuery}`, function (err, results, fields) {
            // var getGameByIdQuery = await connection.query(options, function (err, results, fields) {
                connection.end();
                if (err) {
                    throw new Error('There was an issue with the get game SQL statement');
                }

                console.log(results[0]);
                console.log(results[1]);

                if (results) {
                     game = results[0];
                     response.game.game_id = game.game_id;
                     response.game.venue = game.venue;
                     response.game.location = game.location;
                     response.game.date_created = game.date_created;
                     reponse.game.organising_player = game.organising_player;
                     response.game.invitedPlayers = results[1];

                } else {
                    
                }
            });
            
        } catch (exception) {
            connection.end();
            badRequest.message = exception;
            return badRequest;
        }
    }
    connection.end();
    return response;
}