#!/usr/bin/env node

/**
 * UBER - The University of Basel Exercise Raider
 *
 * Author: Kevin Urban
 */


var FS = require('fs');
var MkdirP = require('mkdirp');
var Path = require('path');
var jQuery = require('jquery');
var Request = require('request');
var JSDom = require('jsdom');
var RSS = require('rss');
var FeedParser = require('feedparser');


// Make string more useful
String.prototype.last = function() {
	return this.charAt(this.length - 1);
};


/**
 * uber contains four properties:
 * * dlDir is the base directory where things are downloaded to
 * * raidList is the object of subdir / parser pairs
 * * scriptDir is the path where this script resides in
 * * parserDir is the directory that contains the parsers
 */
uber = function(config) {
	this.dlDir = Path.resolve(config.downloadDir);
	this.raidList = config.raidList;
	this.scriptDir = __dirname;
	this.parserDir = Path.join(this.scriptDir, "parsers");
};


/**
 * Creates a directory if it doesn't exist yet, including sub directories
 */
uber.prototype.mkdirIfNotExists = function(dir) {
	if (!FS.existsSync(dir)) {
		console.info("creating directory " + dir);
		MkdirP.sync(dir, 0755);
	}
};


/**
 * This is where the magic happens
 */
uber.prototype.raid = function() {
	this.mkdirIfNotExists(this.dlDir);
	for (var key in this.raidList) {
		var parser = require(Path.join(this.parserDir, this.raidList[key]));
		var sheetDir = Path.join(this.dlDir, key);
		this.crawl(sheetDir, parser);
	}
};


/**
 * uses the parser to find and download files to given directory
 */
uber.prototype.crawl = function(sheetDir, parser) {
	console.log("raiding " + parser.url + " for " + sheetDir + "...");
	this.mkdirIfNotExists(sheetDir);
	var self = this;
	Request(parser.url, function(reqErrors, response, body) {
		if (response.statusCode != 200) {
			console.error("could not access " + parser.url);
			return;
		}
		JSDom.env(body, function(domErrors, window) {
			var files = parser.parse(jQuery, window.document);
			for (var index in files) {
				var fileURL = files[index];
				if (!FS.existsSync(self.fileURLToLocalPath(fileURL, sheetDir))) {
					self.download(fileURL, sheetDir);
				}
			}
		});
	});
};


/**
 * converts a fileURL to the local filesystem equivalent residing in localDir
 */
uber.prototype.fileURLToLocalPath = function(fileURL, localDir) {
	return Path.join(localDir, Path.basename(fileURL));
};


/**
 * download fileURL to given directory
 */
uber.prototype.download = function(fileURL, sheetDir) {
	var localFilePath = this.fileURLToLocalPath(fileURL, sheetDir);
	console.log("downloading " + fileURL + " to " + localFilePath);

	var fileStream = FS.createWriteStream(localFilePath, {mode: 0644});
	fileStream.on('close', function() {
		console.log("finished downloading " + Path.basename(localFilePath));
	});

	try {
		Request.get(fileURL).pipe(fileStream);
	} catch (e) {
		console.error("Could not download " + fileURL + " (" + e + ")");
	}
};


RSSGenerator = function() {
	this.items = [];
};


RSSGenerator.prototype.parseExisting = function() {
	if (!FS.existsSync(this.rssFilePath)) {
		return null;
	}

	var parser = new FeedParser();
	parser.parseFile(this.rssFilePath);
	// TODO add existing items to this.items
};


RSSGenerator.prototype.addItem = function(containingDir, fileName, url, date) {
	this.items.push({
		containingDir: containingDir,
		fileName: fileName,
		url: url,
		date: (date ? date : new Date())
	});
};


RSSGenerator.prototype.generate = function(rssConfig) {
	var rss = new RSS({
		title: rssConfig.title ? rssConfig.title : "fg.Uber",
		author: rssConfig.author ? rssConfig.author : "fg.Uber",
		icon: rssConfig.icon ? rssConfig.icon : null
	});
	for (var index in this.items) {
		var item = this.items[index];
		rss.item({
			title: item.fileName,
			description: (item.fileName + " has been downloaded to " + item.containingDir + " from " + item.url),
			url: "file://" + Path.join(item.containingDir, item.fileName),
			date: item.date
		});
	}

	return rss.xml();
};


var config = require('./config.json');
//new uber(config).raid();
var gen = new RSSGenerator();
gen.addItem('/Users/kevin/Dropbox/Uni/Semester 7/Distributed/Skript/', '00-CS341-HS12-Organisation.pdf', 'http://informatik.unibas.ch/fileadmin/Lectures/HS2012/CS341/slides/00-CS341-HS12-Organisation.pdf');
console.log(gen.generate(config.rss));
