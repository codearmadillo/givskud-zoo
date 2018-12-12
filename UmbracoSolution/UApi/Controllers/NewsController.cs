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
    public class NewsController : UmbracoApiController
    {
        readonly int pageId = 1126;






        // /umbraco/api/news/postnews
        [HttpPost] // Api -> Post new content "itemNews" under "news"
        public string PostNews([FromBody] News data)
        {
            var contentService = Services.ContentService;
            var item = contentService.CreateContent(data.Title, pageId, "itemNews");
            item.SetValue("headline", data.Title);
            item.SetValue("bodyText", data.BodyText);
            var isSaved = contentService.SaveAndPublishWithStatus(item);
            string result = isSaved ? "OK" : "ERROR";
            return result;
        }






        // /umbraco/api/news/getnews
        [HttpGet] // Api -> Get a list of all the news items -> headline & bodyText
        public List<News> GetNews()
        {
            List<News> result = new List<News>();
            var cs = Services.ContentService;
            var newsContainer = cs.GetById(pageId);
            var news = newsContainer.Children();

            foreach (var item in news)
            {
                result.Add(new News()
                {
                    Id = item.Id,
                    Title = item.GetValue("headline").ToString(),
                    BodyText = item.GetValue("bodyText").ToString()
                });
            }
            return result;
        }






        // /umbraco/api/news/deletenews
        [HttpPost] // Api -> Find newsitem by id and delete it
        public string DeleteNews([FromBody] News data)
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
