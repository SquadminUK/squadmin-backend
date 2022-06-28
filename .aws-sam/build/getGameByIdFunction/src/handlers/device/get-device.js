const mysql = require('mysql');

exports.getDeviceHandler = async (event, context, callback, connection) => {

    var response = {
        headers: {},
        isBase64Encoded: false,
        statusCode: 200,
        body: {
            results: {
                device_id: '',
                device_make: '',
                device_model: '',
                ios_push_notification_token: '',
                android_push_notification_token: ' '
            }
        }
    }
    
    var badRequest = {
        statusCode: 400,
        message: "Bad request",
        reason: null
    };
    
    var noDeviceFound = {
        statusCode: 200,
        results: [],
        message: ''
    };
    
    if (connection  === undefined) {
        connection = mysql.createConnection({
            connectionLimit: 10,
            host: process.env.RDS_HOSTNAME,
            user: process.env.RDS_USERNAME,
            password: process.env.RDS_PASSWORD,
            port: process.env.RDS_HOST,
            database: process.env.RDS_DATABASE
        });
    }
    
    const { httpMethod, path } = event;
    try {
        if (httpMethod !== 'GET') {
            throw new Error(`getDeviceHandler only accepts GET method, you tried: ${httpMethod}`);
        }
    } catch(exception) {
        badRequest.reason = exception.message;
        return badRequest;
    }
    try {
        if (connection.state === 'disconnected') {
            
            await new Promise((resolve, reject) => {
                connection.connect(function (err) {
                    if (err) { 
                        response = badRequest;
                        reject('Failed to connect'); 
                    }
                    resolve();
                });
            });
            
            try {
                var getDeviceSql = "SELECT * FROM UserDevice WHERE device_id = ?";
                var userDeviceId = event.pathParameters.id;
                var formattedGetDeviceQuery = mysql.format(getDeviceSql, userDeviceId);

                var getDeviceQuery = await new Promise((resolve, reject) => { 
                    connection.query(formattedGetDeviceQuery, function(err, results) {
                        if (err) {
                            new Error('There was an issue with the SQL statement');
                            reject();
                        }
                        var device;
                        if (results.length > 0) {
                            device = results[0];
                        } else {
                            throw new Error('No devices found');
                        }
                        
                        if (device) {
                            response.body.results.device_id = device.device_id;
                            response.body.results.device_make = device.device_make;
                            response.body.results.device_model = device.device_model;
                            response.body.results.ios_push_notification_token = device.ios_push_notification_token;
                            response.body.results.android_push_notification_token = device.android_push_notification_token;
                        }
                        connection.end();
                        resolve();
                    });
                });
            } catch(exception) {
                connection.end();
                noDeviceFound.message = exception.message;
                return noDeviceFound;
            }
        }       
    } catch (exception) {
        response = badRequest;
        response.reason = "Failed to connect";
        return response;
    }
    
    response.body = JSON.stringify(response.body);
    return response;
    
}