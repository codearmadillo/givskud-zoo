using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Umbraco;
using Umbraco.Web;
using Umbraco.Core.Models;

namespace GameController {
    public class GameController {
        public static bool IsGameSession(string id) {
            return System.Web.HttpContext.Current.Request.Cookies["GameSession" + id] != null;
        }
        public static bool IsGameFinished(string id) {
            return System.Web.HttpContext.Current.Request.Cookies["GameEnd" + id] != null;
        }
        public static int GetScore(string id) {
            var Score = System.Web.HttpContext.Current.Request.Cookies["GameScore" + id].Value;

            if(Score == null) {
                return -1;
            } else {
                return Convert.ToInt32(Score);
            }
        }
    }

    public class QuizController {
        public static string QuestionTemplate(IPublishedContent Question) {

            return string.Empty;
        }
        public static Question GetCurrentQuestion(string GameId) {

            return new Question() {
                Image = "Image",
                Hint = "Hint",
                QuestionText = "Text",
                Answers = new List<Answer>()
            };
        }
    }
    public class Question {
        public string Image { get; set; }
        public string Hint { get; set; }
        public string QuestionText { get; set; }
        public List<Answer> Answers { get; set; }
    }
    public class Answer {
        public string Text { get; set; }
        public bool IsCorrect { get; set; }
    }
}