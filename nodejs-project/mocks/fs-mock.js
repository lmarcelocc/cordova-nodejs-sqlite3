// __mocks__/fs.js
'use strict';

const path = require('path');

const fs = jest.genMockFromModule('fs');

// This is a custom function that our tests can use during setup to specify
// what the files on the "mock" filesystem should look like when any of the
// `fs` APIs are used.
let mockFiles = Object.create(null);
function __setMockFiles(newMockFiles) {
  mockFiles = Object.create(null);
  for (const file in newMockFiles) {
    const dir = path.dirname(file);

    if (!mockFiles[dir]) {
      mockFiles[dir] = [];
    }
    mockFiles[dir].push(path.basename(file));
  }
}

// A custom version of `readdirSync` that reads from the special mocked out
// file list set via __setMockFiles
function readdirSync(directoryPath) {
  return mockFiles[directoryPath] || [];
}
function existsSync(directoryPath) {
  return mockFiles[directoryPath] || [];
}
function mkdirSync(directoryPath) {
  mockFiles[directoryPath] = [];
}
function readFile(directoryPath) {
  return mockFiles[directoryPath] || [];
}
function writeFile(directoryPath, data) {
  mockFiles[directoryPath].push(data);
}
function unlinkSync(directoryPath) {
  mockFiles[directoryPath] = null;
}

fs.__setMockFiles = __setMockFiles;
fs.readdirSync = readdirSync;
fs.existsSync = existsSync;
fs.readFile = readFile;
fs.writeFile = writeFile;
fs.unlinkSync = unlinkSync;

module.exports = fs;
