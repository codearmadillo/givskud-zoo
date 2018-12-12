using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UApi.Models
{
    public class Event : ContentModel
    {
        public DateTime Time { get; set; }
        public int Price { get; set; }
    }
}
