const { HttpRequest } = require('aws-sdk');
const mysql = require('mysql');

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
}