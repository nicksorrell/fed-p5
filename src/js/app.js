var ViewModel = {
    valve: {lat: 47.614374, lng: -122.194059},

    markers: [],

    allPlaces: ko.observableArray([]),

    filteredPlaces: ko.observableArray([]),

    initMap: function(){
      map = new google.maps.Map(document.getElementById('map'), {
        center: ViewModel.valve,
        zoom: 16
      });

      infowindow = new google.maps.InfoWindow();

      var image = 'img/valve.png';
      var marker = new google.maps.Marker({
        map: map,
        position: ViewModel.valve,
        animation: google.maps.Animation.DROP,
        icon: image
      });

      this.makeRequests();
    },

    makeRequests: function(){
      var service = new google.maps.places.PlacesService(map);

      var foodRequest = {
        location: ViewModel.valve,
        types: ['restaurant', 'bar'],
        rankBy: google.maps.places.RankBy.DISTANCE
      }
      service.nearbySearch(foodRequest, ViewModel.addResultsToList);

      var busRequest = {
        location: ViewModel.valve,
        types: ['bus_station'],
        rankBy: google.maps.places.RankBy.DISTANCE
      }
      service.nearbySearch(busRequest, ViewModel.addResultsToList);

      var lodgingRequest = {
        location: ViewModel.valve,
        types: ['lodging'],
        rankBy: google.maps.places.RankBy.DISTANCE
      }
      service.nearbySearch(lodgingRequest, ViewModel.addResultsToList);

    },

    addResultsToList: function(results, status){
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        var duplicate = false;
        var k = ViewModel.allPlaces.length;
        for (var i = 0; i < results.length; i++) {
          // Only store the results that are primarily what we want. For example, no gym that has a smoothie bar being counted as a restaurant.
          if(results[i].types[0] == 'restaurant' || results[i].types[0] == 'bar' || results[i].types[0] == 'lodging' || results[i].types[0] == 'bus_station') {

              // Check to see if a place is already in our results so we don't create duplicate entries and markers...
              for(var j = 0; j < k; j++){
                if(ViewModel.allPlaces[j].id == results[i].id) {
                  // and if so, mark it as duplicate for use after the loop
                  duplicate = true;
                  break;
                }
              }

              // When the loop is finished, if we have a unique entry, add it to the main list
              if(!duplicate){
                ViewModel.allPlaces.push(results[i]);
                ViewModel.filteredPlaces.push(results[i]);
                ViewModel.createMarker(results[i]);
              }
          }
        }
      }
    },

    createMarker: function(place) {
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

      google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(place.name);
        infowindow.open(map, this);
      });
    }
};

window.onload = function(){
  ko.applyBindings(ViewModel);
}
