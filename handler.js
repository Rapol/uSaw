'use strict';
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();
const uuidv4 = require('uuid/v4');

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
    // validate request
    // add to dynamoDB
    const params = {
        Item: {
            "id": {
                S: uuidv4()
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
    dynamodb.putItem(params).promise()
        .then((data) => {
            const response = {
                statusCode: 200,
                body: JSON.stringify({
                    status: 200
                })
            };
            callback(null, response);
        })
        // add to s3
        .catch(() => serverError(callback))
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

function serverError(callback) {
    const response = {
        statusCode: 500,
        body: JSON.stringify({
            message: 'Internal Server error'
        })
    };
    callback(null, response);
}