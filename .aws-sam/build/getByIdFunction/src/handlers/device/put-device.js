const mysql = require('mysql');

exports.putDeviceHandler = async (event, context, callback, connection) => {

    var response = {
        statusCode: 200,
        results: {
            device_id: '',
            device_make: '',
            device_model: '',
            ios_push_notification_token: '',
            android_push_notification_token: '',
            date_created: ''
        }
    }
    
    var badRequest = {
        statusCode: 400,
        message: "Bad request",
        reason: null
    };
    
    const { httpMethod, path } = event;
    try {
        if (httpMethod !== 'PUT') {
            throw new Error(`putDeviceHandler only accepts PUT method, you tried: ${httpMethod}`);
        }
        
        if (path === undefined || path === '') {
            throw new Error('No user id provided');
        }
    } catch(exception) {
        badRequest.reason = exception.message;
        return badRequest;
    }

    connection.createConnection({
        connectionLimit: 10,
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT,
        database: process.env.RDS_DATABASE
    });

    if (connection.state === 'disconnected') {
        try {
            await connection.connect(function (err) {
                if (err) {
                    throw new Error();
                }
            });
        } catch (exception) {
            response = badRequest;
            response.reason = "Failed to connect";
            return response;
        }
        
        var updateDeviceSql = "UPDATE UserDevice SET device_id = ?, device_make = ?, device_model = ?, ios_push_notification = ?, android_push_notification = ?) WHERE user_id = ?";
        var userIdParams = [event.body.device_id, event.body.device_make, event.body.device_model, event.body.ios_push_notification_token, event.body.android_push_notification_token, path];
        var formattedInsertDeviceQuery = mysql.format(updateDeviceSql, userIdParams);
        
        try {
            var insertDeviceQuery = await connection.query(formattedInsertDeviceQuery, function (err, results) {
                if (err) {
                    new Error('There was an issue with the update device SQL statement');
                }
                
                response.results.device_id = event.body.device_id;
                response.results.device_make = event.body.device_make;
                response.results.device_model = event.body.device_model;
                response.results.ios_push_notification_token = event.body.ios_push_notification_token;
                response.results.android_push_notification_token = event.body.android_push_notification_token;
                response.results.date_created = event.body.date_created;
                
                connection.end();
            });
        } catch (exception) {
            badRequest.message = exception.message;
            return badRequest;
        }
    }
    
    return response;
}