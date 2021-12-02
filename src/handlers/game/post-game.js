const mysql = require('mysql');
const { from, of } = require('rxjs');
const { filter } = require('rxjs/operators');

exports.postGameHandler = async(event, context, callback, connection) => {

    var response = {
        statusCode: 201,
        body: {
            results: {
                game: {},
                invitedPlayers: {}
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
        if (httpMethod !== 'POST') {
            throw new Error(`postGameHandler only accepts POST method, you tried: ${httpMethod}`);
        }
    } catch (exception) {
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
                });;
            });

            try {
                var allMobileNumbers = [];
                
                const game = from(event.body.game);
                const invitedPlayers = from(event.body.invitedPlayers);
                const filteredMobile = invitedPlayers.pipe(filter(invite => invite.mobile_number !== '' || invite.mobile_number !== undefined)).subscribe(invite => {
                    allMobileNumbers.push(invite.mobile_number);
                });

                const allMobileNumbersSqlPortion = 
                
                // Determine which users are registered
                var nonRegisteredUsersSql = "SELECT * FROM User WHERE mobile_number in";
                // Create ghost record in the user table for non registered users

                // Invite non registered users

                // Setup game

                // Notify users by push notification

            } catch (exception) {
                connection.end();
                response = badRequest;
                return response;
            }
        }
    } catch (exception) {

    }

    response.body = JSON.stringify(response.body);
    return response;
}