const mysql = require('mysql');
const saltedSha256 = require('salted-sha256');

function encrypted(plainStringPassword) {
    const hashedPassword = saltedSha256(plainStringPassword, process.env.HASHING_SALT);
    return hashedPassword;
}

exports.postUserHandler = async (event, context, callback, connection) => {
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
                signed_up_via_social: '',
                has_registered_via_client: ''
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
            host: stageVars.rds_hostname,
            user: stageVars.rds_username,
            password: stageVars.rds_password,
            port: stageVars.rds_port,
            database: stageVars.rds_database
        });
    }
    
    try {
        const { httpMethod } = event;
        if (event.body) {
            event.body = JSON.parse(event.body);
        }
        if (httpMethod != 'POST') {
            throw new Error(`postUserHandler only accepts POST method, you tried: ${httpMethod}`);
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
                var insertUserSql = "INSERT INTO User (user_id, full_name, email_address, mobile_number, password, username, date_of_birth, date_created, signed_up_via_social, has_registered_via_client) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                var userParams = [
                    event.body.user_id, 
                    event.body.full_name, 
                    event.body.email_address, 
                    event.body.mobile_number, 
                    encrypted(event.body.password), 
                    event.body.username, 
                    event.body.date_of_birth, 
                    event.body.date_created, 
                    event.body.signed_up_via_social,
                    event.body.has_registered_via_client
                 ];
                var formattedInsertUserQuery = mysql.format(insertUserSql, userParams);

                var insertUserQuery = await new Promise((resolve, reject) => {
                    connection.query(formattedInsertUserQuery, function (err, results) {
                        if (err) {
                            new Error('There was an issue with the update user SQL statement');
                            reject();
                        }

                        response.body.results = {
                            user_id: event.body.user_id,
                            full_name: event.body.full_name,
                            email_address: event.body.email_address,
                            mobile_number: event.body.mobile_number,
                            username: event.body.username,
                            date_of_birth: event.body.date_of_birth,
                            date_created: event.body.date_created,
                            signed_up_via_social: event.body.signed_up_via_social,
                            has_registered_via_client: event.body.has_registered_via_client
                        };
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