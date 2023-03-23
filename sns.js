const { request } = require('./aws');

const AWS_REGION = 'us-east-1';

function publish(topicArn, groupId, uniqueId, message) {
    const postdata = [
        'Action=Publish',
        'Version=2010-03-31',
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