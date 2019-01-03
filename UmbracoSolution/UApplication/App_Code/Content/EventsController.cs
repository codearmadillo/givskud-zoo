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

namespace EventsController {
    public class EventsController : ContentController.ContentController {

        public void Fetch() {
            var _umbracoHelper = new UmbracoHelper(UmbracoContext.Current);
            IPublishedContent Root = _umbracoHelper.TypedContent(1128);

            if (Root != null) {
                IEnumerable<IPublishedContent> Nodes = Root.Children().OrderByDescending(Node => Node.GetPropertyValue<DateTime>("dateAndTime"));

                if (Nodes.Count() > 0) {

                    DateTime Now = DateTime.Now;

                    foreach (IPublishedContent Node in Nodes) {

                        DateTime EventDateTime = DateTime.Parse(Node.GetPropertyValue("dateAndTime").ToString());

                        MapController.MapController MapCtr = new MapController.MapController();
                        MapCtr.Fetch(Node.GetPropertyValue<int>("mapAttraction"));

                        object MapItem = Node.HasValue("mapAttraction") ? MapCtr.GetItems()[0] : null;
                        MapLocation MapPoint = (MapLocation) MapItem;

                        this.Items.Add(new Event {
                            Name = Node.GetPropertyValue("headline").ToString(),
                            Description = Node.GetPropertyValue("bodyText").ToString(),
                            ImageUrl = Node.HasValue("image") ? Node.GetPropertyValue<IPublishedContent>("image").Url : ContentHelpers.ContentHelpers.GetDefaultPostImage(),
                            MapPoint = MapPoint,
                            Price = ContentHelpers.ContentHelpers.ConvertToCurrency(Convert.ToInt32(Node.GetPropertyValue("Price").ToString())),
                            Time = EventDateTime.ToString("HH:mm"),
                            Date = EventDateTime.ToString("dd/MM/yyyy"),
                            IsToday = Now.ToString("dd/MM/yyyy") == EventDateTime.ToString("dd/MM/yyyy"),
                            IsUpcoming = Now.Date < EventDateTime.Date
                        });
                    }
                }
            }
        }
    }
}