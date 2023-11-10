const fs = require('fs');

afterAll(() => {
  console.log('after tests');
});

beforeAll(() => {
  console.log('before tests');
  const dir = 'tests/output';
  console.log('before tests' + dir);
  if (!fs.existsSync(dir)) {
    console.log('before tests make ' + dir);
    fs.mkdirSync(dir);
    fs.mkdirSync(dir + '/app');
  }
});
