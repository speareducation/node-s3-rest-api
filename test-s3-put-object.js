require('dotenv').config();
const fs = require('fs');
const s3 = require('./s3.js');

const payload = fs.readFileSync('./tooth.txt');

s3.putObject('test-spear-edm', '/sb1/netsuite/test.txt', payload)
    .then(rsp => console.log('Success'))
    .catch(err => console.error(err.response.data));
