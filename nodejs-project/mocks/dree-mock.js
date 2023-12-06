// __mocks__/dree.js
'use strict';

const path = require('path');

const dree = jest.genMockFromModule('dree');

// A custom version of `scan` that reads from the special mocked out
// file list set via __setMockFiles
function scan(dir, ext) {
  return { path: 'test.mp3' };
}

dree.scan = scan;

module.exports = dree;
