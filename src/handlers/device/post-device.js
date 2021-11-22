const mysql = require('mysql');

exports.postDeviceHandler = async (event, context, callback, connection) => {
    
    var response = {
        statusCode: 201,
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
    
    const { httpMethod } = event;
    
    try {
        const userId = event.pathParameters.user_id;
        if (httpMethod !== 'POST') {
            throw new Error(`postDeviceHandler only accepts POST method, you tried: ${httpMethod}`);
        }
        
        if (userId === undefined || userId === '') {
            throw new Error('No user id provided');
        }
    } catch(exception) {
        if (exception.message === "Cannot read properties of undefined (reading 'user_id')") {
            badRequest.reason = "No user id provided";
        } else {
            badRequest.reason = exception.message;
        }
        return badRequest;
    }
    
    if (connection.state === 'disconnected') {
        await new Promise((resolve, reject) => {
            connection.connect(function (err) {
                if (err) {
                    throw new Error();
                    reject('Failed to connect');
                }
                resolve();
            });
        }); 
        
        try {
            var insertDeviceQuery = await new Promise((resolve, reject) => {
                
                var insertDeviceSql = "INSERT INTO UserDevice (device_id, device_make, device_model, ios_push_notification_token, android_push_notification_token, date_created, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
                var userParams = [event.body.device_id, event.body.device_make, event.body.device_model, event.body.ios_push_notification_token, event.body.android_push_notification_token, event.body.date_created, event.pathParameters.user_id];
                var formattedInsertDeviceQuery = mysql.format(insertDeviceSql, userParams);

                connection.query(formattedInsertDeviceQuery, function (err, results) {
                    if (err) {
                        new Error('There was an issue with the insert device SQL statement');
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
    
    response.body = JSON.stringify(response.body);
    return response;
}