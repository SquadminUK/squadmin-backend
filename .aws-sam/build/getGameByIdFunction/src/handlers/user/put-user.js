const mysql = require('mysql');

exports.putUserHandler = async (event, context, callback, connection) => {
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
    
    var userId = undefined;
    try {
        if (event.body) {
            event.body = JSON.parse(event.body);
        }
        const { httpMethod } = event;
        userId = event.pathParameters.user_id;
        
        if (httpMethod != 'PUT') {
            throw new Error(`putUserHandler only accepts PUT method, you tried: ${httpMethod}`);
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
                var putUserSql = "UPDATE User SET full_name = ?, email_address = ?, mobile_number = ?, date_of_birth = ?, date_modified = now() WHERE user_id = ?";
                var userId = [event.body.full_name, event.body.email_address, event.body.mobile_number, event.body.date_of_birth, userId];
                var formattedUpdateUserQuery = mysql.format(putUserSql, userId);
                
                var updateUserQuery = await new Promise((resolve, reject) => {
                    connection.query(formattedUpdateUserQuery, function (err, results) {
                        if (err) {
                            new Error('There was an issue with the update user SQL statement');
                            reject();
                        }
                        
                        response.body.results = event.body;
                        connection.end();
                        resolve();
                    });
                });
            } 
            catch (exception) {
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