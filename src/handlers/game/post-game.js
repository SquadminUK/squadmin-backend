const mysql = require('mysql');
const { from, of, throwError } = require('rxjs');
const { filter, count } = require('rxjs/operators');

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
                
                const game = of(event.body.game);
                const invitedPlayers = from(event.body.invitedPlayers);
                const filteredMobile = invitedPlayers.pipe(filter(invite => invite.mobile_number !== '')).subscribe(invite => {
                    allMobileNumbers.push(invite.mobile_number);
                });
                
                var submittedPlayerCount = undefined;
                var noInvitedPlayers = invitedPlayers.pipe(count()).subscribe(playerCount => {
                    submittedPlayerCount = playerCount;
                });

                if (submittedPlayerCount !== allMobileNumbers.length) {
                    throw new Error('Missing required data');
                }
                
                console.log("hello");
                
                // work out who isn't registered
                // 1. mobile numbers registered via app
                
                // 2. users who aren't registered
                
                // 2.1 insert ghost record for the non registered users
                
                // 3. invite those via notification to be determined (email?)
                
                // 4. 
                
                // Create ghost record in the user table for non registered users
                
                // Invite non registered users
                
                // Setup game
                
                // Notify users by push notification
                
            } catch (exception) {
                connection.end();
                response = badRequest;
                response.reason = exception.message;
                return response;
            }
        }
    } catch (exception) {
        connection.end();
        response = badRequest;
        return response;
    }
    
    response.body = JSON.stringify(response.body);
    return response;
}