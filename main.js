'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var ipcMain = require('electron').ipcMain;
var removeAllFiles = require('./app/js/fileutil.js').removeAllFiles;
var settings = require('./app/config/settings.json');

var mainWindow = null;

ipcMain.on('log', function(sender, m) {
	console.log(m);
});

ipcMain.on('setlasttask', function(sender, lastTask) {
	console.log('setlasttask with ' + lastTask.last_index + ': ' + lastTask.last_filename);
	global.lastTask = lastTask;
});

ipcMain.on('openfile', function(sender, fileName) {
	console.log('OpenFile: ' + fileName);
	global.localpath = fileName + '';
	mainWindow.loadURL('file://' + __dirname + '/app/image.html');
});

ipcMain.on('search-start', function(sender, info) {
	console.log('Search: ' + info.engine + ' with ' + info.keyword);
	global.searchInfo = info;
	mainWindow.loadURL('file://' + __dirname + '/app/download.html');
});

app.on('window-all-closed', function() {
	removeAllFiles(__dirname + '/app/working');
	app.quit();
});

app.on('ready', function() {
	mainWindow = new BrowserWindow({
		resizable: true,
		width: settings.UserInterface.Window.init_width,
		height: settings.UserInterface.Window.init_height
	});
	
	global.lastIndex = 0;
	
	mainWindow.loadURL('file://' + __dirname + '/app/index.html');
		
	//global.localpath = '/Users/hyungki/Documents/workspace/ImageGet/download';
	//mainWindow.loadURL('file://' + __dirname + '/app/image.html');
	
	mainWindow.on('closed', function() {
		mainWindow = null;
	});
});