var map;
var infowindow;
var valveInfowindow;
var app = {
    viewmodel: new ViewModel()
};

function ViewModel() {
   "use strict";

    var _this = this;

    this.valve = {
      coords: {
        lat: 47.614374,
        lng: -122.194059
      },
      name: 'Valve Corporation',
      address: '10900 NE 4th St, Bellevue, WA 98004'
    };

    this.valveMarker = {};

    this.valveShown = ko.observable(false);

    this.markers = ko.observableArray([]);

    this.allPlaces = ko.observableArray([]);

    // TO DO: make this the main filtration array, and have the type buttons filter this
    // have it just show all places (blank search) for init state
    this.searchedPlaces = ko.observableArray(this.allPlaces());

    this.filteredPlaces = ko.observableArray([]);

    this.selectedPlace = ko.observable({
      id:null
    });

    this.query = ko.observable('');

    this.searching = ko.observable(false);

    this.valveMsg = ko.computed(function(){
      if(_this.valveShown()) {
        return "There!";
      } else {
        return "So where is Valve?";
      }
    }, this);

    this.filters = ko.observableArray([
      { label: 'Food', active: false, terms: ['restaurant', 'bar'] },
      { label: 'Lodging', active: false, terms: ['lodging'] },
      { label: 'Bus', active: false, terms: ['bus_station'] }
    ]);

    this.sortArrayByAlpha = function (a, b){
      if(a.name > b.name) return 1;
      if(a.name < b.name) return -1;
      return 0;
    };

    this.initMap = function(){
      map = new google.maps.Map(document.getElementById('map'), {
        center: this.valve.coords,
        zoom: 16
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

      this.makeRequests();
    };

    this.showValve = function(){
      _this.valveMarker.setAnimation( (_this.valveMarker.getAnimation() === null ? google.maps.Animation.BOUNCE : null) );
      _this.valveShown( (_this.valveShown() ? false : true) );
      if(_this.valveShown()) {
        valveInfowindow.setContent('<div><strong>' + _this.valve.name + '</strong><br>' + _this.valve.address + '</div>');
        valveInfowindow.open(map, _this.valveMarker);
      } else {
        valveInfowindow.close();
      }
    };

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

    this.showDetails = function(id, markerClick) {
      var clickedMarker = markerClick === true ? true : false;
      var markers = _this.markers();
      var place = typeof(id) != "string" ? this : _this.getFilteredPlaceById(id);

      var service = new google.maps.places.PlacesService(map);

      service.getDetails({
        placeId: place.place_id
      }, function(place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + place.formatted_address + '</div>');
        }
      });


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
          infowindow.open(map, markers[i].marker);
        } else {
          if(markers[i].marker.getAnimation() == 1){
            markers[i].marker.setAnimation(null);
          }
        }
      }

      if(clickedMarker){
          document.getElementById('menu').scrollTop = document.getElementsByClassName('active')[0].getBoundingClientRect().top + document.getElementById('menu').scrollTop - 75;
      }
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
                _this.filteredPlaces(_this.filteredPlaces().sort(_this.sortArrayByAlpha));
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
          position: place.geometry.location,
          title: place.name
        })
      };

      google.maps.event.addListener(markerObj.marker, 'click', function() {
        _this.showDetails(place.id, true);
      });

      this.markers.push(markerObj);
    };

    this.filterByType = function() {

      // Get the selected filter for lookup, and init vars for the function
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

      // If the reset option is selected, set all filters to inactive. Or if no filters are active anyway...
      if(filterType == 'reset' || !anyFilterActive){
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
          tempArray = _this.allPlaces();
          for(filter in _this.filters()){
            _this.filters.replace(_this.filters()[filter], {
              label: _this.filters()[filter].label,
              active : false,
              terms: _this.filters()[filter].terms
            });
          }
        }
        // Put all our results in the temp array since we're not filtering

      } else {
        // look at each filter, if it is active, push matches into the temp array...
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

      // finally, filter the results and display them
      tempArray.sort(_this.sortArrayByAlpha);
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

      // finally, filter the results and display them
      _this.searchedPlaces(tempArray);
      _this.filterByType();
    };
}

window.onload = function(){
  app.viewmodel.query.subscribe(app.viewmodel.search);
  ko.applyBindings(app.viewmodel);
};
