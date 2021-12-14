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
            host: process.env.RDS_HOSTNAME,
            user: process.env.RDS_USERNAME,
            password: process.env.RDS_PASSWORD,
            port: process.env.RDS_PORT,
            database: process.env.RDS_DATABASE,
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
                var getUsersSQL = "SELECT * FROM Users WHERE user_id IN (";

                event.body.userIds.forEach(function(value, index, array){
                        if (index === array.length - 1) {
                            getUsersSQL += "?) AND has_registered_via_client = true";
                        } else {
                            getUsersSQL += "?, ";
                        }
                    });

                const formattedQuery = mysql.format(getUsersSQL, event.body.userIds);

                await new Promise((reject, resolve) => {
                    connection.query(formattedQuery, function(err, results) {
                        if (err) {
                            new Error('There was an issue with the SQL Statement');
                            reject();
                        }

                        if (results.length > 0) {
                            for (const user in results) {
                                response.body.results.users.push(user);
                            }
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