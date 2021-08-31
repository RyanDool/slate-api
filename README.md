**Slate Virtual Events API**

A repo containing Lambda Functions and other useful information on the structure of the Slate Virtual Events API.

---

# API Structure

I will do my best to map out and explain the logic as well as the current configuration of each AWS service that cannot be demonstrated in code.

## Retrieving raw json from Slate and storing it in S3
Using an AWS CloudWatch Rule “getSlateEvents” (set to run once every hour) executes the AWS Lambda Function “getSlateVirtualEvents”. 

## Fetching Data
AWS API Gateway “virtualEvents” executes the lambda function “virtualEvents”. virtualEvents returns a json response where the root key is a date and the value is an array of events which start on that date. Accepted parameters are ‘month’ and ‘day’ and the values should be in the MM or DD respective format. If no parameters or day is the only parameter passed to the API Gateway call, then a json containing ALL events is returned. If month is passed a json is returned which only has keys for dates which fall within the month provided. If month and day are passed a json with a key of that MM/DD and value (array) of all events which start on that day is returned.

## API EndPoint

