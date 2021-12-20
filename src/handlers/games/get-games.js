var sql = require('mysql');

exports.getGamesHandler = async(event, context, callback, connection) => {
    
    var response = {
        statusCode: 200,
        body: {
            results: {
                organisedGames: {},
                invitedToGames: {}
            }
        }
    };
    
    var badRequest = {
        statusCode: 400,
        message: 'Bad request',
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
    
    try {
        const { httpMethod } = event;
        if (httpMethod !== 'GET') {
            throw new Error(`getGamesHandler only accepts GET method, you tried: ${httpMethod}`);
        }
    } catch (exception) {
        badRequest.reason = exception.message;
        return badRequest;
    }

    response.body = JSON.stringify(response.body);
    return response;
}