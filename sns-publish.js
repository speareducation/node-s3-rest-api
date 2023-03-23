const sns = require('./sns.js');

/** 
 * Documentation URLs:
 * @url https://docs.aws.amazon.com/sns/latest/api/API_Publish.html
 * @url https://docs.aws.amazon.com/general/latest/gr/signing-aws-api-requests.html
 * @url https://docs.aws.amazon.com/general/latest/gr/create-signed-request.html
 */


const topicArn = 'arn:aws:sns:us-east-1:009255884135:test-fifo-topic.fifo';

const transactionTimestamp = 1679498517594; // Date.now();
const groupId = 'jason-test'; // all items within a group are executed in order
const uniqueId = 'jason-test-1'; // ensures uniqueness. maybe also include transaction timestamp (for updates)
const message = {
    timestamp: transactionTimestamp,
    operation: "test",
    data: {
        id: 1,
        jason: "wright",
    }
};

sns.publish(topicArn, groupId, uniqueId, 'test message')
    .then(r => console.log(r))
    .catch(e => console.error(e.response))
