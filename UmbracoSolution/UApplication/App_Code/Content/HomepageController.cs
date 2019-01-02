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

namespace HomepageController {
    public class HomepageController : ContentController.ContentController {
        public void Fetch() {
            var _umbracoHelper = new UmbracoHelper(UmbracoContext.Current);

            IPublishedContent Root = _umbracoHelper.TypedContent(1125);
            IEnumerable<IPublishedContent> Nodes = Root.GetPropertyValue<IEnumerable<IPublishedContent>>("sections");

            if(Nodes != null && Nodes.Count() > 0) {
                foreach(IPublishedContent Node in Nodes) {
                    IEnumerable<IPublishedContent> Links = Node.GetPropertyValue<IEnumerable<IPublishedContent>>("homepageLinks");

                    HomepageSnippet Snippet = new HomepageSnippet {
                        Id = Node.Id,
                        Headline = Node.GetPropertyValue("sectionheadline").ToString(),
                        Body = Node.GetPropertyValue("sectionbody").ToString(),
                        Links = new List<HomepageLink>()
                    };

                    if(Links.Count() > 0) {
                        foreach(IPublishedContent Link in Links) {
                            string Lnk = Link.GetPropertyValue<IPublishedContent>("homelinklnk").Url.ToString();
                            string Label = Link.GetPropertyValue("homelinklabel").ToString();
                            string Image = Link.HasValue("homelinkimage") ? Link.GetPropertyValue<IPublishedContent>("homelinkimage").Url.ToString() : ContentHelpers.ContentHelpers.GetDefaultPostImage();

                            Snippet.Links.Add(new HomepageLink {
                                LinkUrl = Lnk,
                                ImageUrl = Image,
                                Label = Label
                            });
                        }
                    }

                    this.Items.Add(Snippet);
                }
            }
        }
    }
}
