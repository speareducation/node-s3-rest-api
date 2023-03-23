require('dotenv').config();
const s3 = require('./s3.js');

s3.getObject('test-spear-edm', '/sb1/netsuite/test.txt')
    .then(rsp => console.log(rsp.data))
    .catch(err => console.error(err.response.data));