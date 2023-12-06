const userService = require('../../services/user-service');
const dbConfig = require('../../configs/config.js').dbConfig;
const util = require('util');
const fs = require('fs');
const removeFile = util.promisify(fs.unlink);

jest.mock(
  'cordova-bridge',
  () => {
    return {
      // mocked implementation
      app: {
        datadir: () => {
          return 'tests/output/app';
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

describe('User Service', () => {
  const MOCK_FILE_INFO = {
    '/path/to/file1.js': 'console.log("file1 contents");',
    '/path/to/file2.txt': 'file2 contents',
  };

  describe('User Service register()', () => {
    beforeEach(async () => {
      try {
        await removeFile('tests/output/app' + '/' + dbConfig.keyPath + dbConfig.encryptionType);
      } catch (error) {
        console.log(error);
      }
    });
    test('It should reject register if password does not meet criteria', async () => {
      const response = await userService.register('password3');
      expect(response.success).toBeFalsy();
    });
    test('It should register the user', async () => {
      const response = await userService.register('Password3');
      expect(response.success).toBeTruthy();
    });
  });
});
