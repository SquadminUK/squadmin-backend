const mysql = require('mysql');
const saltedSha256 = require('salt-sha256');

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

    async function checkIfUserExists() {
        return await new Promise((resolve, reject) => {
            var userSqlQuery = `SELECT * FROM User WHERE email_address = ?`;
            var formattedUserSQLQuery = mysql.format(userSqlQuery, event.body.email_address);

            connection.query(formattedUserSQLQuery, function (err, results) {
                if (err) {
                    reject('post-user: SQL Query error');
                }
                if (results.length > 0) {
                    resolve(results[0]);
                } else {
                    resolve(null);
                }
            })
        });
    }

    async function insertUser() {

        try {
            return await new Promise((resolve, reject) => {
                var insertUserSql = `INSERT INTO User (
                    user_id, 
                    full_name,
                    email_address, 
                    mobile_number, 
                    password, 
                    username, 
                    date_of_birth, 
                    date_created, 
                    signed_up_via_social, 
                    has_registered_via_client) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                var password = event.body.password;

                if (password) {
                    password = encrypted(event.body.password);
                } else {
                    password = null;
                }

                var userParams = [
                    event.body.user_id,
                    event.body.full_name,
                    event.body.email_address,
                    event.body.mobile_number,
                    password,
                    event.body.username,
                    event.body.date_of_birth,
                    event.body.date_created,
                    event.body.signed_up_via_social,
                    event.body.has_registered_via_client
                ];
                var formattedInsertUserQuery = mysql.format(insertUserSql, userParams);
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
                        password: password,
                        signed_up_via_social: event.body.signed_up_via_social,
                        has_registered_via_client: event.body.has_registered_via_client
                    };

                    resolve();
                });
            })
        } catch {
            connection.end();
            badRequest.reason = exception.message;
            return badRequest;
        }
    }

    async function updateUserDetails() {
        try {
            return await new Promise((resolve, reject) => {
                var updateUserQuery = `UPDATE User SET
                full_name = ?, 
                mobile_number = ?,
                username = ?,
                date_of_birth = ?,
                date_created = now(),
                signed_up_via_social = ?,
                has_registered_via_client = ?
                WHERE mobile_number = ?`;
                var formattedUpdateQuery = mysql.format(updateUserQuery, [
                    event.body.full_name,
                    event.body.mobile_number,
                    event.body.username,
                    event.body.date_of_birth,
                    event.body.signed_up_via_social,
                    event.body.has_registered_via_client,
                    event.body.mobile_number
                ]);

                connection.query(formattedUpdateQuery, function (err, results) {
                    if (err) {
                        reject('post-user: failed to update user details query');
                    }

                    resolve();
                });
            });
        } catch (exception) {
            connection.end();
            badRequest.reason = exception.message;
            return badRequest;
        }
    }

    async function retrieveUserDetails() {
        try {
            return await new Promise((resolve, reject) => {
                let getUserQuery = `SELECT * FROM User WHERE mobile_number = ?`;
                let formattedQuery = mysql.format(getUserQuery, event.body.mobile_number);
                connection.query(formattedQuery, function (err, results) {
                    if (err) {
                        throw new Error("There was an issue with retrieving user details");
                    }

                    if (results.length > 0) {
                        let user = results[0];
                        let responseBody = response.body.results;
                        responseBody.user_id = user['user_id'];
                        responseBody.full_name = user['full_name'];
                        responseBody.email_address = user['email_address'];
                        responseBody.mobile_number = user['mobile_number'];
                        responseBody.username = user['username'];
                        responseBody.date_of_birth = user['date_of_birth'];
                        responseBody.date_created = user['date_created'];
                        responseBody.date_modified = user['date_modified'];
                        responseBody.password = user['password'];
                        responseBody.signed_up_via_social = Boolean(user['signed_up_via_social']);
                        responseBody.has_registered_via_client = Boolean(user['has_registered_via_client']);
                        response.body.results = responseBody;
                        resolve();
                    }
                });
            });
        } catch (e) {
            connection.end();
            badRequest.reason = e.message;
            return badRequest;
        }
    }

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
        const {httpMethod} = event;
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

                    checkIfUserExists().then((userDetails) => {

                        if (userDetails != null) {
                            updateUserDetails(userDetails).then(() => {
                                retrieveUserDetails().then(() => {
                                    resolve();
                                });
                            })
                        } else {
                            insertUser().then(() => {
                                resolve();
                            });
                        }
                    });
                })
            });
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