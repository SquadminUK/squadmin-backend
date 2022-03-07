const mysql = require('mysql');
const lambda = require('../../../../src/handlers/invitation/respond/get-invitation');

exports.getInvitationHandler = async (event, context, callback, connection) => {
    
    var response = {
        statusCode: 200,
        body: {
            results: {
                response_id: '',
                date_responded: '',
                can_play: false,
                date_modified: '',
                organised_game_id: '',
                user_id: ''
            }
        }
    }
    
    var badRequest = {
        statusCode: 400,
        message: "Bad request",
        reason: null
    };
    
    var invitationId = '';
    
    if (connection === undefined) { 
        ;
        connection = mysql.createConnection({
            connectionLimit: 10,
            host: process.env.RDS_HOSTNAME,
            user: process.env.RDS_USERNAME,
            password: process.env.RDS_PASSWORD,
            port: process.env.RDS_PORT,
            database: process.env.RDS_DATABASE
        });
    }
    
    try {
        const { httpMethod } = event;
        invitationId = event.pathParameters.id;
        
        if (httpMethod !== 'GET') {
            throw new Error(`getInvitationHandler only accepts GET method, you tried: ${httpMethod}`);
        }
        
        if (invitationId === undefined || invitationId === '') {
            throw new Error('No invitation id provided');
        }
    } catch(exception) {
        if (exception.message === "Cannot read property 'user_id' of undefined") {
            badRequest.reason = "No invitation id provided";
        } else {
            badRequest.reason = exception.message;
        }
        return badRequest;
    }
    
    try {
        if (connection.state === 'disconnected') {
            
            await new Promise((resolve, reject) => {
                connection.connect(function (err) {
                    if (err) {
                        throw new Error('Failed to connect');
                        reject();
                    }
                    resolve();
                });
            });
            
            try {
                var getInvitationResponseSql = "SELECT * FROM GameInvitation WHERE response_id = ?";
                var invitationParams = [invitationId];
                var formattedGetInvitationQuery = mysql.format(getInvitationResponseSql, invitationParams);
                
                
                await new Promise((resolve, reject) => {
                    connection.query(formattedGetInvitationQuery, function (err, results) {
                        if (err) {
                            new Error('There was an issue with the update device SQL statement');
                            reject();
                        }
                        var gameResponse = results[0];
                        
                        response.body.results.response_id = gameResponse.response_id;                    
                        response.body.results.date_responded = gameResponse.date_responded;
                        response.body.results.can_play = gameResponse.can_play;
                        response.body.results.date_modified = gameResponse.date_modified;
                        response.body.results.organised_game_id = gameResponse.organised_game_id;
                        response.body.results.user_id = gameResponse.user_id;
                        
                        connection.end();
                        resolve();
                    }); 
                });
            } catch (exception) {
                connection.end();
                badRequest.message = exception.message;
                return badRequest;
            }
            
            
            
        }
    } catch (exception) {
        connection.end();
        badRequest.message = exception.message;
        return badRequest;
    }
    
    
    
    response.body = JSON.stringify(response.body);
    return response;
}