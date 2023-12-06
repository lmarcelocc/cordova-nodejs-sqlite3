module.exports = class ServiceResponse {
  constructor() {
    this.success = false;
    this.message = '';
    this.data = '';
    this.hasMoreEntities = false;
    this.responseCode = 200;
    this.filesNotLoaded = [];
  }
};
