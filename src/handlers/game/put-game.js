const mysql = require('mysql');

exports.putGameByIdHandler = async (event, context, callback, connection) => {
    
    var response = {
        statusCode: 201,
        body: {
            results: {
                game: {
                    
                },
                invitedPlayers: []
            }
        }
    };
    
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
        if (httpMethod !== 'PUT') {
            throw new Error(`putGameHandlerById only accepts PUT method, you tried: ${httpMethod}`);
        }

        if (gameId === undefined || gameId === '') {
            throw new Error('No game id provided');
        }
    } catch(exception) {
        badRequest.reason = exception.message;
        return badRequest;
    }

    response.body = JSON.stringify(response.body);
    return response;

}