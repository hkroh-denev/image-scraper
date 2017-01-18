'use strict';

var remote = require('remote');
var dialog = remote.require('dialog');

exports.showMessage = function(msg) {
	dialog.showMessageBox({
		type: 'info',
		buttons: ['OK'],
		defaultId: 0,
		title: 'Info',
		message: msg
	});
};