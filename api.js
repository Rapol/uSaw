'use strict';
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();
const uuidv4 = require('uuid/v4');
const s3 = new AWS.S3();

module.exports.router = (event, context, callback) => {
    if (typeof event.body == "string") {
        event.body = JSON.parse(event.body);
    }
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
    if (!event.body.toolType || !event.body.img) {
        return validationError(callback);
    }
    event.body.toolType = event.body.toolType.toLowerCase();
    // validate request
    // add to dynamoDB
    const params = {
        Item: {
            "id": {
                S: id
            },
            "timestamp": {
                S: Date.now().toString()
            }
        },
        TableName: process.env.USAW_TOOL_TABLE
    };
    params.Item.toolType = {S: event.body.toolType};
    if (event.body.businessUnit) {
        params.Item.businessUnit = {S: event.body.businessUnit};
    }
    if (event.body.year) {
        params.Item.year = {S: event.body.year};
    }
    if (event.body.condition) {
        params.Item.condition = {S: event.body.condition.toLowerCase()};
    }
    if (event.body.spec) {
        params.Item.spec = {S: event.body.spec};
    }
    dynamodb.putItem(params).promise()
        .then(() => {
            const buf = new Buffer(event.body.img, "base64");
            return s3.upload({
                Bucket: process.env.BUCKET,
                Body: buf,
                ContentEncoding: 'base64',
                ContentType: 'image/jpg',
                Key: event.body.toolType + '/' + id + ".jpg"
            }).promise()
        })
        .then(() => {
            const response = {
                statusCode: 200,
                body: JSON.stringify({
                    status: 200,
                    data: {
                        id: id
                    }
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

function validationError(callback) {
    const response = {
        statusCode: 400,
        body: JSON.stringify({
            status: 400,
            message: 'Validation Error'
        })
    };
    callback(null, response);
}

function serverError(callback, ex) {
    console.error(ex);
    const response = {
        statusCode: 500,
        body: JSON.stringify({
            status: 500,
            message: 'Internal Server error'
        })
    };
    callback(null, response);
}