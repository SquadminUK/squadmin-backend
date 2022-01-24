const mysql = require('mysql');

exports.putDeviceHandler = async (event, context, callback, connection) => {
    if (context) {
        context.callbackWaitsForEmptyEventLoop = false;
    }
    
    var response = {
        statusCode: 200,
        body: {
            results: {
                device_id: '',
                device_make: '',
                device_model: '',
                ios_push_notification_token: '',
                android_push_notification_token: '',
                date_created: ''
            }
        }
    }
    
    var badRequest = {
        statusCode: 400,
        message: "Bad request",
        reason: null
    };
    
    var userId = '';
    
    if (connection === undefined) { 
        var stageVars = event.stageVariables;
        connection = mysql.createConnection({
            connectionLimit: 10,
            host: stageVars.rds_hostname,
            user: stageVars.rds_username,
            password: stageVars.rds_password,
            port: stageVars.rds_port,
            database: stageVars.rds_database
        });
    }
    
    try {
        const { httpMethod } = event;
        userId = event.pathParameters.id;
        
        if (event.body) {
            event.body = JSON.parse(event.body);
        }
        
        if (httpMethod !== 'PUT') {
            throw new Error(`putDeviceHandler only accepts PUT method, you tried: ${httpMethod}`);
        }
        
        if (userId === undefined || userId === '') {
            throw new Error('No user id provided');
        }
    } catch(exception) {
        if (exception.message === "Cannot read property 'user_id' of undefined") {
            badRequest.reason = "No user id provided";
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
                var updateDeviceSql = "UPDATE UserDevice SET device_id = ?, device_make = ?, device_model = ?, ios_push_notification_token = ?, android_push_notification_token = ? WHERE user_id = ?";
                var userIdParams = [
                    event.body.device_id, 
                    event.body.device_make, 
                    event.body.device_model, 
                    event.body.ios_push_notification_token, 
                    event.body.android_push_notification_token, 
                    userId
                ];
                var formattedUpdateDeviceQuery = mysql.format(updateDeviceSql, userIdParams);
                
                var insertDeviceQuery = await new Promise((resolve, reject) => {
                    connection.query(formattedUpdateDeviceQuery, function (err, results) {
                        if (err) {
                            new Error('There was an issue with the update device SQL statement');
                            reject();
                        }
                        
                        response.body.results.device_id = event.body.device_id;
                        response.body.results.device_make = event.body.device_make;
                        response.body.results.device_model = event.body.device_model;
                        response.body.results.ios_push_notification_token = event.body.ios_push_notification_token;
                        response.body.results.android_push_notification_token = event.body.android_push_notification_token;
                        response.body.results.date_created = event.body.date_created;
                        
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