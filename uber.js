#!/usr/bin/env node

/**
 * UBER - The University of Basel Exercise Raider
 *
 * Author: Kevin Urban
 */

fs = require('fs');
mkdirp = require('mkdirp');
path = require('path');

String.prototype.last = function() {
	return this.charAt(this.length - 1)
}

uber = function(config) {
	this.dlDir = path.resolve(config.downloadDir);
	this.crawlList = config.crawlList;
}

uber.prototype.mkdirIfNotExists = function(path) {
	console.log(path);
	if (!fs.existsSync(path)) {
		mkdirp.sync(path, 0755);
	}
}

uber.prototype.crawl = function(crawlList) {
	for (var key in crawlList) {
		var val = crawlList[key];
		this.process(key, val);
	}
}

uber.prototype.process = function(dir, script) {
	path = path.join(this.dlDir + dir);
	this.mkdirIfNotExists(path);
}

uber.prototype.run = function() {
	this.mkdirIfNotExists(this.dlDir);
	this.crawl(this.crawlList);
}

new uber(require("./config.json")).run();
