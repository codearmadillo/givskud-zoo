using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Umbraco;
using Umbraco.Web;
using Umbraco.Core.Models;


namespace PageComponents {
    public class Templates {
        public static string Navigation(string url, string label, string icon, bool active) {

            string Response = "<a href='" + url + "' title='" + label + "' class=' " + (active ? "active" : "") + "'>";
                   Response += "<i class='link__icon icon fas " + icon + "'></i>";
                   Response += "<span class='link__title'>" + label + "</span>";
                   Response += "</a>";

            return Response;
            
        }
        public static string Popup(string message, string link, string linkLabel) {
            return string.Empty;
        }
    }
}
