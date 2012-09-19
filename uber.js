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


// check for empty objects
function isEmpty(obj) {
	return (Object.keys(obj).length === 0);
}


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
uber.prototype.raid = function(callback) {
	this.mkdirIfNotExists(this.dlDir);
	var crawling = {};
	var addedAll = false;
	var allFiles = [];
	for (var key in this.raidList) {
		var parser = require(Path.join(this.parserDir, this.raidList[key]));
		var sheetDir = Path.join(this.dlDir, key);
		crawling[sheetDir] = true;
		this.crawl(sheetDir, parser, function(files) {
			delete crawling[sheetDir];
			console.log("finished raiding " + sheetDir);
			allFiles = allFiles.concat(files);
			if (addedAll && callback && isEmpty(crawling)) {
				callback(allFiles);
			}
		});
	}
	addedAll = true;
};


/**
 * uses the parser to find and download files to given directory
 */
uber.prototype.crawl = function(sheetDir, parser, callback) {
	console.log("raiding " + parser.url + " for " + sheetDir + "...");
	this.mkdirIfNotExists(sheetDir);
	var self = this;

	var domParsingCallback = function(domErrors, window) {
		var downloading = {};
		var addedAll = false;
		var files = parser.parse(jQuery, window.document);
		var callbackResult = [];
		for (var index in files) {
			var fileURL = files[index];
			if (FS.existsSync(self.fileURLToLocalPath(fileURL, sheetDir))) {
				continue;
			}

			downloading[fileURL] = true;
			self.download(fileURL, sheetDir, function(localFile) {
				callbackResult.push({
					url: fileURL,
					localFile: localFile
				});
				delete downloading[fileURL];
				console.log("finished downloading " + localFile);

				if (callback && addedAll && isEmpty(downloading)) {
					callback(callbackResult);
				}
			});
		}
		addedAll = true;
	};

	Request(parser.url, function(reqErrors, response, body) {
		if (response.statusCode != 200) {
			console.error("could not access " + parser.url);
			return;
		}
		JSDom.env(body, domParsingCallback);
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
uber.prototype.download = function(fileURL, sheetDir, callback) {
	var localFilePath = this.fileURLToLocalPath(fileURL, sheetDir);
	console.log("downloading " + fileURL + " to " + localFilePath);

	var fileStream = FS.createWriteStream(localFilePath, {mode: 0644});
	fileStream.on('close', function() {
		if (callback) {
			callback(localFilePath);
		}
	});

	try {
		Request.get(fileURL).pipe(fileStream);
		this.downloading[localFilePath] = true;
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
var gen = new RSSGenerator();
new uber(config).raid(function(files) {
	for (var index in files) {
		var item = files[index];
		var containingDir = Path.dirname(item.localFile);
		var fileName = Path.basename(item.localFile);
		var url = item.url;
		gen.addItem(containingDir, fileName, url);
	}

	FS.writeFile(config.rss.path, gen.generate(config.rss), function(errors) {
		console.log("wrote RSS feed to " + config.rss.path);
	});
});
