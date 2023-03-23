const { request, objectToFormString } = require('./aws');

const AWS_REGION = 'us-east-1';

const VERSION = '2010-03-31';

function publish(topicArn, groupId, uniqueId, message) {
    const postdata = objectToFormString({
        Action: 'Publish',
        Version: VERSION,
        TopicArn: topicArn,
        Message: message,
        MessageGroupId: groupId,
        MessageDeduplicationId: uniqueId,
    });

    process.env.DEBUG && console.log('PostData:', postdata);

    return request(
        'sns',
        `sns.${AWS_REGION}.amazonaws.com`,
        'POST',
        '/',
        null,
        postdata,
        { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8' },
        ['content-type'],
    ).then(r => r.data);
}

module.exports = { publish };