

exports.QuestionAnswer  = function QuestionAnswer(domainID, domainGuid, roomGuid, questionGuid,answerGuid, answer) {
    this.DomainID = domainID;
    this.DomainGuid = domainGuid;
    this.RoomGuid = roomGuid;
	this.QuestionGuid = questionGuid;
    this.AnswerGuid = answerGuid;
	this.UserGuid="";
    this.Answer = answer;
    
    this.IsCorrect = false;
    this.Answered = false;
    this.CorrectAnswerGuid = "";
    this.Score = 0;

 //this.SetAnswerAsBeeingCorrect=function()
    //{
     //   this.IsCorrect = true;
     //   this.Score = 1;
    //};
    
}

exports.QuizQuestion  = function QuizQuestion(domainID,domainGuid,roomGuid, questionIndex, questionGuid, definition,imgUrl) {
    this.DomainID = domainID;
    this.DomainGuid = domainGuid;
    this.RoomGuid = roomGuid;

    this.QuestionIndex = questionIndex;
    this.QuestionGuid = questionGuid;
    this.Definition = definition;
    this.ImgUrl = imgUrl;
    this.QuestionAnswers = [];
    this.SeccondsToAnswer = 11;

    var CorrectAnswerGuid = "";
    this.SetCorrectAnswerGuid=function(correctAnswerGuid)
    {
        CorrectAnswerGuid = correctAnswerGuid;
    };
    this.GetCorrectAnswerGuid=function()
    {
        return CorrectAnswerGuid;
    };
}

exports.QuestionUsersAnswers = function QuestionUsersAnswers()
{
    this.DomainID=0;
        this.DomainGuid="";
        this.RoomGuid="";

        this.UserAnswers =[];
        this.ResponseCount=0;
        this.CorrectResponseCount=0;
        this.WrongResponseCount=0;
        this.CorrectAnswerGuid = "";
        this.PodiumPositionList =[];
        this.QuizStatList=[];

}

exports.PodiumPosition = function PodiumPosition()
{
    this.Position=0;
    this.PositionCount=0;
    this.Score=0;
    this.ConnectionIds = [];
}

exports.HourMinSec = function HourMinSec()
{
    this.Hours=0;
    this.Min=0;
    this.Sec=0;
    this.TotalSecconds = 0;
}



//module.exports = QuestionAnswer;
//module.exports = QuizQuestion;