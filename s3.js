/**
 * This module integrates with the S3 REST API.
 * 
 * Resources
 * @url https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html
 * @url https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-authenticating-requests.html
 */
const crypto = require('crypto');
const https = require('axios'); // used because it's similar to N/https
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, DEBUG } = process.env;
const AWS_REGION = 'us-east-1';

/**
 * Generates a SHA-256 HMAC hash of the provided message.
 * @param {String|Buffer} message 
 * @param {String|Buffer} key 
 * @returns {Buffer}
 */
 function hmacSha256(message, key) {
    return crypto.createHmac('sha256', key).update(message).digest();
}

/**
 * Hashes an input with the provided algorithm
 * @param {String} algorithm 
 * @param {String|Buffer} payload 
 * @returns {Buffer}
 */
function hash(algorithm, payload) {
    return crypto.createHash(algorithm).update(payload).digest();
}

/**
 * Hashes the payload with sha256
 * @param {String|Buffer} payload 
 * @returns {Buffer}
 */
function sha256(payload) {
    return hash('sha256', payload);
}

/**
 * Hashes the payload with md5
 * @param {String|Buffer} payload 
 * @returns {Buffer}
 */
function md5(payload) {
    return hash('md5', payload)
}

/**
 * Generates a key buffer used to generate a "signature"
 * @see https://docs.aws.amazon.com/general/latest/gr/signature-v4-examples.html#signature-v4-examples-javascript for crypto-js example
 * 
 * @param {String} dateStamp (YYYYMMDD)
 * @param {String} secretAccessKey (AWS_SECRET_ACCESS_KEY)
 * @param {String} region ("us-east-1")
 * @param {String} service ("s3")
 * @returns {Buffer}
 */
 function createSigningKey(dateStamp, secretAccessKey, region, service) {
    const kDate = hmacSha256(dateStamp, "AWS4" + secretAccessKey);
    const kRegion = hmacSha256(region, kDate);
    const kService = hmacSha256(service, kRegion);
    const kSigning = hmacSha256("aws4_request", kService);
    return kSigning;
}

/**
 * Creates a "StringToSign" and signs it
 * @param {String} algorithm 
 * @param {String} requestDatetime 
 * @param {String} credentialScope 
 * @param {String} hashedCanonicalRequest 
 * @returns {String} (hex)
 */
function getSignature(algorithm, requestDatetime, credentialScope, hashedCanonicalRequest, signingKey) {
    const stringToSign = [
        algorithm,
        requestDatetime,
        credentialScope.replace(AWS_ACCESS_KEY_ID + '/', ''),
        hashedCanonicalRequest
    ].join('\n');

    DEBUG && console.log('StringToSign:' + '\n' + stringToSign + '\n');

    return hmacSha256(stringToSign, signingKey).toString('hex');
}

/**
 * Creates a "CanonicalRequest" string and hashes it.
 * careful of the ordering here. It matters. 
 * @see https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html
 * @param {String} method 
 * @param {String} objectPath 
 * @param {Array} signedHeaders 
 * @param {String} headers 
 * @param {String} queryString (optional)
 * @returns 
 */
function getHashedCanonicalRequest(method, objectPath, signedHeaders, headers, queryString = '') {
    const canonicalRequest = [
        method.toUpperCase(), // GET|PUT
        encodeURI(objectPath || '/'), // must use "/" if path is empty.
        encodeURI(queryString),
        signedHeaders // canonical headers that must be signed
            .map(headerKey => headerKey + ':' + headers[headerKey] + '\n') // dont join on '\n'; needs extra newline
            .join(''),
        headers['signedheaders'], // list of signed headers
        headers['x-amz-content-sha256'],
    ].join('\n');

    DEBUG && console.log('CanonicalRequest:' + '\n' + canonicalRequest + '\n');

    return sha256(canonicalRequest).toString('hex');
}

/**
 * Sends a request to S3 (supports GetObject, PutObject)
 * @param {String} method 
 * @param {String} bucket 
 * @param {String} objectPath 
 * @param {String|Buffer} objectPayload (default null)
 * @param {Boolean} debug (default false)
 * @returns 
 */
function request(method, bucket, objectPath, objectPayload = null) {
    const service = 's3';
    const host = `${bucket}.s3.${AWS_REGION}.amazonaws.com`
    const now = new Date();
    const requestDatetime = now.toISOString().replace(/(-|:|\.\d{3})/g, ''); // ex: 20210315T231500Z
    const dateStamp = requestDatetime.split('T')[0]; // ex: 20210315
    const signingKey = createSigningKey(dateStamp, AWS_SECRET_ACCESS_KEY, AWS_REGION, service);
    const credentialScope = `${AWS_ACCESS_KEY_ID}/${dateStamp}/${AWS_REGION}/${service}/aws4_request`;
    const algorithm = 'AWS4-HMAC-SHA256';
    const signedHeaders = ['host', 'x-amz-content-sha256', 'x-amz-date']; // must be sorted

    const headers = {
        'host': host,
        'x-amz-content-sha256': objectPayload ? sha256(objectPayload).toString('hex') : 'UNSIGNED-PAYLOAD',
        'x-amz-date': requestDatetime,
    }

    if (objectPayload) {
        headers['content-md5'] = md5(objectPayload).toString('base64'); // must be base64
        signedHeaders.push('content-md5');
        signedHeaders.sort(); // make sure these are sorted
    }

    headers.signedheaders = signedHeaders.join(';');

    const hashedCanonicalRequest = getHashedCanonicalRequest(method, objectPath, signedHeaders, headers);

    headers.authorization = algorithm + ' ' + [
        'Credential=' + credentialScope,
        'SignedHeaders=' + signedHeaders.join(';'),
        'Signature=' + getSignature(algorithm, requestDatetime, credentialScope, hashedCanonicalRequest, signingKey)
    ].join(',');

    const request = {
        method: method,
        baseURL: 'https://' + host,
        url: objectPath,
        headers: headers,
        data: objectPayload,
    };

    DEBUG && console.log('Request:', request);

    return https(request);
}

function getObject(bucket, key) {
    return request('GET', bucket, key);
}

function putObject(bucket, key, data) {
    return request('PUT', bucket, key, data);
}

module.exports = { request, getObject, putObject };