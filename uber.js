#!/usr/bin/env node

/**
 * UBER - The University of Basel Exercise Raider
 *
 * Author: Kevin Urban
 */


var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var jQuery = require('jquery');
var request = require('request');
var jsdom = require('jsdom');


// Make string more useful
String.prototype.last = function() {
	return this.charAt(this.length - 1)
}


/**
 * uber contains four properties:
 * * dlDir is the base directory where things are downloaded to
 * * raidList is the object of subdir / parser pairs
 * * scriptDir is the path where this script resides in
 * * parserDir is the directory that contains the parsers
 */
uber = function(config) {
	this.dlDir = path.resolve(config.downloadDir);
	this.raidList = config.raidList;
	this.scriptDir = __dirname;
	this.parserDir = path.join(this.scriptDir, "parsers");
}


/**
 * Creates a directory if it doesn't exist yet, including sub directories
 */
uber.prototype.mkdirIfNotExists = function(dir) {
	if (!fs.existsSync(dir)) {
		console.info("creating directory " + dir);
		mkdirp.sync(dir, 0755);
	}
}


/**
 * This is where the magic happens
 */
uber.prototype.raid = function() {
	this.mkdirIfNotExists(this.dlDir);
	for (var key in this.raidList) {
		var parser = require(path.join(this.parserDir, this.raidList[key]));
		var sheetDir = path.join(this.dlDir, key);
		this.crawl(sheetDir, parser);
	}
}


/**
 * uses the parser to find and download files to given directory
 */
uber.prototype.crawl = function(sheetDir, parser) {
	console.log("raiding " + parser.url + " for " + sheetDir + "...");
	this.mkdirIfNotExists(sheetDir);
	var self = this;
	request(parser.url, function(reqErrors, response, body) {
		if (response.statusCode != 200) {
			console.error("could not access " + parser.url);
			return;
		}
		jsdom.env(body, function(domErrors, window) {
			var files = parser.parse(jQuery, window.document);
			for (var index in files) {
				var fileURL = files[index];
				if (!fs.existsSync(self.fileURLToLocalPath(fileURL, sheetDir))) {
					self.download(fileURL, sheetDir);
				}
			}
		});
	});
}


/**
 * converts a fileURL to the local filesystem equivalent residing in localDir
 */
uber.prototype.fileURLToLocalPath = function(fileURL, localDir) {
	return path.join(localDir, path.basename(fileURL));
}


/**
 * download fileURL to given directory
 */
uber.prototype.download = function(fileURL, sheetDir) {
	var localFilePath = this.fileURLToLocalPath(fileURL, sheetDir);
	console.log("downloading " + fileURL + " to " + localFilePath);

	var fileStream = fs.createWriteStream(localFilePath, {mode: 0644});
	fileStream.on('close', function() {
		console.log("finished downloading " + path.basename(localFilePath));
	});

	try {
		request.get(fileURL).pipe(fileStream);
	} catch (e) {
		console.error("Could not download " + fileURL + " (" + e + ")");
	}
}


var config = require('./config.json');
new uber(config).raid();
