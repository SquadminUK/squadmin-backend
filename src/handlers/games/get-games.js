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

    async function fetchCreatedGames() {
        try {
            return new Promise((resolve, reject) => {

            });
        } catch (exception) {
            connection.end();
            response = badRequest;
            return response;
        }
    }

    async function fetchInvitedToGames() {
        try {
            return new Promise((resolve, reject) => {
                
            });
        } catch (exception) {
            connection.end();
            response = badRequest;
            return response;
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
        if (httpMethod !== 'GET') {
            throw new Error(`getGamesHandler only accepts GET method, you tried: ${httpMethod}`);
        }

        const userId = event.pathParameters.user_id;

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

                fetchCreatedGames().then( () => {
                    resolve();
                });

                fetchInvitedToGames().then( () => {
                    resolve();
                });

            } catch(exception) {
                connection.end();
                response = badRequest;
                response.reason = exception.message;
                return response;
            }
        }

    } catch (exception) {
        badRequest.reason = exception.message;
        return badRequest;
    }

    response.body = JSON.stringify(response.body);
    return response;
}