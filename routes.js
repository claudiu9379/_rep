// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /chat/:id
// and listens for socket.io messages.

// Use the gravatar module, to turn email addresses into avatar images:

var gravatar = require('gravatar');
var sql = require('mssql');
var edge = require('edge');
var XXX = require("./questionAnswer.js");
var uuid = require('node-uuid');
var _und = require("underscore");
var mongoose = require("mongoose"), Schema = mongoose.Schema;

var url = require("url");
//var qMongoSchemas = require("./models/quizMongoSchemas.js");



var getRandomQuizQuestions = edge.func({
    assemblyFile: 'Repository.dll',
    typeName: 'Repository.ColectareIntrebariRepository',
    methodName: 'GetRandomQuizQuestionsAsync'
});

var sqlConfig = {
    server:"192.168.0.1\\sqlClaudiu",
    user: 'sa',
    password: 'tarantula',
    database: 'KIN_Users',
    port:445
    
};

var QuizRoomStatus=
{
	NotStarted: 0,
    SendNextQuestion : 1,
    SendAnswers : 2,
    PreparingQuestions : 3,
    Ended:4
};

// Export a function, so that we can pass 
// the app and io instances from the app.js file:

module.exports = function(app,io){

	app.get('/', function(req, res){
		console.log("ddd");
		// Render views/home.html
		res.render('test');
	});
	
	var ratingAsJson = {
	  DomainID     			: Number,
	  DomainGuid     		: String,
	  UserGuid  			: String,
	  AnswerCount      		: Number,
	  CorrectAnswerCount    : Number,
	  WrongAnswerCount   	: Number,
	  IsNew					: Boolean
	};

	var ratingSchema = new Schema(ratingAsJson);
	var userAsJson = {
	  ID     	: Number,
	  UserGuid  : String,
	  Name      : String,
	  ImgUrl    : String,
	  IsGuest   : Boolean,
	  LanguageID: Number
	};

	var userSchema = new Schema(userAsJson);
	
	var answerSchema = new Schema({
	  AnswerGuid 	:String,
	  Answer 	 	:String,
	  IsCorrect 	:Boolean,
	  Score 		:Number,
	  User 			:[userSchema]
	});

	var questionSchema = Schema({
	  	QuestionIndex:Number,
	  	QuestionGuid :String,
	  	Definition:String,
	  	ImgUrl:String,
	  	QuestionAnswers     : [answerSchema]
	});

	var quizSchema1 = Schema({
  		DomainID     : Number,
	  	DomainGuid   : String,
	  	RoomGuid     : String,
  		StartDate    : Date,
	  	Questions    :[questionSchema]
	});

	
	var RatingModel = mongoose.model("Rating",ratingSchema);
	var UserModel = mongoose.model("Users",userSchema); 
	var AnswerModel = mongoose.model('Answers', answerSchema);
	var QuestionModel = mongoose.model('Question', questionSchema);
	var QuizModel = mongoose.model('QuizData', quizSchema1);


//console.log(answerSchema);
//var answerSchema = new mongoose.Schema(AnswerModel);



var  uristring = "mongodb://localhost:27017/dbName";
mongoose.connect(uristring, function (err, res) {
  if (err) { 
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + uristring);

    //var ans = {DomainID:8};
    //var q = new QuizModel({DomainID:1});
    //q.QuestionAnswers.push(ans);

    // Saving it to the database.  
	//q.save(function (err) {if (err) console.log ('Error on save!')});

	/*var collection = mongoose.model('QuizRoomSchema');
	if(collection != undefined)
	{
		console.log ('saved info: ' + JSON.stringify(collection));	
	}else
	{
		console.write("collection is undefined");
	}*/
  }
});





//http://localhost:8000/user?Name=Doe
    app.get('/quiz', function(req, res){
		var urlQuery = require('url').parse(req.url,true).query;

		//var query = QuizModel.find({});
      	//query.exec(function(err, result) {
		//	res.end(JSON.stringify(result));
		//});

		var query = QuizModel.find({});
      	query.exec(function(err, result) {
			res.end(JSON.stringify(result));
		});
	});
	app.get('/user', function(req, res){
		var urlQuery = require('url').parse(req.url,true).query;

		//var query = QuizModel.find({});
      	//query.exec(function(err, result) {
		//	res.end(JSON.stringify(result));
		//});

		var query = UserModel.find({});
      	query.exec(function(err, result) {
			res.end(JSON.stringify(result));
		});
	});
	app.get('/rating', function(req, res){
		var urlQuery = require('url').parse(req.url,true).query;

		//var query = QuizModel.find({});
      	//query.exec(function(err, result) {
		//	res.end(JSON.stringify(result));
		//});

		var query = RatingModel.find({});
      	query.exec(function(err, result) {
			res.end(JSON.stringify(result));
		});
	});

	app.get('/rating_del', function(req, res){
		var urlQuery = require('url').parse(req.url,true).query;

		//var query = QuizModel.find({});
      	//query.exec(function(err, result) {
		//	res.end(JSON.stringify(result));
		//});

		var query = RatingModel.remove({});
      	query.exec(function(err, result) {
		});

		var query = RatingModel.find({});
      	query.exec(function(err, result) {
			res.end(JSON.stringify(result));
		});
	});




	var quizRooms = {};
	var tokens={};
	var allUsersCount = 0;

	console.log("start 1");



	var chat = io.sockets.on('connection', function (socket) {

		console.log("start");
		


		function updateRatingForUsers(ratings)
		{
			console.log("updateRatingForUsers " +JSON.stringify(ratings));
			var rating = null;
			for(var i=0;i<ratings.length;i++)
			{
				rating = ratings[i];

				var query = RatingModel.find(
				{
					DomainID:rating.DomainID,
					UserGuid:rating.UserGuid
				});
											
				query.exec(function(err, result) 
				{
					if(err != null)
					{
						console.log("error writing user rating");
						return;
					}

					console.log("memory rating :" +JSON.stringify(rating));

					if(result.length ==1)
					{
						var dbRating = result[0];

						
						var userRating = {
									  DomainID     			: dbRating.DomainID,
									  DomainGuid     		: dbRating.DomainGuid,
									  UserGuid  			: dbRating.UserGuid,
									  AnswerCount      		: rating.AnswerCount,
									  CorrectAnswerCount    : rating.CorrectAnswerCount,
									  WrongAnswerCount   	: rating.WrongAnswerCount,
									  IsNew					: false

									};

						
						var updateRatingQuery = RatingModel.update
						(
							{
								DomainID:dbRating.DomainID,
								UserGuid:dbRating.UserGuid
							},
							userRating,
							{ upsert: true }
						);
						updateRatingQuery.exec(function(err, result) {
							if(err != null)
							{
								console.log(" error on updating rating " + err);
							}
						});


					}
					else
					{
						var ratingModel = new RatingModel(rating);
														    // Saving it to the database.  
						ratingModel.save(function (err) 
						{
							if (err)
								{ 
									console.log ('Error on save!')
								}
							else
								{
									console.log ('SAVEDDDDDDDDDDDDDDD rating to db!')
								}
						});
					}
				});
			}							
		}

		function saveQuizAnswersToDB(quizRoomToken)
		{
			var mongoQuizData = 
			{
				DomainID:quizRooms[quizRoomToken].domainRoom.domain.ID,
				DomainGuid:quizRooms[quizRoomToken].domainRoom.domain.Guid,
				RoomGuid:quizRooms[quizRoomToken].domainRoom.RoomGuid,
				StartDate:quizRooms[quizRoomToken].startDate,
				Questions:[]
			};
			
			quizRooms[quizRoomToken].quiz.questions.forEach(function(qq) 
			{
				var q = 
				{
					QuestionIndex:qq.QuestionIndex,
					QuestionGuid :qq.QuestionGuid,
					Definition:qq.Definition,
					ImgUrl:qq.ImgUrl,
					QuestionAnswers:[]
				};
			
				var qAnswers =  _und.filter(quizRooms[quizRoomToken].quiz.answers, function(v){ return v.QuestionGuid==q.QuestionGuid; });
				qAnswers.forEach(function(qAns) 
				{
					var ans = 
						{
							AnswerGuid:qAns.AnswerGuid,
							Answer:qAns.Answer,
							IsCorrect:qAns.IsCorrect,
							Score:qAns.Score
						};

						q.QuestionAnswers.push(ans);
				});

				mongoQuizData.Questions.push(q);
			});

			var mongoQuizModel = new QuizModel(mongoQuizData);
			
			mongoQuizModel.save(function (err) 
			{
				if (err)
					{ 
						console.log ('Error on save!')
					}
					else
					{
						console.log ('saveQuizAnswersToDB went ok!')
					}
			});
		}


		function questionTimerFunction(quizRoomToken)
					{
						console.log("");
						console.log("");
						console.log("");
						console.log("");
						console.log("");
						console.log("");
						console.log("question timer ##############################################################" + new Date() + quizRoomToken );

							switch(quizRooms[quizRoomToken].quiz.status)
							{
								case QuizRoomStatus.SendNextQuestion://send the next question
								{
									
									quizRooms[quizRoomToken].quiz.index ++;
									
									if(quizRooms[quizRoomToken].quiz.index == quizRooms[quizRoomToken].quiz.noOfQuestions)
									{
										console.log("1.0 ");	

										
										quizRooms[quizRoomToken].quiz.status = QuizRoomStatus.Ended;
										quizRooms[quizRoomToken].quiz.questions =[];
										quizRooms[quizRoomToken].quiz.question=null;
										quizRooms[quizRoomToken].quiz.index=-1;
										quizRooms[quizRoomToken].quiz.answers=[];
										quizRooms[quizRoomToken].quiz.quizStatList=[];

										var msg=
										{
											dr:quizRooms[quizRoomToken].domainRoom,
											ratings:quizRooms[quizRoomToken].quiz.ratings,
											secconds:20
										};
										io.sockets.in(quizRoomToken).emit('onQuizHasEnded', msg);

										updateRatingForUsers(quizRooms[quizRoomToken].quiz.ratings);
										
										saveQuizAnswersToDB(quizRoomToken);
										//wait 20 secconds after the quiz has ended
										quizRooms[quizRoomToken].roomTimer= setTimeout(roomTimerFunction, 20*1000,quizRoomToken );
										

									 	return;	
									}

									quizRooms[quizRoomToken].quiz.question = quizRooms[quizRoomToken].quiz.questions[quizRooms[quizRoomToken].quiz.index];

									var msg = 
									{
										question : quizRooms[quizRoomToken].quiz.question
									};
									
									io.sockets.in(quizRoomToken).emit('onReceiveQuizQuestion', msg);
									quizRooms[quizRoomToken].quiz.status = QuizRoomStatus.SendAnswers;//prepare to receive answers
									
									
									quizRooms[quizRoomToken].questionTimer = setTimeout(questionTimerFunction, quizRooms[quizRoomToken].questionTimerInterval,quizRoomToken );
									
									break;
								}
								case QuizRoomStatus.SendAnswers://must send the answers back to the players
								{
									console.log("++++++++++++++++++++++++++++ QuizRoomStatus.SendAnswer " + new Date() );

									var msg = new XXX.QuestionUsersAnswers();
									msg.DomainID = quizRooms[quizRoomToken].domainRoom.domain.ID;
									msg.DomainGuid = quizRooms[quizRoomToken].domainRoom.domain.Guid;
									msg.RoomGuid = quizRooms[quizRoomToken].domainRoom.RoomGuid;

									msg.UserAnswers = quizRooms[quizRoomToken].quiz.lastAnswers;
									msg.CorrectAnswerGuid = quizRooms[quizRoomToken].quiz.question.GetCorrectAnswerGuid();

									console.log("answers count " + quizRooms[quizRoomToken].quiz.lastAnswers.length);
									
									var correctAnswers = _und.filter(quizRooms[quizRoomToken].quiz.lastAnswers, function(v){ return v.IsCorrect==true; }); 
									console.log("correctAnswers = " + JSON.stringify(correctAnswers));
									if(correctAnswers != undefined)
									{
										msg.CorrectResponseCount =correctAnswers.length;	
									}

									msg.ResponseCount = quizRooms[quizRoomToken].quiz.lastAnswers.length;
									msg.WrongResponseCount =msg.ResponseCount - msg.CorrectResponseCount;
										
										console.log("MSG 1 = " + JSON.stringify(msg));
									quizRooms[quizRoomToken].quiz.lastAnswers.forEach(function(ans) {
										quizRooms[quizRoomToken].quiz.answers.push(ans);
									});

									quizRooms[quizRoomToken].quiz.lastAnswers=[];

									var allGoodAnswers = _und.filter(quizRooms[quizRoomToken].quiz.answers, function(v){ return v.IsCorrect==true; });
									console.log("all good answers " + allGoodAnswers.length);
									
									var tempPodium = [];
									//http://jsfiddle.net/R3p4c/2/
									allGoodAnswers.forEach(function(ans) {
						                 var existingObj = _und.find(tempPodium,function(o){return o.UserGuid === ans.UserGuid; });
	    
									    if(existingObj == undefined) {
									        existingObj = 
									        {
									        	UserGuid:ans.UserGuid,
									        	CorrectAnswerCount:1
									        };
									        tempPodium.push(existingObj);
									    } else {
									        existingObj.CorrectAnswerCount++;
									    }
									});

									tempPodium = _und.sortBy(tempPodium, function(num){ return Math.sin(num); });

									//var groupedAnswers = _und.groupBy(allGoodAnswers, function(ans){ return ans.UserGuid; });
									//console.log(groupedAnswers);


									var podiumList = [];
									var pos =0;
									var lastPointsValue = -1;
									var pp=null;
									tempPodium.forEach(function(podium) {
										var changed = false;
										if(lastPointsValue == -1)
										{
											lastPointsValue = podium.CorrectAnswerCount;
											pos=1;
											changed=true;
										}else
										{
											if(podium.CorrectAnswerCount<lastPointsValue)
											{
												pos++;
												changed = true;
											}
										}
										//PositionCount = _.filter(tempPodium, function(num){ return numCorrectAnswerCount == podium.CorrectAnswerCount;}).length,
						                if(changed)
						                {
							                 pp = new XXX.PodiumPosition();
							                
							                 pp.Position =pos;
							                 pp.PositionCount = 1;
							                 pp.Score = podium.CorrectAnswerCount;
							                 pp.ConnectionIds =[]; 
							                
							                pp.ConnectionIds.push(podium.UserGuid);
							                podiumList.push(pp);
										}else
										{
											pp.PositionCount++;
											pp.ConnectionIds.push(podium.UserGuid);
										}
									});
									msg.PodiumPositionList=podiumList;

									quizRooms[quizRoomToken].quiz.quizStatList.forEach(function(qs) {
									
										msg.QuizStatList.push(qs);
									});

									io.sockets.in(quizRoomToken).emit('onReceiveQuizQuestionAnswer', msg);

									console.log(quizRooms[quizRoomToken].questionTimerAnswerInterval + ":2222222222222222222222222222222222222222222222222222222222222222222222");
									quizRooms[quizRoomToken].questionTimer =  setTimeout(questionTimerFunction,quizRooms[quizRoomToken].questionTimerAnswerInterval,quizRoomToken);


									quizRooms[quizRoomToken].quiz.status = QuizRoomStatus.SendNextQuestion;//send next question
									break;
								}
							}
			       			io.sockets.in(quizRoomToken).emit('onReceiveQuizQuestions', msg);
					}         

		

		

		

		function roomTimerFunction(quizRoomToken)
			{
					console.log("room timer " + new Date() + quizRoomToken + " . ");	

					quizRooms[quizRoomToken].quiz.status = QuizRoomStatus.PreparingQuestions;
					quizRooms[quizRoomToken].quiz.index =-1;
					quizRooms[quizRoomToken].startDate =new Date();
					
					var reqData =
					{
						//domains:quizRooms[quizRoomToken].domainRoom.domain.SubDomains,
						 domains:quizRooms[quizRoomToken].domainRoom.domain.SubDomains,
						noOfQuestions:5,
						sqlConnectionString:"data source=.\\sqlClaudiu;initial catalog=kin_users;connect timeout=60;user id=sa;password=tarantula"
					};


					
					console.log("u1 " + quizRooms[quizRoomToken].players.length);
					var loggedUserGuids=[];

					for(var i=0;i<quizRooms[quizRoomToken].players.length;i++)
					{
						var user = quizRooms[quizRoomToken].players[i].user;
						if(user.IsGuest)
						{
							console.log("user is guest");
						}
						else
						{
							loggedUserGuids.push(user.UserGuid);							
						}
					}

					console.log("getRatingsForLoggedUsersFromMongoDB 1 "+JSON.stringify(loggedUserGuids));
					var ratings=[];

					var query = RatingModel.find({DomainID:quizRooms[quizRoomToken].domainRoom.domain.ID,UserGuid: {$all:loggedUserGuids} });
      				query.exec(function(err, result) {
							if(err)
							{
								console.log("Error getting rating");
								return;
							}

							for (var i = 0; i < loggedUserGuids.length; i++) {
								var currentGuid = loggedUserGuids[i];

								var dbRating = _und.find(result,function(o){return o.UserGuid === currentGuid; });

								if(dbRating == undefined)
								{
									var userRating = {
									  DomainID     			: quizRooms[quizRoomToken].domainRoom.domain.ID,
									  DomainGuid     		: quizRooms[quizRoomToken].domainRoom.domain.DomainGuid,
									  UserGuid  			: currentGuid,
									  AnswerCount      		: 0,
									  CorrectAnswerCount    : 0,
									  WrongAnswerCount   	: 0,
									  IsNew					: true

									};

									ratings.push(userRating);
								}else
								{
									dbRating.IsNew = false;
									ratings.push(dbRating);
								}
							};
								console.log("rating is " + JSON.stringify(ratings));
								
							quizRooms[quizRoomToken].quiz.ratings=ratings;
							io.sockets.in(quizRoomToken).emit('onReceiveRatings', ratings);

							console.log("asyncGetRandomQuizQuestions 2");

							getRandomQuizQuestions(reqData, function (error, result) {
						        if (error) { console.log(" errorr getting quiz questions   " + error); return; }
						        if (result == null || result.length==0) {return;}

						        console.log("asyncProcessQuizQuestionsGetFromMongo 3");
							var qIndex = -1;
							result.forEach(function(dbQuestion) {
					            	qIndex++;

					            	var question = new XXX.QuizQuestion
					            	(
					            		quizRooms[quizRoomToken].domainRoom.domain.ID,
					            		quizRooms[quizRoomToken].domainRoom.domain.DomainGuid,
					            		quizRooms[quizRoomToken].domainRoom.RoomGuid,
					            		qIndex,
					            		dbQuestion.QuestionGuid,
					            		dbQuestion.Definition,
					            		dbQuestion.DefinitionImageUrl
					            	);
					            	var correctAnswerGuid = uuid.v1();
					            	question.SetCorrectAnswerGuid(correctAnswerGuid);
					            	
					            	var answerList=[];
					                var answer = new XXX.QuestionAnswer
					                (
					                	quizRooms[quizRoomToken].domainRoom.domain.ID,
					            		quizRooms[quizRoomToken].domainRoom.domain.DomainGuid,
					            		quizRooms[quizRoomToken].domainRoom.RoomGuid,
					            		dbQuestion.QuestionGuid,
					            		correctAnswerGuid,
					            		dbQuestion.CorrectAnswer
					                );
					                answerList.push(answer);
					                
					                answer = new XXX.QuestionAnswer
					                (
					                	quizRooms[quizRoomToken].domainRoom.domain.ID,
					            		quizRooms[quizRoomToken].domainRoom.domain.DomainGuid,
					            		quizRooms[quizRoomToken].domainRoom.RoomGuid,
					            		dbQuestion.QuestionGuid,
					            		uuid.v1(),
					            		dbQuestion.WrongAnswer1
					                );
					                answerList.push(answer);
					                answer = new XXX.QuestionAnswer
					                (
					                	quizRooms[quizRoomToken].domainRoom.domain.ID,
					            		quizRooms[quizRoomToken].domainRoom.domain.DomainGuid,
					            		quizRooms[quizRoomToken].domainRoom.RoomGuid,
					            		dbQuestion.QuestionGuid,
					            		uuid.v1(),
					            		dbQuestion.WrongAnswer2
					                );
					                answerList.push(answer);
					                answer = new XXX.QuestionAnswer
					                (
					                	quizRooms[quizRoomToken].domainRoom.domain.ID,
					            		quizRooms[quizRoomToken].domainRoom.domain.DomainGuid,
					            		quizRooms[quizRoomToken].domainRoom.RoomGuid,
					            		dbQuestion.QuestionGuid,
					            		uuid.v1(),
					            		dbQuestion.WrongAnswer3
					                );
					                answerList.push(answer);

					               	answerList = _und.sortBy(answerList, function(val){ return Math.random(val); });
					               	question.QuestionAnswers = answerList;


									quizRooms[quizRoomToken].quiz.questions.push(question);
					            });
									
									//set the quiz status to 1; this means send the next question
									quizRooms[quizRoomToken].quiz.status=QuizRoomStatus.SendNextQuestion;
									quizRooms[quizRoomToken].quiz.noOfQuestions = quizRooms[quizRoomToken].quiz.questions.length;
									
									console.log("KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK " + new Date());
									
									//http://jsfiddle.net/58Jv5/13/
									//console.log("set QT to 3sec " ++ new Date() );
									quizRooms[quizRoomToken].questionTimer = setTimeout(questionTimerFunction,(3*1000),quizRoomToken);

						    });
						});
					

				}	 
	
		function createQuizRoom(quizRoomToken,data)
		{
				if(quizRooms[quizRoomToken] != null)
				{
					return;
				}
				console.log("create q room");

				//create the quiz room
				quizRooms[quizRoomToken] = {
				      'creator': socket,
				      'players': [],
				      'interval': null,
				      'startDate':null,
				      
				      'roomTimer': null,
				      'roomTimerInterval' : 120*1000,

					  'questionTimer': null,
					  'questionTimerInterval': 15*1000,
					  'questionTimerAnswerInterval': 5*1000,

				      
				      'domainRoom':data,
				      'startRoomTimerDate':null,
				      'quiz':
				      	{
				      		questions:[],
				      		noOfQuestions:0,
				      		question:null,
				      		index:-1,
				      		status:QuizRoomStatus.NotStarted,
				      		answers:[],
				      		lastAnswers:[],
				      		ratings:[],
				      		quizStatList:[]
				      	}
				    };
		}	
    
    // A new user connects.
	socket.on('join', function(data) {

	    console.log('join: '+JSON.stringify(data));

		allUsersCount++;

		var b = new Buffer(Math.random() + new Date().getTime() + socket.id);
    		
    	var sid =  b.toString('base64').slice(12, 32);

		//set the token into a hash
    	tokens[sid] = sid;

    	socket.sid = sid;

	    	//set the user information to the socket
	    	socket.user = data.user;

			//first time the user connects, has no room
	    	socket.quizRoomToken = null;

	    	socket.chatDomains=[];
	       //add the socket to "room" 0 where all the connected users will reside
	       //socket.join(user.languageID);
	       socket.join(0);
	       
	       //broadcast to all connected users a new message containing the user info and the number of connected users
	       var msg = 
	       {
				user:data.user,
				allUsersCount:allUsersCount,
				count:chat.clients(data.user.LanguageID).length,
				sid :sid		       	
	       };
			console.log('ssssssssssssssss'+JSON.stringify(msg));
	       //socket.broadcast.emit('onUserConnected', msg);
	       io.sockets.emit('onUserConnected', msg);
	});

	socket.on('userLogged', function(data) {
		console.log('userLogged: '+JSON.stringify(data));
	    	//set the user information to the socket
	   		socket.user = data.newuser;
	});

	socket.on('userLoggedOut', function(data) {
			console.log('userLoggedOut: '+JSON.stringify(data));
	    	//set the user information to the socket
	   		socket.user = data.user;
	});


	socket.on('getUserRatingForDomain', function(data) {
		console.log('getUserRatingForDomain: '+JSON.stringify(data));
	    	//set the user information to the socket

	    var query = RatingModel.find(
											{
												DomainID:data.DomainID,
												UserGuid:data.UserGuid
											});

      	query.exec(function(err, result) {
			if(err != null)
			{
				console.log("Error getting user rating");
			}
			var rating = null;
			if(result.length==0)
			{
				rating =
				{
					DomainID     			: data.DomainID,
									  DomainGuid     		: '',
									  UserGuid  			: data.UserGuid,
									  AnswerCount      		: 0,
									  CorrectAnswerCount    : 0,
									  WrongAnswerCount   	: 0,
									  IsNew					: true

				};
			
			}else
			{
				rating=result[0];	
			}
			io.sockets.emit('onUserRatingForDomain', rating);
		});

	});

	// join domain chat
	socket.on('joinChatDomain', function(data){
			//nodeService.nodeServer.socket.emit('joinChatDomain', { sid: nodeService.nodeServer.SID, domain:domain });
			console.log("joinChatDomain");

			
		    
		    socket.join(data.domainID);

		    socket.chatDomains.push(data.domainID);


		    var bMsg = {
					user:socket.user,
					count:chat.clients(data.domainID).length,
					domainID : data.domainID
		       };  
		      

			io.sockets.emit('onUserJoinedDomain', bMsg);

		      // sending to all clients in 'game' room(channel) except sender
		 	//socket.broadcast.to(chatDomainKey).emit('userJoinedDomain', bMsg);
	});

	// receive domain chat message
	socket.on('domainChatMessage', function(data){
			console.log("domainChatMessage " + JSON.stringify(data));

			//var chatDomainKey = "domain" +data.domainID;


		    var msg = {
					user:socket.user,
					domainID : data.domainID,
					msg :data.msg
		       };  
		      

			io.sockets.emit('onDomainChatMessage', msg);
	});


	socket.on('enterToQuizRoom', function(data){
			console.log("enterToQuizRoom " + JSON.stringify(data));

			//create the quiz room token
			var quizRoomToken = data.domain.ID + data.domain.DomainGuid + data.RoomGuid;

	
			//check if the quiz room exists on the server and if not exists --> create the room
			createQuizRoom(quizRoomToken,data);
			

			var hms = new XXX.HourMinSec();
			if(quizRooms[quizRoomToken].startDate == null)
			{
				hms.Hours=0;
				hms.Min=0;
				hms.Sec=0;
				hms.TotalSecconds=0;
			}else
			{
				var b = new Date();
				hms.TotalSecconds = (b - quizRooms[quizRoomToken].startDate) / 1000;
				hms.TotalSecconds = Math.round(hms.TotalSecconds);
				hms.TotalSecconds = (quizRooms[quizRoomToken].roomTimerInterval/1000) - hms.TotalSecconds;
			}

			if(quizRooms[quizRoomToken].quiz.status ==0 || quizRooms[quizRoomToken].quiz.status ==-1 || 1==1)
			{
				//set the quiz room token to the user
				socket.quizRoomToken = quizRoomToken;

				//add the user to the quiz room
				socket.join(quizRoomToken);
				quizRooms[quizRoomToken].players.push(socket);

				//notify the other players that i  joined the quiz room
				var data=
				{
					user:socket.user,
					dr:quizRooms[quizRoomToken].domainRoom,
					count:	chat.clients(quizRoomToken).length,
					HourMinSec:hms		  			
				};
				console.log("onUserJoinedQuizRoom" + chat.clients(quizRoomToken).length);
				io.sockets.in(quizRoomToken).emit('onUserJoinedQuizRoom', data);
			}

			if(quizRooms[quizRoomToken].quiz.status ==QuizRoomStatus.NotStarted)
			{
				quizRooms[quizRoomToken].roomTimer = setTimeout(roomTimerFunction,1*1000,quizRoomToken);
			}
	});
	
	socket.on('userAnsweredToQuizQuestion', function(data)
		{
			var answer = data.answer;
			console.log(new Date() + " userAnsweredToQuizQuestion " +  " " + JSON.stringify(answer));
				var quizRoomToken = answer.DomainID + answer.DomainGuid + answer.RoomGuid;

				if(quizRooms[quizRoomToken].quiz.question == undefined)
				{
					console.log("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEe 1");
					return;					
				}
				var question = quizRooms[quizRoomToken].quiz.question;
				if(question.QuestionGuid != answer.QuestionGuid)
				{
					console.log("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEe 2");
					
					console.log(JSON.stringify(quizRooms[quizRoomToken].quiz.question));

					console.log("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEe 2");
					return;					
				}
				
				var qs =  _und.find(quizRooms[quizRoomToken].quiz.quizStatList,function(o){return o.UserGuid === answer.UserGuid; });
				if(qs == null)
				{
					qs = 
					{
						UserGuid:answer.UserGuid,
						trimise:0,
						raspunsuri:0,
						corecte:0,
						gresite:0
					};
						quizRooms[quizRoomToken].quiz.quizStatList.push(qs);
				}
				qs.raspunsuri++;

				answer.CorrectAnswerGuid = question.GetCorrectAnswerGuid();
				
				if (answer.AnswerGuid == answer.CorrectAnswerGuid)
	            {
	                answer.IsCorrect = true;
	                answer.Score = 1;
	            	qs.corecte++;
	            }else{
	            	qs.gresite++;
	            }

				quizRooms[quizRoomToken].quiz.lastAnswers.push(answer);


				if(socket.user.IsGuest == false)
				{
					var rating =  _und.find(quizRooms[quizRoomToken].quiz.ratings,function(o){return o.UserGuid === answer.UserGuid; });
					console.log("user rating " + JSON.stringify(rating));
					if(rating != undefined)
					{
						rating.AnswerCount++;
						if(answer.IsCorrect)
						{
							rating.CorrectAnswerCount++;
						}else
						{
							rating.WrongAnswerCount++;
						}
					}
				}

		});

    // Somebody left the chat
	socket.on('disconnect', function() {
			
			allUsersCount--;
			console.log("dis-connect");
			//return;
			// Notify the other person in the chat room
			// that his partner has left
			
			if(socket.quizRoomToken != undefined)
			{	
				var qrt = this.quizRoomToken; 
				
				// leave the room
				socket.leave(qrt);

				//notify the users from the room that a user has leaved 
				var quizPlayersCount =  chat.clients(qrt).length;
				var msg = 
	       		{	
					user:socket.user,
					count:quizPlayersCount		       	
	       		};
				socket.broadcast.to(qrt).emit('onLeaveRoom', msg);

				if(quizPlayersCount ==0)
				{
					//stop the quiz
					console.log("STOP QUIZ");
					clearTimeout(quizRooms[qrt].questionTimer);
					quizRooms[qrt].questionTimer=null;

					clearTimeout(quizRooms[qrt].roomTimer);
					quizRooms[qrt].roomTimer=null;
					
					quizRooms[qrt] = null;
				}


			}	

			if(socket.chatDomains != undefined)
			{
				for(var i=0;i<this.chatDomains.length;i++)
				{
					var msg = 
					{
						user:socket.user,
						domainID:this.chatDomains[i],
						count:chat.clients(this.chatDomains[i]).length - 1
					};
					socket.broadcast.emit('onUserLeavedChat', msg);
					
					socket.leave(this.chatDomains[i]);					
				}				
			}

			//remove the token
			if(socket.sid != undefined )
			{
				tokens[socket.sid] = null;
			}
			//broadcast to all connected users a new message containing the user info and the number of connected users
	       	var msg = 
	       	{
				user:socket.user,
				domainID:0,
				count:chat.clients(0).length -1		       	
	       	};
	       	socket.broadcast.emit('onUserHasDisconnected', msg);

			// leave the server
			socket.leave(0);
	});

    
	});
};
