const mysql = require('mysql');

exports.getDeviceHandler = async (event) => {
    const { httpMethod, path } = event;
    if (httpMethod !== 'GET') {
        throw new Error(`getDeviceHandler only accepts GET method, you tried: ${httpMethod}`);
    }
    
    const response = {
        statusCode: 200,
        results: {
            device_id: '',
            device_make: '',
            device_model: '',
            ios_push_notification_token: '',
            android_push_notification_token: ''
        }
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
        connection.connect(function (err) {
            if (err) {
                response = badRequest;
                reject('Failed to connect');
            }
            resolve();
        }).promise();
        
        var getDeviceSql = "SELECT * FROM Device WHERE device_id = ?";
        var userDeviceId = path.deviceId;
        var formattedGetDeviceQuery = mysql.format(getDeviceSql, userDeviceId);
        
        const getDeviceQuery = await connection.query(formattedGetDeviceQuery, function(err, results) {
            if (err) {
                new Error('There was an issue with the SQL statement');
                reject();
            }
            if (results[0] > 0) {
                device = results [0];
                response.results.device_id = device.device_id;
                response.results.device_make = device.device_make;
                response.results.device_model = device.device_model;
                response.results.ios_push_notification_token = device.ios_push_notification_token;
                response.results.android_push_notification_token = device.android_push_notification_token;
            }
            connection.end();
            resolve();
        }).promise();
        
    }
    
    return response;
    
}