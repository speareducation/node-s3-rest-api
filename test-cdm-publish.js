require('dotenv').config();
const sns = require('./sns');
const { md5 } = require('./aws');

const snsTopicArn = 'arn:aws:sns:us-east-1:009255884135:sns-cdm-dev.fifo';

async function handle() {

    const source = 'netsuite';
    const operation = 'update';
    const target = 'person';
    const person = {
        id: 100532,
        firstName: 'Jason',
        lastName: 'Wright',
        email: 'jwright@speareducation.com',
    };

    const groupId = source + '-' + operation;
    const uniqueId = target + '-' + md5(JSON.stringify(person)).toString('hex');

    const cdmEvent = {
        eventHeader: {
            timestamp: Date.now(),
            transactionId: groupId + '-' + uniqueId,
            operation: operation,
            target: target,
        },
        eventPayload: {
            person: person,
        },
    };

    // PUSH Change: send an update to SNS
    try {
        const rsp = await sns.publish(snsTopicArn, groupId, uniqueId, JSON.stringify(cdmEvent));
        console.log(rsp);
    } catch (e) {
        console.error('Failed to publish event', e);
        return;
    }
}

handle()
    .catch(e => console.error(e));
