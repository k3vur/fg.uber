module.exports.url = "http://informatik.unibas.ch/fileadmin/Lectures/HS2012/CS321/slides/";
module.exports.parse = function($, document) {
	var files = [];
	$('tr', document).filter(function(index, element) {
		return ($(element).children('th').length === 0);
	}).each(function(index, element) {
		var link = $($(element).find('a').first());
		if (link.attr("href").match(/pdf$/)) {
			files.push(module.exports.url + link.attr("href"));
		}
	});
	return $.unique(files);
};
