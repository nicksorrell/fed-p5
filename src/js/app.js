/*****
* Global var declarations
*****/
var app = {
      viewmodel: new ViewModel() // Set up a namespace + reference to the view model
    },
    infowindow, // For the info window on the map
    map, // For the Google Maps view
    streetview, // For the Google Street View view
    valveInfowindow; // For the Valve-specific info window

/*****
* This is the Knockout viewmodel, which contains all functionality for the app
*****/
function ViewModel() {
   "use strict";

    var _this = this; // Create a reference to the viewmodel to avoid 'this' scoping issues

    this.valve = { // This object contains information for the specific Valve marker which is used by the map + street view
      coords: {
        lat: 47.614374,
        lng: -122.194059
      },
      name: 'Valve Corporation',
      address: '10900 NE 4th St, Bellevue, WA 98004',
      streetview: {
        coords: { // Street view coords are slightly different so we can get a good hard-coded shot of the building
          lat: 47.6137654,
          lng: -122.1950236
        },
        pov: {
          heading: 63,
          pitch: 30
        }
      }
    };

    this.valveMarker = {}; // Valve's location will have it's own marker apart from the queried results

    this.valveShown = ko.observable(false); // Used to determine whether the marker is active or not

    this.svShown = ko.observable(true); // Used to determine whether the street view panel is shown or not

    this.markers = ko.observableArray([]); // An array for all the map markers

    this.allPlaces = ko.observableArray([]); // An array for all the map places query results

    this.searchedPlaces = ko.observableArray(this.allPlaces()); // Used to hold filtered (via search) results. Default state is the full list

    this.filteredPlaces = ko.observableArray([]); // Used to hold results filtered from the search results via the type-filter (e.g., Bus) buttons

    this.selectedPlace = ko.observable({ // Identifies the current selected place by ID
      id:null
    });

    this.query = ko.observable(''); // Used to track the input search query

    this.searching = ko.observable(false); // Used to determine whether the user is searching or not

    this.valveMsg = ko.computed(function(){ // Text for the button which displays Valve on the map
      if(_this.valveShown()) {
        return "There!";
      } else {
        return "Where is Valve?";
      }
    }, this);

    this.svMsg = ko.computed(function(){ // Text for the button which toggles street view
      if(_this.svShown()) {
        return "Hide Street View";
      } else {
        return "Show Street View";
      }
    }, this);

    this.filters = ko.observableArray([ // Available filters which get turned into buttons in the view
      { label: 'Food', active: false, terms: ['restaurant', 'bar'] },
      { label: 'Lodging', active: false, terms: ['lodging'] },
      { label: 'Bus', active: false, terms: ['bus_station'] }
    ]);

    /*****
    * VIEWMODEL FUNCTION: sortArrayByAlpha
    * - Parameters:
    *   NONE
    *
    * - Alphabetical sort function used for sorting the list of places
    *****/
    this.sortArrayByAlpha = function (a, b){
      if(a.name > b.name) return 1;
      if(a.name < b.name) return -1;
      return 0;
    };

    /*****
    * VIEWMODEL FUNCTION: initMap
    * - Parameters:
    *   NONE
    *
    * - Called as a callback from the Google Maps script in the view
    * - Initializes the map and street view views, infowindows, and Valve marker
    * - Runs the makeRequests viewmodel function to request places via AJAX
    *****/
    this.initMap = function() {
      map = new google.maps.Map(document.getElementById('map'), {
        center: this.valve.coords,
        zoom: 16
      });

      streetview = new google.maps.StreetViewPanorama(
        document.getElementById('streetview'), {
          position: _this.valve.streetview.coords,
          pov: _this.valve.streetview.pov
      });

      infowindow = new google.maps.InfoWindow();
      valveInfowindow = new google.maps.InfoWindow();

      var image = 'img/valve.png';
      _this.valveMarker = new google.maps.Marker({
        map: map,
        position: this.valve.coords,
        animation: google.maps.Animation.DROP,
        icon: image,
        title: 'Valve'
      });

      google.maps.event.addListener(_this.valveMarker, 'click', function() {
        _this.showValve();
      });

      google.maps.event.addListener(infowindow, 'closeclick', function(){
        for(var i = 0; i < _this.markers().length; i++) {
          if(_this.markers()[i].id == _this.selectedPlace().id) {
            _this.markers()[i].marker.setAnimation(null);
            _this.selectedPlace( { id:null } );
          }
        }
      });

      google.maps.event.addListener(valveInfowindow, 'closeclick', function(){
        _this.showValve();
      });

      this.makeRequests(); // Request lists of places via AJAX

      // Show the user where Valve is when the map loads
      _this.showValve();
      _this.valveMarker.setAnimation(google.maps.Animation.BOUNCE);
    };

    /*****
    * VIEWMODEL FUNCTION: showValve
    * - Parameters:
    *   NONE
    *
    * - Toggles the Valve map marker and infowindow, and sets the street view to Valve
    *****/
    this.showValve = function(){
      _this.valveMarker.setAnimation( (_this.valveMarker.getAnimation() === null ? google.maps.Animation.BOUNCE : null) );
      _this.valveShown( (_this.valveShown() ? false : true) );
      if(_this.valveShown()) {
        valveInfowindow.setContent('<div><strong>' + _this.valve.name + '</strong><br>' + _this.valve.address + '</div>');
        valveInfowindow.open(map, _this.valveMarker);
        streetview.setPosition( _this.valve.streetview.coords );
        streetview.setPov( _this.valve.streetview.pov );
      } else {
        valveInfowindow.close();
      }
    };

    /*****
    * VIEWMODEL FUNCTION: makeRequests
    * - Parameters:
    *   NONE
    *
    * - Declares and runs three AJAX requests for places from Google
    * - Each request corresponds to a type of place: restaurant/bar, bus station, and lodging
    *****/
    this.makeRequests = function(){
      var service = new google.maps.places.PlacesService(map);

      var foodRequest = {
        location: this.valve.coords,
        types: ['restaurant', 'bar'],
        rankBy: google.maps.places.RankBy.DISTANCE
      };
      service.nearbySearch(foodRequest, this.addResultsToList);

      var busRequest = {
        location: this.valve.coords,
        types: ['bus_station'],
        rankBy: google.maps.places.RankBy.DISTANCE
      };
      service.nearbySearch(busRequest, this.addResultsToList);

      var lodgingRequest = {
        location: this.valve.coords,
        types: ['lodging'],
        rankBy: google.maps.places.RankBy.DISTANCE
      };
      service.nearbySearch(lodgingRequest, this.addResultsToList);

    };

    /*****
    * VIEWMODEL FUNCTION: showDetails
    * - Parameters
    *     id: (string) the ID of the clicked place
    *     markerClick: (bool) whether the click originated from the menu or a map marker
    *
    * - Run when a place is clicked.
    * - Looks up the details, such as name and address, for the clicked place
    * - Handles map marker and street view activation
    *****/
    this.showDetails = function(id, markerClick) {
      var clickedMarker = markerClick === true ? true : false;
      var markers = _this.markers();
      var place = typeof(id) != "string" ? this : _this.getFilteredPlaceById(id); // The place needs to be looked up by ID if it comes from the menu, since Knockout passed the full object

      var service = new google.maps.places.PlacesService(map);

      // AJAX request for place details from Google
      service.getDetails({
        placeId: place.place_id
      }, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + place.formatted_address + '</div>');
        } else {
          console.log('Place details lookup request failed. STATUS: ' + status);
        }
      });


      // If the selected place is selected again, close the info window and de-select the map marker
      if(_this.selectedPlace().id == place.id) {
        for(var x = 0, y = markers.length; x < y; x++) {
          if(markers[x].marker.getAnimation() == 1){
            markers[x].marker.setAnimation(null);
          }
        }
        _this.selectedPlace( { id:null } );
        infowindow.close();
        return;
      }

      // Loop through the markers to find the one with the matching ID, and activate it and the infowindow
      for(var i = 0, j = markers.length; i < j; i++) {
        if(markers[i].id == place.id ){
          _this.selectedPlace(place);
          markers[i].marker.setAnimation(google.maps.Animation.BOUNCE);
          infowindow.open(map, markers[i].marker);
        } else {
          if(markers[i].marker.getAnimation() == 1){
            markers[i].marker.setAnimation(null);
          }
        }
      }

      // If a map marker was clicked, scroll the menu to show the active place
      if(clickedMarker){
          document.getElementById('menu').scrollTop = document.getElementsByClassName('active')[0].getBoundingClientRect().top + document.getElementById('menu').scrollTop - 75;
      }

      // Set the street view view to the location of the selected place
      streetview.setPosition( { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() } );
      streetview.setPov({
        heading: 0,
        pitch:20
      });
    };

    /*****
    * VIEWMODEL FUNCTION: getFilteredPlaceById
    * - Parameters
    *     id: (string) the ID of the place to look up
    *
    * - Takes an ID and returns the full place object that matches the ID
    * - ... this is done because Knockout passes the view object calling an event, but we want the place object in the gathered list
    *****/
    this.getFilteredPlaceById = function(id){
      for(var i = 0, j = this.filteredPlaces().length; i < j; i++){
        if(this.filteredPlaces()[i].id == id){
          return this.filteredPlaces()[i];
        }
      }
      return null;
    };

    /*****
    * VIEWMODEL FUNCTION: addResultsToList
    * - Parameters
    *     results: (array) a list of returned objects from an AJAX call
    *     status: (number) the status of the AJAX response
    *
    * - Runs as a callback to the requests made in the makeRequests function
    * - Loops through retured results and picks out the ones necessary for the application (food, lodging, bus stations)
    *****/
    this.addResultsToList = function(results, status){
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        var duplicate = false;
        var k = _this.allPlaces.length;

        for (var i = 0; i < results.length; i++) {
          // Only store the results that are primarily what we want. For example, no gym that has a smoothie bar being counted as a restaurant.
          if(results[i].types[0] == 'restaurant' || results[i].types[0] == 'bar' || results[i].types[0] == 'lodging' || results[i].types[0] == 'bus_station') {

              // Check to see if a place is already in our results so we don't create duplicate entries and markers...
              for(var j = 0; j < k; j++){
                if(this.allPlaces[j].id == results[i].id) {
                  // and if so, mark it as duplicate for use after the loop
                  duplicate = true;
                  break;
                }
              }

              // When the loop is finished, if we have a unique entry, add it to the main list through the createMarker function
              if(!duplicate){
                results[i].active = false;
                _this.allPlaces.push(results[i]);
                _this.filteredPlaces.push(results[i]);
                _this.filteredPlaces(_this.filteredPlaces().sort(_this.sortArrayByAlpha));
                _this.createMarker(results[i]);
              }
          }
        }
      } else {
        console.log('Google Places request failed. STATUS: ' + status);
      }
    };

    /*****
    * VIEWMODEL FUNCTION: createMarker
    * - Parameters
    *     place: (object) a place from the retured lists requested via AJAX
    *
    * - Creates a marker on the map view using the info in the passed in place
    * - Adds the marker to the list of markers
    *****/
    this.createMarker = function(place) {
      var placeLoc = place.geometry.location;

      var image = "";

      // Use the marker image corresponding with the place type
      switch(place.types[0]){
        case 'lodging':
          image = 'img/lodging.png';
          break;
        case 'restaurant':
        case 'bar':
          image = 'img/food.png';
          break;
        case 'bus_station':
          image = 'img/busstop.png';
          break;
      }

      var markerObj = {
        id: place.id,
        marker: new google.maps.Marker({
          icon: image,
          map: map,
          position: place.geometry.location,
          title: place.name
        })
      };

      google.maps.event.addListener(markerObj.marker, 'click', function() {
        _this.showDetails(place.id, true);
      });

      this.markers.push(markerObj);
    };

    /*****
    * VIEWMODEL FUNCTION: filterByType
    * - Parameters:
    *   NONE
    *
    * - Called by the filter buttons in the view
    * - Modifies the displayed list of places with matches for the filter type (read from the event object)
    *****/
    this.filterByType = function() {

      // Get the selected filter for lookup, and declare vars for the function
      var filterType = event.target.getAttribute('data-filter');
      var tempArray = [];
      var anyFilterActive = false;
      var filter;

      // Toggle the selected filter's active state in the filters observableArray
      for(filter in _this.filters()){
        if(_this.filters()[filter].label == filterType) {
          _this.filters.replace(_this.filters()[filter], {
            label: _this.filters()[filter].label,
            active : !_this.filters()[filter].active,
            terms: _this.filters()[filter].terms
          });
        }
      }

      // Check to see if there are no active filters
      for(filter in _this.filters()){
        if(_this.filters()[filter].active) {
          anyFilterActive = true;
        }
      }

      // If there are no active filters...
      if(!anyFilterActive){
        // But if searching... just show the results from the search
        if(_this.searching()){
          tempArray = _this.searchedPlaces();
          for(filter in _this.filters()){
            _this.filters.replace(_this.filters()[filter], {
              label: _this.filters()[filter].label,
              active : false,
              terms: _this.filters()[filter].terms
            });
          }
        } else {
          // And if searching... show all the places, since no form of filtering is active
          tempArray = _this.allPlaces();
          for(filter in _this.filters()){
            _this.filters.replace(_this.filters()[filter], {
              label: _this.filters()[filter].label,
              active : false,
              terms: _this.filters()[filter].terms
            });
          }
        }
      } else {
        // There are active filters, so...
        // If searching too, filter places from the search-filtered place list (searchedPlaces array)
        if(_this.searching()){
          for(filter in _this.filters()){
            if(_this.filters()[filter].active === true){
              for(var i = 0, j = _this.searchedPlaces().length; i < j; i++) {
                for(var k = 0, l = _this.filters()[filter].terms.length; k < l; k++){
                  if(_this.searchedPlaces()[i].types[0] == _this.filters()[filter].terms[k]) {
                    tempArray.push(_this.searchedPlaces()[i]);
                  }
                }
              }
            }
          }
        } else {
          // If not searching, filter places from the list of all places (allPlaces array)
          for(filter in _this.filters()){
            if(_this.filters()[filter].active === true){
              for(var m = 0, n = _this.allPlaces().length; m < n; m++) {
                for(var o = 0, p = _this.filters()[filter].terms.length; o < p; o++){
                  if(_this.allPlaces()[m].types[0] == _this.filters()[filter].terms[o]) {
                    tempArray.push(_this.allPlaces()[m]);
                  }
                }
              }
            }
          }
        }
      }

      // Finally, adjust the displayed list of places and call the filterMarkers function
      tempArray.sort(_this.sortArrayByAlpha);
      _this.filteredPlaces(tempArray);
      _this.filterMarkers();
    };

    /*****
    * VIEWMODEL FUNCTION: filterMarkers
    * - Parameters:
    *   NONE
    *
    * - Called by the filterByType function
    * - Compares filtered places and marker list, and only shows markers whose ID matches a filtered place
    *****/
    this.filterMarkers = function() {
      for(var i = 0, j = this.markers().length; i < j; i++) {
        this.markers()[i].marker.setMap(null);
        for(var k = 0, l = this.filteredPlaces().length; k < l; k++) {
          if(this.markers()[i].id == this.filteredPlaces()[k].id) {
            this.markers()[i].marker.setMap(map);
          }
        }
      }
    };

    /*****
    * VIEWMODEL FUNCTION: search
    * - Parameters
    *     query: (string) user-inputted text from the view text input
    *
    * - Adjusts the list of searched places based on the query string
    * - Calls the main filtering function (filterByType) to adjust the displayed list of places
    *****/
    this.search = function(query){
      var tempArray = [];

      if(query !== ''){
        _this.searching(true);
      }

      for(var place in _this.allPlaces()) {
        if(_this.allPlaces()[place].name.toLowerCase().indexOf(query.toLowerCase()) >= 0) {
          tempArray.push(_this.allPlaces()[place]);
        }
      }

      _this.searchedPlaces(tempArray);
      _this.filterByType();
    };

    /*****
    * VIEWMODEL FUNCTION: toggleSV
    * - Parameters:
    *   NONE
    *
    * - Called by the view button to toggle street view
    * - Adjusts the 'right' position of the street view panel to show or hide it
    *****/
    this.toggleSV = function(){
      var sv = document.getElementById('streetview');
      if(_this.svShown()) {
        sv.style.right = ((0 - sv.getBoundingClientRect().width).toString() - 50).toString() + "px";
      } else {
        sv.style.right = "0";
      }
      _this.svShown( ( _this.svShown() ? false : true ) );
    };
}

/*****
* Window load event function.
* - Subscribe the viewmodel query observable to the viewmodel search observable
* - Set up the Knockout viewmodel bindings so everything will function
*****/
window.onload = function(){
  app.viewmodel.query.subscribe(app.viewmodel.search);
  ko.applyBindings(app.viewmodel);
};
