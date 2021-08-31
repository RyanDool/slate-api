'use strict';
import PATH_EVENTS from './globals';

const AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'})

const 
	SSM = require('aws-sdk/clients/ssm'),
	ssm = new AWS.SSM(),
	S3 = new AWS.S3(),
	https = require('https'),
	options = {
		hostname: 'slate.admissions.arizona.edu',
		port: 443,
		path: PATH_EVENTS,
		method: 'GET',
		json: true
	},
	ssmParam = {
		'Name': '/dev/slate/events/rawContLen',
		'WithDecryption': false
	};


exports.handler = (event, context, callback) => {
	/* 
		Get Stored Parameter containing content-length string.
		If error, print error to console.
		else, execute getSlateJson() with stored parameter value as argument.
	*/
	ssm.getParameter(ssmParam, (err, data) => {
		err ? console.log(err, err.stack) : getSlateJson(data.Parameter.Value);
	})
	
	/*
		Request slate json end-point
		if request header 'content-length' does not match
		paramVal (argument passed from ssm.getParameter) then
		that means the JSON has been updated by Slate and 
		we must update the JSON stored in S3. Object from Slate
		and new content length are passed to saveToStorage().
	*/
	function getSlateJson(paramVal){
		const req = https.request(options, (res) => {
			let slateContLen = res.headers['content-length'];
			if( slateContLen != paramVal){
				let obj = '';
				res.setEncoding('utf8');
				res.on('data', (data) => obj += data);
				res.on('end', () => {
					// one last check to be sure that we are accessing the right content
					// before saving it to file.
					if (res.headers['content-type'] === 'application/json; charset=utf-8') {
						saveToStorage(obj, slateContLen);
					}
				});
			}
		});
		req.on('error', callback);
		req.end();
	}

	/*
		This function performs two vital tasks.
		1) The allSlateEventsRaw.json file is overwritten with the obj passed in.
		2) The rawContLen Stored Parameter value is updated with the slateContLen passed in.
	*/
	function saveToStorage(obj, slateContLen){

		// overwirte allSlateEventsRaw.json with new content
		S3.putObject({
			Bucket: 'emcvirtualevents',
			Key: 'events/allSlateEventsRaw.json',
			Body: obj,
			ContentType: 'application/json'
		})
			.promise()
			.then(() => console.log('JSON Upload Successful' ))
			.catch(e => {
			   console.error('ERROR', e);
			   callback(e);
			});
			
		// Update slateContLen in Stored Parameter 'rawContLen'
		ssm.putParameter({
			Name: ssmParam.Name,
			Type: 'String',
			Value: slateContLen,
			Description: 'header content-length value of raw slate json file',
			Overwrite: true
		})
			.promise()
			.then(() => console.log('Parameter Upload Successful' ))
			.catch(e => {
			   console.error('ERROR', e);
			   callback(e);
			});
	}
};