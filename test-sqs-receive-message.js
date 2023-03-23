require('dotenv').config();
const sqs = require('./sqs.js');

const queueUrl = 'https://sqs.us-east-1.amazonaws.com/009255884135/devops-645.fifo';

sqs.receiveMessage(queueUrl)
    .then(rsp => console.log(rsp.data))
    .catch(err => console.error(err.response.data));
