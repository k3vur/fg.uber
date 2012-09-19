module.exports.url = "http://informatik.unibas.ch/index.php?id=hs12_cs341_slides"
module.exports.parse = function($, document) {
	var files = [];
	$("a.download", document).each(function(index, link){
		files.push("http://informatik.unibas.ch/" + $(link).attr("href"));
	});
	return $.unique(files)
}
