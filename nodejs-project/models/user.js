module.exports = class User {
  constructor(hash) {
    this.id = 'gafAdminUser';
    this.password = hash;
    this.createdAt = new Date();
  }
};
