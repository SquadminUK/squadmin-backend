const { CostExplorer } = require('aws-sdk');
var mysql = require('mysql');
const { from } = require('rxjs');
const { map } = require('rxjs/operators');

exports.getGamesHandler = async (event, context, callback, connection) => {

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
                var getGamesSql = `SELECT Game.*, Invitation.*, userTable.id, userTable.user_id, userTable.full_name, userTable.email_address, userTable.email_address, userTable.mobile_number, userTable.username
                                    FROM OrganisedGame Game 
                                    INNER JOIN GameInvitation Invitation ON Invitation.organised_game_id = Game.game_id 
                                    INNER JOIN User userTable ON Invitation.user_id = userTable.user_id
                                    WHERE Game.organising_player = ? AND Game.event_date > now()`;
                const formattedGetUsersGamesQuery = mysql.format(getGamesSql, userId);

                const sqlOptions = { sql: formattedGetUsersGamesQuery, nestTables: true };
                connection.query(sqlOptions, function (err, results) {
                    if (err) {
                        throw new Error('There was an issue with the GetUsersCreatedGames SQL Statement');
                    }
                    if (results.length > 0) {
                        const retrievedDetails = from(results);

                        const games = retrievedDetails.pipe(map((game) => game.Game)).subscribe(OrganisedGame => {
                            response.body.results.organisedGames.push(OrganisedGame);
                        });
                        removeDuplicatesFromOrganisedGames();
                        const invites = retrievedDetails.pipe(map((invitation) => invitation.Invitation)).subscribe(Invitation => {
                            const games = response.body.results.organisedGames;

                            games.forEach(function (value, index, array) {
                                if (value['game_id'] === Invitation.organised_game_id) {
                                    if (!value['invitedPlayers']) {
                                        games[index].invitedPlayers = new Array();
                                    }
                                    Invitation.can_play = Boolean(Invitation.can_play);
                                    games[index].invitedPlayers.push(Invitation);
                                }
                            });
                            response.body.results.organisedGames = games;
                            resolve();
                        });

                        const users = retrievedDetails.pipe(map((user) => user.userTable)).subscribe(UserDetails => {
                            const games = response.body.results.organisedGames
                            games.forEach(function (game, index, array) {
                                const invites = game.invitedPlayers
                                invites.forEach(function (invite, index, array){
                                    if (invite.user_id == UserDetails.user_id) {
                                        invite.user_details = UserDetails
                                    }
                                })
                            })
                        });


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

                var getInvitationsSQL = `SELECT Invitation.id, Invitation.response_id, Invitation.can_play, Invitation.date_modified, Invitation.has_been_uninvited, Invitation.organised_game_id, Invitation.user_id, 
                Game.id, Game.game_id, Game.venue, Game.location, Game.event_date, Game.date_created, Game.date_modified, Game.organising_player, Game.is_active, 
                userTable.id, userTable.user_id, userTable.full_name, userTable.email_address, userTable.mobile_number, userTable.username FROM GameInvitation Invitation 
                    INNER JOIN OrganisedGame Game ON Game.game_id = Invitation.organised_game_id 
                    INNER JOIN User userTable ON userTable.user_id = Game.organising_player 
                    WHERE Invitation.user_id = ? AND Game.event_date > now()`

                const formattedGetInvitesQuery = mysql.format(getInvitationsSQL, userId);

                const sqlOptions = { sql: formattedGetInvitesQuery, nestTables: true };
                connection.query(sqlOptions, function (err, results) {
                    if (err) {
                        throw new Error('There was an issue with the GetUserInvites SQL Statement');
                    }
                    if (results.length > 0) {
                        const invitedToGames = response.body.results.invitedToGames;
                        results.forEach(function (value, index, array) {
                            const game = value.Game;
                            game.invitation = value.Invitation;
                            game.invitation.can_play = Boolean(value.Invitation.can_play);
                            game.invitation.invitingPlayer = value.userTable;
                            response.body.results.invitedToGames.push(game);
                        });
                    }

                    resolve();
                });
            });
        } catch (exception) {
            connection.end();
            response = badRequest;
            return response;
        }
    }

    function removeDuplicatesFromOrganisedGames() {
        const uniqueGameIds = new Set();
        const uniqueGamesSet = new Set();
        const organisedGamesResponseArray = response.body.results.organisedGames;
        const filteredArr = organisedGamesResponseArray.filter((game) => {
            const isPresentInSet = uniqueGameIds.has(game.id);

            if (!isPresentInSet) {
                uniqueGameIds.add(game.id);
                uniqueGamesSet.add(game);
            }
            return !isPresentInSet;
        });

        const organisedGames = Array.from(uniqueGamesSet);
        response.body.results.organisedGames = organisedGames;
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

                    try {

                        fetchCreatedGames().then(() => {
                            fetchInvitedToGames().then(() => {
                                resolve();
                            })
                        });

                    } catch (exception) {
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