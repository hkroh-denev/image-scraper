

# ImageScraper

scraping images using Google API, Naver API then manual cropping and some preprocessing


## Install

* Installing [NodeJS](https://nodejs.org/en/)

```sh
git clone http://github.com/hkroh-denev/image-scraper.git
cd image-scraper
npm install
```

## Usage

using follow command on 'image-scraper' directory

```sh
npm start
```

You should get the API key from Google or Naver (South Korean) and put it the the config folder.

Keyboard command:

* Right Arrow: Save current image and load next image
* Left Arrow: Load previous original (not processed) image
* Space Bar or Down Arrow: Skip current image (not copying to output directory), and load next image
* D Key: Delete mode, filling with white pixel in dragging area
* B Key: Blur mode, applying blur in dragging area
* C Key: Crop mode, crop and set working image in dragging area (default mode)
* R Key: Reload, canceling the processing and load original image

Important Directories:

* ./app/download: For downloaded files
* ./app/output: For processed files (cropped, etc)

### Frameworks & Tools
This is by standing on the shoulders of these awesome projects.
* [Electron](https://github.com/electron/electron)
* [Jimp](https://github.com/oliver-moran/jimp)  

### License

MIT License