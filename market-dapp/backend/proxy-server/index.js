const express = require('express');
const morgan = require("morgan");
const bodyParser = require('body-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');
var cors = require('cors');

const fs = require('fs');

const fetch = require('node-fetch');
// Create Express Server
const app = express();

// Configuration
const PORT = 3001;
const HOST = "localhost";
const API_SERVICE_URL = "https://api.json2video.com/v2/movies";

//use Cors
app.use(cors()) // include before other routes
//For parsing JOSN data
app.use(bodyParser.json());

app.use(bodyParser.raw({type: 'application/octet-stream', limit : '12mb'}))

// Logging requests
app.use(morgan('dev')); 


//********************************/
const {Movie, Scene} = require("json2video-sdk");
        
//TODO SCENES ARRAY
async function doVideo(scenesObject) {

    /*******
     * {
        
            "scenes": [
              {
                "background-color": "#4392F1",
                "elements": [
                  {
                    "type": "text",
                    "style": "003",
                    "text": description,
                    "duration": 2,
                    "start": 1
                  }
                ]
              },
              {
                "background-color": "#4392F1",
                "elements": [
                  {
                    "type": "text",
                    "style": "003",
                    "text": series,
                    "duration": 2,
                    "start": 3
                  }
                ]
              }
            ]
          }
     */
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

    const scenes = scenesObject.scenes;

    for(let sceneObj of scenes) {

        // Create a new scene
        let scene = new Scene;

        console.log('sceneObj is: ', sceneObj);

        // Set the scene background color
        scene.set("background-color",  sceneObj['background-color']);

        // Add a text element printing "Hello world" in a fancy way (style 003)
        // The element is 10 seconds long and starts 2 seconds from the scene start

        for(let elementObj of sceneObj.elements) {
            scene.addElement(elementObj);
        }
        // Add the scene to the movie
        movie.addScene(scene);
    }

    console.log('MOVIE IS', JSON.stringify(movie));
 
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
            return status.movie.url;
        })
        .catch((err) => {
            console.log("Error: ", err);
            return null;
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



app.post('/json2video', (req, res) => {


    //JSON SCENES
    const scenes = req.body;
    console.log('SCENES: ',scenes);

    doVideo(scenes).then(url => {
        console.log('got url: ', url);
        getVideoBuffer(url).then(buffer => {

            //save file locally
            fs.createWriteStream("./scene-frames.mp4").write(buffer);

            console.log('buffer: ', buffer);
            res.status(200).send(buffer);
        });

    }).catch( err => {
        console.log('buffer error: ', err);
        res.status(200).send([]);
    });


    //video for testing purposes
    //const url = 'https://assets.json2video.com/clients/vkyssyob9a/renders/2022-08-18-89909.mp4';
    //getVideoBuffer(url).then(buffer => {
    //    console.log('buffer was: ', buffer);
    //    res.status(200).send(buffer);
    //});
    
});

app.post('/mergevideos', (req, res) => {


    //JSON SCENES
    const rawData = req.body;
    
    console.log('rawData: ',rawData);
    const buffer = Buffer.from(rawData);

    //save file locally
     fs.createWriteStream("./uploaded-video.mp4").write(buffer);
     
     //concat both
     const concat = require('ffmpeg-concat')
     console.log('Will merge both videos now...');
     concat({
        output: './merged.mp4',
        videos: [
          './scene-frames.mp4',
          './uploaded-video.mp4',
        ],
        transition: {
          name: 'directionalWipe',
          duration: 500
        }
      }).then(result => {
        console.log('Merge files OK :', result);
        const outputBuffer = fs.readFileSync('./merged.mp4', null).buffer;
        console.log('read outputBuffer: ', outputBuffer);
        res.status(200).send(outputBuffer);  
      }).catch(err => {
        console.log('Merge files error :', err);
        console.log('buffer: ', buffer);
        res.status(200).send(buffer);    
        //TODO save uploaded video, merge with frames one
        //save new merged output file and read the data back to client
      })

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
/**app.use('/json2video', createProxyMiddleware({
    target: API_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        [`^/json2video`]: '',
    },
 }));*/

 // Start the Proxy
app.listen(PORT, HOST, () => {
    console.log(`Starting Proxy at ${HOST}:${PORT}`);
 });
 
 