require('dotenv').config();
const sns = require('./sns');

const snsTopicArn = 'arn:aws:sns:us-east-1:009255884135:sns-cdm-dev.fifo';

async function handle() {

    const cdmPayload = {
        timestamp: Date.now(),
        transactionId: 'testtransactionasdf123',
        operation: 'Update',
        target: 'Person',
        payload: {
            spearUserId: 100532,
            firstName: 'Jason',
            lastName: 'Wright',
            email: 'jwright@speareducation.com',
        },
    };

    const uniqueId = cdmPayload.transactionId;
    const groupId = cdmPayload.operation + '-' + cdmPayload.target;
    
    // PUSH Change: send an update to SNS
    try {
        const rsp = await sns.publish(snsTopicArn, groupId, uniqueId, JSON.stringify(cdmPayload));
        console.log(rsp);
    } catch (e) {
        console.error('Failed to publish event', e);
        return;
    }
}

handle()
    .catch(e => console.error(e));
