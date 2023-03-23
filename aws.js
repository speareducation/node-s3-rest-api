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
 * @param {String} canonicalPath 
 * @param {Array} signedHeaders 
 * @param {String} headers 
 * @param {String} queryString (optional)
 * @param {String} payloadHash (optional)
 * @returns string
 */
function getHashedCanonicalRequest(method, canonicalPath, signedHeaders, headers, queryString = '', payloadHash = '') {
    const canonicalRequestParts = [
        method.toUpperCase(), // GET|PUT
        encodeURI(canonicalPath || '/'), // must use "/" if path is empty.
        queryString || '', // must use "" if empty. Do not prefix with ?
        signedHeaders // canonical headers that must be signed
            .map(headerKey => headerKey + ':' + headers[headerKey] + '\n') // dont join on '\n'; needs extra newline
            .join(''),
        headers['signedheaders'], // list of signed headers
        payloadHash, // payload hash (even if empty string)
    ];

    const canonicalRequest = canonicalRequestParts.join('\n');

    DEBUG && console.log('CanonicalRequest:');
    DEBUG && console.log(canonicalRequest + '\n');

    return sha256(canonicalRequest).toString('hex');
}

/**
 * Sends a request to AWS (from S3 authorization flow)
 * @param {String} service (sns, s3, etc.)
 * @param {String} endpoint (protocol + domain)
 * @param {String} method (post, get, put)
 * @param {String} path (set to / if unsure)
 * @param {String} querystring (default null)
 * @param {String|Buffer} postdata (default null)
 * @param {Object} extraHeaders (default {})
 * @param {Array} extraSignedHeaders (default [])
 * @returns 
 */
function request(
    service, 
    endpoint, 
    method, 
    path, 
    querystring = null, 
    postdata = null,
    extraHeaders = {},
    extraSignedHeaders = [],
) {
    if (!AWS_ACCESS_KEY_ID) {
        throw Error('AWS_ACCESS_KEY_ID undefined');
    }
    if (!AWS_SECRET_ACCESS_KEY) {
        throw Error('AWS_SECRET_ACCESS_KEY undefined');
    }
    if (!AWS_REGION) {
        throw Error('AWS_REGION undefined');
    }

    const host = endpoint;
    const now = new Date();
    // const requestDatetime = '20230322T225509Z'; 
    const requestDatetime = now.toISOString().replace(/(-|:|\.\d{3})/g, ''); // ex: 20210315T231500Z
    const dateStamp = requestDatetime.split('T')[0]; // ex: 20210315
    const signingKey = createSigningKey(dateStamp, AWS_SECRET_ACCESS_KEY, AWS_REGION, service);
    const credentialScope = `${AWS_ACCESS_KEY_ID}/${dateStamp}/${AWS_REGION}/${service}/aws4_request`;
    const algorithm = 'AWS4-HMAC-SHA256';
    const signedHeaders = ['host', 'x-amz-date'].concat(extraSignedHeaders); // must be sorted
    signedHeaders.sort();

    const payloadHash = sha256(postdata || '').toString('hex'); // include this even if hash of empty string

    const headers = {
        'host': host,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': requestDatetime,
        ...extraHeaders,
    };

    headers['signedheaders'] = signedHeaders.join(';');

    const hashedCanonicalRequest = getHashedCanonicalRequest(method, path, signedHeaders, headers, querystring, payloadHash);

    const signature = getSignature(algorithm, requestDatetime, credentialScope, hashedCanonicalRequest, signingKey);
    DEBUG && console.log('Signature:', signature);

    headers.authorization = algorithm + ' ' + [
        'Credential=' + credentialScope,
        'SignedHeaders=' + signedHeaders.join(';'),
        'Signature=' + signature
    ].join(',');

    const request = {
        method: method,
        baseURL: 'https://' + host,
        url: path + (querystring ? '?' + querystring : ''),
        headers: headers,
    };

    if (postdata) {
        request.data = postdata;
    }

    DEBUG && console.log(JSON.stringify(request, null, 2));

    // return new Promise((resolve) => resolve());
    return https(request);
}

module.exports = { hash, hmacSha256, sha256, md5, request, createSigningKey, getSignature, getHashedCanonicalRequest };