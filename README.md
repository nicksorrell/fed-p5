# Let's Visit Valve!
This is a single-page application I built as one of my projects while completing the Front-End Web Developer Nanodegree on Udacity.

[Live example] (http://nicksorrell.com/udacity/fedp5/)

The purpose of the project was to create a neighborhood tour app that shows relevant info about notable locations via third-party APIs.

The app uses Google Maps and Street View to show users a filterable list of useful places around Valve Corporation's building in Bellevue, WA. Locations shown are:

- Restaurants and bars
- Bus stations
- Lodging

## How to Run
Running the app is as simple as making the files in the _dist_ folder (the _src_ folder works too if you want to debug) available on a web server. You can use your own online, or run Python or XAMPP -- whatever you like.

### Gulp Build Process
If you want to to build the source files into their minified and concatenated versions, use the following steps:

- Install the package via npm
- Run the default Gulp task to optimize images, minify and concatenate CSS and JS files
- Edit _index.html_ so that only the built _app.js_ file and the Google Maps scripts are present
- Run the _html-min_ Gulp task to minify _index.html_

## How it Works
The app uses _Knockout_ to provide overall MV* functionality.

The app requests list of places from the Google Places service, and gathers all results into a list used by the application.

The user can search through results by name, and filter results by type.

When the user selects a place, the place name and address will be shown on the map, and a street view for the place will be requested from Google's Street View service.
