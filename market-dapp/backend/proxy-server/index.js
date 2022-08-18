const express = require('express');
const morgan = require("morgan");
const { createProxyMiddleware } = require('http-proxy-middleware');
var cors = require('cors');

const fetch = require('node-fetch');
// Create Express Server
const app = express();

// Configuration
const PORT = 3001;
const HOST = "localhost";
const API_SERVICE_URL = "https://api.json2video.com/v2/movies";

//use Cors
app.use(cors()) // include before other routes

// Logging requests
app.use(morgan('dev')); 


//********************************/
const {Movie, Scene} = require("json2video-sdk");
        
//TODO SCENES ARRAY
async function doVideo(scenesArray) {
    console.log('do video called');
    // Create a new movie
    let movie = new Movie;

    // Set your API key
    // Get your free API key at https://json2video.com
    movie.setAPIKey(process.env.JSON2VIDEO_API_KEY);

    // Set movie quality: low, medium, high
    movie.set("quality", "high");

    movie.set("resolution", "full-hd");

    // Generate a video draft 
    movie.set("draft", true);

    // Create a new scene
    let scene = new Scene;

    // Set the scene background color
    scene.set("background-color",  "#4392F1");

    // Add a text element printing "Hello world" in a fancy way (style 003)
    // The element is 10 seconds long and starts 2 seconds from the scene start
    scene.addElement({
        type: "text",
        style: "003",
        text: "Hello world",
        duration: 10,
        start: 2
    });

    // Add the scene to the movie
    movie.addScene(scene);

    // Call the API and render the movie
    let render = await movie.render();
    console.log(render);

    // Wait for the movie to finish rendering
    await movie
        .waitToFinish((status) => {
            console.log("Rendering: ", status.movie.status, " / ", status.movie.message);
        })
        .then((status) => {
            console.log("Movie is ready: ", status.movie.url);
            console.log("Remaining final movies: ", status.remaining_quota.movies);
            console.log("Remaining drafts: ", status.remaining_quota.drafts);
        })
        .catch((err) => {
            console.log("Error: ", err);
        });
}

//The url is provide by API => status.movie.url
getVideoBuffer = async (url) => {

    let stream = await fetch(url);
    let arrayBuffer = await stream.arrayBuffer();
    console.log('got arrayBuffer: ', arrayBuffer);
    return Buffer.from(arrayBuffer);
}

//********************************/



// Info GET endpoint (Open)
app.get('/info', (req, res, next) => {
    //doVideo();
    res.send('This is a proxy service which proxies to JSON2Video APIs.');
});



app.get('/blob', (req, res, next) => {

    //video for testing purposes
    const url = 'https://assets.json2video.com/clients/vkyssyob9a/renders/2022-08-18-89909.mp4';
    getVideoBuffer(url).then(buffer => {
        console.log('buffer was: ', buffer);
        res.status(200).send(buffer);
    });
    

});


// Authorization
app.use('', (req, res, next) => {
    if (req.headers.authorization) {
        next();
    } else {
        res.sendStatus(403);
    }
 });

 // Proxy endpoints
app.use('/json2video', createProxyMiddleware({
    target: API_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        [`^/json2video`]: '',
    },
 }));

 // Start the Proxy
app.listen(PORT, HOST, () => {
    console.log(`Starting Proxy at ${HOST}:${PORT}`);
 });
 
 