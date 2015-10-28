process.env.NODE_PATH = __dirname;
require('module').Module._initPaths();

var express = require('express'),
	request = require('request'),
	_ = require('lodash'),
	low = require('lowdb'),
	xml2js = require('xml2js'),
	schedule = require('node-schedule'),
	cheerio = require('cheerio');

var app = express()
var db = low('db.json');

var site = "http://comediansincarsgettingcoffee.com/";

var rule = new schedule.RecurrenceRule();
rule.hour = 0;
rule.minute = 10;

var j = schedule.scheduleJob(rule, function() {
	request(site, function (error, response, body) {			
		if (!error && response.statusCode == 200) {
			var $ = cheerio.load(body);
			var videoData = $('#videoData').html();
			var videos = JSON.parse(videoData).videos;
			
			_.forEach(videos, function(n, key) {
				var itemExist = db('videos').find({ slug: n.slug });

				if(!itemExist) {
					request(n.mediaUrl, function (error, response, body) {
						if (!error && response.statusCode == 200) {

							var videoDataArray = body.split('\n');
							_.forEach(videoDataArray, function(line, lineNumber) {
								if(line.indexOf('RESOLUTION=1280x720') > -1) {
									n.videoUrl = videoDataArray[1*lineNumber+1];
									db('videos').push(n);
								}
							});						
						}
					});
				}
			});
		}
	});
});

app.get('/', function(req, res) {
	var result = db('videos')
				.chain()
				.sortByOrder(['season', 'episode'], ['asc', 'asc'])
				.value();
	res.send(result);
});

app.get('/season/:season', function(req, res) {
	var season = req.params.season;

	console.log("Looking for season " + season);

	var result = db('videos')
				.chain()				
				.where({'season': season})
				.sortByOrder(['season', 'episode'], ['asc', 'asc'])
				.value();

	res.send(result);
});

var server = app.listen(3000, function() {
	var port = server.address().port;
	console.log('Application listening at port %s', port);
});