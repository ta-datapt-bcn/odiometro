/** APP **/
// Node app

// ROOT PATH
var path = require('path');
global.appRoot = path.resolve(__dirname);

// Initialize express
var express = require('express'),
	app = express();

var port = process.env.PORT || 8000;

// Libs
var database = require("./app/lib/database.js");
var twitterStream = require("./app/lib/twitterStream.js");

// Models
var Tweet = require("./app/models/Tweet.js");

// Initialize a new socket.io object. It is bound to 
// the express app, which allows them to coexist.
var io = require('socket.io').listen(app.listen(port));

// Require the configuration and the routes files, and pass
// the app and io as arguments to the returned functions.
require('./config')(app, io);
require('./routes')(app, io);

// Logging
console.log('Your application is running on http://localhost:' + port);

// When socket connection
io.on('connection', function (socket) {
	console.log('New user connected');
});

// Twitter Stream
twitterStream.on('tweet', function (tweet) {

	// FILTER: If it's not a hate tweet, we ignore it
	if (!Tweet.isItAHateTweet(tweet)) return;

	// FILTER: Is it a retweet?
	if (Tweet.isItARetweet(tweet)) {
		console.log('retweet');
		database.insertRetweetToDatabase(tweet);
	} else {
		console.log(tweet.text);
		database.insertTweetToDatabase(tweet);
		io.sockets.emit('tweet', tweet.text);
	}

});

// Number Tweets
var frequencyOfUpdateNumberTweets = 500;
setInterval(function() {

	database.getNumberOfTweetsInLastMinute(function(number_tweets) {
		var data = {
			number_tweets: number_tweets
		};
		io.sockets.emit('number_tweets', data);
	});

}, frequencyOfUpdateNumberTweets);