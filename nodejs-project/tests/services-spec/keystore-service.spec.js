const keystoreService = require('../../services/keystore-service');
const fs = require('fs');
const dbConfig = require('../../configs/config.js').dbConfig;

const outputDir = 'tests/output/app' + dbConfig.keyPath + dbConfig.encryptionType;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Keystore service', () => {
  test('It should create a private key file', async () => {
    if (fs.existsSync(outputDir)) {
      //remove if test file already exists
      fs.unlinkSync(outputDir);
    }
    const user = await keystoreService.createKey('publickey', 'password', 'tests/output/app' + dbConfig.keyPath);
    expect(user).toBeDefined();
    await delay(2000);
    expect(fs.existsSync(outputDir)).toBeTruthy();
  });

  test('It should accept correct password', async () => {
    const isValidPass = await keystoreService.isValidPassword('password', 'tests/output/app' + dbConfig.keyPath);
    expect(isValidPass).toBeTruthy();
  });

  test('It should correctly reject incorrect password', async () => {
    const isValidPass = await keystoreService.isValidPassword('wrongpassword', 'tests/output/app' + dbConfig.keyPath);
    expect(isValidPass).toBeFalsy();
  });
});
