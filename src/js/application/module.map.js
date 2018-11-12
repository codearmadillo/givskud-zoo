class InteractiveMap {
    constructor(parent, map, config = null) {
        this.Viewport = {
            Width: parent.clientWidth,
            Height: parent.clientHeight,
            Orientation: null
        }
        this.Zoom = {
            Minimum: 1,
            Maximum: 4,
            Increase: 0.5
        }
        this.Zoom.Zoom = config && config.Zoom && config.Zoom >= this.Zoom.Minimum && config.Zoom <= this.Zoom.Maximum ? config.Zoom : 1;
        this.Pan = {
            Force: 0.09,
            IsEnabled: true,
            Horizontal: {
                isEnabled: true
            },
            Vertical: {
                isEnabled: true
            },
            Element: {

            },
            XStart: null,
            YStart: null,
            mouseDrag: false,
            touchDrag: false
        }

        this.Position = {
            x: config && config.Position ? config.Position.x : 0,
            y: config && config.Position ? config.Position.y : 0
        };
        this.Map = {
            Source: map.Map,
            AspectRatio: null,
            Orientation: null,
            RealWorld: map.UsesRealWorld
        }
        if(this.Map.RealWorld){
            this.Map.Longitude = map.Longitude
            this.Map.Latitude = map.Latitude;
            this.Map.Area = {
                Longitude: this.Map.Longitude.End - this.Map.Longitude.Start,
                Latitude: this.Map.Latitude.Start - this.Map.Latitude.End
            }
            this.Map.Distances = {
                hor: this.GetGeographicDistance(
                    this.Map.Longitude.Start,
                    this.Map.Latitude.Start - ((this.Map.Latitude.Start - this.Map.Latitude.End) / 2),
                    this.Map.Longitude.End,
                    this.Map.Latitude.Start - ((this.Map.Latitude.Start - this.Map.Latitude.End) / 2)
                ),
                ver: this.GetGeographicDistance(
                    this.Map.Longitude.End  - ((this.Map.Latitude.End - this.Map.Latitude.Start) / 2),
                    this.Map.Latitude.Start,
                    this.Map.Longitude.End  - ((this.Map.Latitude.End - this.Map.Latitude.Start) / 2),
                    this.Map.Latitude.End
                )
            }
            this.Map.Step = 1;
            this.CalculateDistances();
        }
        
        this.Elements = {
            Parent: parent
        };
        this.SynchQueue = Array();
        this.InitiatedCall = false;

        this.Animations = {};
        this.Markers = {};

        this.Load();
    }

    // Iteration cycles
    Load() {
        var self = this;

        this.Elements.Parent.className = this.Elements.Parent.className + ' iamap';

        this.Elements.Loader = this.Loader();
        this.Elements.Parent.appendChild(this.Elements.Loader);

        var MapImageElement = new Image();
            MapImageElement.addEventListener('load', function(e){
                if(MapImageElement.width / MapImageElement.height > 1){ 
                    self.Map.Orientation = 'horizontal';
                    self.Map.AspectRatio = MapImageElement.height / MapImageElement.width;
                } else {
                    self.Map.Orientation = 'vertical';
                    self.Map.AspectRatio = MapImageElement.width / MapImageElement.height;
                }

                self.Render();

                window.addEventListener('resize', function(e){
                    self.CalculateDistances();
                    self.Render();
                });
            });
            MapImageElement.src = this.Map.Source;
    }
    Render() {
        
        // Refresh window size
        this.Viewport = {
            Width: this.Elements.Parent.clientWidth,
            Height: this.Elements.Parent.clientHeight,
            Orientation: this.Elements.Parent.clientWidth > this.Elements.Parent.clientHeight ? 'horizontal' : 'vertical'
        }
        
        // Initial settings
        if(!this.Elements.Map) {
            var MElement = document.createElement('div');
                MElement.className = 'iamap-maplayer';

                MElement.Styles({
                    "position": "relative",
                    "background-image": "url('" + this.Map.Source + "')",
                    "background-repeat": "no-repeat",
                    "background-position": "center center",
                    "z-index": 50
                });

            this.Elements.Map = MElement;
            this.Elements.Parent.appendChild(this.Elements.Map);

            if(this.Elements.Loader){
                this.Elements.Parent.removeChild(this.Elements.Loader);
            }

            this.RunSynchQueue();

            this.CreateControllers();
        }

        // Recalculate background proportions
        let MapOffset = {
            left: 0,
            top: 0
        }

        if(this.Viewport.Orientation == 'horizontal') {
            var MapHeight = (this.Viewport.Height * this.Zoom.Zoom) + "px";
            var MapWidth = (this.Viewport.Height / this.Map.AspectRatio  * this.Zoom.Zoom).toFixed(2) + "px";
        } else {
            var MapWidth = (this.Viewport.Width * this.Zoom.Zoom) + "px";
            var MapHeight = (this.Viewport.Width * this.Map.AspectRatio * this.Zoom.Zoom).toFixed(2) + "px";
        }
        var MapBgStyle = this.Map.Orientation == 'horizontal' ? '100% auto' : 'auto 100%';

        // Dragging is enabled by default
        this.Pan.Horizontal.isEnabled = true
        this.Pan.Vertical.isEnabled = true;

        if(this.Map.Orientation == 'horizontal') {
            if(parseFloat(MapWidth) <= this.Viewport.Width) {
                MapOffset.left = (this.Viewport.Width - parseFloat(MapWidth)).toFixed(2) / 2;
                MapOffset.top = (this.Viewport.Height - parseFloat(MapHeight)).toFixed(2) / 2;

                this.Elements.Map.style.left = MapOffset.left + "px";
                this.Elements.Map.style.top = MapOffset.top + "px";
            } else {
                if(parseFloat(MapHeight) < this.Viewport.Height) {
                    MapOffset.top = (this.Viewport.Height - parseFloat(MapHeight)).toFixed(2) / 2;

                    this.Elements.Map.style.top = MapOffset.top + "px";
                }
            }  
        } else {
            if(parseFloat(MapHeight) <= this.Viewport.Height) {
                MapOffset.left = (this.Viewport.Width - parseFloat(MapWidth)).toFixed(2) / 2;
                MapOffset.top = (this.Viewport.Height - parseFloat(MapHeight)).toFixed(2) / 2;

                this.Elements.Map.style.left = MapOffset.left + "px";
                this.Elements.Map.style.top = MapOffset.top + "px";
            } else {
                if(parseFloat(MapWidth) < this.Viewport.Width) {
                    MapOffset.left = (this.Viewport.Width - parseFloat(MapWidth)).toFixed(2) / 2;

                    this.Elements.Map.style.top = MapOffset.top + "px";
                }
            }
        }

        if(parseFloat(MapWidth) <= this.Viewport.Width) {
            this.Pan.Horizontal.isEnabled = false;
        }
        if(parseFloat(MapHeight) <= this.Viewport.Height) {
            this.Pan.Vertical.isEnabled = false;
        }

        this.Elements.Map.style.backgroundSize = MapBgStyle;
        this.Elements.Map.style.width = MapWidth;
        this.Elements.Map.style.height = MapHeight;

        // Coordinates, Markers, Location
        let MapSize = {
            w: parseFloat(this.Elements.Map.style.width),
            h: parseFloat(this.Elements.Map.style.height)
        }
        if(!this.Map.StepSize.hor.px) {
            this.Map.StepSize.hor.px = MapSize.w / (this.Map.Distances.hor / this.Map.Step);
        }
        if(!this.Map.StepSize.ver.px) {
            this.Map.StepSize.ver.px = MapSize.h / (this.Map.Distances.ver / this.Map.Step);
        }
        if(this.Markers){
            for(let g in this.Markers){
                let MarkerGroup = this.Markers[g].items;
                for(let m in MarkerGroup){
                    let Marker = MarkerGroup[m];
                    
                    // Create marker element if not available
                    if(!Marker.Element){
                        let MarkerElement = document.createElement('span');
                            MarkerElement.style.position = 'absolute';
                            MarkerElement.className = 'iamap-marker';

                            /*
                            Temporary
                            */
                            MarkerElement.style.width = "7px";
                            MarkerElement.style.height = MarkerElement.style.width;
                            MarkerElement.style.borderRadius = "calc(" + MarkerElement.style.width + " / 2)";
                            MarkerElement.style.backgroundColor = "red";

                        this.Markers[g].items[m].Element = MarkerElement;
                        this.Elements.Markers.appendChild(this.Markers[g].items[m].Element);
                    }

                    this.Markers[g].items[m].Element.style.visibility = Marker.render ? "unset" : "hidden";

                    let CoordDiff = {
                        x: Math.abs(this.Map.Longitude.Start - Marker.position.x),
                        y: Math.abs(this.Map.Latitude.Start - Marker.position.y)
                    }

                    this.Markers[g].items[m].Element.style.left = Math.abs((CoordDiff.x / this.Map.StepSize.hor.coords) * this.Map.StepSize.hor.px) * this.Zoom.Zoom + "px";
                    this.Markers[g].items[m].Element.style.top = Math.abs((CoordDiff.y / this.Map.StepSize.ver.coords) * this.Map.StepSize.ver.px) * this.Zoom.Zoom + "px";

                }

            }
        }

        this.Pan.Boundaries = {
            top: 0,
            right: (this.Elements.Map.offsetWidth - this.Viewport.Width) * -1,
            bottom: (this.Elements.Map.offsetHeight - this.Viewport.Height) * -1,
            left: 0
        }

        return true;
    }

    // Preload element
    Loader() {
        var loaderElement = document.createElement('span');
            loaderElement.className = 'iamap-loader';
            loaderElement.textContent = 'Loading resources';

            return loaderElement;
    }

    // Geographical and location services
    GetGeographicDistance(lon1,lat1,lon2,lat2){
        let R = 6391;
        let dLat = this.Deg2Rad(lat2 - lat1);
        let dLon = this.Deg2Rad(lon2 - lon1);
        let a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.Deg2Rad(lat1)) * Math.cos(this.Deg2Rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c * 1000;
    }
    Deg2Rad(deg){
        return deg * (Math.PI/180);
    }
    CalculateDistances() {
        this.Map.StepSize = {
            hor: {
                coords: this.Map.Area.Longitude / (this.Map.Distances.hor / this.Map.Step),
                px: null
            },
            ver: {
                coords: this.Map.Area.Latitude / (this.Map.Distances.ver / this.Map.Step),
                px: null
            }
        }
    }
    MapShowCurrentLocation(){
        var self = this;
        let Options = {
            enableHighAccuracy: true,
            maximumAge: 0
        }
        if(navigator && navigator.geolocation) {
            return navigator.geolocation.getCurrentPosition(function(res){
                let Coords = res.coords;

                if(!self.Markers.location){
                    self.AddMarkers(Array({
                        group: {
                            id: 'location',
                            slug: 'location',
                            label: 'Location',
                            icon: null,
                            controller: false
                        },
                        id: 'location',
                        label: 'My location',
                        listener: false,
                        position: {
                            x: Coords.longitude,
                            y: Coords.latitude
                        }
                    }));
                } else {
                    self.Markers.location.items.location.position = {
                        x: Coords.longitude,
                        y: Coords.latitude
                    }
                }
            }, this.MapLocationError, Options);
        } else {
            return this.MapLocationError(null);
        }
    }
    MapLocationError(e){
        switch(e.code){
            case e.PERMISSION_DENIED:
                console.log("User denied the request for Geolocation.");
                break;
            case e.POSITION_UNAVAILABLE:
                console.log("Location information is unavailable.");
                break;
            case e.TIMEOUT:
                console.log("The request to get user location timed out.");
                break;
            case e.UNKNOWN_ERROR:
            default:
                console.log("An unknown error occurred.");
                break;
        }

        return false;
    }

    // Map event callbacks
    MapControlZoom(ZoomIn){
        let posX = this.Position.x / this.Zoom.Zoom;
        let posY = this.Position.y / this.Zoom.Zoom;

        if(ZoomIn) {
            this.Zoom.Zoom = this.Zoom.Zoom < this.Zoom.Maximum ? this.Zoom.Zoom + this.Zoom.Increase : this.Zoom.Zoom;
        } else {
            this.Zoom.Zoom = this.Zoom.Zoom > this.Zoom.Minimum ? this.Zoom.Zoom - this.Zoom.Increase : this.Zoom.Zoom;
        }

        this.Position.x = posX * this.Zoom.Zoom;
        this.Position.y = posY * this.Zoom.Zoom;

        return this.Render();
    }
    ZoomTo(increment){
        this.Zoom.Zoom = increment;
        return this.Render();
    }
    MapControlPan(clientX, clientY){
        if(!this.Pan.Vertical.isEnabled && !this.Pan.Horizontal.isEnabled) {
            return false;
        }

        let hor = parseFloat((clientX - this.Pan.XStart).toFixed(2));
        let ver = parseFloat((clientY - this.Pan.YStart).toFixed(2));

        this.Pan.XStart = clientX;
        this.Pan.YStart = clientY;

        let offsetX = this.Elements.Map.offsetLeft ? this.Elements.Map.offsetLeft : 0;
        let offsetY = this.Elements.Map.offsetTop ? this.Elements.Map.offsetTop : 0;

        if(this.Pan.Horizontal.isEnabled) {
            this.Elements.Map.style.left = parseFloat(offsetX + hor) + "px";
        }
        if(this.Pan.Vertical.isEnabled) {
            this.Elements.Map.style.top = parseFloat(offsetY + ver) + "px";
        }
    }
    MapControlPanCallback(){

        this.Pan.Boundaries = {
            top: 0,
            right: (this.Elements.Map.offsetWidth - this.Viewport.Width) * -1,
            bottom: (this.Elements.Map.offsetHeight - this.Viewport.Height) * -1,
            left: 0
        }
        
        var animation = {
            iterations: 1,
            duration: 250
        }

        let self = this;

        if(
            this.Pan.Horizontal.isEnabled &&
            ( 
                this.Elements.Map.offsetLeft < this.Pan.Boundaries.right ||
                this.Elements.Map.offsetLeft > this.Pan.Boundaries.left
            )
        ) {
            this.Pan.Horizontal.isEnabled = false;

            if(this.Elements.Map.offsetLeft < this.Pan.Boundaries.right) {
                var keyframes = Array(
                    {
                        left: this.Elements.Map.offsetLeft + "px"
                    }, 
                    {
                        left: this.Pan.Boundaries.right + "px"
                    }
                );
                var callback = {
                    left: this.Pan.Boundaries.right + "px"
                }
            }
            if(this.Elements.Map.offsetLeft > this.Pan.Boundaries.left) {
                var keyframes = Array(
                    {
                        left: this.Elements.Map.offsetLeft + "px"
                    },
                    {
                        left: this.Pan.Boundaries.left + "px"
                    }
                );
                var callback = {
                    left: this.Pan.Boundaries.left + "px"
                }
            }  

            this.Elements.Map.Animation(
                keyframes,
                animation,
                function(){
                    self.Elements.Map.Styles(callback)
                }
            );

            this.Pan.Horizontal.isEnabled = true;
        }

        if(
            this.Pan.Vertical.isEnabled &&
            (
                this.Elements.Map.offsetTop < this.Pan.Boundaries.bottom ||
                this.Elements.Map.offsetTop > this.Pan.Boundaries.top
            ) 
        ) {
            this.Pan.Vertical.isEnabled = false;

            if(this.Elements.Map.offsetTop < this.Pan.Boundaries.bottom) {
                var keyframes = Array(
                    {
                        top: this.Elements.Map.offsetTop + "px"
                    },
                    {
                        top: this.Pan.Boundaries.bottom + "px"
                    }
                );
                var callback = {
                    top: this.Pan.Boundaries.bottom + "px"
                }
            }
            if(this.Elements.Map.offsetTop > this.Pan.Boundaries.top) {
                var keyframes = Array(
                    {
                        top: this.Elements.Map.offsetTop + "px"
                    },
                    {
                        top: this.Pan.Boundaries.top + "px"
                    }
                );
                var callback = {
                    top: this.Pan.Boundaries.top + "px"
                }
            }

            this.Elements.Map.Animation(
                keyframes,
                animation,
                function(){
                    self.Elements.Map.Styles(callback)
                }
            );

            this.Pan.Vertical.isEnabled = true;
        }
    }
    MoveToLocation(m) {

        if(this.Markers.hasOwnProperty(m.groupId) && this.Markers[m.groupId].items.hasOwnProperty(m.itemId)){
            this.ZoomTo(3);

            let Item = this.Markers[m.groupId].items[m.itemId];

            let pointOffset = {
                h: Math.abs(Item.position.x - this.Map.Longitude.Start) / Map.Map.StepSize.hor.coords * Map.Map.StepSize.hor.px * this.Zoom.Zoom * (-1),
                v: Math.abs(Item.position.y - this.Map.Latitude.Start) / Map.Map.StepSize.ver.coords * Map.Map.StepSize.ver.px * this.Zoom.Zoom * (-1)
            };
            let viewportOffset = {
                h: this.Viewport.Width / 2 - Item.Element.offsetWidth / 2,
                v: this.Viewport.Height / 2 - Item.Element.offsetHeight / 2
            }
            let calculatedOffset = {
                h: pointOffset.h + viewportOffset.h,
                v: pointOffset.v + viewportOffset.v
            }

            if(calculatedOffset.h > this.Pan.Boundaries.left) {
                calculatedOffset.h = this.Pan.Boundaries.left;
            } else if (calculatedOffset.h < this.Pan.Boundaries.right) {
                calculatedOffset.h = this.Pan.Boundaries.right;
            }

            if(calculatedOffset.v > this.Pan.Boundaries.top) {
                calculatedOffset.v = this.Pan.Boundaries.top;
            } else if (calculatedOffset.v < this.Pan.Boundaries.bottom) {
                calculatedOffset.v = this.Pan.Boundaries.bottom;
            }

            this.Elements.Map.Styles({
                "left": calculatedOffset.h + "px",
                "top": calculatedOffset.v + "px"
            });

            this.HighlightMarker(Item.id, Item.group.id);

            return this.Render();
        } else {
            return false;
        }
    }
    MapCoverArea(lon1, lat1, lon2, lat2){

    }

    // Markers
    AddMarkers(markers, context){
        if(!this.Elements.Map){
            return this.AddToSynchQueue('AddMarkers', this, Array(markers));
        }        

        context = context ? context : this;
        var self = context;

        markers.forEach(function(val){
            if(!self.Markers[val.group.id]){
                self.Markers[val.group.id] = {
                    id: val.group.id,
                    label: val.group.label,
                    slug: val.group.slug,
                    icon: val.group.icon,
                    items: {}
                };
            }
            if(self.Markers[val.group.id]['items'][val.id]){
                console.log('Warning: Duplicate marker ID');
                return;
            } else {
                self.Markers[val.group.id]['items'][val.id] = new InteractiveMapMarker({
                    id: val.id,
                    group: val.group,
                    label: val.label,
                    position: val.position,
                    desc: val.description ? val.description : null
                });
            }
        });

        if(!context.Elements.Markers){
            var MField = document.createElement('div');
                MField.className = 'iamap-markerslayer';
                MField.style.position = 'absolute';
                MField.style.left = 0; MField.style.top = 0; MField.style.right = 0; MField.style.bottom = 0;
            context.Elements.Markers = MField;
            context.Elements.Map.appendChild(context.Elements.Markers);
        }

        context.Render();
    }
    HideMarkers(filter) {
        let Markers = this.FilterMarkers(filter).items;

        if(Markers){
            for(let key in Markers){
                let MarkerId = Markers[key].id;
                let MarkerGroup = Markers[key].group.id;

                if(this.Markers[MarkerGroup] && this.Markers[MarkerGroup].items[MarkerId]){
                    this.Markers[MarkerGroup].items[MarkerId].render = false;
                }
            }
        } else {
            return false;
        }

        this.Render();
    }
    ShowMarkers(filter){
        let Markers = this.FilterMarkers(filter).items;

        if(Markers){
            for(let key in Markers){
                let MarkerId = Markers[key].id;
                let MarkerGroup = Markers[key].group.id;

                if(this.Markers[MarkerGroup] && this.Markers[MarkerGroup].items[MarkerId]){
                    this.Markers[MarkerGroup].items[MarkerId].render = true;
                }
            }
        } else {
            return false;
        }

        this.Render();
    }
    FilterMarkers(filter){
        if(!filter){
            let filter = {
                type: 'all'
            };
        }

        let Markers;
        
        switch(filter.type){
            case 'group':
                if(!filter.group){
                    Markers = null;
                } else {
                    Markers = this.Markers[filter.group];
                }
                break;
            case 'marker':
                if(!filter.group || !filter.id){
                    Markers = null;
                } else {
                    Markers = this.Markers[filter.group]['items'][filter.id];
                }
                break;
            case 'all':
            default:
                Markers = this.Markers;
                break;
        }

        return Markers == null ? false : Markers;
    }
    HighlightMarker(id, grp) {
        return console.log('Highlighting marker ', id, ' from group ', grp);
    }

    // Map controllers
    CreateControllers() {
        var self = this;

        this.Elements.Controllers = {};

        var ControllersElement = document.createElement('div');
            ControllersElement.Properties({
                className: 'iamap-controllerslayer'
            });
            ControllersElement.Styles({
                "position": 'absolute',
                "bottom": "15px",
                "right": "15px",
                "z-index": 100,
                "text-align": 'right'
            });
        this.Elements.Controllers.Parent = ControllersElement;
        this.Elements.Parent.appendChild(this.Elements.Controllers.Parent);

        // Location controller
        var LocationController = document.createElement('span');
            LocationController.Styles({
                "position": 'relative',
                "display": 'inline-block',
                "width": '32px',
                "height": '32px',
                "background-size": '32px 32px',
                "background-image": 'url("assets/map.icon.location.svg")',
                "margin-right": "32px"
            });
            LocationController.addEventListener('click', function(e){
                e.preventDefault();
                self.MapShowCurrentLocation();
            }); 
        this.Elements.Controllers.Location = LocationController;
        this.Elements.Controllers.Parent.appendChild(this.Elements.Controllers.Location);


        // Zoom controllers
        var ZoomInController = document.createElement('span');
            ZoomInController.Styles({
                "position": 'relative',
                "display": 'inline-block',
                "width": '32px',
                "height": '32px',
                "background-size": '32px 32px',
                "background-image": 'url("assets/map.icon.zoom-in.svg")'
            });
            ZoomInController.addEventListener('click', function(e){
                e.preventDefault();
                self.MapControlZoom(true);
            });
        this.Elements.Controllers.ZoomIn = ZoomInController;
        this.Elements.Controllers.Parent.appendChild(this.Elements.Controllers.ZoomIn);

        var ZoomOutController = document.createElement('span');
            ZoomOutController.Styles({
                "position": 'relative',
                "display": 'inline-block',
                "width": '32px',
                "height": '32px',
                "background-size": '32px 32px',
                "background-image": 'url("assets/map.icon.zoom-out.svg")',
                "margin-left": "6px"
            });
            ZoomOutController.addEventListener('click', function(e){
                e.preventDefault();
                self.MapControlZoom(false);
            });
        this.Elements.Controllers.ZoomOut = ZoomOutController;
        this.Elements.Controllers.Parent.appendChild(this.Elements.Controllers.ZoomOut);

        // Map movement
        this.Elements.Map.addMultipleListeners('mousedown', 'touchstart', function(e){
            e.preventDefault();

            switch(e.type) {
                case 'mousedown':
                    self.Pan.mouseDrag = true;

                    self.Pan.XStart = parseFloat((e.clientX - self.Elements.Parent.offsetLeft).toFixed(2));
                    self.Pan.YStart = parseFloat((e.clientY - self.Elements.Parent.offsetTop).toFixed(2));

                    break;
                case 'touchstart':
                    self.Pan.touchDrag = true;

                    self.Pan.XStart = parseFloat((e.changedTouches[0].clientX - self.Elements.Parent.offsetLeft).toFixed(2));
                    self.Pan.YStart = parseFloat((e.changedTouches[0].clientY - self.Elements.Parent.offsetTop).toFixed(2));

                    break;
            }
        });
        this.Elements.Map.addMultipleListeners('mousemove', 'touchmove', function(e){
            e.preventDefault();

            switch(e.type){
                case 'mousemove':
                    if(self.Pan.mouseDrag && self.Pan.IsEnabled){
                        var cursorX = window.event.clientX;
                        var cursorY = window.event.clientY;
                    } else {
                        return false;
                    }
                    break;
                case 'touchmove':
                    if(self.Pan.touchDrag && self.Pan.IsEnabled){
                        var cursorX = parseFloat((window.event.changedTouches[0].clientX).toFixed(2));
                        var cursorY = parseFloat((window.event.changedTouches[0].clientY).toFixed(2));
                    } else {
                        return false;
                    }
                    break;
            }

            self.MapControlPan(cursorX, cursorY);
        });
        this.Elements.Map.addMultipleListeners('mouseup', 'mouseleave', 'touchend', function(e){
            e.preventDefault();

            self.Pan.touchDrag = false;
            self.Pan.mouseDrag = false;

            self.MapControlPanCallback();

            self.Pan.XStart = null;
            self.Pan.YStart = null;
        });

        return true

        // Marker controls
        var FilterWrapper = document.createElement('div');
            FilterWrapper.className = 'iamap-filterwrapper';

        var FilterWrapperClose = document.createElement('span');
            FilterWrapperClose.className = 'close';
            FilterWrapperClose.addEventListener('click', function(e){
                self.ToggleMapSidebar('close');
            });

        FilterWrapper.appendChild(FilterWrapperClose);

        this.Elements.Controllers.FilterWrapper = FilterWrapper;
        this.Elements.Parent.appendChild(this.Elements.Controllers.FilterWrapper);

        for(let key in self.Markers){
            let Marker = self.Markers[key];

            if(Marker.controller === false){
                return;
            }

            let MarkerController = document.createElement('label');
                MarkerController.htmlFor = Marker.slug;
            let MarkerControllerTxt = document.createTextNode(Marker.label);
            let MarkerControllerInput = document.createElement('input');
                MarkerControllerInput.type = 'checkbox';
                MarkerControllerInput.checked = 'checked';
                MarkerControllerInput.id = Marker.slug; MarkerControllerInput.name = Marker.slug;
                MarkerControllerInput.addEventListener('change', function(e){
                    if(this.checked) {
                        MarkerController.classList.add('active');
                        self.ShowMarkers({
                            type: 'group',
                            group: Marker.id.toString()
                        });
                    } else {
                        MarkerController.classList.remove('active');
                        self.HideMarkers({
                            type: 'group',
                            group: Marker.id.toString()
                        });
                    }
                });

                MarkerController.append(
                    MarkerControllerInput,
                    MarkerControllerTxt
                );

            this.Elements.Controllers["Group"+Marker.id] = MarkerController;
            this.Elements.Controllers.FilterWrapper.appendChild(this.Elements.Controllers["Group"+Marker.id]);
        }

        return true;
    }

    // Queue
    AddToSynchQueue(name, context, args){
        let self = this;

        this.SynchQueue.push({
            f: name,
            c: context ? self : null,
            data: Array.isArray(args) ? args : Array(args)
        });
    }
    RunSynchQueue(){
        let self = this;

        this.SynchQueue.forEach(function(e, key){
            if(e.c) {
                e.data.push(self);
            }
            self[e.f].apply(self, e.data);
            self.SynchQueue.splice(key, 1);
        });
    }
}
class InteractiveMapMarker {
    constructor(cfg){
        if(!cfg || !cfg.group || !cfg.id || !cfg.position || !cfg.label){
            console.log('Marker error: The definition of config incorrect');
        } else {
            this.id = cfg.id;
            this.group = cfg.group;
            this.position = cfg.position;
            this.label = cfg.label;
            this.desc = cfg.desc ? cfg.desc : "";
            this.render = true;
        }
    }
    cfgError(field){
        return alert('The field ' + field + ' is missing from configuration');
    }
    getPosition(){
        return this.position;
    }
}
