
var userMediaStream;
var playlist1, playlist2;
let recorderSuccessfullyInitialized = false; // Initialization flag

navigator.getUserMedia = (navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);

function gotStream(stream) {
  if (recorderSuccessfullyInitialized) {
    console.warn("EventManager: gotStream called, but recorder is already successfully initialized. Skipping playlist3.initRecorder().");
    userMediaStream = stream; // Keep updating the stream reference if needed elsewhere
    // Hide spinner if it was shown by a redundant call path
    var existingSpinProgress = document.getElementById("spinprogress");
    if (existingSpinProgress) existingSpinProgress.style.display = "none";
    return;
  }
  userMediaStream = stream;
  var compressionChk = document.getElementById("compression");
  var eqChk = document.getElementById("eqsettings");

  console.log("EventManager/gotStream: Immediately before initRecorder call - eqset1 type:", typeof eqset1, "value:", eqset1);
  console.log("EventManager/gotStream: Immediately before initRecorder call - eqset2 type:", typeof eqset2, "value:", eqset2);
  console.log("EventManager/gotStream: Immediately before initRecorder call - eqset3 type:", typeof eqset3, "value:", eqset3);
  console.log("EventManager/gotStream: Immediately before initRecorder call - eqset4 type:", typeof eqset4, "value:", eqset4);
  console.log("EventManager/gotStream: Immediately before initRecorder call - eqset5 type:", typeof eqset5, "value:", eqset5);
  playlist3.initRecorder(userMediaStream, compressionChk.checked, eqChk.checked, eqset1, eqset2, eqset3, eqset4, eqset5);

  console.log("EventManager: Recorder initialized successfully via gotStream.");
  recorderSuccessfullyInitialized = true;

  var spinprogress = document.getElementById("spinprogress");
  spinprogress.style.display = "none";
  // $(".btn-record").removeClass("disabled");
  // console.log("gotStream", compressionChk.checked, eqChk.checked);
}

function startUserMedia(deviceID) {
  // CONSTRAINTS INITIALIZED AS WINDOW VARIABLE IN INDEX.HTML SO THEY APPLY TO ALL AUDIO CAPTURE
  // var constraints;
  console.log("EventManager/startUserMedia: Before getUserMedia call - eqset1 type:", typeof eqset1, "value:", eqset1);
  console.log("EventManager/startUserMedia: Before getUserMedia call - eqset2 type:", typeof eqset2, "value:", eqset2);
  console.log("EventManager/startUserMedia: Before getUserMedia call - eqset3 type:", typeof eqset3, "value:", eqset3);
  console.log("EventManager/startUserMedia: Before getUserMedia call - eqset4 type:", typeof eqset4, "value:", eqset4);
  console.log("EventManager/startUserMedia: Before getUserMedia call - eqset5 type:", typeof eqset5, "value:", eqset5);

  if (deviceID == "" || deviceID == undefined)
    ;// constraints = {audio: true};
  else {
    localStorage.savedPlaybackDevice = deviceID;
    // constraints = {
    //   audio: {
    //     deviceId: { exact: deviceID },
    //     echoCancellation: true,
    //     noiseSuppression: true,
    //     autoGainControl: true
    //   }
    // };
    constraints.audio.deviceId = deviceID;
  }


  if (navigator.mediaDevices) {
    if (isSafari == false)   ///04/16/23
    {
      navigator.mediaDevices.getUserMedia(constraints).then(gotStream).catch(logError);
    }
  }
  else
  if (navigator.getUserMedia && 'MediaRecorder' in window) {
    navigator.getUserMedia(constraints, gotStream, logError);
  }
}

function logError(err) {
  console.error(err);
}
let scrollingWaveform = false
let continuousWaveform = true
// Initialize the plugins
const regions = WaveSurfer.Regions.create();
const record = WaveSurfer.Record.create(
    false,
    scrollingWaveform,
    continuousWaveform,
    30);

playlist1 = new RecordWaveSurfer({
  container: '#curform',
  waveColor: '#FF4A85',
  progressColor: '#F83351',
  cursorColor: '#28f351',
  height: 40,
  responsive: true,
  waveWidth: document.getElementById("curform").clientWidth,
  plugins: [
    regions
  ],
  // url: "https://wavesurfer.xyz/wavesurfer-code/examples/audio/demo.wav"
})

// playlist1x =  WaveformPlaylist.init({
//   samplesPerPixel: 5000,
//   waveHeight: 40,//document.getElementById("curform").clientHeight + 2,
//   container: document.getElementById("curformx"),
//   state: 'cursor',
//   colors: {
//     waveOutlineColor: 'black',
//     timeColor: 'red',
//     fadeColor: 'black'
//   },
//   timescale: true,
//   controls: {
//     show: false, //whether or not to include the track controls
//     width: 200 //width of controls in pixels
//   },
//   seekStyle : 'line',
//   zoomLevels: [500, 1000, 3000, 5000],
//   waveWidth: document.getElementById("curformx").clientWidth
// });

playlist2 = new RecordWaveSurfer({
  container: '#nextform',
  waveColor: '#FF4A85',
  progressColor: '#F83351',
  cursorColor: '#28f351',
  height: 40,
  responsive: true,
  waveWidth: document.getElementById("nextform").clientWidth,
  plugins: [
    regions, // Enable regions plugin
    record
  ],
  // url: "https://wavesurfer.xyz/wavesurfer-code/examples/audio/demo.wav"
});
//     WaveformPlaylist.init({
//   samplesPerPixel: 5000,
//   waveHeight: 40,//document.getElementById("nextform").clientHeight + 2,
//   container: document.getElementById("nextform"),
//   state: 'cursor',
//   colors: {
//     waveOutlineColor: 'black',
//     timeColor: 'red',
//     fadeColor: 'black'
//   },
//   timescale: true,
//   controls: {
//     show: false, //whether or not to include the track controls
//     width: 200 //width of controls in pixels
//   },
//   seekStyle : 'line',
//   zoomLevels: [500, 1000, 3000, 5000],
//   waveWidth: document.getElementById("nextform").clientWidth
// });

playlist3 =new RecordWaveSurfer({
  container: '#recordform',
  waveColor: '#FF4A85',
  progressColor: '#F83351',
  cursorColor: '#28f351',
  height: 34,
  responsive: true,
  waveWidth: 288,//document.getElementById("recordform").clientWidth,
  plugins: [
    regions, // Enable regions plugin
  ],
  // url: "https://wavesurfer.xyz/wavesurfer-code/examples/audio/demo.wav"
});
//     WaveformPlaylist.init({
//   samplesPerPixel: 5000,
//   waveHeight: 34,//document.getElementById("recordform").clientHeight,
//   container: document.getElementById("recordform"),
//   state: 'cursor',
//   colors: {
//     waveOutlineColor: 'black',
//     timeColor: 'red',
//     fadeColor: 'black'
//   },
//   timescale: true,
//   controls: {
//     show: false, //whether or not to include the track controls
//     width: 200 //width of controls in pixels
//   },
//   seekStyle : 'line',
//   zoomLevels: [500, 1000, 3000, 5000],
//   waveWidth: 288//document.getElementById("recordform").clientWidth
// });

var ee1 = playlist1;
var ee2 = playlist2;
var ee3 = playlist3;
// var eeNew = playlist1x;

// ee1.on('click', (relativeX) => {
//   console.log(relativeX)
//   ee1.seekTo(relativeX/100);
// })
ee1.on("ready", function(duration) {
  locked1 = false;
  //todo: handle navigate on click

  // var canvas = document.getElementById("curform").getElementsByTagName("canvas")[0];
  // canvas.addEventListener("mousedown", function( event ) {
  //   ee1.seekTo(event.offsetX);
  // }, false);

  curTrackLengthSeconds1 = duration;
  var canvasdiv = document.getElementById("form1");
  canvasdiv.innerText = curTrackName1 + "  ---  " + getHMS(curTrackLengthSeconds1);
  canvasdiv.style.fontSize = "2.2vh";
  //canvasdiv.innerText += "\n";
  //canvasdiv.innerText += getHMS(curTrackLengthSeconds1);
});

ee1.on("finish", function() {
  if (recordstate === "playing" && vtStart === 10000)
    ee3.play();
});

ee1.on("timeupdate", function(sec) {
  playbackSeconds1 = sec;

  if (playbackSeconds1 > vtStart && recordstate === "playing" && voiceTrackState === false) {
    voiceTrackState = true;
    ee3.play();
    ee1.setVolume(validatePercent100(100 - ducking)); ///WP 11/22
    ee2.setVolume(validatePercent100(100 - ducking)); ///WP 11/22
  }

  // if (playbackSeconds1 > vtStart + leftTrackKeepTime && recordstate === "playing") {
  //       ee1.emit("stop");
  //       ee1.emit("mastervolumechange", 100);
  // }

  var canvasdiv = document.getElementById("form1");
  canvasdiv.innerText = curTrackName1 + "  ---  " + getHMS(curTrackLengthSeconds1 - playbackSeconds1);;
  //canvasdiv.innerText += "\n";
  //canvasdiv.innerText += getHMS(curTrackLengthSeconds1 - playbackSeconds1);
});

// ee2.on('click', (relativeX) => {
//   console.log(relativeX)
//   ee2.seekTo(relativeX);
// })

ee2.on("ready", function(duration) {
  locked2 = false;
  // var canvas = document.getElementById("nextform").getElementsByTagName("canvas")[0];
  // canvas.addEventListener("mousedown", function( event ) {
  //   ee2.seekTo(event.offsetX);
  // }, false);

  curTrackLengthSeconds2 = duration;
  var canvasdiv = document.getElementById("form2");
  canvasdiv.innerText = curTrackName2 + "  ---  " + getHMS(curTrackLengthSeconds2);
  canvasdiv.style.fontSize = "2.2vh";
  playbackSeconds2 = 0; ///07/2023/WP
  //canvasdiv.innerText += "\n";
  //canvasdiv.innerText += getHMS(curTrackLengthSeconds2);
});

ee2.on("timeupdate", function(sec) {

  playbackSeconds2 = sec;	 ///06/28/2023

  var canvasdiv = document.getElementById("form2");

  //08/29/23 WP
  if (introTime2 > 0 && sec < introTime2)
  {
    canvasdiv.innerText = getHMS(introTime2 - sec) + " :INTRO " + curTrackName2;
  }
  else
  {
    canvasdiv.innerText = curTrackName2 + "  ---  " + getHMS(sec);
  }
});

ee3.on("timeupdate", function(sec) {
  voicetrackPlaySecond = sec;
  if (voicetrackPlaySecond > nextstart && recordstate === "playing" && rightTrackState === false) {
    rightTrackState = true;
    ee2.play();

    var curvolume = localStorage.miclevel || 0.8;
    var fadeAudio = setInterval(function () {
      if (curvolume > 0) {
        curvolume -= 20;
        ee1.setVolume(curvolume);
      } else {
        ee1.stop();
        ee1.setVolume(1);
        clearInterval(fadeAudio);
      }
    }, /*400*/fadetime * 1000 / 5);
  }
});

ee3.on("voicetrackblob", function(mp3file) {
  curVoiceTrackFullPath = "Music/Tracks/" + mp3file.name;
  extractedFile.file(curVoiceTrackFullPath, mp3file);
  extractedFile.remove(plsFileFullName);
  extractedFile.file(plsFileFullName, ComposePLS(mp3file.name));

  // var storageWoker = new Worker(URL.createObjectURL(new Blob([ localStorageWorker ], { type: "text/javascript" })));
  // extractedFile.generateAsync({type:"blob"})
  //   .then(function (content) {
  //     // storageWoker.postMessage({command: 'saveToLocalStorage', zipfile: content});//content can not be passed becuase it is a promise so can't clone it
  //     storageWoker.postMessage({command: 'saveToLocalStorage'});
  //     storageWoker.onmessage = function(e){
  //       if (e.data.cmd == 'startLocalSave') {
  //         // zFile = new File([content], "a.zip", {type: "application/zip"});
  //         content.arrayBuffer().then(buffer => {
  //           localStorage.setItem("storageFiles", JSON.stringify(buffer));
  //           console.log("saved local storag", JSON.stringify(buffer), buffer);
  //         });
  //       }
  //     };
  //   });

  ParsePLS(extractedFile);
  listUpdateState = false;
  SaveExtractedFileToIndexDB(false);

  // console.log("receive", mp3file, extractedFile);
});

// ee3.on('click', (relativeX) => {
//   console.log(relativeX)
//   ee3.seekTo(relativeX / 100);
// })

ee3.on("ready", function(duration) {
  listUpdateState = false;
  // var canvas = document.getElementById("recordform").getElementsByTagName("canvas")[0];
  // canvas.addEventListener("mousedown", function( event ) {
  //   ee3.seekTo(event.offsetX);
  // }, false);

  curVoiceTrackLengthSecond = duration;
  // var canvasdiv = document.getElementById("form2");
  // canvasdiv.innerText = curTrackName2;
  // canvasdiv.innerText += "\n";
  // canvasdiv.innerText += getHMS(curTrackLengthSeconds2);
});

ee3.on("finish", function() {
  ee2.setVolume(1); ///WP 11/22
  if (vtStart === 10000)
    ee2.play();
});

ee3.on("audiometer", function(meter) {
  audioMeter = meter;

  // for (var i = 1; i <= 10; i++) {
  //   if (sampleSplitter[i])
  //   sampleSplitter[i].connect(audioMeter);
  // }
});

localStorageWorker_func = function() {
  this.onmessage = function(e){
    switch(e.data.command){
      case 'saveToLocalStorage':
        saveToLocalStorage(e.data.zipfile, e.data.localStorage);
        this.postMessage({cmd: "startLocalSave"});
        break;
        // case 'record':
        //   record(e.data.buffer);
        //   break;
        // case 'clear':
        //   clear();
        //   break;
    }
  };

  function saveToLocalStorage(file, localStorage){
    console.log("in worker", file);
    // localStorage.setItem("storageFiles", JSON.stringify(file));
  }
}

localStorageWorker = localStorageWorker_func.toString().trim().match(
    /^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/
)[1];

// --- Part 2: Add Event Listeners for EQ Slider Updates ---
// This code should run after playlist3 (ee3) is initialized.
// playlist3 is ee3 as per the variables ee1, ee2, ee3 declared below.
if (playlist3 && typeof playlist3.on === 'function') {
  console.log("EventManager: Setting up listeners for eqsettingX events on playlist3 (ee3)...");

  playlist3.on('eqsetting1', function(value) {
    const numericValue = parseFloat(value);
    if (isFinite(numericValue)) {
      if (typeof eqset1 !== 'undefined') { // Check if global var exists
        eqset1 = numericValue;
        localStorage.setItem('eqset1', eqset1.toString());
        console.log("EventManager: Global eqset1 updated to:", eqset1);
      } else {
        console.warn("EventManager: Global eqset1 not found.");
      }
    } else {
      console.warn("EventManager: Received non-finite value for eqsetting1 event:", value);
    }
  });

  playlist3.on('eqsetting2', function(value) {
    const numericValue = parseFloat(value);
    if (isFinite(numericValue)) {
      if (typeof eqset2 !== 'undefined') {
        eqset2 = numericValue;
        localStorage.setItem('eqset2', eqset2.toString());
        console.log("EventManager: Global eqset2 updated to:", eqset2);
      } else {
        console.warn("EventManager: Global eqset2 not found.");
      }
    } else {
      console.warn("EventManager: Received non-finite value for eqsetting2 event:", value);
    }
  });

  playlist3.on('eqsetting3', function(value) {
    const numericValue = parseFloat(value);
    if (isFinite(numericValue)) {
      if (typeof eqset3 !== 'undefined') {
        eqset3 = numericValue;
        localStorage.setItem('eqset3', eqset3.toString());
        console.log("EventManager: Global eqset3 updated to:", eqset3);
      } else {
        console.warn("EventManager: Global eqset3 not found.");
      }
    } else {
      console.warn("EventManager: Received non-finite value for eqsetting3 event:", value);
    }
  });

  playlist3.on('eqsetting4', function(value) {
    const numericValue = parseFloat(value);
    if (isFinite(numericValue)) {
      if (typeof eqset4 !== 'undefined') {
        eqset4 = numericValue;
        localStorage.setItem('eqset4', eqset4.toString());
        console.log("EventManager: Global eqset4 updated to:", eqset4);
      } else {
        console.warn("EventManager: Global eqset4 not found.");
      }
    } else {
      console.warn("EventManager: Received non-finite value for eqsetting4 event:", value);
    }
  });

  playlist3.on('eqsetting5', function(value) {
    const numericValue = parseFloat(value);
    if (isFinite(numericValue)) {
      if (typeof eqset5 !== 'undefined') {
        eqset5 = numericValue;
        localStorage.setItem('eqset5', eqset5.toString());
        console.log("EventManager: Global eqset5 updated to:", eqset5);
      } else {
        console.warn("EventManager: Global eqset5 not found.");
      }
    } else {
      console.warn("EventManager: Received non-finite value for eqsetting5 event:", value);
    }
  });
} else {
  console.error("EventManager: Could not set up eqsetting listeners - playlist3 (ee3) is not available or not an event emitter at the time of listener setup.");
}
