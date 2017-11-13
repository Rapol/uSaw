'use strict';
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();

var rp = require('request-promise');

const LABEL = "saw_classifier";

module.exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event));
    if (event.Records) {
        let requests = event.Records.map((record) => {
            let bucket = record.s3.bucket.name;
            let key = record.s3.object.key;
            const options = {
                uri: 'https://www.matroid.com/api/v1/detectors/59f388c4d0edfa3e73ecce1f/classify_image',
                method: 'POST',
                headers: {
                    Authorization: "Bearer bf6fb22ec3457b15df5213605be7122b"
                },
                form: {url: `https://s3.amazonaws.com/${bucket}/${key}`}
            };
            return rp(options);
        });
        Promise.all(requests)
            .then((responses) => {
                return Promise.all(responses.map((response, i) => {
                    response = JSON.parse(response);
                    console.log(response)
                    let predictionValue = response.results[0].predictions[0].labels.saw_classifier;
                    var params = {
                        ExpressionAttributeNames: {
                            "#LN": LABEL
                        },
                        ExpressionAttributeValues: {
                            ":lv": {
                                N: predictionValue.toString()
                            }
                        },
                        Key: {
                            "id": {
                                S: event.Records[i].s3.object.key.split("/")[1].split(".")[0]
                            }
                        },
                        TableName: process.env.USAW_TOOL_TABLE,
                        UpdateExpression: "SET #LN = :lv"
                    };
                    console.log(params)
                    return dynamodb.updateItem(params).promise();
                }))
            })
            .then(() => callback())
            .catch(callback)
    }
    else {
        callback("No records in event trigger");
    }
};

// function createTool(event, context, callback) {
//     const id = uuidv4();
//     if (!event.body.toolType || !event.body.img) {
//         return validationError(callback);
//     }
//     // validate request
//     // add to dynamoDB
//     const params = {
//         Item: {
//             "id": {
//                 S: id
//             },
//             "timestamp": {
//                 S: Date.now().toString()
//             }
//         },
//         TableName: process.env.USAW_TOOL_TABLE
//     };
//     params.Item.toolType = {S: event.body.toolType};
//     if (event.body.businessUnit) {
//         params.Item.businessUnit = {S: event.body.businessUnit};
//     }
//     if (event.body.year) {
//         params.Item.year = {S: event.body.year};
//     }
//     if (event.body.condition) {
//         params.Item.condition = {S: event.body.condition};
//     }
//     if (event.body.spec) {
//         params.Item.spec = {S: event.body.spec};
//     }
//     dynamodb.putItem(params).promise()
//         .then(() => {
//             const buf = new Buffer(event.body.img, "base64");
//             return s3.upload({
//                 Bucket: process.env.BUCKET,
//                 Body: buf,
//                 ContentEncoding: 'base64',
//                 ContentType: 'image/jpeg',
//                 Key: event.body.toolType + '/' + id
//             }).promise()
//         })
//         .then(() => {
//             const response = {
//                 statusCode: 200,
//                 body: JSON.stringify({
//                     status: 200
//                 })
//             };
//             callback(null, response);
//         })
//         // add to s3
//         .catch((ex) => serverError(callback, ex))
// }