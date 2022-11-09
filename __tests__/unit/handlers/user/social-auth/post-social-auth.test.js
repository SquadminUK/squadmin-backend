const mysql = require('mysql');
const lambda = require('../../../../../src/handlers/user/social-auth/post-social-auth');

let event, context, callback;
jest.mock('mysql', () => ({
  state: 'disconnected',
  createConnection: () => {},
  connect: jest.fn().mockImplementation((callback) => { callback() }),
  format: jest.fn(),
  query: jest.fn().mockImplementation((query, callback) => callback(null, [])),
  end: jest.fn()
}));

describe('Test postSocialAuthHandler', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should not acccept PUT method', async done => {
    event = {
      httpMethod: 'PUT',
      pathParameters: {
        user_id: 'user_id'
      }
    };

    const result = await lambda.postSocialAuthHandler(event, context, callback, mysql);

    const expectedResult = {
      statusCode: 400,
      body: {
        message: 'Bad request',
        reason: 'postSocialAuthHandler only accepts POST method, you tried: PUT'
      }
    };

    expectedResult.body = JSON.stringify(expectedResult.body);

    expect(result).toEqual(expectedResult);
    done();
  });

  it('should not acccept GET method', async done => {
    event = {
      httpMethod: 'GET',
      pathParameters: {
        user_id: 'user_id'
      }
    };

    const result = await lambda.postSocialAuthHandler(event, context, callback, mysql);

    const expectedResult = {
      statusCode: 400,
      body: {
        message: 'Bad request',
        reason: 'postSocialAuthHandler only accepts POST method, you tried: GET'
      }
    };

    expectedResult.body = JSON.stringify(expectedResult.body);

    expect(result).toEqual(expectedResult);
    done();
  });

  it('should return an error when no email address is provided', async done => {

    event = {
      httpMethod: 'POST',
      pathParameters: {
        user_id: 'user_id'
      },
      body: {
        email_address: ''
      }
    };
    event.body = JSON.stringify(event.body);

    const result = await lambda.postSocialAuthHandler(event, context, callback, mysql);

    const expectedResult = {
      statusCode: 400,
      body: {
        message: 'Bad request',
        reason: 'User email not provided'
      }
    };

    expectedResult.body = JSON.stringify(expectedResult.body);

    expect(result).toEqual(expectedResult);
    done();
  });

  it('should return an error when an invalid email address is provided', async done => {

    event = {
      httpMethod: 'POST',
      pathParameters: {
        user_id: 'user_id'
      },
      body: {
        email_address: 'x.com'
      }
    };
    event.body = JSON.stringify(event.body);

    const result = await lambda.postSocialAuthHandler(event, context, callback, mysql);

    const expectedResult = {
      statusCode: 400,
      body: {
        message: 'Bad request',
        reason: 'Invalid email address'
      }
    };
    expectedResult.body = JSON.stringify(expectedResult.body);
    expect(result).toEqual(expectedResult);
    done();
  });

  it('should return the user details when user details are already registered', async done => {
    event = {
      httpMethod: 'POST',
      pathParameters: {
        user_id: 'user_id'
      },
      body: {
        email_address: 'jamilnawaz88@gmail.com'
      }
    };
    event.body = JSON.stringify(event.body);
    mysql.query = jest.fn()
      .mockImplementationOnce((query, callback) => callback(null, [
        {
          user_id: 'user_id',
          full_name: 'full_name',
          email_address: 'email_address',
          mobile_number: 'mobile_number',
          username: 'username',
          date_of_birth: 'date_of_birth',
          date_created: 'date_created',
          date_modified: 'date_modified',
          signed_up_via_social: true,
          has_registered_via_client: true
        }
      ]))

    const result = await lambda.postSocialAuthHandler(event, context, callback, mysql);

    const expectedResult = {
      statusCode: 200,
      body: {
        user: {
          user_id: 'user_id',
          full_name: 'full_name',
          email_address: 'email_address',
          date_created: 'date_created',
          date_modified: 'date_modified',
          signed_up_via_social: true,
          has_registered_via_client: true
        }
      }

    };

    expectedResult.body = JSON.stringify(expectedResult.body);
    expect(result).toEqual(expectedResult);
    done();
  });

});
