'use strict';

module.exports.router = (event, context, callback) => {
    if (event.httpMethod == "POST") {
        createTool(event, context, callback);
    }
    else if (event.httpMethod == "PUT") {
        detectTool(event, context, callback);
    }
    else {
        const response = {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal Server error'
            })
        };
        callback(null, response);
    }
};

function createTool(event, context, callback) {
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Go Serverless v1.0! Your function executed successfully!',
            input: event
        })
    };

    callback(null, response);
}

function detectTool(event, context, callback) {
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Go Serverless v1.0! Your function executed successfully!',
            input: event
        })
    };

    callback(null, response);
}