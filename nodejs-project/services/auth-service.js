const AuthDetails = require('../models/auth-details');
const crypto = require('crypto');

class AuthService {
  init() {
    this._authDetails = new AuthDetails(false, false, null);
    this._key = null;
    this._jwtSecret = crypto.randomBytes(12).toString('hex');
  }

  get authDetails() {
    return this._authDetails;
  }

  set authDetails(authDetails) {
    this._authDetails = authDetails;
  }

  set key(key) {
    this._key = key;
  }

  get key() {
    return this._key;
  }

  get jwtSecret() {
    return this._jwtSecret;
  }
  /**
   * logs out a user and creates a new secret for our token
   */
  async logout() {
    this._authDetails = new AuthDetails(false, true, null);
    this._key = null;
  }
}
// create a singleton instance for lifescycle of server
module.exports = new AuthService();
