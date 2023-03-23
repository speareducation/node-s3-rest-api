const { request } = require('./aws');

const AWS_REGION = 'us-east-1';

const VERSION = '2010-03-31';

function publish(topicArn, groupId, uniqueId, message) {
    const postdata = [
        'Action=Publish',
        'Version=' + VERSION,
        'TopicArn=' + encodeURIComponent(topicArn),
        'Message=' + encodeURIComponent(message),
        'MessageGroupId=' + encodeURIComponent(groupId),
        'MessageDeduplicationId=' + encodeURIComponent(uniqueId),
    ].join('&');

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
    );
}

module.exports = { publish };