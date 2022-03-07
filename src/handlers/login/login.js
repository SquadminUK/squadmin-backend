const mysql = require('mysql');

exports.postLoginHandler = async (event, context, callback, connection) => {
    
    var response = {
        statusCode: 200,
        body: {
            results: {
                user_id: '',
                full_name: '',
                email_address: '',
                mobile_number: '',
                password: '',
                username: '',
                date_of_birth: '',
                date_created: '',
                date_modified: '',
                signed_up_via_social: true
            }
        }
    };
    
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
        if (httpMethod !== 'POST') {
            throw new Error(`postLoginHandler only accepts POST method, you tried: ${httpMethod}`);
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
            })
            
            try { 
                var getUserSql = "SELECT * FROM User WHERE user_id = ?";
                var userParams = event.body.user_id;
                var formattedGetUserQuery = mysql.format(getUserSql, userParams);
                
                await new Promise((resolve, reject) => {
                    connection.query(formattedGetUserQuery, function(err, results) {
                        if (err) {
                            new Error('There was an issue with the SQL statement');
                            reject();
                        }
                        
                        var userSubmittedPassword = event.body.password;
                        
                        if (results.length > 0) {
                            var retrievedUser = results[0];
                            if (retrievedUser.password === userSubmittedPassword) {
                                response.body.results.user_id = retrievedUser.user_id;
                                response.body.results.full_name = retrievedUser.full_name;
                                response.body.results.email_address = retrievedUser.email_address;
                                response.body.results.mobile_number = retrievedUser.mobile_number;
                                response.body.results.password = retrievedUser.password;
                                response.body.results.username = retrievedUser.username;
                                response.body.results.date_of_birth = retrievedUser.date_of_birth;
                                response.body.results.date_created = retrievedUser.date_created;
                                response.body.results.date_modified = retrievedUser.date_modified;
                                response.body.results.signed_up_via_social = retrievedUser.signed_up_via_social;
                            } else {
                                response = badRequest;
                                response.reason = "Failed to login";
                                throw new Error('Failed to login');
                            }
                        } else {
                            
                        } 
                        
                        connection.end();
                        resolve();
                    });
                });
            } catch (exception) {
                connection.end();
                response = badRequest;
                response.reason = exception.message;
                return response;
            }
            
        }
    } catch (exception) {
        connection.end();
        response = badRequest;
        response.reason = "Failed to connect";
        return response;
    }
    
    response.body = JSON.stringify(response.body);
    return response;
}