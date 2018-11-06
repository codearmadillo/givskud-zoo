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

            }
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
    Loader() {
        var loaderElement = document.createElement('span');
            loaderElement.className = 'iamap-loader';
            loaderElement.textContent = 'Loading resources';

            return loaderElement;
    }
    Load() {
        var self = this;

        this.Elements.Parent.className = 'iamap';

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
                MElement.style.position = 'relative';

                MElement.style.backgroundImage = "url('" + this.Map.Source + "')";
                MElement.style.backgroundRepeat = 'no-repeat';
                MElement.style.backgroundPosition = 'center center';

                MElement.style.zIndex = 50;

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
            var MapBgStyle = '100% auto';

            var MapHeight = (this.Viewport.Height * this.Zoom.Zoom) + "px";
            var MapWidth = (this.Viewport.Height / this.Map.AspectRatio  * this.Zoom.Zoom).toFixed(2) + "px";
        } else {
            var MapBgStyle = 'auto 100%';

            var MapWidth = (this.Viewport.Width * this.Zoom.Zoom) + "px";
            var MapHeight = (this.Viewport.Width * this.Map.AspectRatio * this.Zoom.Zoom).toFixed(2) + "px";
        }

        // Dragging is enabled by default
        this.Pan.Horizontal.isEnabled = true
        this.Pan.Vertical.isEnabled = true;

        if(this.Map.Orientation == 'horizontal') {
            if(parseFloat(MapWidth) <= this.Viewport.Width) {
                MapOffset.left = (this.Viewport.Width - parseFloat(MapWidth)).toFixed(2) / 2;
                MapOffset.top = (this.Viewport.Height - parseFloat(MapHeight)).toFixed(2) / 2;
            } else {
                if(parseFloat(MapHeight) < this.Viewport.Height) {
                    MapOffset.top = (this.Viewport.Height - parseFloat(MapHeight)).toFixed(2) / 2;
                }
            }
        } else {
            if(parseFloat(MapHeight) <= this.Viewport.Height) {
                MapOffset.left = (this.Viewport.Width - parseFloat(MapWidth)).toFixed(2) / 2;
                MapOffset.top = (this.Viewport.Height - parseFloat(MapHeight)).toFixed(2) / 2;
            } else {
                if(parseFloat(MapWidth) < this.Viewport.Width) {
                    MapOffset.left = (this.Viewport.Width - parseFloat(MapWidth)).toFixed(2) / 2;
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
        this.Elements.Map.style.left = MapOffset.left + "px";
        this.Elements.Map.style.top = MapOffset.top + "px";
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

        return true;
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
    CreateControllers() {
        var self = this;

        this.Elements.Controllers = {};

        var ControllersElement = document.createElement('div');
            ControllersElement.className = 'iamap-controllerslayer';
            ControllersElement.style.position = 'absolute';
            ControllersElement.style.top = 0; ControllersElement.style.left = 0;
            ControllersElement.style.zIndex = 100;
        this.Elements.Controllers.Parent = ControllersElement;
        this.Elements.Parent.appendChild(this.Elements.Controllers.Parent);

        var LocationController = document.createElement('input');
            LocationController.type = 'button';
            LocationController.value = 'My location';
            LocationController.style.position = 'relative';
            LocationController.addEventListener('click', function(e){
                e.preventDefault();
                self.MapShowCurrentLocation();
            }); 
        this.Elements.Controllers.Location = LocationController;
        this.Elements.Controllers.Parent.appendChild(this.Elements.Controllers.Location);

        var ZoomInController = document.createElement('input');
            ZoomInController.type = "button";
            ZoomInController.value = "Zoom in";
            ZoomInController.style.position = "relative";
            ZoomInController.addEventListener('click', function(e){
                e.preventDefault();
                self.MapControlZoom(true);
            });
        this.Elements.Controllers.ZoomIn = ZoomInController;
        this.Elements.Controllers.Parent.appendChild(this.Elements.Controllers.ZoomIn);

        var ZoomOutController = document.createElement('input');
            ZoomOutController.type = 'button';
            ZoomOutController.value = 'Zoom out';
            ZoomOutController.style.position = "relative";
            ZoomOutController.addEventListener('click', function(e){
                e.preventDefault();
                self.MapControlZoom(false);
            });
        this.Elements.Controllers.ZoomOut = ZoomOutController;
        this.Elements.Controllers.Parent.appendChild(this.Elements.Controllers.ZoomOut);

        this.Pan.XStart = null;
        this.Pan.YStart = null;

        this.Pan.mouseDrag = false;
        this.Pan.touchDrag = false;

        this.Elements.Map.addEventListener('touchstart', function(e){
            e.preventDefault();

            self.Pan.touchDrag = true;

            self.Pan.XStart = parseFloat((e.changedTouches[0].clientX - self.Elements.Parent.offsetLeft).toFixed(2));
            self.Pan.YStart = parseFloat((e.changedTouches[0].clientY - self.Elements.Parent.offsetTop).toFixed(2));
        });
        this.Elements.Map.addEventListener('mousedown', function(e){
            e.preventDefault();

            self.Pan.mouseDrag = true;

            self.Pan.XStart = parseFloat((e.clientX - self.Elements.Parent.offsetLeft).toFixed(2));
            self.Pan.YStart = parseFloat((e.clientY - self.Elements.Parent.offsetTop).toFixed(2));
        });
        this.Elements.Map.addEventListener('touchend', function(e){
            e.preventDefault();

            self.Pan.touchDrag = false;

            self.MapControlPanCallback();

            self.Pan.XStart = null;
            self.Pan.YStart = null;
        });
        this.Elements.Map.addEventListener('mouseup', function(e){
            e.preventDefault();

            self.Pan.mouseDrag = false;

            self.MapControlPanCallback();
            
            self.Pan.XStart = null;
            self.Pan.YStart = null;
        });
        this.Elements.Map.addEventListener('mouseleave', function(e){
            if(self.Pan.mouseDrag){
                self.Pan.mouseDrag = false;

                self.MapControlPanCallback();

                self.Pan.XStart = null;
                self.Pan.YStart = null;
            }
        });
        this.Elements.Map.addEventListener('mousemove', function(e){
            e.preventDefault();

            if(self.Pan.mouseDrag && self.Pan.IsEnabled){
                let cursorX = window.event.clientX;
                let cursorY = window.event.clientY;

                self.MapControlPan(cursorX, cursorY);
            }
        });
        this.Elements.Map.addEventListener('touchmove', function(e){
            e.preventDefault;

            if(self.Pan.touchDrag && self.Pan.IsEnabled){
                let cursorX = parseFloat((window.event.changedTouches[0].clientX).toFixed(2));
                let cursorY = parseFloat((window.event.changedTouches[0].clientY).toFixed(2));

                self.MapControlPan(cursorX, cursorY);
            }
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
    ToggleMapSidebar(){
        switch(arguments[0]) {
            case 'close':  
                this.Elements.Controllers.FilterWrapper.css({
                    left: (this.Elements.Controllers.FilterWrapper.offsetWidth * -1) + "px"
                });
                break;
            case 'open':
                this.Elements.Controllers.FilterWrapper.css({
                    left: unset
                });
                break;
            default:
                
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

        return true;
    }
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
    MapControlPan(clientX, clientY){
        if(!this.Pan.Vertical.isEnabled && !this.Pan.Horizontal.isEnabled) {
            return false;
        }

        /*

        There new pan controller must use variables:
            - Pan.Horizontal.isEnabled
            - Pan.Vertical.isEnabled
        
        The boundaries will no longer be controlled here in this script.
        Instead, they will be controlled by callback, which, if needed, moves the map back to the viewport.

        */

        let hor = parseFloat((clientX - this.Pan.XStart).toFixed(2));
        let ver = parseFloat((clientY - this.Pan.YStart).toFixed(2));

        let directionX = this.Pan.XStart;
        let directionY = this.Pan.YStart;

        this.Pan.XStart = clientX;
        this.Pan.YStart = clientY;

        let offsetX = this.Elements.Map.offsetLeft ? this.Elements.Map.offsetLeft : 0;
        let offsetY = this.Elements.Map.offsetTop ? this.Elements.Map.offsetTop : 0;

        this.Pan.Boundaries = {
            top: 0,
            right: (this.Elements.Map.offsetWidth - this.Viewport.Width) * -1,
            bottom: (this.Elements.Map.offsetHeight - this.Viewport.Height) * -1,
            left: 0
        }

        if(this.Pan.Horizontal.isEnabled) {
            this.Elements.Map.style.left = parseFloat(offsetX + hor) + "px";
        }
        if(this.Pan.Vertical.isEnabled) {
            this.Elements.Map.style.top = parseFloat(offsetY + ver) + "px";
        }
    }
    MapControlPanCallback(){

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
                this.Elements.Map.css({
                    left: this.Pan.Boundaries.right + "px"
                });
            }
            if(this.Elements.Map.offsetLeft > this.Pan.Boundaries.left) {
                this.Elements.Map.css({
                    left: this.Pan.Boundaries.left + "px"
                });
            }

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
                this.Elements.Map.css({
                    top: this.Pan.Boundaries.bottom + "px"
                });
            }
            if(this.Elements.Map.offsetTop > this.Pan.Boundaries.top) {
                this.Elements.Map.css({
                    top: this.Pan.Boundaries.top + "px"
                });
            }

            this.Pan.Vertical.isEnabled = true;
        }
    }
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

        this.SynchQueue.forEach(function(e){
            if(e.c) {
                e.data.push(self);
            }
            self[e.f].apply(self, e.data);
        });
    }
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
