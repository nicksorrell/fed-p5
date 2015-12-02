function ViewModel() {
    var _this = this;

    this.valve = {lat: 47.614374, lng: -122.194059},

    this.markers = ko.observableArray([]),

    this.allPlaces = ko.observableArray([]),

    this.filteredPlaces = ko.observableArray([]),

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
    },

    this.makeRequests = function(){
      var service = new google.maps.places.PlacesService(map);

      var foodRequest = {
        location: this.valve,
        types: ['restaurant', 'bar'],
        rankBy: google.maps.places.RankBy.DISTANCE
      }
      service.nearbySearch(foodRequest, this.addResultsToList);

      var busRequest = {
        location: this.valve,
        types: ['bus_station'],
        rankBy: google.maps.places.RankBy.DISTANCE
      }
      service.nearbySearch(busRequest, this.addResultsToList);

      var lodgingRequest = {
        location: this.valve,
        types: ['lodging'],
        rankBy: google.maps.places.RankBy.DISTANCE
      }
      service.nearbySearch(lodgingRequest, this.addResultsToList);

    },

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
                _this.allPlaces.push(results[i]);
                _this.filteredPlaces.push(results[i]);
                _this.createMarker(results[i]);
              }
          }
        }
      }
    },

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

      var marker = new google.maps.Marker({
        icon: image,
        map: map,
        position: place.geometry.location
      });

      marker.id = place.id;

      google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(place.name);
        infowindow.open(map, this);
      });

      this.markers.push(marker);
    }
};

var app = {
    viewmodel: new ViewModel()
}

window.onload = function(){
  ko.applyBindings(app.viewmodel);
}
