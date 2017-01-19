'use strict';

var ipcRenderer = require('electron').ipcRenderer;
var remote = require('remote');
var dialog = remote.require('dialog');
var fs = require('fs');
var path = require('path');
var fileutil = require('./js/fileutil.js');
var showMessage = require('./js/util.js').showMessage;
var settings = require('./config/settings.json');
var $ = require('jquery');

var $warning_msg = $('#warning_msg');
var $rename_link = $('#rename_link');
var $clean_output = $('#clean_output');

var $openfile = $('#openfile');

var $google_keyword =$('#google_keyword');
var $google_count = $('#google_count');
var $googlesearch = $('#googlesearch');

var $naver_keyword = $('#naver_keyword');
var $naver_count = $('#naver_count');
var $naversearch = $('#naversearch');

var cacheDirectory = path.join(__dirname, settings.System.Directories.cache);
var downloadDirectory = path.join(__dirname, settings.System.Directories.download);
var outputDirectory = path.join(__dirname, settings.System.Directories.output);
var workingDirectory = path.join(__dirname, settings.System.Directories.working);
var configDirectory = path.join(__dirname, settings.System.Directories.config);

// check required directory
fileutil.ensureDirectory(cacheDirectory);
fileutil.ensureDirectory(downloadDirectory);
fileutil.ensureDirectory(outputDirectory);
fileutil.ensureDirectory(workingDirectory);

if (fs.existsSync(path.join(configDirectory, 'last_task.json'))) {
	dialog.showMessageBox({
		type: 'info',
		buttons: ['Continue', 'Ignore'],
		defaultId: 0,
		cancelId: 1,
		title: 'Info',
		message: 'You have a previous task which is not completed. Do you want to continue it?'
	}, function(choice) {
		if (choice === 0) {
			var lastTask = require(path.join(configDirectory, 'last_task.json'));
			ipcRenderer.send('setlasttask', lastTask);
			ipcRenderer.send('openfile', lastTask.input_directory);
		}
	});
}

if (fileutil.getFileCount(outputDirectory) > 0) {
		$warning_msg.html('Warning: Your output folider (app/output) is exist and it may be overwritten.');
		$warning_msg.css({'color': 'red'});
		$warning_msg.show();
		$rename_link.show();
		$clean_output.show();
}

$rename_link.click(function() {
	var newOutputPath = outputDirectory + ' - ' + new Date().toISOString();
	fs.rename(outputDirectory, newOutputPath);
	$warning_msg.html('Previous output folder chagned to "' + newOutputPath);
	$warning_msg.css({'color': 'yellow'});
	$rename_link.hide();
	$clean_output.hide();
});

$clean_output.click(function() {
	fileutil.removeAllFiles(outputDirectory);
	$warning_msg.hide();
	$rename_link.hide();
	$clean_output.hide();
});

$openfile.click(function() {
	dialog.showOpenDialog({
		properties: [
			'openDirectory'
		]},
		function(fileName) {
			if (fileName) {
				ipcRenderer.send('openfile', fileName);
			}
		});
});

$googlesearch.click(function() {
	var google_search = function() {
		var google_keyword = $.trim($google_keyword.val());
		if (google_keyword.length > 0) {
			ipcRenderer.send('search-start', {
				engine: 'google',
				keyword: google_keyword,
				start: 1,
				count: parseInt($google_count.val())
			});
		}
		else {
			showMessage('Please input keyword for Google search engine');
		}	
	};
	if (fileutil.getFileCount(downloadDirectory) > 0) {
		dialog.showMessageBox({
			type: 'info',
			buttons: ['Delete All', 'Ignore'],
			defaultId: 0,
			cancelId: 1,
			title: 'Info',
			message: 'Download folder contains some previous works.'
		}, function(choice) {
			if (choice === 0) {
				fileutil.removeAllFiles(downloadDirectory);
			}
			google_search();
		});
	}
	google_search();
});

$naversearch.click(function() {
	var naver_search = function() {
		var naver_keyword = $.trim($naver_keyword.val());
		if (naver_keyword.length > 0) {
			ipcRenderer.send('search-start', {
				engine: 'naver',
				keyword: naver_keyword,
				start: 1,
				count: parseInt($naver_count.val())
			});
		}
		else {
			showMessage('Please input keyword for Naver search engine');
		}
	};
	
	if (fileutil.getFileCount(downloadDirectory) > 0) {
		dialog.showMessageBox({
			type: 'info',
			buttons: ['Delete All', 'Ignore'],
			defaultId: 0,
			cancelId: 1,
			title: 'Info',
			message: 'Download folder contains some previous works.'
		}, function(choice) {
			if (choice === 0) {
				fileutil.removeAllFiles(downloadDirectory);
			}
			naver_search();
		});
	}
	else {
		naver_search();
	}
});