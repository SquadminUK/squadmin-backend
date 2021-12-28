const mysql = require('mysql');

exports.getUserHandler = async (event, context, callback, connection) => {
    var response = {
        statusCode: 200,
        body: {
            results: {
                user_id: '',
                full_name: '',
                email_address: '',
                mobile_number: '',
                username: '',
                date_of_birth: '',
                date_created: '',
                date_modified: '',
                signed_up_via_social: ''
            }
        }
    }
    
    var badRequest = {
        statusCode: 400,
        message: 'Bad request',
        reason: null
    };
    
    var noUserFound = {
        statusCode: 200,
        body: {
            results: [],
            message: ''
        } 
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
    
    try {
        if (event.body) {
            event.body = JSON.parse(event.body);
        }
        const { httpMethod } = event;
        const userId = event.pathParameters.user_id;
        
        if (httpMethod != 'GET') {
            throw new Error(`getUserHandler only accepts GET method, you tried: ${httpMethod}`);
        }
        
        if (userId === undefined || userId === '') {
            throw new Error('No user id provided');
        }
    } catch (exception) {
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
                })
            });
            
            try {
                var getUserSql = "SELECT * FROM User WHERE user_id = ?";
                var userId = event.pathParameters.user_id;
                var formattedGetUserQuery = mysql.format(getUserSql, userId);
                
                await new Promise((reject, resolve) => {
                    connection.query(formattedGetUserQuery, function(err, results) {
                        if (err) {
                            new Error('There was an issue with the SQL statement');
                            reject();
                        }
                        
                        var user;
                        if (results.length > 0) {
                            user = results[0];
                            // reject('No users found');
                        } else {
                            throw new Error('No users found');
                        }
                        
                        if (user) {
                            
                            response.body.results.user_id = user.user_id;
                            response.body.results.full_name = user.full_name;
                            response.body.results.email_address = user.email_address;
                            response.body.results.mobile_number = user.mobile_number;
                            response.body.results.username = user.username;
                            response.body.results.date_of_birth = user.date_of_birth;
                            response.body.results.date_created = user.date_created;
                            response.body.results.date_modified = user.date_modified;
                            response.body.results.signed_up_via_social = user.signed_up_via_social;
                            
                        }
                        connection.end();
                        resolve();
                    });
                    
                });
                
            } catch (exception) {
                connection.end();
                badRequest.reason = exception.message;
                return badRequest;
            }
            
        }
    } catch (exception) {
        connection.end();
        response = badRequest;
        response.reason = exception.message;
        return response;
    }
    
    response.body = JSON.stringify(response.body);
    return response;
}