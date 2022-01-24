const mysql = require('mysql');
const { from, of } = require('rxjs');
const { map, toArray } = require('rxjs/operators');

exports.getUsersRegistrationStatusHandler = async(event, context, callback, connection) => {

    var response = {
        statusCode: 200,
        body: {
            results: {
                users: []
            }
        }
    };

    var badRequest = {
        statusCode: 400,
        message: 'Bad request',
        reason: null
    };

    if (connection === undefined) {
        connection = mysql.createConnection({
            connectionLimit: 10,
            host: stageVars.rds_hostname,
            user: stageVars.rds_username,
            password: stageVars.rds_password,
            port: stageVars.rds_port,
            database: stageVars.rds_database,
            multipleStatements: true
        });
    }
    
    try {
        const { httpMethod } = event;
        if (httpMethod !== 'GET') {
            throw new Error(`getUsersRegistrationStatusHandler only accepts GET method, you tried: ${httpMethod}`);
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
                        throw new Error('Failed to connect');
                    }
                    resolve();
                });;
            });
            
            try {
                var getUsersSQL = "SELECT * FROM User WHERE user_id IN (";

                const userIds = event.multiValueQueryStringParameters.user_ids;
                userIds.forEach(function(value, index, array){
                        if (index === array.length - 1) {
                            getUsersSQL += "?)";
                        } else {
                            getUsersSQL += "?, ";
                        }
                    });

                const formattedQuery = mysql.format(getUsersSQL, userIds);

                var query = await new Promise((resolve, reject) => {
                    connection.query(formattedQuery, function(err, results) {
                        if (err) {
                            new Error('There was an issue with the SQL Statement');
                            reject();
                        }

                        if (results.length > 0) {
                            results.forEach(user => {
                                response.body.results.users.push(user);
                            });
                        }
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
        return response;
    }
    
    connection.end();
    response.body = JSON.stringify(response.body);
    return response;
}