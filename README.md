NetSuite S3 REST API
================================
This is an example library, intended to be copied, modified, and used in NetSuite. It utilizes the S3 REST API to perform `GetObject` and `PutObject` actions on a bucket.

## Environment Variables
_These don't have to be implemented as environment variables_
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## References
- [The Full Tutorial](https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-authenticating-requests.html)
- [The "createSigningKey" function](https://docs.aws.amazon.com/general/latest/gr/signature-v4-examples.html#signature-v4-examples-javascript)
- [Generating a "CanonicalRequest" String](https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html)