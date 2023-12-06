module.exports = class AuthDetails {
  constructor(authState, registered, key, token) {
    this.authState = authState;
    this.userRegistered = registered;
    this.key = key || null;
    this.token = token || null;
  }
};
