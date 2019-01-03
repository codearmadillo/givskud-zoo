using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;

using Types;
using ContentHelpers;

using Umbraco;
using Umbraco.Web;

using Umbraco.Core; 
using Umbraco.Core.Models;
using Umbraco.Core.Services;

namespace MapController {
    public class MapController : ContentController.ContentController {
        public void Fetch(int Id = -1) {
            var _umbracoHelper = new UmbracoHelper(UmbracoContext.Current);
            IPublishedContent Root = _umbracoHelper.TypedContentAtRoot().FirstOrDefault();

            if(Root != null) {
                IEnumerable<IPublishedContent> Nodes = (Id == -1) ? Root.Descendants("itemMap") : Root.Descendants("itemMap").Where(x => x.Id == Id);

                foreach (IPublishedContent Node in Nodes) {

                    IPublishedContent NodeCategory = Node.GetPropertyValue<IPublishedContent>("category");

                    MapCategory LocationCategory = new MapCategory {
                        Id = NodeCategory.Id,
                        Label = NodeCategory.GetPropertyValue<string>("label"),
                        Icon = NodeCategory.HasValue("icon") ? NodeCategory.GetPropertyValue<IPublishedContent>("icon").Url : null,
                        Slug = NodeCategory.GetPropertyValue<string>("label").ToLower().Replace(" ", "-")
                    };

                    this.Items.Add(new MapLocation {
                        Id = Node.Id,
                        Title = Node.GetPropertyValue("title").ToString(),
                        Description = Node.GetPropertyValue("description").ToString(),
                        Longitude = Convert.ToDecimal(Node.GetPropertyValue("longitude").ToString()),
                        Latitude = Convert.ToDecimal(Node.GetPropertyValue("latitude").ToString()),
                        Category = LocationCategory
                    });
                }
            }
        }
        public string RenderMarkersAsJson() {
            string Response = string.Empty;

            if (this.HasItems()) {
                Response = new JavaScriptSerializer().Serialize(this.Items);
            } else {
                Response = string.Empty;
            }

            return Response;
        }
    }
}