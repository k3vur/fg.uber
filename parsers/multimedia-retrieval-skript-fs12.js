module.exports.url = "http://informatik.unibas.ch/index.php?id=98";
module.exports.parse = function($, document) {
	var files = [];
	$('.download', document).each(function(index, element) {
		files.push("http://informatik.unibas.ch/" + $(element).attr("href"));
	});
	return $.unique(files);
};
