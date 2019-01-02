using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ContentController {
    public class ContentController {
        public readonly List<object> Items = new List<object>();

        public bool HasItems() {
            return this.Items.Count() > 0;
        }
        public List<object> GetItems() {
            return this.Items;  
        }
        public void Empty() {
            this.Items.Clear();
        }
    }
}