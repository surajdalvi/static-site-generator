var contentstack = require("contentstack-express");
var app = contentstack();
/**
* start the application
*/
app.listen((process.env.PORT || 4000));