test-sns-publish:
	set -a && . .env && set +a && node sns-publish.js

test-s3-get-object:
	set -a && . .env && set +a && node s3-get-object.js

test-s3-put-object:
	set -a && . .env && set +a && node s3-put-object.js

test-test:
	set -a && . .env && set +a && node test.js

test-sqs-retrieve-message:
	set -a && . .env && set +a && node sqs-receive-message.js

test-sqs-delete-message:
	set -a && . .env && set +a && node sqs-delete-message.js
