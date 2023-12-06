const authService = require('../../services/auth-service');
const AuthDetails = require('../../models/auth-details');

describe('Auth service', () => {
  test('It should init', () => {
    authService.init();
    expect(authService.authDetails).toBeDefined();
  });

  test('It should set key', async () => {
    authService.key = 'testKey';
    expect(authService.key).toBe('testKey');
  });

  test('It should set authdetails', async () => {
    authService.authDetails = new AuthDetails(false, false);
    expect(authService.authDetails).toBeDefined();
  });

  test('It should logout', async () => {
    expect(authService.key).toBe('testKey');
    authService.logout();
    expect(authService.key).toBeNull();
  });
});
