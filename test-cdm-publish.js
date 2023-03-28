require('dotenv').config();
const sns = require('./sns');
const { md5 } = require('./aws');

const snsTopicArn = 'arn:aws:sns:us-east-1:009255884135:sns-cdm-dev.fifo';

async function handle() {

    const source = 'core'; // DEMO only! This will actually be set to "netsuite" if being sent FROM netsuite.
    const operation = 'update';
    const target = 'person';
    const person = {
        id: 100532,
        firstName: 'Jason',
        lastName: 'Wright',
        email: 'jwright@speareducation.com',
        updatedAt: new Date().toJSON(),
    };

    const groupId = source + '-' + operation;
    const uniqueId = target + '-' + md5(JSON.stringify(person)).toString('hex');

    const cdmEvent = {
        eventHeader: {
            timestamp: Date.now(),
            source: source,
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
        console.log('PUBLISH');
        console.log({ groupId, uniqueId });
        console.log(JSON.stringify(cdmEvent, null, 2));
        const rsp = await sns.publish(snsTopicArn, groupId, uniqueId, JSON.stringify(cdmEvent));
        console.log(rsp);
    } catch (e) {
        console.error('Failed to publish event', e);
        return;
    }
}

handle()
    .catch(e => console.error(e));
