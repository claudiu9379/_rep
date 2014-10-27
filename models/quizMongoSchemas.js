
var mongoose = require("mongoose"), Schema = mongoose.Schema;
module.exports = (function() {

var ratingSchema = new Schema({
	  DomainID     			: Number,
	  UserGuid  			: String,
	  AnswerCount      		: Number,
	  CorrectAnswerCount    : Number,
	  WrongAnswerCount   	: Number
	});

})();