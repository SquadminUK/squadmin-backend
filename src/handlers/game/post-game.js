const mysql = require('mysql');
const { v4: uuid } = require('uuid');
const { from, of } = require('rxjs');
const { filter, count, map, tap, toArray } = require('rxjs/operators');

function formattedMobileNumber(mobileNumber) {
    var unformatted = mobileNumber;
    unformatted.trim();
    unformatted = mobileNumber.replace(/ /g, "");
    if (unformatted.startsWith("07")) {
        unformatted = unformatted.replace("07", "+447");
    }
    
    return unformatted;
}

exports.postGameHandler = async (event, context, callback, connection) => {
    
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
    
    function existsInDB(mobileNumber, array) {
        return array.some(function(user) {
            return user.mobile_number === mobileNumber;
        });
    }
    
    function insertNonRegisteredUsers(arrayOfPlayers) {
        try {
            return new Promise((resolve, reject) => {
                var insertUserSQL = 'INSERT INTO User (user_id, mobile_number) VALUES ?';
                var params = [arrayOfPlayers.map(player => [uuid(), formattedMobileNumber(player.mobile_number)])];
                
                var newUserIds = [];
                params[0].forEach(function (value, index, array) {
                    newUserIds.push(value[0]);
                });
                
                newUserIds.forEach(function (value, index, array) {
                    event.body.invitedPlayers[index].user_id = value;
                });
                
                const formattedInsertUserSQL = mysql.format(insertUserSQL, params);
                connection.query(formattedInsertUserSQL, function (err, results) {
                    if (err) {
                        throw new Error('There was a problem with the Insert User SQL Statement');
                    }
                    response.body.results = event.body;
                    resolve();
                });
            });
        } catch (exception) {
            connection.end();
            response = badRequest;
            return response;
        }
        
    }
    
    async function insertGame() {
        
        await new Promise((resolve, reject) => {
            var insertGameSQL = "INSERT INTO OrganisedGame (game_id, location, date_created, organising_player) VALUES (?, ?, ?, ?)";
            const game = event.body.game;
            const gameParams = [game.game_id, game.location, game.date_created, game.organising_player];
            const formattedInsertGameSQL = mysql.format(insertGameSQL, gameParams);
            connection.query(formattedInsertGameSQL, function (err, results) {
                if (err) {
                    throw new Error('There was a problem with the Insert Game SQL Statement');
                }
                response.body.results = event.body;
                resolve();
            });
        });
        
    }
    
    async function insertInvites() {
        await new Promise((resolve, reject) => {
            var getAllUsersQuery = "SELECT * FROM User WHERE mobile_number IN(";
            var mobileNumbersParams = [];
            var invitedPlayers = from(event.body.invitedPlayers);
            invitedPlayers.pipe(map(invite => formattedMobileNumber(invite.mobile_number)), toArray()).subscribe(mobileNumbers => {
                mobileNumbers.forEach(function(value, index, array) {
                    if (array.length - 1 == index) {
                        getAllUsersQuery += `?)`;
                    } else {
                        getAllUsersQuery += `?,`;
                    }
                    event.body.invitedPlayers[index].mobile_number = value;
                    mobileNumbersParams.push(value);
                });
            });
            const formattedAllUsersQuery = mysql.format(getAllUsersQuery, mobileNumbersParams);
            connection.query(formattedAllUsersQuery, function(err, results) {
                if (err) {
                    throw new Error('There was in issue with the SQL statement before inserting GameInvites');
                }
                
                if (results.length > 0) {
                    results.forEach(function(value, index, array) {
                        event.body.invitedPlayers[index].user_id = value['user_id'];
                    });
                }
                
                var insertGameInvitesSQL = "INSERT INTO GameInvitation (response_id, organised_game_id, user_id) VALUES ?";
                var inviteParams = [event.body.invitedPlayers.map(invite => [invite.response_id, invite.organised_game_id, invite.user_id])];
                const formattedInsertInviteSQL = mysql.format(insertGameInvitesSQL, inviteParams);
                connection.query(formattedInsertInviteSQL, function(err, results) {
                    if (err) {
                        throw new Error('There was an issue with the SQL statement inserting GameInvites');
                    }
                    response.body.results = event.body;
                    resolve();
                });
                
            });
        });
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
        
        if (httpMethod !== 'POST') {
            throw new Error(`postGameHandler only accepts POST method, you tried: ${httpMethod}`);
        }
        
        if (typeof event.body === 'string') {
            event.body = JSON.parse(event.body);
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
                var getAllUsersQuery = "SELECT * FROM User WHERE mobile_number IN(";
                var mobileNumbersParams = [];
                var invitedPlayers = from(event.body.invitedPlayers);
                invitedPlayers.pipe(map(invite => formattedMobileNumber(invite.mobile_number)), toArray()).subscribe(mobileNumbers => {
                    mobileNumbers.forEach(function(value, index, array) {
                        if (array.length - 1 == index) {
                            getAllUsersQuery += `?)`;
                        } else {
                            getAllUsersQuery += `?,`;
                        }
                        event.body.invitedPlayers[index].mobile_number = value;
                        mobileNumbersParams.push(value);
                    });
                });
                const formattedNonRegUsersQuery = mysql.format(getAllUsersQuery, mobileNumbersParams);
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
                            
                            insertNonRegisteredUsers(invitedPlayers).then(() => {
                                resolve();
                            });
                        } 
                        else if (results.length === event.body.invitedPlayers.length) {
                            // All users exists in the db, shouldn't have to do anything here except
                            // Send Notification to registered users (filter)
                            var theRegisteredUsers = undefined;
                            var usersFromDB = from(results);
                            usersFromDB.pipe(filter(user => user.has_registered_via_client === true), toArray()).subscribe(registeredUsers => {
                                theRegisteredUsers = registeredUsers;
                            });
                            response.body.results = event.body;
                            resolve();
                        } 
                        else if (results.length < event.body.invitedPlayers.length) {
                            const invitedPlayers = event.body.invitedPlayers;
                            var usersToInsert = Array.from(invitedPlayers);
                            const usersFromDB = results;
                            usersToInsert.forEach(function(value, index, array) {
                                const mobileNumber = value['mobile_number'];
                                if (existsInDB(mobileNumber, usersFromDB)) {
                                    usersToInsert.splice(index, 1);
                                }
                            });
                            
                            insertNonRegisteredUsers(usersToInsert).then(() => {
                                resolve();
                            });
                        }
                    });
                    
                });
                
                await new Promise((resolve, reject) => {
                    insertGame().then(() => {
                        resolve();
                    });
                });
                
                await new Promise((resolve, reject) => {
                    insertInvites().then(() => {
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