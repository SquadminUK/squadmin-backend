const mysql = require('mysql');

exports.postSocialAuthHandler = async (event, context, callback, connection) => {

  let response = {
    statusCode: 200,
    body: {
      user: {}
    }
  };
  const badRequest = {
    statusCode: 400,
    message: 'Bad request',
    reason: null
  };

  const isValidEmail = (email) => {
    const regex = new RegExp('[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?');
    return regex.test(email);
  }

  async function checkUserExists() {
    return await new Promise((resolve, reject) => {

      const userSqlQuery = `SELECT * FROM User WHERE email_address = ?`;
      if (event.body.email_address === null || event.body.email_address === undefined || event.body.email_address === '') {
        reject('User email not provided');
      }

      if (!isValidEmail(event.body.email_address)) {
        reject('Invalid email address');
      }

      const userFormattedSQLQuery = mysql.format(userSqlQuery, event.body.email_address);

      connection.query(userFormattedSQLQuery, function (err, results) {
        if (err) {
          reject('post-social-auth: SQL Query error');
        }
        if (results) {
          if (results.length > 0) {
            resolve(results[0]);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  async function insertUser() {
    try {
      return await new Promise((resolve, reject) => {
        const insertUserSQL = `INSERT INTO User (
            user_id,
            full_name,
            email_address,
            signed_up_via_social,
            has_registered_via_client) VALUES (?, ?, ?, ?, ?)`;

        const userParams = [
          event.body.user_id,
          event.body.full_name,
          event.body.email_address,
          event.body.signed_up_via_social,
          event.body.has_registered_via_client
        ];

        const formattedInsertUserQuery = mysql.format(insertUserSQL, userParams);
        connection.query(formattedInsertUserQuery, function (err, results) {
          if (err) {
            new Error('There was an issue with the insert user SQL statement');
            reject();
          }

          response.body.results = {
            user_id: event.body.user_id,
            full_name: event.body.full_name,
            email_address: event.body.email_address,
            signed_up_via_social: event.body.signed_up_via_social,
            has_registered_via_client: event.body.has_registered_via_client
          }

        });
      });
    } catch (exception) {
      connection.end();
      badRequest.reason = exception.message;
      return JSON.stringify(badRequest);
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
    if (typeof event === 'string') {
      event = JSON.parse(event);
    }

    const {httpMethod} = event;
    if (httpMethod !== 'POST') {
      throw new Error(`postSocialAuthHandler only accepts POST method, you tried: ${httpMethod}`);
    }

  } catch (exception) {
    badRequest.reason = exception.message;
    return JSON.stringify(badRequest);
  }

  try {
    if (connection.state === 'disconnected') {
      await new Promise((resolve, reject) => {
          connection.connect(function (err) {
            if (err) {
              response = badRequest;
              reject('Failed to connect');
            }

            checkUserExists().then((userDetails) => {
              if (userDetails != null) {
                let user = response.body.user;
                user.user_id = userDetails.user_id;
                user.email_address = userDetails.email_address;
                user.date_created = userDetails.date_created;
                user.date_modified = userDetails.date_modified;
                user.signed_up_via_social = Boolean(userDetails.signed_up_via_social);
                user.has_registered_via_client = Boolean(userDetails.has_registered_via_client);
                resolve();
              } else {
                insertUser().then(() => {
                  resolve();
                });
              }
            }).catch((exception) => {
              badRequest.reason = exception;
              reject(new Error(exception));
            });

          });
        }
      );
    }
  } catch
    (exception) {
    connection.end();
    response = badRequest;
    response.reason = exception.message;
    return JSON.stringify(response);
  }

  response = JSON.stringify(response);
  return response;
}
