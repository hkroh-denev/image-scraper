'use strict';

var ipcRenderer = require('electron').ipcRenderer;
var remote = require('electron').remote;
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var Jimp = require('jimp');
var keycode = require('./js/keycode');
var showMessage = require('./js/util.js').showMessage;
var settings = require('./config/settings.json');

var IMAGE_DISPLAY_WIDTH_MAX = settings.UserInterface.Image.display_max_width;
var IMAGE_DISPLAY_HEIGHT_MAX = settings.UserInterface.Image.display_max_height;
var IMAGE_ALIGN_WIDTH = settings.Preprocessing.Padding.width_unit;
var IMAGE_ALIGN_HEIGHT = settings.Preprocessing.Padding.height_unit;

var $ = require('jquery');
var $image_area = $('#image_area');
var $cropper = $('#crop_box');
var $error_box = $('#error_box');
var $current_image = $('#current_image');
var $current_count = $('#current_count');
var $image_total = $('#image_total');
var $image_ratio = $('#image_ratio');
var $mode_ind = $('#mode_ind');
var $statusbar = $('#statusbar');
var img_tags = $('img');

var imageIndex = 0;
var imageFiles;
var workingFilePath; 
var workingDirectory = path.join(__dirname, settings.System.Directories.working);
var outputDirectory = path.join(__dirname, settings.System.Directories.output); 

var imageInfo = {
	imageTitle: '',
	imageExt: '',
	original_path : '',
	original_width : 0,
	original_height: 0,
	display_ratio: 0.0
};

var mode = 'crop';		// crop, delete, blur

var dragInfo = { 
	startX : 0,
	startY : 0,
	mouseX : 0,
	mouseY : 0,
	isDrag : false,
	getLeft: function() {
		if (this.startX > this.mouseX) {
			return this.mouseX;
		}
		return this.startX;
	},
	getTop: function() {
		if (this.startY > this.mouseY) {
			return this.mouseY;
		}
		return this.startY;
	},
	getWidth: function() {
		if (this.startX > this.mouseX) {
			return this.startX - this.mouseX - 3;
		}
		return this.mouseX - this.startX - 3;
	},
	getHeight: function() {
		if (this.startY > this.mouseY) {
			return this.startY - this.mouseY - 3;
		}
		return this.mouseY - this.startY - 3;
	}
};

function getColorFromMode()
{
	if (mode === 'crop') {
		return 'yellow';
	}
	else if (mode === 'delete') {
		return 'red';
	}
	else if (mode === 'blur') {
		return 'cyan';
	}
}

function imageElementReset(e)
{
	e.hide();
	e.removeAttr('width');
	e.removeAttr('height');
}

function pathURLencoding(s)
{
	if (process.platform === 'win32') {
		return encodeURIComponent(s).replace(/%3A/g, ":").replace(/%5C/g, "\\");
	}
	else {
		return encodeURIComponent(s).replace(/%2F/g, "/");
	}
}

function setDisplayRatio(im_elem, w, h)
{
	imageInfo.original_width = w;
	imageInfo.original_height = h;
	if (w >= h && imageInfo.original_width > IMAGE_DISPLAY_WIDTH_MAX) {
		imageInfo.display_ratio = IMAGE_DISPLAY_WIDTH_MAX / imageInfo.original_width;
		im_elem.attr('width', IMAGE_DISPLAY_WIDTH_MAX + 'px');				
	}
	else if (imageInfo.original_height > IMAGE_DISPLAY_HEIGHT_MAX) { 
		imageInfo.display_ratio = IMAGE_DISPLAY_HEIGHT_MAX / imageInfo.original_height;
		im_elem.attr('height', IMAGE_DISPLAY_HEIGHT_MAX + 'px');
	}
	else {
		imageInfo.display_ratio = 1.0;
	}
	$image_ratio.html(parseInt(imageInfo.display_ratio * 100) + '%');
}

function loadImage()
{
	$error_box.hide();
	$statusbar.html('Loading...');
	
	if (imageIndex >= 0 && imageIndex < imageFiles.length)
	{
		imageInfo.original_path = imageFiles[imageIndex];
		
		imageElementReset($current_image);
		
		$current_image.attr('src', 'file://' + pathURLencoding(imageFiles[imageIndex]));
		imageInfo.imageExt = path.extname(imageFiles[imageIndex]);
		imageInfo.imageTitle = path.basename(imageFiles[imageIndex], imageInfo.imageExt);
		
		$current_count.html('' + (imageIndex + 1));
		$image_total.html('' + imageFiles.length);
		
		mode = 'crop';
		$mode_ind.css({'color': getColorFromMode()});
		$mode_ind.html('Crop mode');
		
		
		Jimp.read(imageInfo.original_path).then(function(im) {
			setDisplayRatio($current_image, im.bitmap.width, im.bitmap.height);
			$current_image.show();
			
			workingFilePath = path.join(workingDirectory, imageInfo.imageTitle + '_work.jpg'); 
			im.write(workingFilePath);
			$statusbar.html('Ready');
		}).catch(function(err) {
			$error_box.html('Image loading failed');
			$error_box.show();
		});
	}
}

function init() 
{	
	var localpath = remote.getGlobal('localpath');
	ipcRenderer.send('log', 'localpath from renderer: ' + localpath);
	
	var files = fs.readdirSync(localpath);
	var fullFilePaths = _.map(files, function(fileName) {
		return path.join(localpath, fileName);
	});
	
	imageFiles = _.filter(fullFilePaths, function(file) {
		var extension = path.extname(file);
		if (extension) {
			extension = extension.slice(1);
			extension = extension.toLowerCase();
			return (extension === 'jpg' || extension === 'jpeg' || extension === 'png');
		}		
		return false;
	});
	
	imageIndex = 0;
	loadImage();
	
	// no image dragging
	img_tags.on('dragstart', function(e) { 
		e.preventDefault(); 
	});
}

$image_area.mousedown(function(e) {
	console.log('MouseDown: ' + e.pageX + ', ' + e.pageY);
	dragInfo.isDrag = true;
	dragInfo.startX = e.pageX;
	dragInfo.startY = e.pageY;
	$cropper.css({'left': dragInfo.startX + 'px',
					'top': dragInfo.startY + 'px',
					'width': '0px',
					'height': '0px',
					'border': 'solid 3px ' + getColorFromMode(), 
					'visibility': 'true'});
	$cropper.show();
});

$image_area.mousemove(function(e) {
	if (dragInfo.isDrag) {
		dragInfo.mouseX = e.pageX;
		dragInfo.mouseY = e.pageY;
		$cropper.css({
			'left': dragInfo.getLeft() + 'px',
			'top': dragInfo.getTop() + 'px',
			'width': dragInfo.getWidth() + 'px',
			'height': dragInfo.getHeight() + 'px'
		});
	}
});

$image_area.mouseup(function(e) {
	console.log('MouseUp: ' + e.pageX + ', ' + e.pageY);
	if (dragInfo.isDrag) {
		dragInfo.mouseX = e.pageX;
		dragInfo.mouseY = e.pageY;
		$cropper.css({'visibility': 'false'});
		$cropper.hide();
		dragInfo.isDrag = false;
		
		if (mode === 'crop' && (dragInfo.getWidth() < 20 || dragInfo.getHeight() < 20)) {
			$statusbar.html('Too small area is selected to crop!');
			return;
		}
		
		$statusbar.html('Processing...');
		
		Jimp.read(workingFilePath).then(function(im) {
			console.log('ImageProcess: ' + dragInfo.getLeft() + ', ' + dragInfo.getTop() + ' - ' + 
										$current_image.offset().left + ', ' + $current_image.offset().top);
			var cropx = parseInt((dragInfo.getLeft() - $current_image.offset().left) / imageInfo.display_ratio);
			var cropy = parseInt((dragInfo.getTop() - $current_image.offset().top) / imageInfo.display_ratio);
			var newWidth = parseInt(dragInfo.getWidth() / imageInfo.display_ratio);
			var newHeight = parseInt(dragInfo.getHeight() / imageInfo.display_ratio);
			console.log('ImagePos: ' + cropx + ', ' + cropy + ' : ' + 
							newWidth + ', ' + newHeight);
			
			if (cropx < 0) {
				newWidth += cropx;
				cropx = 0;				
			}
			if (cropy < 0) {
				newHeight += cropy;
				cropy = 0;
			}
			if (cropx + newWidth > imageInfo.original_width) {
				newWidth = imageInfo.original_width - cropx;
			}
			if (cropy + newHeight > imageInfo.original_height) {
				newHeight = imageInfo.original_height - cropy;
			}
			console.log('ImagePosAdjust: ' + cropx + ', ' + cropy + ' : ' + 
										newWidth + ', ' + newHeight);
										
			var new_image, new_im;							
			if (mode === 'crop') {										
				new_im = im.crop(cropx, cropy, newWidth, newHeight);
				console.log('New Crop Image: ' + newWidth + ', ' + newHeight);
				
				// align
				if (IMAGE_ALIGN_WIDTH > 0) {
					newWidth = parseInt((newWidth + IMAGE_ALIGN_WIDTH - 1) / IMAGE_ALIGN_WIDTH) * IMAGE_ALIGN_WIDTH;
				}
				if (IMAGE_ALIGN_HEIGHT > 0) {
					newHeight = parseInt((newHeight + IMAGE_ALIGN_HEIGHT -1) / IMAGE_ALIGN_HEIGHT) * IMAGE_ALIGN_HEIGHT;
				}
				console.log('Align Image: ' + newWidth + ', ' + newHeight);
				
				new_image = new Jimp(newWidth, newHeight, 0xFFFFFFFF);
				new_image.blit(new_im, 0, 0);
			}
			else if (mode === 'delete') {
				new_im = new Jimp(newWidth, newHeight, 0xFFFFFFFF);
				im.blit(new_im, cropx, cropy);
				new_image = im;
			}
			else if (mode === 'blur') {
				new_im = im.clone().crop(cropx, cropy, newWidth, newHeight);
				new_im.blur(settings.Preprocessing.Blur.pixel_range);
				im.blit(new_im, cropx, cropy);
				new_image = im;		
			}
			
			if (new_image) {
				new_image.write(workingFilePath, function() {
						imageElementReset($current_image);
						$current_image.attr('src', 'working/' + imageInfo.imageTitle + '_work.jpg?timestamp=' + new Date().getTime());
						setDisplayRatio($current_image, new_image.bitmap.width, new_image.bitmap.height);
						$current_image.show();	
						$statusbar.html('Ready');				
				});
			}
			else {
				console.log('No new image created for mode=' + mode);
			}
		});		
	}
});

init();

$(window).keydown(function(ev) {
	switch(ev.keyCode) {
	
		case keycode.LeftKey:	// Left
			imageIndex--;
			if (imageIndex < 0) {
				imageIndex = 0;
			}
			console.log('imageIndex: ' + imageIndex);
			loadImage();
			break;
			
		case keycode.UpKey:	// Up
			break;
			
		case keycode.SpaceBar:
		case keycode.RightKey:	// Right
			workingFilePath = path.join(workingDirectory, imageInfo.imageTitle + '_work.jpg');
			if (ev.keyCode !== keycode.SpaceBar) {				
				console.log('Output from ' + workingFilePath);
				fs.rename(workingFilePath, path.join(outputDirectory, imageInfo.imageTitle + '.jpg'));
			}
			else {
				fs.unlink(workingFilePath);
			}
			imageIndex++;
			if (imageIndex >= imageFiles.length) {
				imageIndex = imageFiles.length -1;
			}
			console.log('imageIndex: ' + imageIndex);
			loadImage();
			break;
			
		case keycode.DownKey:	// Down
			break;
			
		case keycode.Dkey:
			mode = 'delete';
			$mode_ind.css({'color': getColorFromMode()});
			$mode_ind.html('Delete mode');			
			break;
			
		case keycode.Bkey:
			mode = 'blur';
			$mode_ind.css({'color': getColorFromMode()});
			$mode_ind.html('Blur mode');			
			break;
			
		case keycode.Rkey:
			loadImage();
			break;
			
		case keycode.Ckey:
			mode = 'crop';
			$mode_ind.css({'color': getColorFromMode()});
			$mode_ind.html('Crop mode');
			break;
			
		default:
			console.log('KeyCode: ' + ev.keyCode);
			break;
	}
});
