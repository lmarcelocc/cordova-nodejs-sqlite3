const cryptoService = require('../../services/crypto-service');
const fs = require('fs');
const dbConfig = require('../../configs/config.js').dbConfig;

describe('Crypto service', () => {
  test('It should create a media file', async () => {
    cryptoService.createMediaFile('0101000', 'tests/output/downloads');
    expect(fs.existsSync('tests/output/downloads')).toBeTruthy();
  });

  test('It should encrypt a media file', async () => {
    cryptoService.createMediaFile('0101000', 'tests/output/downloads');
    cryptoService.encryptMediaFile('tests/output/downloads', 'tests/output/downloads', 'password');
    expect(await fs.existsSync('tests/output/downloads.enc')).toBeTruthy();
  });

  test('It should encrypt the file and remove the original', async () => {
    const data = {
      id: 1,
      test: 'test',
    };
    await cryptoService.createEncryptedFile('tests/output/test-vp.json', data, 'password');
    expect(fs.existsSync('tests/output/test-vp.json' + dbConfig.encryptionType)).toBeTruthy();
    expect(fs.existsSync('tests/output/test-vp.json')).toBeFalsy();
  });

  test('It should return the decrypted file data and remove the decrypted file after reading', async () => {
    expect(fs.existsSync('tests/output/test-vp.json' + dbConfig.encryptionType)).toBeTruthy();
    const data = await cryptoService.decryptAndReadFile('tests/output/test-vp.json', 'password');
    expect(data).toBeDefined();
    expect(data.id).toEqual(1);
    expect(fs.existsSync('tests/output/test-vp.json')).toBeFalsy();
  });
});
