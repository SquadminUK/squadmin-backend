const mysql = require('mysql');
const { from, of } = require('rxjs');
const { filter, count, map, tap, toArray } = require('rxjs/operators');

function formattedMobileNumber(mobileNumber) {
    var unformatted = mobileNumber;
    unformatted.trim();
    unformatted = mobileNumber.replaceAll(" ", "");
    if (unformatted.startsWith("07")) {
        unformatted = unformatted.replace("07", "+447");
    }
    
    return unformatted;
}

exports.postGameHandler = async(event, context, callback, connection) => {
    
    var response = {
        statusCode: 201,
        body: {
            results: {
                game: {},
                invitedPlayers: {}
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
        if (httpMethod !== 'POST') {
            throw new Error(`postGameHandler only accepts POST method, you tried: ${httpMethod}`);
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
    
    response.body = JSON.stringify(response.body);
    return response;
}