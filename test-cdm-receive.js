require('dotenv').config();
const sqs = require('./sqs');

const sqsQueueUrl = 'https://sqs.us-east-1.amazonaws.com/009255884135/ns-cdm-dev.fifo';

async function handle() {

    // PULL Change: pull updates from SQS
    let sqsRsp;
    try {
        sqsRsp = await sqs.receiveMessage(sqsQueueUrl, {
            WaitTimeSeconds: 20, // 20s is maximum
            VisibilityTimeout: 5,
        });
    } catch (e) {
        // Exceptions are not thrown when queue is empty
        console.error('SQS ReceiveMessage failed. Likely service disruption', e);
        return;
    }

    if (!sqsRsp.ReceiveMessageResponse?.ReceiveMessageResult?.messages?.length) {
        console.log('No messages in queue');
        return;
    }

    let message = sqsRsp.ReceiveMessageResponse.ReceiveMessageResult.messages[0]; // SQS message object
    const sqsMessageBody = JSON.parse(message.Body); // SQS message body (from SNS)
    const sqsCdmPayload = JSON.parse(sqsMessageBody.Message); // CDM object
    const receiptHandle = message.ReceiptHandle;
    console.log('SQS CDM Payload:', sqsCdmPayload);
    console.log('ReceiptHandle', receiptHandle);

    /**
     * Process the CDM Payload from SQS here!
     */

    // once complete, delete the message from the queue.
    try {
        const rsp = await sqs.deleteMessage(sqsQueueUrl, receiptHandle);
        console.log(rsp);
    } catch (e) {
        console.error('Failed to delete message', JSON.stringify(e, null, 2));
        if (e.response) {
            console.error(e.response);
        }
        return;
    }

}

async function loop() {
    while (true) {
        await handle();
    }
}
loop();