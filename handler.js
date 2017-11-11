'use strict';
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();
const uuidv4 = require('uuid/v4');
const s3 = new AWS.S3();

module.exports.router = (event, context, callback) => {
    if (event.httpMethod == "POST") {
        createTool(event, context, callback);
    }
    else if (event.httpMethod == "PUT") {
        detectTool(event, context, callback);
    }
    else {
        serverError(callback);
    }
};

function createTool(event, context, callback) {
    const id = uuidv4();
    // validate request
    // add to dynamoDB
    const params = {
        Item: {
            "id": {
                S: id
            },
            "toolType": {
                S: event.body.toolType
            },
            "businessUnit": {
                S: event.body.businessUnit
            },
            "year": {
                S: event.body.year
            },
            "condition": {
                S: event.body.condition
            },
            "spec": {
                S: event.body.spec
            }
        },
        TableName: process.env.USAW_TOOL_TABLE
    };
    const buf = new Buffer(event.body.img, "base64");
    dynamodb.putItem(params).promise()
        .then(() => {
            return s3.upload({
                Bucket: process.env.BUCKET,
                Body: buf,
                ContentEncoding: 'base64',
                ContentType: 'image/jpeg',
                Key: event.body.toolType + '/' + id
            }).promise()
        })
        .then(() => {
            const response = {
                statusCode: 200,
                body: JSON.stringify({
                    status: 200
                })
            };
            callback(null, response);
        })
        // add to s3
        .catch((ex) => serverError(callback, ex))
}

function detectTool(event, context, callback) {
    // validate request
    // send request to AI API
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Go Serverless v1.0! Your function executed successfully!',
            input: event
        })
    };

    callback(null, response);
}

function serverError(callback, ex) {
    console.error(ex);
    const response = {
        statusCode: 500,
        body: JSON.stringify({
            message: 'Internal Server error'
        })
    };
    callback(null, response);
}