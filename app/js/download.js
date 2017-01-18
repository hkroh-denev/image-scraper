var request = require('request')
	, cachedRequest = require('cached-request')(request)
	, fs = require('fs')
	, path = require('path');

var google_config = require('./config/googleapikey.json');
var naver_config = require('./config/naverapikey.json');	
var settings = require('./config/settings.json');

var ipcRenderer = require('electron').ipcRenderer;
var remote = require('electron').remote;

var EOL = require('os').EOL;

var $ = require('jquery');
var $status = $('#status');
var $process = $('#process');

var RESULT_PER_QUERY = 10;
var ONE_YEAR_AS_MILLISECONDS = 365*24*60*60*1000; 
var url_log_file;
var searchInfo;
var cacheDirectory = path.join(__dirname, settings.System.Directories.cache);
var downloadDirectory = path.join(__dirname, settings.System.Directories.download); 

cachedRequest.setCacheDirectory(cacheDirectory);

$process.click(function() {
	ipcRenderer.send('openfile', downloadDirectory);
});
	
function pad(pad, str) {
	if (typeof str === 'undefined') {
		return pad;
	}
	return (pad + str).slice(-pad.length);
}

function makeFilepath(tag, start, index) {
	return path.join(downloadDirectory, tag + pad('00000000', start + index));
}

function getFileExtensionFromMimetype(mimeType, defaultExt)
{
	if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
		return '.jpg';
	}
	else if (mimeType === 'image/gif') {
		return '.gif';
	}
	else if (mimeType === 'image/png') {
		return '.png';
	}
	else if (mimeType === 'text/html') {
		return '.html';
	}
	else {
		console.log('Unknown mimeType: ' + mimeType);
	}
	
	return defaultExt;
}
	
var download = function(url, filepath, callback) {
	var mimeType = 'image/jpeg';
	
	url_log_file.write(url + EOL);
	request
		.get(url)
		.on('response', function(response) {
			mimeType = response.headers['content-type'];
		})
		.on('error', function(err) {
			callback(err);
			fs.unlink(filepath);
		})
		.on('end', function() {
			callback();
			fs.rename(filepath, filepath + getFileExtensionFromMimetype(mimeType, '.jpg'));
		})
		.pipe(fs.createWriteStream(filepath));
};

function googleImageCollector(query, start) {
	var full_url = 'https://www.googleapis.com/customsearch/v1?q=' + encodeURIComponent(query) + 
		'&cx=' + google_config.CSE_ID + 
		'&num=' + RESULT_PER_QUERY +
		'&searchType=image' +
		'&start=' + start + '&key=' + google_config.API_KEY;
		
	cachedRequest({
			url: full_url, 
			ttl: ONE_YEAR_AS_MILLISECONDS
		}, 
		function(error, response, body) {
			if (error) {
				console.log('Request error: ' + error);
			}
			
			if (response.statusCode !== 200) {
				console.log(body);
				return;
			}
			
			var obj = JSON.parse(body);
			var n = 0;	
			if (start === searchInfo.start) {
				var info_file = fs.createWriteStream(path.join(downloadDirectory, 'queryinfo.txt'), { flags: 'w'});
				info_file.write('Search Engine: Google' + EOL + 
					'Query: ' + query + EOL +
					'Range: ' + searchInfo.start + ' ~ ' + searchInfo.count + EOL +
					'Result: ' + obj.searchInformation.totalResults + EOL);
			}	
			var download_callback = function(err) {
				if (err) {
					console.log('Download Error: ' + err);
				}
					
				// go on next
				n++;
				if (n >= RESULT_PER_QUERY) {
					if (start + RESULT_PER_QUERY < searchInfo.count) {
						console.log('Go Next query ' + (start + RESULT_PER_QUERY));
						$status.html('Download ' + (start + RESULT_PER_QUERY -1) + ' of ' + searchInfo.count + ' images');
						googleImageCollector(query, start + RESULT_PER_QUERY);
					}
					else {
						console.log('All download completed');
						$status.html('All download completed');
						$process.show();
					}
				}
				else if  (n >= obj.display) {
					console.log('Results get only ' + obj.display);
					$status.html('Results get only ' + (start + obj.display - 1));
					$process.show();
				}
				else {
					var filepath = makeFilepath('G', start, n);
					download(obj.items[n].link, filepath, download_callback);
				}				
			};
			
			var filepath = makeFilepath('G', start, 0);
			download(obj.items[0].link, filepath, download_callback);
		}
	);
}

function naverImageCollector(query, start) {		
	var full_url = 'https://openapi.naver.com/v1/search/image.json?query=' + encodeURIComponent(query) + 
		'&display=' + RESULT_PER_QUERY +
		'&start=' + start + 
		'&sort=sim';
	
	console.log(full_url);
		
	cachedRequest({
			url: full_url, 
			headers: {
				'X-Naver-Client-Id': naver_config.clientID,
				'X-Naver-Client-Secret': naver_config.clientSecret
			}, 
			
			ttl: ONE_YEAR_AS_MILLISECONDS
		}, 
		function(error, response, body) {
			if (error) {
				console.log('Request error: ' + error);
			}
			
			if (response.statusCode !== 200) {
				console.log('HTTP response: ' + response.statusCode);
				console.log(body);
				return;
			}
			
			
			var obj = JSON.parse(body);
			var n = 0;		

			if (start === searchInfo.start) {
				var info_file = fs.createWriteStream(path.join(downloadDirectory, 'queryinfo.txt'), { flags: 'w'});
				info_file.write('Search Engine: Naver' + EOL +  
					'Query: ' + query + EOL +
					'Range: ' + searchInfo.start + ' ~ ' + searchInfo.count + EOL +
					'Result: ' + obj.total + EOL);
			}

			var download_callback = function(err) {
				if (err) {
					console.log('Download Error: ' + err);
				}
					
				// go on next
				n++;
				if (n >= RESULT_PER_QUERY) {
					if (start + RESULT_PER_QUERY < searchInfo.count) {
						console.log('Go Next query ' + (start + RESULT_PER_QUERY));
						$status.html('Download ' + (start + RESULT_PER_QUERY -1) + ' of ' + searchInfo.count + ' images');
						naverImageCollector(query, start + RESULT_PER_QUERY);
					}
					else {
						console.log('All download completed');
						$status.html('All download completed');
						$process.show();
					}
				}
				else if  (n >= obj.display) {
					console.log('Results get only ' + obj.display);
						$status.html('Results get only ' + (start + obj.display - 1));
						$process.show();
				}
				else {
					var filepath = makeFilepath('N', start, n);
					download(obj.items[n].link, filepath, download_callback);
				}				
			};
			
			if (obj.display > 0) {			
				var filepath = makeFilepath('N', start, 0);
				download(obj.items[0].link, filepath, download_callback);
			}
			else {
				console.log('No result found');
			}
		}
	);
}

url_log_file = fs.createWriteStream(path.join(downloadDirectory, 'urls.txt'), { flags: 'w'});
searchInfo = remote.getGlobal('searchInfo');

if (searchInfo.engine === 'google') {
	console.log('Google Image Search with "' + searchInfo.keyword + '"');
	googleImageCollector(searchInfo.keyword, searchInfo.start);
}
else if (searchInfo.engine === 'naver') {
	console.log('Naver Image Search with "' + searchInfo.keyword + '"');
	naverImageCollector(searchInfo.keyword, searchInfo.start);
}
else {
	console.log('Unknown search engine ' + searchInfo.engine);
}
