using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text.RegularExpressions;
using Umbraco;
using Umbraco.Web;
using Umbraco.Core.Models;

namespace PostController {

    public class ContentHelper {
        public static string GetExcerpt(string Input, int Size) {
            string Washed = Regex.Replace(Input, "<.*?>", string.Empty);

            return string.Join(" ", Washed.Substring(0, Washed.Length > Size ? Size : Washed.Length).Split(' ').Reverse().Skip(1).Reverse()) + (Washed.Length <= Size ? "" : "...");
        }
        public static string AuthorImage(int AuthorId) {
            return "https://pbs.twimg.com/profile_images/2553092547/4square_avatar_400x400.jpg";
        }
        public static string ConvertToCurrency(int Value) {
            return Value > 0 ? "DKK " + Value : "Free";
        }
        public static string GetDefaultPostImage() {
            return "https://www.chesterzoo.org/~/media/images/animals/mammals/carnivores/lions/asiatic%20lion%20iblis%20(1).jpg?la=en";
        }
    }

    public class GetContent {
        public static void Posts (int nodeid) {

            

        }
    }

    public class Post {
        public string Title { get; set; }
    }

}
