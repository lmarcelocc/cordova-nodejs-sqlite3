const nodecipher = require('node-cipher');
const fs = require('fs');
const util = require('util');
const dbConfig = require('../configs/config.js').dbConfig;

// private helper functions
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const fileExists = util.promisify(fs.exists);

/**
 *
 * @param {*} filePath
 * @param {*} key
 * Working
 */
async function asyncEncryptFile(filePath, key) {
  //create a promise using the node cipher callback for the async await
  await new Promise(function (resolve, reject) {
    nodecipher.encrypt(
      {
        input: filePath,
        output: filePath + dbConfig.encryptionType,
        password: key,
        //salt: saltBuffer
      },
      function (err, opts) {
        if (err) {
          throw err;
        }
        resolve('file encrypted');
      }
    );
  }).then(function (value) {
    console.log(value);
    //remove the unencrypted version
    fs.unlinkSync(filePath);
  });
}
/**
 *
 * @param {*} filePath
 * @param {*} key
 * async Not working as node cipher uses old school callback
 */
async function asyncDecryptFile(filePath, key) {
  //create a promise using the node cipher callback for the async await
  await new Promise(function (resolve, reject) {
    nodecipher.decrypt(
      {
        input: filePath + dbConfig.encryptionType,
        output: filePath,
        password: key,
        //salt: saltBuffer
      },
      function (err, opts) {
        if (err) {
          throw err;
        }
        resolve('file decrypted');
      }
    );
  }).then(function (value) {
    console.log(value);
  });
}

/**
 * Public functions
 */
function decryptMediaFile(sourceDir, outputDir, key) {
  nodecipher.decryptSync({ input: sourceDir + '.enc', output: outputDir, password: key });
}

function encryptMediaFile(sourceDir, outputDir, key) {
  nodecipher.encryptSync({ input: sourceDir, output: outputDir + '.enc', password: key });
}

async function createEncryptedFile(filePath, data, encKey) {
  //write the data to the file
  try {
    // create the file
    await writeFile(filePath, JSON.stringify(data), 'utf8');
    //encrypt the file
    await asyncEncryptFile(filePath, encKey);
  } catch (error) {
    console.log(error);
    if (await fileExists(filePath)) {
      console.log('error encrypting file removing original');
      fs.unlinkSync(filePath);
    }
    throw error;
  }
}

async function decryptAndReadFile(filePath, encKey) {
  try {
    // decrypt the file
    await asyncDecryptFile(filePath, encKey);
    // return the contents
    console.log('reading file');
    const file = JSON.parse(await readFile(filePath, 'utf-8'));
    // clone the data to memory
    const data = { ...file };
    console.log(data);
    // remove the unencypted file
    fs.unlinkSync(filePath);
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Used to create files for the provided images
 * @param {output directory} outputDir
 */
function createMediaFile(data, outputDir) {
  const image = new Buffer(data, 'base64');
  fs.writeFileSync(outputDir, image);
}

module.exports = {
  decryptMediaFile,
  encryptMediaFile,
  createMediaFile,
  createEncryptedFile,
  decryptAndReadFile,
};
