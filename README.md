NetSuite AWS REST API PoC
================================
This is an example library, intended to be copied, modified, and used in NetSuite. It utilizes the AWS REST API to perform various service actions in AWS.
- S3 `GetObject` and `PutObject` actions on a bucket.
- SQS Message retrieval
- SNS Topic publishing 

## Environment Variables
_These don't have to be implemented as environment variables_
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Overview
All services within the AWS REST API are accessible via their "v4" auth integration. This involves creating a signature of your request using `AWS_SECRET_ACCESS_KEY` and passing it inside of the `Authorization` header.

The auth v4 flow contains 3 main stages:
- CanonicalRequest
- StringToSign
- Signature

Here's a real example of each:

**CanonicalRequest**
```
GET
/sb1/netsuite/test.txt

host:test-spear-edm.s3.us-east-1.amazonaws.com
x-amz-date:20230323T172514Z

host;x-amz-date
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

**StringToSign**
```
AWS4-HMAC-SHA256
20230323T172514Z
20230323/us-east-1/s3/aws4_request
b25d00dcf70e3338f92ae250ad21b6d0db10b58a9d90b6fd27d5dbc45ab53734
```

**Signature**
```
419278140431dca83c08a7b767b1a6d49283a9309c6d0ad6a0daa5310930dad9
```

### Running these examples
Each of these example .js files are executable and were built against the `spear` AWS account. To run them, you'll need to run the following steps:
```
nvm install && nvm use

npm install

cp .env.example .env
```
Then, edit the `.env` file in the project's root directory with the access key ID and Secret.

Now, you can run the tests in the `Makefile` with the `make` command. Example: `make test-s3-get-object`


## References
- [AWS API Request Signing](https://docs.aws.amazon.com/general/latest/gr/create-signed-request.html)
- [The Full S3 Tutorial](https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-authenticating-requests.html)
- [The "createSigningKey" function](https://docs.aws.amazon.com/general/latest/gr/signature-v4-examples.html#signature-v4-examples-javascript)
- [Generating a "CanonicalRequest" String](https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html)