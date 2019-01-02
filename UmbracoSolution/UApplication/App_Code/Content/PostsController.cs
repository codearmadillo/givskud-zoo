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

namespace PostsController {
    public class PostsController : ContentController.ContentController {
        public void Fetch(int Id = -1) {
            var _umbracoHelper = new UmbracoHelper(UmbracoContext.Current);
            IPublishedContent Root = _umbracoHelper.TypedContent(1126);

            if(Root != null) {
                IEnumerable<IPublishedContent> Nodes = (Id == -1) ? Root.Descendants("itemNews").OrderByDescending(Node => Node.CreateDate) : Root.Descendants("itemNews").Where(x => x.Id == Id).OrderByDescending(Node => Node.CreateDate);

                if (Nodes.Count() > 0) {
                    foreach(IPublishedContent Node in Nodes) {
                        this.Items.Add(new Post {
                            Id          = Node.Id,
                            Title       = Node.GetPropertyValue("headline").ToString(),
                            Body        = Node.GetPropertyValue("bodyText").ToString(),
                            Excerpt     = ContentHelpers.ContentHelpers.GetExcerpt(Node.GetPropertyValue("bodyText").ToString(), 100),
                            Date        = Node.CreateDate.ToString("dd/MM/yyyy"),
                            Time        = Node.CreateDate.ToString("HH:mm"),
                            Author      = new Author(Node.CreatorId),
                            Url         = Node.Url.ToString()
                        });
                    }
                }
            }
        } 
    }
    
}