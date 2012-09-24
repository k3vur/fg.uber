module.exports.url = "http://informatik.unibas.ch/index.php?id=89";
module.exports.parse = function($, document) {
	var files = [];
	$('.external-link-new-window', document).filter(function(index, link) {
		return (link.innerHTML.indexOf('Screen') !== -1);
	}).each(function(index, link) {
		files.push($(link).attr("href"));
	});
	return $.unique(files);
};
