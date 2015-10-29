var request = require('request'),
	_ = require('lodash'),
	low = require('lowdb'),
	cheerio = require('cheerio');

var db = low('db.json');	

module.exports = (function(){

	var parseSite = function(url) {
		request(url, function (error, response, body) {			
			if (!error && response.statusCode == 200) {
				var $ = cheerio.load(body);
				var videoData = $('#videoData').html();
				var videos = JSON.parse(videoData).videos;
				
				_.forEach(videos, function(n, key) {
					var itemExist = db('videos').find({ slug: n.slug });
					if(!itemExist || typeof itemExist == 'undefined') {
						request(n.mediaUrl, function (error, response, body) {
							if (!error && response.statusCode == 200) {

								var videoDataArray = body.split('\n');
								_.forEach(videoDataArray, function(line, lineNumber) {
									if(line.indexOf('RESOLUTION=1280x720') > -1) {
										n.videoUrl = videoDataArray[1*lineNumber+1];
										db('videos').push(n);
										db.save();
									}
								});						
							}
						});
					}
				});
			}
		});
	};

	return {
		parseSite: parseSite
	}

})();