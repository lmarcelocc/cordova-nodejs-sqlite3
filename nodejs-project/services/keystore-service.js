const User = require('../models/user');
const cryptoService = require('../services/crypto-service');
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 10; //more rounds mean higher encryption but slower processing
const dbConfig = require('../configs/config.js').dbConfig;

// public functions
/**
 *
 * @param {*} publicKey
 * @param {*} password
 */
async function isValidPassword(password, keyFile) {
  try {
    const user = await cryptoService.decryptAndReadFile(keyFile, dbConfig.password);
    const hash = user.password;
    const res = await bcrypt.compare(password, hash);
    return res;
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param {*} publicKey
 * @param {*} password
 * @param {*} privateK
 */
async function createKey(publicKey, password, path) {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User(hash);
    await cryptoService.createEncryptedFile(path, user, dbConfig.password);
    return user;
  } catch (error) {
    console.log('error creating key');
    throw error;
  }
}

module.exports = {
  createKey: createKey,
  isValidPassword: isValidPassword,
};
