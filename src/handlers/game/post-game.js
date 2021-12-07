const mysql = require('mysql');
const { from, of } = require('rxjs');
const { filter, count, map, tap, toArray } = require('rxjs/operators');

function formattedMobileNumber(mobileNumber) {
    var unformatted = mobileNumber;
    unformatted.trim();
    unformatted = mobileNumber.replaceAll(" ", "");
    if (unformatted.startsWith("07")) {
        unformatted = unformatted.replace("07", "+447");
    }
    
    return unformatted;
}

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
                
                invitedPlayers.pipe(filter(invite => invite.mobile_number !== '')).subscribe(invite => {
                    allMobileNumbers.push(invite.mobile_number);
                });
                
                var submittedPlayerCount = undefined;
                invitedPlayers.pipe(count()).subscribe(playerCount => {
                    submittedPlayerCount = playerCount;
                });
                
                if (submittedPlayerCount !== allMobileNumbers.length) {
                    throw new Error('Missing required data');
                }
                
                // 1. mobile numbers registered via app
                var registeredUsersSQL = "SELECT * FROM Users WHERE mobile_number IN (";
                invitedPlayers.pipe(map(invite => invite.mobile_number = formattedMobileNumber(invite.mobile_number))).subscribe(updatedInvite => {
                    console.log(`${updatedInvite}`);
                });
                // 2. users who aren't registered
                var registeredUsers = undefined;
                var submittedUserIds = undefined;
                invitedPlayers.pipe(map(invite => invite.user_id), toArray()).subscribe(userIdArray => {
                    submittedUserIds = userIdArray;
                });

                submittedUserIds.forEach(function (value, index, array){
                    if (index === array.length -1) {
                        registeredUsersSQL += " ?) AND registered_via_client = true);";
                    } else {
                        registeredUsersSQL += "?,"
                    }
                });

                registeredUsersSQLFormatted = mysql.format(registeredUsersSQL, submittedUserIds);

                await new Promise((resolve, reject) => {
                    connection.query(registeredUsersSQLFormatted, function (err, results) {
                        if (err) {
                            connection.end();
                            throw new Error('There was an issue with the SQL Statement');
                        }

                        registeredUsers = results;

                        if (results.length === event.body.invitedPlayers.length) {
                            allSubmittedUsersRegistered = true;
                            resolve();
                        } else {
                           allSubmittedUsersRegistered = false;
                           resolve();
                        }
                    });
                });

                var unregisteredUsers = undefined;
                
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