const { hash, hmacSha256, sha256, md5, createSigningKey, getHashedCanonicalRequest } = require('./aws');

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

const host = `sns.${AWS_REGION}.amazonaws.com`;
const service = 'sns';
const date = '20230322T225509Z';
const dateStamp = date.split('T')[0];

const payload = [
    'Action=Publish',
    'Version=2010-03-31',
    'TopicArn=arn%3Aaws%3Asns%3Aus-east-1%3A009255884135%3Atest-fifo-topic.fifo',
    'Message=test%20message',
    'MessageGroupId=jason-test',
    'MessageDeduplicationId=jason-test-1',
].join('&');
console.log('Payload:', payload);

const payloadHash = sha256(payload).toString('hex');

const canonicalRequest = [
    'POST',
    '/',
    '',
    'content-type:application/x-www-form-urlencoded; charset=utf-8',
    `host:${host}`,
    `x-amz-date:${date}`,
    '',
    'content-type;host;x-amz-date',
    payloadHash,
].join('\n');

const hashedCanonicalRequest = sha256(canonicalRequest).toString('hex');

const stringToSign = [
    'AWS4-HMAC-SHA256',
    date,
    `${dateStamp}/${AWS_REGION}/${service}/aws4_request`,
    hashedCanonicalRequest
].join('\n');

const signingKey = createSigningKey(dateStamp, AWS_SECRET_ACCESS_KEY, AWS_REGION, service);
const signature = hmacSha256(stringToSign, signingKey).toString('hex');

console.log(`
TEST CanonicalRequest:
${canonicalRequest}

TEST StringToSign:
${stringToSign}

TEST Signature:
${signature}
`);

console.log('==================================================================================');

