const mysql = require('mysql');
const lambda = require('../../../../src/handlers/invitation/respond/put-invitation');

exports.putInvitationHandler = async (event, context, callback, connection) => {
    
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
        
        if (httpMethod !== 'PUT') {
            throw new Error(`putInvitationHandler only accepts PUT method, you tried: ${httpMethod}`);
        }
        
        if (invitationId === undefined || invitationId === '') {
            throw new Error('No invitation id provided');
        }
        if (typeof event.body === 'string') {
            event.body = JSON.parse(event.body);
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
                var updateInvitationResponseSql = "UPDATE GameInvitation SET can_play = ?, date_modified = ?, date_responded = ? WHERE response_id = ?";
                var userIdParams = [event.body.can_play, event.body.date_modified, event.body.date_modified, invitationId];
                var formattedUpdateInvitationQuery = mysql.format(updateInvitationResponseSql, userIdParams);
                
                
                var insertDeviceQuery = await new Promise((resolve, reject) => {
                    connection.query(formattedUpdateInvitationQuery, function (err, results) {
                        if (err) {
                            new Error('There was an issue with the update device SQL statement');
                            reject();
                        }
                        
                        response.body.results = event.body;
                        
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