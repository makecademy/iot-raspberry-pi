// Include required modules
var RaspiCam = require("raspicam");
var cloudinary = require('cloudinary');
var sensorLib = require('node-dht-sensor');
var dweetClient = require("node-dweetio");

// Create Dweet.io client
var dweetio = new dweetClient();

// Initialise camera module
var camera = new RaspiCam({mode: "photo",
  width: 1280,
  height: 720,
  output: "./image.jpg",
  encoding: "jpg",
  timeout: 0,
  n: true,
  rot: 180
});

// Configure Cloudinary access
cloudinary.config({ 
  cloud_name: 'cloud_name', 
  api_key: 'api_key', 
  api_secret: 'api_secret' 
});

// Take picture every 10 seconds & upload it
setInterval(function() {

  camera.start();

  camera.once("read", function(err, timestamp, filename){
    console.log("Picture recorded");
    camera.stop();
  });

  camera.once('stop', function() {

    // Upload picture
    cloudinary.uploader.upload("image.jpg", function(result) { 
      console.log(result) 
    }, { public_id: "raspberry_pi_camera"});
  });

}, 10000);

// Read from sensor & send to Dweet.io
var sensor = {
  initialize: function () {
      return sensorLib.initialize(11, 4);
  },
  read: function () {

      // Read from sensor
      var readout = sensorLib.read();
      var temperature = readout.temperature.toFixed(2);
      var humidity = readout.humidity.toFixed(2);
      console.log('Temperature: ' + temperature + 'C, ' +
          'humidity: ' + humidity + '%');

      // Send to Dweet
      dweetio.dweet({temperature: temperature, humidity: humidity}, function(err, dweet){

        console.log(dweet.thing); // The generated name
        console.log(dweet.content); // The content of the dweet
        console.log(dweet.created); // The create date of the dweet
      });

      setTimeout(function () {
          sensor.read();
      }, 10000);
  }
};

// Initialize DHT11 sensor
if (sensor.initialize()) {
    sensor.read();
} else {
    console.warn('Failed to initialize sensor');
}