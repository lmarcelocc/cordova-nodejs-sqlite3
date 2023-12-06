jest.mock('@mapbox/mbtiles', () => (a) => a, { virtual: true });
jest.mock(
  'cordova-bridge',
  () => {
    return {
      // mocked implementation
      app: {
        datadir: () => {
          return 'tests/output/app/';
        },
        send: jest.fn(),
        on: jest.fn(),
      },
      channel: {
        on: jest.fn(),
        send: jest.fn(),
      },
    };
  },
  { virtual: true }
);

jest.mock('dree');

const fs = require('fs');
const request = require('supertest');
const app = require('../../secure-server.js');
const dbConfig = require('../../configs/config.js').dbConfig;
// singleton to store authdetails at runtime
const authService = require('../../services/auth-service');
authService.init();
const jwt = require('jsonwebtoken');

describe('Test user routes', () => {
  let token;
  const MOCK_FILE_INFO = {
    '/path/to/file1.js': 'console.log("file1 contents");',
    '/path/to/file2.txt': 'file2 contents',
  };
  // set the token once
  beforeAll(async () => {
    token = 'Bearer ' + jwt.sign({ userID: 'gafAdminUser' }, authService.jwtSecret, { expiresIn: '2h' });
  });

  beforeEach(() => {
    try {
      fs.unlinkSync('tests/output/app' + '/' + dbConfig.keyPath + dbConfig.encryptionType);
    } catch (error) {
      console.log(error.toString());
    }
    // Set up some mocked out file info before each test
    //require('fs').__setMockFiles(MOCK_FILE_INFO);
  });
  afterAll(async (done) => {
    done();
  });

  // helper function
  async function registerUser() {
    const result = await postWithToken('/register', { props: { password: 'Testing1234' } });
    expect(result.status).toBe(200);
    const resData = JSON.parse(result.text);
    expect(resData.authState).toBeTruthy();
    expect(resData.userRegistered).toBeTruthy();
    return result;
  }

  async function postWithToken(url, props) {
    const result = await request(app).post(url).type('form').set('Authorization', token).send(props);
    return result;
  }

  test('should respond with 404 on unknown path', async (done) => {
    const result = await request(app).get('/').set('Authorization', token);
    expect(result.status).toBe(404);
    done();
  });

  test('Init: It should correctly send back new user', async (done) => {
    const response = await request(app).get('/init').set('Authorization', token);
    expect(response.status).toBe(200);
    console.log(response.text);
    expect(JSON.parse(response.text).userRegistered).toBeFalsy();
    done();
  });

  test('Register: should send a 401 if password not valid', async (done) => {
    const result = await postWithToken('/register', { props: { password: 'Test' } });
    expect(result.status).toBe(401);
    done();
  });

  test('Register: should register a valid user', async (done) => {
    await registerUser();
    done();
  });

  test('Register: should send a 409 if user already exists', async (done) => {
    await registerUser();
    const result = await postWithToken('/register', { props: { password: 'Testing1234' } });
    expect(result.status).toBe(409);
    done();
  });

  test('Init: It should correctly send back registered info', async (done) => {
    await registerUser();
    // check init route after registration
    const response = await request(app).get('/init').set('Authorization', token);
    expect(response.status).toBe(200);
    console.log(response.text);
    expect(JSON.parse(response.text).userRegistered).toBeTruthy();
    done();
  });

  test('Login: It should succesfully login a valid registered user', async (done) => {
    await registerUser();
    // check login route after registration
    const result = await postWithToken('/login', { props: { password: 'Testing1234' } });
    expect(result.status).toBe(200);
    const resData = JSON.parse(result.text);
    expect(resData.authState).toBeTruthy();
    done();
  });

  test('Login: It should respond with 400 if user not registered', async (done) => {
    const result = await postWithToken('/login', { props: { password: 'Testing1234' } });
    expect(result.status).toBe(400);
    done();
  });

  test('Login: It should respond with 403 if password incorrect', async (done) => {
    await registerUser();
    const result = await postWithToken('/login', { props: { password: 'wrong-password' } });
    expect(result.status).toBe(403);
    done();
  });

  test('Login: It should disable the route after too many requests', async (done) => {
    await registerUser();
    for (let i = 0; i < 6; i++) {
      const result = await postWithToken('/login', { props: { password: 'wrong-password' } });
      console.log('i: ' + i + ' status: ' + result.status);
      if (i < 3) {
        expect(result.status).toBe(403);
      } else {
        expect(result.status).toBe(429);
      }
    }
    done();
  });

  test('Logout: It should log a user out', async (done) => {
    const result = await request(app).post('/logout').type('form').set('Authorization', token);
    expect(result.status).toBe(200);
    const resData = JSON.parse(result.text);
    expect(resData.authState).toBeFalsy();
    done();
  });
});

describe('Test access denied on secure routes', () => {
  let token;
  beforeAll(async () => {
    authService.key = null;
    authService.authDetails.authState = false;
    // set the token once
    token = 'Bearer ' + jwt.sign({ userID: 'gafAdminUser' }, authService.jwtSecret, { expiresIn: '2h' });
  });

  test('Should prevent unauthorised access to encrypt', async (done) => {
    const result = await request(app).post('/encrypt').set('Authorization', token);
    expect(result.status).toBe(401);
    done();
  });
  test('Should prevent unauthorised access to decrypt', async (done) => {
    const result = await request(app).post('/decrypt').set('Authorization', token);
    expect(result.status).toBe(401);
    done();
  });
  test('Should prevent unauthorised access to createfile', async (done) => {
    const result = await request(app).post('/createfile').set('Authorization', token);
    expect(result.status).toBe(401);
    done();
  });

  test('Should prevent access to token protected routes without token', async (done) => {
    authService.key = 'setkey1234';
    authService.authDetails.authState = true;
    let result = await request(app).post('/createfile');
    expect(result.status).toBe(401);
    result = await request(app).post('/decrypt');
    expect(result.status).toBe(401);
    result = await request(app).post('/encrypt');
    expect(result.status).toBe(401);
    done();
  });

  test('Should allow access to Cesium3DTileset routes without token', async (done) => {
    const result = await request(app).post('/Cesium3DTileset/GPX/');
    expect(result.status).toBe(404);
    done();
  });
});
