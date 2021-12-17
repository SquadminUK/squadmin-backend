const mysql = require('mysql');
const uuid = require('uuid-v4');
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
                var nonRegisteredUsersSql = "SELECT * FROM User WHERE mobile_number IN(";
                var mobileNumbersParams = undefined;
                var invitedPlayers = from(event.body.invitedPlayers);
                invitedPlayers.pipe(map(invite => formattedMobileNumber(invite.mobile_number)), toArray()).subscribe(mobileNumbers => {
                    mobileNumbers.forEach(function(value, index, array) {
                        if (array.length - 1 == index) {
                            nonRegisteredUsers += `?)`;
                        } else {
                            nonRegisteredUsers += `?,`;
                        }
                        event.body.invitedPlayers[index].mobile_number = value;
                    });
                });

                const formattedNonRegUsersQuery = mysql.format(nonRegisteredUsersSql, mobileNumbersParams);

                // Fetch Non Registered Users
                var nonRegisteredUsers = undefined;
                await new Promise((resolve, reject) => {
                    connection.query(formattedNonRegUsersQuery, function(err, results) {
                        if (err) {
                            throw new Error('There was a problem with the SQL Statement');
                        }

                        if (results.length == 0) {
                            // All users don't exist in the DB
                            // Insert a claimable ghost record in the DB for each user
                            const invitedPlayers = event.body.invitedPlayers;
                            var insertUserSQL = 'INSERT INTO User (user_id, mobile_number) VALUES ?';
                            var params = [invitedPlayers.map(player => [uuid(), formattedMobileNumber(player.mobile_number)])];
                            const formattedInsertUserSQL = mysql.format(insertUserSQL, params);
                            connection.query(formattedInsertUserSQL, function(err, results) {
                                if (err) {
                                    throw new Error('There was a problem with the Insert User SQL Statement');
                                }
                                response.body.results = event.body;
                            });

                            // INSERT GAME QUERY


                            
                            console.log("working here");
                        } 
                        // else if (results.length === event.body.invitedPlayers.length) {
                        //     // All users exists in the db, shouldn't have to do anything here
                        //     // Send Notification to registered users (filter)
                        // } else if (results.length < event.body.invitedPlayers.length) {
                        //     // Some users are not in the DB
                        //     console.log("working here");
                            
                        //     // Workout which ones are saved in the DB
                        //     console.log("working here");
                            
                        //     // Workout which ones are not registered

                        // }

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
        response = badRequest;
        return response;
    }
    
    response.body = JSON.stringify(response.body);
    return response;
}