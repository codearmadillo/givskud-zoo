using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;
using Umbraco.Web.WebApi;
using Umbraco.Core;
using Umbraco.Core.Models;
using Umbraco.Core.Services;
using UApi.Models;


namespace UApi.Controllers
{
    public class EventController : UmbracoApiController
    {
        readonly int pageId = 1128;






        // /umbraco/api/event/postevent
        [HttpPost] // Api -> Post new event item(child) under events(parent)
        public string PostEvent([FromBody] Event data)
        {
            var contentService = Services.ContentService;
            var item = contentService.CreateContent(data.Title, pageId, "itemEvents");
            item.SetValue("headline", data.Title);
            item.SetValue("bodyText", data.BodyText);
            item.SetValue("dateAndTime", data.Time);
            item.SetValue("price", data.Price);
            var isSaved = contentService.SaveAndPublishWithStatus(item);
            string result = isSaved ? "OK" : "ERROR";
            return result;
        }






        // /umbraco/api/event/getevents
        [HttpGet] // Api -> Get a list of all the event items -> headline & bodyText
        public List<Event> GetEvents()
        {
            List<Event> result = new List<Event>();
            var cs = Services.ContentService;
            var newsContainer = cs.GetById(pageId);
            var news = newsContainer.Children();

            foreach (var item in news)
            {
                result.Add(new Event()
                {
                    Id = item.Id,
                    Title = item.GetValue("headline").ToString(),
                    BodyText = item.GetValue("bodyText").ToString()
                });
            }
            return result;
        }






        // /umbraco/api/event/deleteevent
        [HttpPost] // Api -> Find event item by id and delete it
        public string DeleteEvent([FromBody] Event data)
        {
            var contentService = ApplicationContext.Services.ContentService;
            var pages = contentService.GetChildren(pageId).Where(x => x.Id == data.Id);
            foreach (var item in pages)
            {
                contentService.Delete(item);
            }
            contentService.EmptyRecycleBin();
            return "ok";
        }

    }
}
