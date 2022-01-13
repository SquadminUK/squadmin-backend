const { CostExplorer } = require('aws-sdk');
var mysql = require('mysql');
const { from } = require('rxjs');
const { map } = require('rxjs/operators');

exports.getGamesHandler = async(event, context, callback, connection) => {
    
    var response = {
        statusCode: 200,
        body: {
            results: {
                organisedGames: [],
                invitedToGames: []
            }
        }
    };
    
    var badRequest = {
        statusCode: 400,
        message: 'Bad request',
        reason: null
    };
    
    var userId = undefined;
    
    async function fetchCreatedGames() {
        try {
            return new Promise((resolve, reject) => {
                var getGamesSql = "SELECT * FROM OrganisedGame Game LEFT JOIN GameInvitation Invitation ON Invitation.organised_game_id = Game.game_id WHERE Game.organising_player = ? AND Game.event_date > now()";
                const formattedGetUsersGamesQuery = mysql.format(getGamesSql, userId);   
                
                const sqlOptions = {sql: formattedGetUsersGamesQuery, nestTables: true};
                connection.query(sqlOptions, function(err, results){
                    if (err) {
                        throw new Error('There was an issue with the GetUsersCreatedGames SQL Statement');
                    }
                    console.log(results);
                    if (results.length > 0) {
                        const retrievedDetails = from(results);

                        const games = retrievedDetails.pipe(map((game) => game.Game)).subscribe(OrganisedGame => {
                            response.body.results.organisedGames.push(OrganisedGame);
                        });
                        removeDuplicatesFromOrganisedGames();
                        // const invites = retrievedDetails.pipe(map((invitation) => invitation.Invitation)).subscribe(Invitation => {

                        // });

                        console.log("check dem!");
                    }
                });
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

    function removeDuplicatesFromOrganisedGames() {
        const uniqueGames = new Set();
        const gamesArray = response.body.results.organisedGames;
        const filteredArr = gamesArray.filter((game) => {
            const isPresentInSet = uniqueGames.has(game);

            if (!isPresentInSet) {
                uniqueGames.add(game);
            }
            

            return !isPresentInSet;
        });

        console.log("hello");
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
        
        userId = event.pathParameters.user_id;
        
        if (connection.state === 'disconnected') {
            await new Promise((resolve, reject) => {
                connection.connect(function (err) {
                    if (err) {
                        response = badRequest;
                        new Error('Failed to connect');
                    }
                    // resolve();

                    try {
                
                        fetchCreatedGames().then( () => {
                            // resolve();
                        });
                        
                        // fetchInvitedToGames().then( () => {
                        //     resolve();
                        // });
                        
                    } catch(exception) {
                        connection.end();
                        response = badRequest;
                        response.reason = exception.message;
                        return response;
                    }
                });
            });
            
            
        }
        
    } catch (exception) {
        badRequest.reason = exception.message;
        return badRequest;
    }
    
    response.body = JSON.stringify(response.body);
    return response;
}