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

// console.log(`
// REAL CanonicalRequest:
// POST
// /

// content-type:application/x-www-form-urlencoded; charset=utf-8
// host:localhost:8080
// x-amz-date:20230322T225509Z

// content-type;host;x-amz-date
// ac0520ef86a45f5da1de9341d831f94d3f6b9b2c48c5986c76fd8d933c1e27df

// REAL StringToSign:
// AWS4-HMAC-SHA256
// 20230322T225509Z
// 20230322/us-east-1/sns/aws4_request
// 145f884cdd7ac756f7cd34526cbbfa076e9b589241b247b094d083064ae66296

// REAL Signature:
// 3689c521966cae48ad79d391e5d80891268e8f9c77f0d17f840a92f648ee7f71
// `);
