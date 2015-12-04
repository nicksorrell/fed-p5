function ViewModel() {
   "use strict";

    var _this = this;

    this.valve = {lat: 47.614374, lng: -122.194059};

    this.markers = ko.observableArray([]);

    this.allPlaces = ko.observableArray([]);

    this.filteredPlaces = ko.observableArray([]);

    this.selectedPlace = ko.observable({
      id:null
    });

    this.filters = ko.observableArray([
      { label: 'food', active: false, terms: ['restaurant', 'bar'] },
      { label: 'lodging', active: false, terms: ['lodging'] },
      { label: 'bus', active: false, terms: ['bus_station'] },
      { label: 'reset', active: false, terms: []}
    ]);

    this.initMap = function(){
      map = new google.maps.Map(document.getElementById('map'), {
        center: this.valve,
        zoom: 16
      });

      infowindow = new google.maps.InfoWindow();

      var image = 'img/valve.png';
      var marker = new google.maps.Marker({
        map: map,
        position: this.valve,
        animation: google.maps.Animation.DROP,
        icon: image
      });

      this.makeRequests();
    };

    this.makeRequests = function(){
      var service = new google.maps.places.PlacesService(map);

      var foodRequest = {
        location: this.valve,
        types: ['restaurant', 'bar'],
        rankBy: google.maps.places.RankBy.DISTANCE
      };
      service.nearbySearch(foodRequest, this.addResultsToList);

      var busRequest = {
        location: this.valve,
        types: ['bus_station'],
        rankBy: google.maps.places.RankBy.DISTANCE
      };
      service.nearbySearch(busRequest, this.addResultsToList);

      var lodgingRequest = {
        location: this.valve,
        types: ['lodging'],
        rankBy: google.maps.places.RankBy.DISTANCE
      };
      service.nearbySearch(lodgingRequest, this.addResultsToList);

    };

    this.showDetails = function(id) {
      var markers = _this.markers();
      var place = typeof(id) != "string" ? this : _this.getFilteredPlaceById(id);

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

      for(var i = 0, j = markers.length; i < j; i++) {
        if(markers[i].id == place.id ){
          _this.selectedPlace(place);
          markers[i].marker.setAnimation(google.maps.Animation.BOUNCE);
          infowindow.setContent(place.name);
          infowindow.open(map, markers[i].marker);
        } else {
          if(markers[i].marker.getAnimation() == 1){
            markers[i].marker.setAnimation(null);
          }
        }
      }


      document.getElementById('menu').scrollTop = document.getElementsByClassName('active')[0].getBoundingClientRect().top + document.getElementById('menu').scrollTop - 75;
    };

    this.getFilteredPlaceById = function(id){
      for(var i = 0, j = this.filteredPlaces().length; i < j; i++){
        if(this.filteredPlaces()[i].id == id){
          return this.filteredPlaces()[i];
        }
      }
      return null;
    };

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

              // When the loop is finished, if we have a unique entry, add it to the main list
              if(!duplicate){
                results[i].active = false;
                _this.allPlaces.push(results[i]);
                _this.filteredPlaces.push(results[i]);
                _this.createMarker(results[i]);
              }
          }
        }
      }
    };

    this.createMarker = function(place) {
      var placeLoc = place.geometry.location;

      var image = "";

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
          position: place.geometry.location
        })
      };

      google.maps.event.addListener(markerObj.marker, 'click', function() {
        _this.showDetails(place.id);
      });

      this.markers.push(markerObj);
    };

    this.filterBy = function() {
      // Get the selected filter for lookup, and init vars for the function
      var filterType = event.target.getAttribute('data-filter');
      var tempArray = [];
      var anyFilterActive = false;
      var filter;

      // Check to see if there are no active filters
      for(filter in _this.filters()){
        if(_this.filters()[filter].active) {
          anyFilterActive = true;
        }
      }

      // If the reset option is selected, set all filters to inactive. Or if no filters are active anyway...
      if(filterType == 'reset' || anyFilterActive){
        // Put all our results in the temp array since we're not filtering
        tempArray = _this.allPlaces();
        for(filter in _this.filters()){
          _this.filters.replace(_this.filters()[filter], {
            label: _this.filters()[filter].label,
            active : false,
            terms: _this.filters()[filter].terms
          });
        }
        // Otherwise, toggle the selected filter's active state in the filters observableArray
      } else {
        for(filter in _this.filters()){
          if(_this.filters()[filter].label == filterType) {
            _this.filters.replace(_this.filters()[filter], {
              label: _this.filters()[filter].label,
              active : !_this.filters()[filter].active,
              terms: _this.filters()[filter].terms
            });
          }
        }

        // look at each filter, if it is active, push matches into the temp array...
        for(filter in _this.filters()){
          if(_this.filters()[filter].active === true){
            for(var i = 0, j = _this.allPlaces().length; i < j; i++) {
              for(var k = 0, l = _this.filters()[filter].terms.length; k < l; k++){
                if(_this.allPlaces()[i].types[0] == _this.filters()[filter].terms[k]) {
                  tempArray.push(_this.allPlaces()[i]);
                }
              }
            }
          }
        }
      }

      // finally, filter the results and display them
      _this.filteredPlaces(tempArray);
      _this.filterMarkers();
    };

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
}

var map;
var infowindow;
var app = {
    viewmodel: new ViewModel()
};

window.onload = function(){
  ko.applyBindings(app.viewmodel);
};
