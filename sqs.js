const { request, objectToFormString } = require('./aws');

const AWS_REGION = 'us-east-1';

const VERSION = '2012-11-05';

/** @url https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_ReceiveMessage.html */
function receiveMessage(queueUrl, params = {}) {
    const postdata = objectToFormString({
        Action: 'ReceiveMessage',
        Version: VERSION,
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        VisibilityTimeout: 60, // the time (seconds) NS needs to process the request. If this lapses without a DeleteMessage, the item in the queue will become available again.
        WaitTimeSeconds: 1, // the amount of time to wait for messages when the queue is empty
        ...params,
    });

    process.env.DEBUG && console.log('PostData:', postdata);

    return request(
        'sqs',
        `sqs.${AWS_REGION}.amazonaws.com`,
        'POST',
        '/',
        null,
        postdata,
        { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8' },
        ['content-type'],
    ).then(r => r.data);
}

/** @url https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_ReceiveMessage.html */
function deleteMessage(queueUrl, receiptHandle) {
    const postdata = objectToFormString({
        Action: 'DeleteMessage',
        Version: VERSION,
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
        // ...etc.
    });

    process.env.DEBUG && console.log('PostData:', postdata);

    return request(
        'sqs',
        `sqs.${AWS_REGION}.amazonaws.com`,
        'POST',
        '/',
        null,
        postdata,
        { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8' },
        ['content-type'],
    ).then(r => r.data);
}

module.exports = { receiveMessage, deleteMessage };