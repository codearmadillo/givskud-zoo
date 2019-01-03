using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;
using System.Text.RegularExpressions;

using Umbraco;
using Umbraco.Web;
using Umbraco.Core;
using Umbraco.Core.Services;
using Umbraco.Core.Models;

namespace ContentHelpers {
    public class ContentHelpers {
        public static string GetExcerpt(string Input, int Size) {
            string Washed = Regex.Replace(Input, "<.*?>", string.Empty);

            return string.Join(" ", Washed.Substring(0, Washed.Length > Size ? Size : Washed.Length).Split(' ').Reverse().Skip(1).Reverse()) + (Washed.Length <= Size ? "" : "...");
        }
        public static string DefaultAvatar() {
            return "Assets/images/user-default.jpg";
        }
        public static string ConvertToCurrency(int Value) {
            return Value > 0 ? "DKK " + Value : "Free";
        }
        public static string GetDefaultPostImage() {
            return "https://images.pexels.com/photos/40756/lion-safari-afika-landscape-40756.jpeg?fit=crop&crop=entropy&w=640&h=428";
        }
    }
}

namespace Types {
    public class Post {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Body { get; set; }
        public string Excerpt { get; set; }
        public string Date { get; set; }
        public string Time { get; set; }
        public Author Author { get; set; }
        public string Url { get; set; }
    }
    public class Event {
        public string Name { get; set; }
        public string Description { get; set; }
        public string ImageUrl { get; set; }
        public MapLocation MapPoint { get; set; }
        public string Price { get; set; }
        public string Time { get; set; }
        public string Date { get; set; }
        public bool IsToday { get; set; }
        public bool IsUpcoming { get; set; }

        public bool HasAttraction() {
            return this.MapPoint == null;
        }
    }
    public class Author {
        public int userId;
        public string userName;
        public string userImage;

        public Author (int Id) {
            userId = Id;

            var userNode = ApplicationContext.Current.Services.UserService.GetUserById(Id);
            userName = userNode.Name;
            userImage = userNode.Avatar == null ? ContentHelpers.ContentHelpers.DefaultAvatar() : "/Media/" + userNode.Avatar;
        }
    }
    public class MapLocation {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public decimal Longitude { get; set; }
        public decimal Latitude { get; set; }
        public MapCategory Category { get; set; }
    }
    public class MapCategory {
        public int Id { get; set; }
        public string Label { get; set; }
        public string Icon { get; set; }
        public string Slug { get; set; }
    }
    public class HomepageSnippet {
        public int Id { get; set; }
        public string Headline { get; set; }
        public string Body { get; set; }
        public List<HomepageLink> Links { get; set; }

        public bool HasLinks() {
            return Links.Count() > 0;
        }
    }
    public class HomepageLink {
        public string LinkUrl { get; set; }
        public string ImageUrl { get; set; }
        public string Label { get; set; }
    }
    public class Game {
        public int Id { get; set; }
        public string Url { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Image { get; set; }
        public string Topic { get; set; }
    }
    public class Quiz : Game {
        public List<Question> Questions { get; set; }

        public string QuizJson() {
            var json = new JavaScriptSerializer().Serialize(this.Questions);
            return json;
        }
    }
    public class Question {
        public string Text { get; set; }
        public string Hint { get; set; }
        public string ImageUrl { get; set; }
        public List<string> Answers { get; set; }
        public int CorrectAnswer { get; set; }
    }
}