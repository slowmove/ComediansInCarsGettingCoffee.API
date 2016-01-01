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
				var text = $($('script')).text();
				var findAndClean = findTextAndReturnRemainder(text, "window.app =");
				var result = JSON.parse(findAndClean);
				var videoData = result.videoData;				
				var videos = videoData.videos;
				
				_.forEach(videos, function(n, key) {
					var itemExist = db('videos').find({ slug: n.slug });
					if(!itemExist || typeof itemExist == 'undefined') {
						request(n.mediaUrl, function (error, response, body) {
							if (!error && response.statusCode == 200) {

								var videoDataArray = body.split('\n');
								_.forEach(videoDataArray, function(line, lineNumber) {
									if(line.indexOf('RESOLUTION=1280x720') > -1) {										
										n.videoUrl = videoDataArray[1*lineNumber+1];
										console.log(n.videoUrl);
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

	var findTextAndReturnRemainder = function(target, variable){
	    var chopFront = target.substring(target.search(variable)+variable.length,target.length);
	    var result = chopFront.substring(0,chopFront.search(";"));
	    return result;
	};

	return {
		parseSite: parseSite
	}

})();