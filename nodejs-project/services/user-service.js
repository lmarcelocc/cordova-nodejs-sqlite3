const keystoreService = require('./keystore-service');
const dbConfig = require('../configs/config.js').dbConfig;
const cordova = require('cordova-bridge');
const ServiceResponse = require('../models/service-response');
const fs = require('fs');
const util = require('util');

const path = cordova.app.datadir() + '/' + dbConfig.keyPath;
/**
 * private functions
 */
const fileExists = util.promisify(fs.exists);

function validatePasswordStrength(password) {
  const pRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})'); // special chars (?=.*[!@#\$%\^&\*])
  return pRegex.test(password);
}

/**
 * Public functions
 */
async function register(password) {
  const response = new ServiceResponse();
  if (await userExists(path)) {
    console.log('error: user already exists');
    response.success = false;
    response.message = 'error: user already exists';
    response.responseCode = 409;
  } else if (!validatePasswordStrength(password)) {
    console.log('error: password does not meet criteria');
    response.success = false;
    response.message = 'error: password does not meet criteria';
    response.responseCode = 401;
  } else {
    console.log('creating user...');
    try {
      const user = await keystoreService.createKey('publicKey', password, path);
      if (!user) {
        console.log('error creating user');
        response.success = false;
        response.message = 'server error - could not create user';
        response.responseCode = 500;
      } else {
        response.success = true;
        response.message = 'user has been registered';
      }
    } catch (error) {
      response.success = false;
      response.message = error;
      response.responseCode = 500;
    }
  }
  return response;
}

async function userExists() {
  return await fileExists(path + dbConfig.encryptionType);
}

async function isValidUser(password) {
  const response = new ServiceResponse();
  try {
    const userRegistered = await userExists();
    if (!userRegistered) {
      response.success = false;
      response.message = 'user not found';
      response.responseCode = 400;
    } else {
      response.success = true;
      response.data = await keystoreService.isValidPassword(password, path);
    }
  } catch (error) {
    response.success = false;
    response.message = error.toString();
    response.responseCode = 500;
  }
  return response;
}

module.exports = {
  register,
  userExists,
  isValidUser,
};
