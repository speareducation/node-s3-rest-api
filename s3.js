const { request, md5 } = require('./aws');

const AWS_REGION = 'us-east-1';

function getObject(bucket, key) {
    return request(
        's3',
        `${bucket}.s3.${AWS_REGION}.amazonaws.com`,
        'GET',
        key,
    );
}

function putObject(bucket, key, payload) {
    return request(
        's3',
        `${bucket}.s3.${AWS_REGION}.amazonaws.com`,
        'PUT',
        key,
        null,
        payload,
        {'content-md5': md5(payload).toString('base64')},
        ['content-md5'],
    );
}

module.exports = { getObject, putObject };