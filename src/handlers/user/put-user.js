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

  async function updateUserDetails() {
    return await new Promise((resolve, reject) => {
      var putUserSql = "UPDATE User SET full_name = COALESCE(?, NULL), email_address = COALESCE(?, NULL), mobile_number = COALESCE(?, NULL), date_of_birth = COALESCE(?, NULL), date_modified = now() WHERE user_id = ?";
      var userId = [event.body.full_name, event.body.email_address, event.body.mobile_number, event.body.date_of_birth, userId];
      var formattedUpdateUserQuery = mysql.format(putUserSql, userId);

      connection.query(formattedUpdateUserQuery, function (err, results) {
        if (err) {
          new Error('There was an issue with the update user SQL statement');
          reject('There was an issue with the update user SQL statement');
        }
        resolve();
      });
    })
  }

  async function retrieveUserDetails(userId) {
    try {
      return await new Promise((resolve, reject) => {
        let getUserQuery =
          `SELECT 
                User.user_id, 
                User.full_name, 
                User.email_address, 
                User.mobile_number,
                User.username,
                User.date_of_birth,
                User.date_created,
                User.date_modified,
                User.signed_up_via_social,
                User.has_registered_via_client
            FROM User WHERE user_id = ?`;
        let formattedQuery = mysql.format(getUserQuery, userId);
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

  var userId = undefined;
  try {
    if (event.body) {
      event.body = JSON.parse(event.body);
    }
    const {httpMethod} = event;
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
          updateUserDetails().then(() => {
            retrieveUserDetails(userId).then(() => {
              resolve();
            });
          });
        });
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
