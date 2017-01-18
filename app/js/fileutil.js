'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');

exports.ensureDirectory = function(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
};

exports.removeAllFiles = function(dir) {
	var files = fs.readdirSync(dir);
	var fullFilePaths = _.map(files, function(fileName) {
		var fullpath = path.join(dir, fileName);
		//console.log('Delete ' + fullpath);
		fs.unlinkSync(fullpath);
	});
};

exports.getFileCount = function(dir) {
	return fs.readdirSync(dir).length;
};