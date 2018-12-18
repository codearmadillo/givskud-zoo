using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

using Types;
using ContentHelpers;

using Umbraco;
using Umbraco.Web;
using Umbraco.Core;
using Umbraco.Core.Services;
using Umbraco.Core.Models;

namespace GamesController {
    public class QuizController : ContentController.ContentController {
        public void Fetch(int Id = -1, bool IncludeQuestions = false) {
            UmbracoHelper _umbracoHelper = new UmbracoHelper(UmbracoContext.Current);
            IPublishedContent Root = _umbracoHelper.TypedContent(1129);

            if(Root != null) {
                IEnumerable<IPublishedContent> Nodes = (Id == -1) ? Root.Children() : Root.Children().Where(x => x.Id == Id);
            
                if(Nodes.Count() > 0) {
                    foreach(IPublishedContent Node in Nodes) {
                        Quiz Game = new Quiz {
                            Id = Node.Id,
                            Url = Node.Url.ToString(),
                            Title = Node.GetPropertyValue("title").ToString(),
                            Description = Node.GetPropertyValue("description").ToString(),
                            Image = Node.HasValue("image") ? Node.GetPropertyValue<IPublishedContent>("image").Url.ToString() : ContentHelpers.ContentHelpers.GetDefaultPostImage(),
                            Topic = Node.GetPropertyValue("topic").ToString(),
                            Questions = new List<Question>()
                        };

                        if(IncludeQuestions == true) {
                            IEnumerable<IPublishedContent> Questions = Node.GetPropertyValue<IEnumerable<IPublishedContent>>("question");

                            if(Questions.Count() > 0) {
                                foreach(IPublishedContent Q in Questions) {
                                    Game.Questions.Add(new Question {
                                        Text = Q.GetPropertyValue<string>("question"),
                                        Hint = Q.GetPropertyValue<string>("hint"),
                                        ImageUrl = Q.HasValue("image") ? Q.GetPropertyValue<IPublishedContent>("image").Url.ToString() : ContentHelpers.ContentHelpers.GetDefaultPostImage(),
                                        CorrectAnswer = Q.GetPropertyValue<int>("correctAnswer") - 1,
                                        Answers = new List<string>() {
                                            Q.GetPropertyValue<string>("answer1"),
                                            Q.GetPropertyValue<string>("answer2"),
                                            Q.GetPropertyValue<string>("answer3"),
                                            Q.GetPropertyValue<string>("answer4")
                                        }
                                    });
                                }
                            }
                        }

                        this.Items.Add(Game);
                    }
                }
            }
        }
    }
}
