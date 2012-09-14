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


String.prototype.last = function() {
	return this.charAt(this.length - 1)
}


uber = function(config) {
	this.dlDir = path.resolve(config.downloadDir);
	this.raidList = config.raidList;
	this.scriptDir = __dirname;
	this.parserDir = path.join(this.scriptDir, "parsers");
}


uber.prototype.mkdirIfNotExists = function(dir) {
	if (!fs.existsSync(path)) {
		console.info("creating directory " + dir);
		mkdirp.sync(dir, 0755);
	}
}


uber.prototype.raid = function() {
	this.mkdirIfNotExists(this.dlDir);
	for (var key in this.raidList) {
		var parser = require(path.join(this.parserDir, this.raidList[key]));
		var sheetDir = path.join(this.dlDir, key);
		this.crawl(sheetDir, parser);
	}
}


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
				if (!self.haveFile(fileURL, sheetDir)) {
					self.download(fileURL, sheetDir);
				}
			}
		});
	});
}


uber.prototype.haveFile = function(fileURL, sheetDir) {
	try {
		fs.lstatSync(this.fileURLToLocalPath(fileURL, localDir));
		return true;
	} catch (e) {
		return false;
	}
}


uber.prototype.fileURLToLocalPath = function(fileURL, localDir) {
	return path.join(localDir, path.basename(fileURL));
}


uber.prototype.download = function(fileURL, sheetDir) {
	console.log("downloading " + fileURL + "to " + this.fileURLToLocalPath(fileURL, sheetDir));
}


app = new uber(require('./config.json'));
console.log(app);
app.raid();
