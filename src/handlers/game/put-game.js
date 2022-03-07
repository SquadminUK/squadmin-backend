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

exports.putGameByIdHandler = async (event, context, callback, connection) => {
    
    var response = {
        statusCode: 201,
        body: {
            results: {
                game: {},
                invitedPlayers: []
            }
        }
    };
    
    var badRequest = {
        statusCode: 400,
        message: "Bad request",
        reason: null
    };
    
    function badRequestResponse(message) {
        if (message) {
            badRequest.reason = message
        }
        
        return badRequest;
    }
    
    var gameId = undefined;
    
    function existsInDB(mobileNumber, array) {
        return array.some(function(user) {
            return user.mobile_number === mobileNumber;
        });
    }
    
    async function insertNonRegisteredUsers(arrayOfPlayers) {
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
            response = badRequestResponse;
            return response;
        }
        
    }
    
    async function updateGameDetails() {
        try {
            return new Promise((resolve, reject) => {
                var getGameDetailsSql = "UPDATE OrganisedGame set location = ?, event_date = ?, date_modified = now(), is_active = ? WHERE game_id = ?";
                var updateGameParams = [event.body.game.location, event.body.game.event_date, event.body.game.is_active, gameId];
                const formattedGetGameQuery = mysql.format(getGameDetailsSql, updateGameParams);
                
                connection.query(formattedGetGameQuery, function (err, results) {
                    if (err) {
                        throw new Error('There was an issue with the GetGame SQL query');
                    }
                    response.body.results.game = event.body.game;
                    resolve();
                    
                });
            });
        } catch (exception) {
            return badRequestResponse(exception.message);            
        }
    }
    
    async function updateInvitees() {
        try {
            return new Promise((resolve, reject) => {
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
                connection.query(formattedAllUsersQuery, function (err, results) {
                    if (err) {
                        throw new Error('There was an issue with the SQL statement when trying to retrieve all invited players');
                    }
                    
                    var invitedPlayers = Array.from(event.body.invitedPlayers);
                    if (results.length < invitedPlayers) {
                        // some players exist in DB
                        invitedPlayers.forEach(function (value, index, array) {
                            const mobileNumber = value['mobile_number'];
                            if (existsInDB(mobileNumber, results)) {
                                invitedPlayers.splice(index, 1);
                            }
                        });
                        
                        insertNonRegisteredUsers(invitedPlayers).then( () => {
                            response.body.results.invitedPlayers = invitedPlayers;
                            resolve();
                        });
                    } else if (results.length === 0) {
                        // none of the players are in the DB
                        insertNonRegisteredUsers(invitedPlayers).then( () => { 
                            response.body.results.invitedPlayers = invitedPlayers;
                            resolve();
                        });
                    } else {
                        response.body.results.invitedPlayers = invitedPlayers;
                        var uninvitedPlayers = invitedPlayers.filter(player => player.has_been_uninvited === true);
                        if (uninvitedPlayers.length > 0) {
                            uninvite(uninvitedPlayers).then( () => {
                                uninvitedPlayers.forEach(function (value, index, array) {
                                    removeUninvitedFromResponse(value);
                                });
                                
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    }
                });
            });
        } catch (exception) {
            return badRequestResponse(exception.message);
        }
    }
    
    async function uninvite(uninvitedPlayers) {
        try {
            return await new Promise ((resolve, reject) => {
                uninvitedPlayers.forEach(function (value, index, array){
                    connection.beginTransaction(function (err) {
                        if (err) {
                            connection.rollback(function() {
                                throw new Error('Rollback error');
                            });
                            throw new Error('Transaction begin error');
                        }
                        var updateInviteSQL = "UPDATE GameInvitation SET has_been_uninvited = ?, date_modified = now() WHERE response_id = ?"; 
                        var params = [value['has_been_uninvited'], value['response_id']];
                        var formattedUpdateInviteQuery = mysql.format(updateInviteSQL, params);
                        connection.query(formattedUpdateInviteQuery, function (err, results){
                            if (err) {
                                throw new Error("There was an issue with the UpdateInvite SQL Statement");
                            }
                        });
                        
                        if (index === array.length - 1) {
                            connection.commit(function(err) {
                                if (err) {
                                    throw new Error('SQL Statement commit error');
                                }
                                
                                resolve();
                            });
                        }
                        
                    });
                });
            });  
        } catch (exception) {
            return badRequestResponse(exception.message);
        }
    }
    
    function removeUninvitedFromResponse(value) {
        response.body.results.invitedPlayers = response.body.results.invitedPlayers.filter(function (invite) {
            return invite.mobile_number !== value['mobile_number'];
        });
    }
    
    if (connection === undefined) { 
        ;
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
        gameId = event.pathParameters.id;
        if (httpMethod !== 'PUT') {
            throw new Error(`putGameHandlerById only accepts PUT method, you tried: ${httpMethod}`);
        }
        
        if (gameId === undefined || gameId === '') {
            throw new Error('No game id provided');
        }
        
        if (typeof event.body === 'string') {
            event.body = JSON.parse(event.body);
        }
        
    } catch(exception) {
        return badRequestResponse(exception.message);
    }
    try {
        if (connection.state === 'disconnected') {
            await new Promise((resolve, reject) => {
                connection.connect(function (err) {
                    if (err) {
                        throw new Error('Failed to connect');    
                    }
                    resolve();
                });
            });
            
            await new Promise((resolve, reject) => {
                updateGameDetails().then(() => {
                    resolve();
                });
            });
            
            if (event.body.invitedPlayers.length > 0) {
                await new Promise((resolve, reject) => {
                    updateInvitees().then( () => {
                        resolve();
                    });
                });
            }
        }
        
    } catch (exception) {
        connection.end();
        response = badRequestResponse;
        response.reason = exception.message;
        return response;
    }
    
    response.body = JSON.stringify(response.body);
    return response;
    
}
