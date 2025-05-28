var scriptprocessor = false;
var eqset1 = 0.0;
var eqset2 = 0.0;
var eqset3 = 0.0;
var eqset4 = 0.0;
var eqset5 = 0.0;
console.log("Startup: Initializing eqset1-eqset5 to default values (0.0).");
var saveSampleVoulume = 100;
var isSafari = false;

//WP
function detectBrowser() {

    var sBrowser, sUsrAg = navigator.userAgent;
    // The order matters here, and this may report false positives for unlisted browsers.
    if (sUsrAg.indexOf("Firefox") > -1) {
        sBrowser = "Mozilla Firefox";
        // "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:61.0) Gecko/20100101 Firefox/61.0"
    } else if (sUsrAg.indexOf("SamsungBrowser") > -1) {
        sBrowser = "Samsung Internet";
        // "Mozilla/5.0 (Linux; Android 9; SAMSUNG SM-G955F Build/PPR1.180610.011) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/9.4 Chrome/67.0.3396.87 Mobile Safari/537.36
    } else if (sUsrAg.indexOf("Opera") > -1 || sUsrAg.indexOf("OPR") > -1) {
        sBrowser = "Opera";
        // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 OPR/57.0.3098.106"
    } else if (sUsrAg.indexOf("Trident") > -1) {
        sBrowser = "Microsoft Internet Explorer";
        // "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; Zoom 3.6.0; wbx 1.0.0; rv:11.0) like Gecko"
    } else if (sUsrAg.indexOf("Edge") > -1) {
        sBrowser = "Microsoft Edge (Legacy)";
        // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299"
    } else if (sUsrAg.indexOf("Edg") > -1) {
        sBrowser = "Microsoft Edge (Chromium)";
        // Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.64
    } else if (sUsrAg.indexOf("Chrome") > -1) {
        sBrowser = "Google Chrome or Chromium";
        // "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/66.0.3359.181 Chrome/66.0.3359.181 Safari/537.36"
    } else if (sUsrAg.indexOf("Safari") > -1) {
        sBrowser = "Apple Safari";
        // "Mozilla/5.0 (iPhone; CPU iPhone OS 11_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Mobile/15E148 Safari/604.1 980x1306"
    } else {
        sBrowser = "unknown";
    }

    //alert("You are using: " + sBrowser);
    return sBrowser;
}

// localStorage.clear();
if (localStorage.eqset1 != undefined) {
    eqset1 = Number(localStorage.eqset1);
    if (!isFinite(eqset1)) {
        console.warn(`Startup: localStorage.eqset1 ('${localStorage.getItem('eqset1')}') resulted in non-finite value (${eqset1}). Resetting eqset1 to 0.0.`);
        eqset1 = 0.0;
    }
}

if (localStorage.eqset2 != undefined) {
    eqset2 = Number(localStorage.eqset2);
    if (!isFinite(eqset2)) {
        console.warn(`Startup: localStorage.eqset2 ('${localStorage.getItem('eqset2')}') resulted in non-finite value (${eqset2}). Resetting eqset2 to 0.0.`);
        eqset2 = 0.0;
    }
}

if (localStorage.eqset3 != undefined) {
    eqset3 = Number(localStorage.eqset3);
    if (!isFinite(eqset3)) {
        console.warn(`Startup: localStorage.eqset3 ('${localStorage.getItem('eqset3')}') resulted in non-finite value (${eqset3}). Resetting eqset3 to 0.0.`);
        eqset3 = 0.0;
    }
}

if (localStorage.eqset4 != undefined) {
    eqset4 = Number(localStorage.eqset4);
    if (!isFinite(eqset4)) {
        console.warn(`Startup: localStorage.eqset4 ('${localStorage.getItem('eqset4')}') resulted in non-finite value (${eqset4}). Resetting eqset4 to 0.0.`);
        eqset4 = 0.0;
    }
}

if (localStorage.eqset5 != undefined) {
    eqset5 = Number(localStorage.eqset5);
    if (!isFinite(eqset5)) {
        console.warn(`Startup: localStorage.eqset5 ('${localStorage.getItem('eqset5')}') resulted in non-finite value (${eqset5}). Resetting eqset5 to 0.0.`);
        eqset5 = 0.0;
    }
}

if (localStorage.saveSampleVoulume != undefined)
    saveSampleVoulume = Number(localStorage.saveSampleVoulume);

// var storageFiles = JSON.parse(localStorage.getItem("storageFiles")) || {};
// console.log("storage", storageFiles, Object.keys(storageFiles).length);
var compressCheckState = false;
if (localStorage.compressCheckState != undefined && !isNaN(localStorage.compressCheckState))
    compressCheckState = Number(localStorage.compressCheckState) == 1;

var eqCheckState = false;
if (localStorage.eqCheckState != undefined && !isNaN(localStorage.eqCheckState))
    eqCheckState = Number(localStorage.eqCheckState) == 1;

var ducking = 30;
if (localStorage.ducking != undefined && !isNaN(localStorage.ducking))
    ducking = Number(localStorage.ducking);

var ipaddressSaved = "";
if (localStorage.ipaddress != undefined)
    ipaddressSaved = localStorage.ipaddress;

var portSaved = "";
if (localStorage.port != undefined)
    portSaved = localStorage.port;

var usernameSaved = "";
if (localStorage.username != undefined)
    usernameSaved = localStorage.username;

var passwordSaved = "";
if (localStorage.password != undefined)
    passwordSaved = localStorage.password;

var vtmode = "remote";
if (localStorage.vtmode != undefined)
    vtmode = localStorage.vtmode;

var fadetime = 2;
if (localStorage.fadetime != undefined && !isNaN(localStorage.fadetime))
    fadetime = Number(localStorage.fadetime);

var recordstate = "stop";

Mp3LameEncoderConfig = {
    memoryInitializerPrefixURL: "./lib/audio/" // must end with slash
    // => changed to javascripts/Mp3LameEncoder.min.js.mem
};

//WP
window.indexedDB;

window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window
    .msIndexedDB;
IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window
    .msIDBTransaction;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


//https://developer.chrome.com/blog/autoplay/#webaudio
window.AudioContext = window.AudioContext || window.webkitAudioContext;
let globalAudioContext = new window.AudioContext();
const sampleAudioCtx = globalAudioContext;
const sampleMixer = sampleAudioCtx.createMediaStreamDestination();
let mixedAudioSource = sampleAudioCtx.createMediaStreamSource(sampleMixer.stream); //WP moved from InitRecord

if (globalAudioContext == null) {
    alert("Could not start audio context Please reload page");
    //let globalAudioContext = new window.AudioContext();
}

//wp
if (detectBrowser() == "Apple Safari") {
    isSafari = true;
}


// Used to detect whether the users browser is an mobile browser WP GOLive
window.isMobile = () => {
    ///<summary>Detecting whether the browser is a mobile browser or desktop browser</summary>
    ///<returns>A boolean value indicating whether the browser is a mobile browser or not</returns>

    if (window.matchMedia("(max-width: 767px)").matches) {
        return true;
    } //WP Go live
    if (sessionStorage.desktop) // desktop storage
        return false;
    else if (localStorage.mobile) // mobile storage
        return true;

    // alternative
    mobile = ['iphone', 'ipad', 'android', 'blackberry', 'nokia', 'opera mini', 'windows mobile', 'windows phone',
        'iemobile', 'tablet', 'mobi'
    ];
    var ua = navigator.userAgent.toLowerCase();

    for (var i in mobile)
        if (ua.indexOf(mobile[i]) > -1) return true;

    // nothing found.. assume desktop
    return false;
}

// AUDIO CONSTRAINTS INITIALIZATION
window.getLocalStream = () => {
    if (isMobile()) {
        window.constraints = {
            audio: {
                sampleSize: 16,
                sampleRate: 44100,
                latency: 0
                //audio: true
            }
        };
    } else {
        window.constraints = {
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                googEchoCancellation: false,
                googEchoCancellation2: false,
                googAutoGainControl: false,
                googAutoGainControl2: false,
                googNoiseSuppression: false,
                googHighpassFilter: false,
                googTypingNoiseDetection: false,
                googAudioMirroring: false,
                sampleSize: 16,
                sampleRate: 44100,
                latency: 0
            }
        };
        if (localStorage.savedPlaybackDevice) {
            constraints.audio.deviceId = localStorage.savedPlaybackDevice;
        }
    }
    // if (navigator.mediaDevices.getUserMedia) {
    //   return navigator.mediaDevices.getUserMedia(constraints);
    // }
};
getLocalStream();

var extractedFile;
var displayedList;
var masterLibraryList = [];
var curID = -1;
var curStyle;
var curMp3name1, curMp3name2;
var curTrackName1, curTrackName2;
var curTrackLengthSeconds1, curTrackLengthSeconds2;
var introTime2 = 0;
var playstate = false;
// var recordstate = "stop";
var locked1 = false;
var locked2 = false;
var micstate = false;
// var enumeratorPromise = navigator.mediaDevices.enumerateDevices();
var playbackSeconds1 = 0;
var playbackSeconds2 = 0; ///06/28/2023 wp
var vtStart = 10000;
var filedate = "";
var zipFileName = "";
var timerID = null;
var elapsedTime = 0.0;
var nextstart = 10000;
var rightTrackState = false;
var voiceTrackState = false;
//var zipFileName = ""; WP
var vtJobDateText = null;
var listUpdateState = false;
var plsFileFullName = "";
const leftTrackKeepTime = 2; //second
var markNextStartClikced = false;
var curVoiceTrackFile = "";
var curVoiceTrackFullPath = "";
var curVoiceTrackLengthSecond = 0;
var voicetrackPlaySecond = 0;
var intromark = 10000;
var isDeleteMode = false;
var dbDeleteFlag = false; //WP
var goLiveState = false; ///WP GoLive
var lastPlaylistHighLight = -1; ///WP GoLive
var JumpToTrackMode = false;
var globalDate = new Date();
var breakNoteRow = -1;///wp 02/23
var previewPlayer = null; ///04/12/23
var localShift = false; ///04/22/23

//   window.indexedDB.deleteDatabase("MeteorDynamicImportCache");
// window.location.reload();

var dbVersion = 1;
// indexedDB.deleteDatabase("vtjob");

var request = indexedDB.open("vtjob", dbVersion);
var db;
var putActiveVTJobInDb = function (blob) {
    var transaction = db.transaction(["vtjob"], "readwrite");
    if (transaction)
        transaction.objectStore("vtjob").put(blob, "vtjob");
    //transaction.commit;//WP
};
var putActiveVTJobNameInDb = function (zipName) {
    var transaction = db.transaction(["vtjob"], "readwrite");
    if (transaction)
        transaction.objectStore("vtjob").put(zipName, "zipName");
    //transaction.commit;//WP
};
var putSampleMusicInDb = function (dbKey, file) {
    var transaction = db.transaction(["vtjob"], "readwrite");
    if (transaction)
        transaction.objectStore("vtjob").put(file, dbKey);
};
var deleteSampleMusicInDb = function (dbKey) {
    var transaction = db.transaction(["vtjob"], "readwrite");
    if (transaction)
        transaction.objectStore("vtjob").delete(dbKey);
};

var deleteActiveVTJobInDb = function () {
    var transaction = db.transaction(["vtjob"], "readwrite");
    if (transaction)
        transaction.objectStore("vtjob").delete("vtjob");
    transaction.objectStore("vtjob").delete("zipName");
    extractedFile = null; ///031323 WP
    //transaction.commit;//WP
};
let subjRef = document.getElementById('subject');
let bottomNavigation = document.getElementById('bottomNavigation');
if (isMobile()) {
    if (subjRef != null) subjRef.style.fontSize = "4.2vw";
    document.getElementById('goLiveStateIcon').style.width = "1px";
    if (bottomNavigation != null) bottomNavigation.style.display = "none";
} else {
    if (subjRef != null) subjRef.style.fontSize = "2vw";
    if (bottomNavigation != null) bottomNavigation.style.display = "flex";
}

////WP Golive
if (isMobile()) {
    theFrame = document.getElementById('streamdiv');
    autobtndiv = document.getElementById('autobtn');
    micbtndiv = document.getElementById('micbtn');
    theFrame.style.fontSize = "22px";
    autobtndiv.style.width = "70px";
    micbtndiv.style.width = "70px";
    document.getElementById('startbtn').style.width = "70px";
    //document.getElementById('goLiveStateIcon').style.width = "80px";
    //document.getElementById('subject').style.fontSize = "4vw";
}

// For future use. Currently only in latest Firefox versions
request.onupgradeneeded = function (event) {
    event.target.result.createObjectStore("vtjob");
};

request.onsuccess = function (event) {

    db = request.result;
    var transaction = db.transaction(["vtjob"], "readwrite");
    transaction.objectStore("vtjob").get("zipName").onsuccess = function (event) {
        if (event.target.result != undefined)
            zipFileName = event.target.result;
    };
    transaction.objectStore("vtjob").get("vtjob").onsuccess = function (event) {
        var vtFile = event.target.result;
        if (vtFile != undefined) {
            var unzip = new JSZip();
            unzip.loadAsync(vtFile)
                .then(function (extracted) {
                    extractedFile = extracted;
                    ParsePLS(extracted);
                });
        }

    };

    for (var i = 1; i <= 10; i++) {
        let localIdx = i;
        transaction.objectStore("vtjob").get("empty" + localIdx).onsuccess = function (event) {
            var musicFile = event.target.result;
            var btn = document.getElementById("empty" + localIdx);

            if (musicFile != undefined) {
                btn.innerHTML = musicFile.name.replace(/\..+$/, '');
                sampleMusicFileName[localIdx] = musicFile.name;
                // console.log("sample", musicFile.name, localIdx, musicFile)
                GetAudioArrayBuffer(musicFile, localIdx);
            }
        };
    }

    if (db.setVersion) {
        if (db.version != dbVersion) {
            var setVersion = db.setVersion(dbVersion);
            setVersion.onsuccess = function () {
                db.createObjectStore("vtjob");
            };
        }
    }
}

request.onerror = function (event) {
    console.log("index error", event.target.error);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function openMenu() {
    document.getElementById("mySidenav").style.width = "250px";
    closebtnClicked();
}

function closeMenu() {
    document.getElementById("mySidenav").style.width = "0";
}

function deleteitem() {
    closeMenu();
    isDeleteMode = !isDeleteMode;
    var subject = document.getElementById("subject");
    var deletemenu = document.getElementById("deletemenu");
    if (isDeleteMode == true) {
        subject.innerText = "Delete MODE select Track or Sample Button to delete";
        deletemenu.innerText = "Cancel Delete Item"
        subject.style.backgroundColor = "#ed2939";
    } else {
        subject.innerText = "NextKast MobileVT";
        deletemenu.innerText = "Delete Item"
        subject.style.backgroundColor = "rgb(210, 210, 210)";
    }
    ///031323
    if (curVoiceTrackFullPath != "There is no voicetrack full path") {
        RowClicked(curID);
    }


}

var isNumeric = function (num) {
    return (typeof (num) === 'number' || typeof (num) === "string" && num.trim() !== '') && !isNaN(num);
}

function RowClicked(e) {
    // console.log($(this).index()); //row index

    if (locked1 === true ||
        locked2 === true ||
        listUpdateState === true ||
        dbDeleteFlag === true) //WP Go Live
        return;

    if (goLiveState === true && JumpToTrackMode === true) {
        golive_cmd("JumpToTrack~|~" + $(this).index());
        JumpToTrackMode = false;
        return;
    }

    if (goLiveState === true) {
        if (curID != -1) {
            row = document.getElementById(curID);
            row.style.backgroundColor = ""; //curStyle;
        }
        row = e.target.parentNode;
        row.style.backgroundColor = "rgb(0, 120, 215)";
        curID = row.id;
        //return;
    }

    if (isDeleteMode == true) {

        if (curVoiceTrackFullPath != "There is no voicetrack full path") {
            var selectedID = curID; ///e.target.parentNode.id; changed 031323
        } else {
            var selectedID = e.target.parentNode.id; //changed // 031323
        }

        //if (e.target.parentNode.innerText.includes("VoiceTrack-") || e.target.parentNode.style.color ==
        //  'rgb(255, 255, 0)') { //before goLive

        if (curVoiceTrackFullPath != "There is no voicetrack full path" || confirm("Are you sure you want to remove item From Playlist, This cannot be undone?")) { //WP GoLive 031323 added vt ez delete
            extractedFile.remove(plsFileFullName);
            extractedFile.file(plsFileFullName, deleteplaylistitem(selectedID));
            //////////////////////
            extractedFile.remove(curVoiceTrackFullPath);//WP	 added back 031323
            SaveExtractedFileToIndexDB(true); //WP
            ShowPlayList(displayedList.Items);

            var tmpId = Number(curID) - 1;
            if (Number(selectedID) < Number(curID)) {
                tmpId = Number(curID) - 2;
            }

            var deletemenu = document.getElementById("deletemenu"); ///WP Added
            isDeleteMode = false;
            subject.innerText = zipFileName; //"NextKast MobileVT";
            deletemenu.innerText = "Delete VT or Sample";
            subject.style.backgroundColor = "rgb(210, 210, 210)";

            if (tmpId < 0)
                return;

            if (goLiveState === true) //GoLive  WP 08/22
            {
                var eptNm = zipFileName + " DONE.zip";
                fileOTW(eptNm);
                exportVTDone();
            }

            RowClicked(tmpId);

        } else {
        }
        return;
    }

    if (goLiveState === true) {
        return;
    }//GoLive  WP 09/22

    //04/22/23
    if (localShift === true) {

        var row;
        if (curID != -1) {
            row = document.getElementById(curID);
            if (row != null)///032123
            {
                row.style.backgroundColor = ""; //curStyle;
            }
        }
        if (isNumeric(e))
            row = document.getElementById(e);
        else
            row = e.target.parentNode;

        curID = row.id;
        row.style.backgroundColor = "rgb(0, 120, 215)";
        return;
    } //04/22/23


    //04/16/23
    fixSafari();

    resumeAudio();

    ///WP
    document.getElementById("meter").firstElementChild.style.width = "100%";
    document.getElementById("form1").innerText = "Loading";
    document.getElementById("form2").innerText = "Loading";

    var waveform = document.getElementById("waveform");
    waveform.style.display = "flex";

    var row;
    if (curID != -1) {
        row = document.getElementById(curID);

        if (row != null)///032123
        {
            row.style.backgroundColor = ""; //curStyle;
        }

        //removed WP they dont exist


        // ee3.emit("clear");
        ee1.removeTrack(curMp3name1);
        ee2.removeTrack(curMp3name2);
        ee3.empty()

        if (playstate == true) {
            play();
        }

        if (recordstate != "stop") {
            var btn = document.getElementById("recordbtn");
            if (recordstate == "recording")
                recordstate = "playing";
            recordstart(btn);
            // console.log("in RowClicked", recordstate, btn);
        }

        if (timerID !== null) {
            clearInterval(timerID);
            timerID = null;
            elapsedTime = 0;
        }
    }

    vtStart = 10000;
    ee1.emit("markvtstart", vtStart);
    nextstart = 10000;
    markNextStartClikced = false;
    curVoiceTrackFile = "There is no voicetrack file";
    curVoiceTrackFullPath = "There is no voicetrack full path"
    intromark = 10000;

    if (isNumeric(e))
        row = document.getElementById(e);
    else
        row = e.target.parentNode;

    curID = row.id;
    // curStyle = row.style.backgroundColor;

    var mp3file = displayedList.Items[Number(curID)].File;
    mp3file = mp3file.split("\\").slice(-1)[0];
    curMp3name1 = mp3file;

    //08/30/23 WP
    if (displayedList.Items[Number(curID)].TrackName.includes("VoiceTrack")) {
        curTrackName1 = displayedList.Items[Number(curID)].TrackName;
    } else {
        const words = displayedList.Items[Number(curID)].TrackName.split('-');
        curTrackName1 = words[1] + " - " + words[0];
    }
    //08/30/23 WP

    //curTrackName1 = displayedList.Items[Number(curID)].TrackName;

    curTrackLengthSeconds1 = displayedList.Items[Number(curID)].TrackLengthSeconds;

    ///WP 02/23///
    breakNoteRow = -1;
    if (curTrackName1.includes("breakNote")) {
        curID = row.id - 1;
        mp3file = displayedList.Items[Number(curID)].File;
        mp3file = mp3file.split("\\").slice(-1)[0];
        curMp3name1 = mp3file;
        curTrackName1 = displayedList.Items[Number(curID)].TrackName;
        curTrackLengthSeconds1 = displayedList.Items[Number(curID)].TrackLengthSeconds;
        curID = row.id;
        breakNoteRow = curID;
    }
    ///////////////

    if (curTrackName1.includes("VoiceTrack-")) {
        var btn = document.getElementById("recordbtn");
        btn.style.display = "none";

        var recform = document.getElementById("recordform");
        recform.style.display = "inline-flex";
        recform.style.bottom = "18px";

        //WP 0301323
        var vtBut = document.getElementById("vtbtn");
        vtBut.style.display = "none";
        var PlayBut = document.getElementById("playbtn");
        PlayBut.style.display = "inline-block";
        ////////

        curVoiceTrackLengthSecond = curTrackLengthSeconds1;
        curVoiceTrackFile = curMp3name1;
        var curVoiceTrackName = curTrackName1;
        // recform.addEventListener("mousedown", function( event ) {
        //   ee3.emit("seek", event.offsetX);
        // }, false);

        mp3file = displayedList.Items[Number(curID) - 1].File;
        mp3file = mp3file.split("\\").slice(-1)[0];
        curMp3name1 = mp3file;

        //08/30/23 WP
        const words = displayedList.Items[Number(curID) - 1].TrackName.split('-');
        curTrackName1 = words[1] + " - " + words[0];
        //08/30/23 WP
        //curTrackName1 = displayedList.Items[Number(curID) - 1].TrackName;

        curTrackLengthSeconds1 = displayedList.Items[Number(curID) - 1].TrackLengthSeconds;
        playlist3.waveWidth = document.getElementById("recordform").clientWidth; ///WP

        extractedFile.forEach(function (relPath, file) {
            if (relPath.endsWith(curVoiceTrackFile)) {
                curVoiceTrackFullPath = relPath;
                listUpdateState = true;
                recordstate = "playing";
                file.async('blob').then(function (content) {
                    var blb_content = new Blob([content], {
                        type: "audio"
                    });
                    let bUrl = URL.createObjectURL(blb_content)
                    ee3.load(bUrl);
                    ee3.emit("newtrack", blb_content, curVoiceTrackFile, document.getElementById("recordform")
                        .clientWidth);
                    getMetaData(content, ee3);
                    // ee1.emit("markvtstart", vtStart);
                    // console.log("sent newtrack", document.getElementById("curform").clientWidth);
                });
            }
        });
    } else {
        //WP 0301323
        var PlayBut = document.getElementById("playbtn");
        PlayBut.style.display = "none";
        var vtBut = document.getElementById("vtbtn");
        vtBut.style.display = "inline-block";
        vtBut.innerText = "Start VT Process";
        ////////
    }

    curMp3name2 = "There is no mp3 file";
    curTrackName2 = "";
    curTrackLengthSeconds2 = 0;
    if (Number(curID) + 1 < displayedList.Items.length) {
        mp3file = displayedList.Items[Number(curID) + 1].File;
        mp3file = mp3file.split("\\").slice(-1)[0];
        curMp3name2 = mp3file;
        //08/30/23 WP
        if (displayedList.Items[Number(curID) + 1].TrackName.includes("VoiceTrack")) {
            curTrackName2 = displayedList.Items[Number(curID) + 1].TrackName;
        } else {
            const words = displayedList.Items[Number(curID) + 1].TrackName.split('-');
            curTrackName2 = words[1] + " - " + words[0];
        }
        //08/30/23 WP

        //curTrackName2 = displayedList.Items[Number(curID) + 1].TrackName;

        curTrackLengthSeconds2 = displayedList.Items[Number(curID) + 1].TrackLengthSeconds;
        //console.log("introTime2", displayedList.Items[Number(curID) + 1].IntroTime)
        ///08/29/23 WP
        introTime2 = displayedList.Items[Number(curID) + 1].IntroTime;
    }

    row.style.backgroundColor = "rgb(0, 120, 215)";

    if (curTrackName2.includes("VoiceTrack-") || curTrackName2 == "") {
        closebtnClicked();
        return;
    }

    extractedFile.forEach(function (relPath, file) {
        //if (relPath.endsWith(curMp3name1)) { changed 01/23 WP so shd and other file exrensions in playlist do not re-download
        if (relPath.split(".")[0].endsWith(curMp3name1.split(".")[0])) {
            locked1 = true;
            file.async('blob').then(function (content) {
                var blb_content = new Blob([content], {
                    type: "audio"
                });
                let bUrl = URL.createObjectURL(blb_content)
                ee1.load(bUrl);
                ee1.emit("newtrack", blb_content, curMp3name1, document.getElementById("curform").clientWidth);
                getMetaData(content, ee1);
            });
        }

        if (relPath.split(".")[0].endsWith(curMp3name2.split(".")[0])) { ///change 01/23 WP
            // console.log("in match", relPath, curMp3name2);
            locked2 = true;
            file.async('blob').then(function (content) {
                var blb_content = new Blob([content], {
                    type: "audio"
                });
                let bUrl = URL.createObjectURL(blb_content)
                ee2.load(bUrl);
                ee2.emit("newtrack", blb_content, curMp3name2, document.getElementById("nextform").clientWidth);
                getMetaData(content, ee2);
            });
        }
    });
    // console.log("select row",displayedList, curMp3name1, curMp3name2);
    if (locked1 == false && locked2 == false)
        RequestTracks(curMp3name1, curMp3name2);
    else if (locked1 == false)
        RequestTracks(curMp3name1, "");
    else if (locked2 == false)
        RequestTracks("", curMp3name2);
}

function play() {
    if (locked1 === true || locked2 === true || listUpdateState === true)
        return;

    var btn = document.getElementById("playbtn");
    if (playstate == false) {
        btn.classList.remove("play-btn");
        btn.classList.add("stop-btn");
        btn.innerHTML = "STOP";
        playstate = true;
        var startTime = curTrackLengthSeconds1 - 12;
        if (vtStart != 10000)
            startTime = vtStart - 2; ///08/31/23 reduced from 10
        if (startTime < 0)
            startTime = 0;
        ee1.play(startTime);
        ee1.setVolume(1);
        ee3.setVolume(1);
    } else {
        btn.classList.remove("stop-btn");
        btn.classList.add("play-btn");
        btn.innerHTML = "PLAY";
        playstate = false;
        rightTrackState = false;
        voiceTrackState = false;
        ee1.stop();
        ee2.stop();
        ee3.stop();
        markNextStartClikced = false;

        ///added to stop recording WP goLive
        if (recordstate == "recording") {
            var btn = document.getElementById("recordbtn");
            if (recordstate == "recording")
                recordstart(btn);
            //closebtnClicked();
        }
    }
}

function recordstart(btn) {
    if (locked1 === true || locked2 === true || listUpdateState === true)
        return;

    if (recordstate == "stop") {

        // micselection();
        btn.classList.remove("recordstart-btn");
        btn.classList.add("recordstop-btn");
        // btn.innerHTML = "Press HERE to Stop Recording";
        var reclbl = document.getElementById("recordlabel");
        reclbl.innerHTML = "Press HERE to Stop Recording<br>";
        reclbl.classList.add("recordlabel");
        timerID = setInterval(recording_time, 100, btn);
        recordstate = "recording";
        // mediaRecorder.start();
        ee3.record();
        if (playstate === true) {
            vtStart = playbackSeconds1;
            ee1.emit("markvtstart", vtStart);
        }
        // console.log("record started");
        ee1.setVolume((100 - ducking) / 100);
        ee3.setVolume((100 - ducking) / 100);

    } else if (recordstate == "recording") {

        btn.style.display = "none";
        curVoiceTrackLengthSecond = elapsedTime;

        if (timerID !== null) {
            clearInterval(timerID);
            timerID = null;
            elapsedTime = 0;
        }

        var recform = document.getElementById("recordform");
        recform.style.display = "inline-flex";
        recform.style.bottom = "18px";
        recform.addEventListener("mousedown", function (event) {
            console.log(event.offsetX)
            ee3.seekTo(validatePercent100(event.offsetX / 100));
        }, false);

        if (vtStart == 10000)
            vtStart = curTrackLengthSeconds1 - 0.1;
        if (nextstart == 10000)
            nextstart = curVoiceTrackLengthSecond - 0.1;


        curVoiceTrackFile = getVoiceTrackName();
        listUpdateState = true;
        ee3.emit("recordstop", curVoiceTrackFile);

        ///////02/23
        if (breakNoteRow > 0) {
            deleteplaylistitem(breakNoteRow);
            breakNoteRow = -1;
            curID -= 1;
        }
        ///////////////

        ee3.emit("setvtstartandnext", vtStart, nextstart);
        ee2.stop();
        recordstate = "playing";

        if (playstate == true) {
            ee1.stop();

            var startTime = vtStart - 2; ///08/31/23 reduced from 10
            if (startTime < 0)
                startTime = 0;
            ee1.play(startTime);
        }
        // else
        //   play();

        markNextStartClikced = false;
        ee1.setVolume(1);
        ee3.setVolume(1);


    } else if (recordstate == "playing") {
        btn.classList.remove("recordstop-btn");
        btn.classList.add("recordstart-btn");
        // btn.innerHTML = "Press HERE to Record Voice Track";

        btn.style.display = "";
        var reclbl = document.getElementById("recordlabel");
        reclbl.classList.remove("recordlabel");
        reclbl.innerHTML = "Press HERE to Record Voice Track";

        recordstate = "stop";

        var recform = document.getElementById("recordform");
        recform.style.display = "none";
        // mediaRecorder.stop();
        // ee3.emit("clear");

        //removed WP they dont exist
        //ee3.emit("removeTrack", "Recording");

        // console.log("hide voice track");
    }
}

function markNextStart() {
    if (locked1 === true || locked2 === true || listUpdateState === true)
        return;

    if (playstate === false)
        return;

    if (recordstate === "recording" && markNextStartClikced === false) {
        markNextStartClikced = true;
        nextstart = elapsedTime;

        var curvolume = 80;
        var fadeAudio = setInterval(function () {
            if (recordstate === "playing") {
                ee1.emit("mastervolumechange", 100);
                clearInterval(fadeAudio);
                return;
            }

            if (curvolume > 0) {
                curvolume -= 20;
                ee1.setVolume(curvolume / 100);
            } else {
                ee1.stop();
                ee1.setVolume(1);
                clearInterval(fadeAudio);
            }
        }, /*400*/ fadetime * 1000 / 5);

        ee2.play();
    }

    if (recordstate === "playing") {
        if (playlist3.isPlaying() == true) {
            nextstart = voicetrackPlaySecond;
            extractedFile.forEach(function (relPath, file) {
                if (relPath.endsWith(curVoiceTrackFile)) {
                    file.async('blob').then(function (content) {
                        content.arrayBuffer().then(buffer => {
                            console.log("in click next start", nextstart, vtStart, relPath, curVoiceTrackFile);
                            ResetMp3tag(buffer);
                            updateNextStart();
                        });
                    });
                }
            });
        } else if (playlist1.isPlaying() == true) {
            vtStart = playbackSeconds1
            extractedFile.forEach(function (relPath, file) {
                if (relPath.endsWith(curVoiceTrackFile)) {
                    file.async('blob').then(function (content) {
                        content.arrayBuffer().then(buffer => {
                            console.log("in click next start", nextstart, vtStart, relPath, curVoiceTrackFile);
                            ResetMp3tag(buffer);
                        });
                    });
                }
            });
        }
    }
}

function resetmark() {
    if (locked1 === true || locked2 === true || listUpdateState === true)
        return;
    // vtStart = 10000;
    // ee1.emit("markvtstart", vtStart);

    if (recordstate != "playing")
        return;

    vtStart = 10000;
    nextstart = 10000;

    extractedFile.forEach(function (relPath, file) {
        if (relPath.endsWith(curVoiceTrackFile /*curMp3name1*/)) {
            file.async('blob').then(function (content) {
                content.arrayBuffer().then(buffer => {
                    console.log("in resetmark", content, buffer);
                    ResetMp3tag(buffer);
                });
                var blb_content = new Blob([content], {type: "audio"});
                let bUrl = URL.createObjectURL(blb_content)
                ee1.load(bUrl);
                ee1.emit("newtrack", blb_content, curMp3name1, document.getElementById("curform").clientWidth);
                getMetaData(content, ee1);
                // // ee1.emit("markvtstart", vtStart);
                // // console.log("sent newtrack", document.getElementById("curform").clientWidth);
            });
        }
    });
}

function markToIntro() {
    if (recordstate === "playing") {
        nextstart = curVoiceTrackLengthSecond - intromark;

        if (nextstart < 0)
            nextstart == 0;

        extractedFile.forEach(function (relPath, file) {
            if (relPath.endsWith(curVoiceTrackFile)) {
                file.async('blob').then(function (content) {
                    content.arrayBuffer().then(buffer => {
                        console.log("in click next start", nextstart, vtStart, relPath, curVoiceTrackFile);
                        ResetMp3tag(buffer);
                        updateNextStart();
                    });
                });
            }
        });
    }
}

///08/31/23 WP
function updateNextStart() {
    displayedList.Items[Number(curID)].IntroTime = nextstart;
    curID -= 1;
    ShowPlayList(displayedList.Items);
}

///06/28/2023 WP
///07/2023/WP
function goToMark() {
    ee3.setVolume(0);
    if (playbackSeconds2 == 0) {
        ee2.play();
    }
}

function newMarkToIntro() {
    //ee2.emit("seek" , intromark);
    ee3.setVolume(1);
    if (playlist3.duration > playbackSeconds2) ///08/31/23
    {
        intromark = playbackSeconds2;
    } else {
        intromark = playlist3.duration - .1;
    }

    ee2.emit("addmark", intromark, 0);
    markToIntro();
    markNextStartClikced = false;
    rightTrackState = false;
    recordstate = "playing";
    ee1.stop();
    ee2.stop();
    ee3.stop();
    console.log(nextstart)
    ee3.play(validatePercent100((nextstart - .5) / 100));

}

///06/28/2023 WP

function closebtnClicked() {

    if (locked1 === true || locked2 === true || listUpdateState === true)
        return false;

    var waveform = document.getElementById("waveform");
    waveform.style.display = "none";
    var markintroEle = document.getElementById("markintro");
    markintroEle.style.display = "none";

    if (playstate == true)
        play();

    //WP clear all so no stray memory exist
    ee1.removeTrack(curMp3name1);
    ee2.removeTrack(curMp3name2);
    ee3.empty();

    //032423
    return true;

}

///04/12/23
function goToLibrary() {
    importDialog.style.display = "none";
    insertNewTrack();
}

///12/8/24
function formatTime(seconds) {
    var minutes = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

///12/8/24

function previewTrack(theTrackName) {
    var theP = encodeURI(GetServeUrl() + "/" + theTrackName);
    if (previewPlayer == null) {

        previewPlayer = new Audio(theP);
        previewPlayer.preload = "auto"; ///12/7/24
        previewPlayer.controls = true;

        var theL = document.getElementById("previewTrack");
        theL.classList.add("gradientGreen");
        theL.classList.remove("gradientGray");

        const originalText = theL.textContent;

        // Update the button text with the current playing position
        previewPlayer.addEventListener('timeupdate', function () {
            if (previewPlayer != null) {
                var currentTime = formatTime(previewPlayer.currentTime);
                var duration = formatTime(previewPlayer.duration);
                theL.textContent = `${originalText} (${currentTime}/ ${duration})`;
            }
        });

        // Handle metadata loading to show total duration initially
        previewPlayer.addEventListener('loadedmetadata', function () {
            if (previewPlayer != null) {
                var duration = formatTime(previewPlayer.duration);
                theL.textContent = `Preview (0:00 / ${duration})`;
            }
        });

        previewPlayer.play();

    } else {
        stopPreview();
    }
}

///12/8/24

function stopPreview() {
    if (previewPlayer != null) {
        previewPlayer.pause();
        previewPlayer = null;
        var theL = document.getElementById("previewTrack");
        theL.classList.add("gradientGray");
        theL.classList.remove("gradientGreen");
    }
}

///04/12/23


//////12/7/24
function seekAudio(direction) {

    const seekAmount = 5; // seconds
    let newTime;

    if (direction === "back") {
        newTime = Math.max(0, previewPlayer.currentTime - seekAmount);
        previewPlayer.currentTime = newTime;
    } else if (direction === "forward") {
        //newTime = previewPlayer.currentTime + seekAmount; // Allow forward seek beyond duration
        previewPlayer.playbackRate = 15.0; // Fast-forward
        setTimeout(() => {
            previewPlayer.playbackRate = 1.0; // Normal speed
        }, 700); //
    }

    //console.log(`Calculated newTime: ${newTime}`);

    try {
        //previewPlayer.currentTime = newTime;
        //console.log(`Set currentTime to: ${newTime}`);
    } catch (e) {
        console.error("Seek failed:", e);
    }
}

/////12/7/24

<!-- added 3/12/23 -->
function processVTState() {
    if (playstate == false) {
        play();
        var btn = document.getElementById("vtbtn");
        btn.innerText = "Start Voice Record";
    } else {
        if (playstate == true) {
            if (recordstate == "stop") {
                var btn = document.getElementById("recordbtn");
                recordstart(btn);
                var btn1 = document.getElementById("vtbtn");
                btn1.innerText = "Mark next start";
            } else {
                if (markNextStartClikced == false) {
                    markNextStart();
                    var btn1 = document.getElementById("vtbtn");
                    btn1.innerText = "Stop Voice Record";
                } else {
                    if (recordstate == "recording") {
                        var btn = document.getElementById("recordbtn");
                        recordstart(btn)
                        var btn2 = document.getElementById("vtbtn");
                        btn2.style.display = "none";
                        var btn1 = document.getElementById("playbtn");
                        btn1.style.display = "inline-block";
                    }
                }
            }
        }
    }

}

<!-- added 3/12/23 -->

function mic(btn) {
    if (micstate == false) {
        btn.classList.remove("mic-btn-off");
        btn.classList.add("mic-btn-on");
        btn.innerHTML = "Microphone On";
        micstate = true;
    } else {
        btn.classList.remove("mic-btn-on");
        btn.classList.add("mic-btn-off");
        btn.innerHTML = "Microphone Off";
        micstate = false;
    }
}

function compressionCheck() {
    micselection();
    saveCompressEq();
}

function eqCheck() {
    var modal = document.getElementById("modal-content");
    var chk = document.getElementById("eqsettings");
    var eqdiv = document.getElementById("eqdiv");

    if (chk.checked == true) {
        modal.style.height = "440px";
        eqdiv.style.display = "block";
    } else {
        modal.style.height = "290px";
        eqdiv.style.display = "none";
    }

    micselection();
    saveCompressEq();
}

// eqdiv.style.display = "none";

var picker = new Pikaday({
    field: document.getElementById('datepicker'),
    firstDay: 1,
    minDate: new Date(),
    maxDate: new Date(2020, 12, 31),
    yearRange: [2000, 2020]
});

var picker2 = new Pikaday({
    field: document.getElementById('subject'),
    firstDay: 1,
    minDate: new Date(),
    maxDate: new Date(2020, 12, 31),
    yearRange: [2000, 2020]
});

////04/16/23
function fixSafari() {

    //test04/16/23
    if (!userMediaStream & isSafari == true) {
        navigator.mediaDevices.getUserMedia(constraints).then(gotStream).catch(logError);
    }

}


//WP
function resumeAudio() {

    //var subject = document.getElementById("subject");
    //subject.innerText = globalAudioContext.state;

    if (isSafari) {

        if (globalAudioContext == null) {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            let globalAudioContext = new window.AudioContext();
        }
        if (sampleAudioCtx == null) {
            const sampleAudioCtx = globalAudioContext;
        }
        if (sampleMixer == null) {
            const sampleMixer = sampleAudioCtx.createMediaStreamDestination();
        }
        if (mixedAudioSource == null) {
            let mixedAudioSource = sampleAudioCtx.createMediaStreamSource(sampleMixer.stream);
        }

        //subject.innerText = globalAudioContext.state;
        if (globalAudioContext.state != 'running') { //wp
            globalAudioContext.resume();
            console.log("Audio Engine Resumed Global"); //wp
        }
        //subject.innerText = playlist1.ac.state;
        if (playlist1.ac.state != 'running') { //wp
            playlist1.ac.resume();
            console.log("Audio Engine Resumed 1"); //wp
        }

        //subject.innerText = playlist2.ac.state;
        if (playlist2.ac.state != 'running') { //wp
            playlist2.ac.resume();
            console.log("Audio Engine Resumed 2"); //wp
        }

        //subject.innerText = playlist3.ac.state;
        if (playlist3.ac.state != 'running') { //wp
            playlist3.ac.resume();
            console.log("Audio Engine Resumed 3"); //wp
        }
    }
}

function logOut() { ///Added WP GoLive

    localStorage.username = "";
    localStorage.password = "";

    if (goLiveState) {
        if (webrtcPeerConnection) webrtcPeerConnection.close();
        clearInterval(window.requestDataIntervalID);
        location.reload(true);
    }
    location.reload(true);
    deleteActiveVTJobInDb();//WP
    closeMenu();
}

function webrtc() {
    closeMenu();

    ////TEST 04/16/23
    fixSafari();

    if (goLiveState) {
        if (webrtcPeerConnection) webrtcPeerConnection.close();
        clearInterval(window.requestDataIntervalID);
        location.reload(true);
        lastPlaylistHighLight = -100; ///WP 11/22
        return;
    }

    login_frm = document.getElementById("golive_login_frm");

    window.golive_login = () => {
        var usr = document.getElementById("golive_user");
        var pwd = document.getElementById("golive_password");
        var port = document.getElementById("golive_port");

        if (!usr.checkValidity() || !pwd.checkValidity() || !port.checkValidity()) {
            alert("Login input invalid");
        } else {
            localStorage.username = usr.value;
            localStorage.password = pwd.value;
            localStorage.golive_port = port.value;
            webrtc();
        }
    };

    if (!localStorage.username || !localStorage.password || !localStorage.golive_port) {
        login_frm.style.display = "block";
        alert("Please login");
        return;
    } else {
        login_frm.style.display = "none";
    }

    var stream_div = document.getElementById("streamdiv");
    stream_div.style.display = "flex";

    var vumeter_div = document.getElementById("vumeter_div");
    vumeter_div.style.display = "flex";

    var html5VideoElement;
    var websocketConnection;
    var webrtcPeerConnection;
    var webrtcConfiguration;
    var reportError;
    var theTimeLeft;
    var lastPlaylistUpdate = Date.now(); // 12/22 WP

    function onLocalDescription(desc) {

        //WORKAROUND CHROMIUM STEREO WEBRTC BUG
        //desc.sdp = desc.sdp.replace("useinbandfec=1", "useinbandfec=1; stereo=1");
        desc.sdp = desc.sdp.replace("useinbandfec=1",
            "stereo=1; maxaveragebitrate=128000; maxplaybackrate=44100; sprop-maxcapturerate=44100; cbr=1");

        console.log('Local description: ', JSON.stringify(desc));
        webrtcPeerConnection.setLocalDescription(desc).then(function () {
            websocketConnection.send(JSON.stringify({
                type: "sdp",
                "data": webrtcPeerConnection.localDescription
            }));
        }).catch(reportError);
    }

    function onIncomingSDP(sdp) {

        //WORKAROUND CHROMIUM STEREO WEBRTC BUG
        //sdp.sdp = sdp.sdp.replace("sprop-stereo=1", "sprop-stereo=1;stereo=1");
        sdp.sdp = sdp.sdp.replace("sprop-stereo=1",
            "sprop-stereo=1; stereo=1; maxaveragebitrate=128000; maxplaybackrate=44100; sprop-maxcapturerate=44100; cbr=1"
        );

        console.log('Incoming SDP: ', JSON.stringify(sdp));
        webrtcPeerConnection.setRemoteDescription(sdp).catch(reportError);
        /* Send our video/audio to the other peer */

        // USE WEBAUDIO AS SOURCE
        // local_stream_promise = getLocalStream().then((stream) => {
        console.log('Adding local stream');
        // webrtcPeerConnection.addStream(stream);
        webrtcPeerConnection.addStream(mixedAudioSource.mediaStream);
        webrtcPeerConnection.createAnswer().then(onLocalDescription).catch(reportError);
        // });

    }

    function onIncomingICE(ice) {
        var candidate = new RTCIceCandidate(ice);
        console.log("Incoming ICE: " + JSON.stringify(ice.candidate));
        webrtcPeerConnection.addIceCandidate(candidate).catch(reportError);
    }

    function onAddRemoteStream(event) {
        html5VideoElement.srcObject = event.streams[0];
        //html5VideoElement.volume = ducking * 1.0 / 100;
        lastPlaylistHighLight = -100; ///WP 11/22
    }

    function onIceCandidate(event) {
        if (event.candidate == null) return;
        console.log("Sending ICE: " + JSON.stringify(event.candidate.candidate));
        websocketConnection.send(JSON.stringify({
            "type": "ice",
            "data": event.candidate
        }));
    }

    function onServerMessage(event) {
        var msg;
        if (event.data === "NOT AUTHORIZED") {
            alert("Invalid login credentials");
            websocketConnection.close();
            if (webrtcPeerConnection) webrtcPeerConnection.close();
            clearInterval(window.requestDataIntervalID);
            localStorage.clear();
            webrtc();
        }
        try {
            msg = JSON.parse(event.data);
        } catch (e) {
            console.log("Incoming msg not json:\n", e.message, "\n", "msg:\n", event.data);
            return;
        }

        if (!webrtcPeerConnection) {
            //webrtcPeerConnection = new RTCPeerConnection(webrtcConfiguration);
            webrtcPeerConnection = new RTCPeerConnection({
                iceServers: [{
                    urls: ["stun:us-turn4.xirsys.com"]
                }, {
                    username: "_ZhsURT15pRg5yjNqO-FlJ8CES8s_Rk5UwtBzy8P_6Ap_BgRfepHY4t-IwAMZN6PAAAAAGJ2jFVuZXh0a2FzdA==",
                    credential: "17803fae-ce18-11ec-ba1e-0242ac140004",
                    urls: [
                        "turn:us-turn4.xirsys.com:80?transport=udp",
                        "turn:us-turn4.xirsys.com:3478?transport=udp",
                        "turn:us-turn4.xirsys.com:80?transport=tcp",
                        "turn:us-turn4.xirsys.com:3478?transport=tcp",
                        "turns:us-turn4.xirsys.com:443?transport=tcp",
                        "turns:us-turn4.xirsys.com:5349?transport=tcp"
                    ]
                }]
            });
            webrtcPeerConnection.ontrack = onAddRemoteStream;
            webrtcPeerConnection.onicecandidate = onIceCandidate;

        }

        switch (msg.type) {
            case "sdp":
                onIncomingSDP(msg.data);
                break;
            case "ice":
                onIncomingICE(msg.data);
                break;
            default:
                playerUpdate(msg.PlayerUpdate);
                break;
        }
    }

    //window.updatePlaylist = true;

    function playerUpdate(data) {
        document.getElementById('PlayerArtist').textContent = data.Artist;
        document.getElementById('PlayerTitle').textContent = data.Title;

        minutesleft = Math.floor(data.TimeLeft / 60).toLocaleString('en-US', {
            minimumIntegerDigits: 2,
            useGrouping: false
        });
        secondsleft = Math.floor(data.TimeLeft % 60).toLocaleString('en-US', {
            minimumIntegerDigits: 2,
            useGrouping: false
        });

        theTimeLeft = document.getElementById('PlayerTimeLeft')
        theTimeLeft.textContent = minutesleft + ":" + secondsleft;

        ///WP goLive
        if (data.isIntro) {
            theTimeLeft.style.color = "orange";
        } else {
            theTimeLeft.style.color = "white";
        }

        window.Auto = data.AutoState === "Automated";
        autobtndiv = document.getElementById('autobtn');
        autobtndiv.innerHTML = "Auto<br>" + (window.Auto ? "On" : "Off");
        autobtndiv.style.backgroundColor = (window.Auto ? "green" : "red");

        window.Mic = data.MicState;
        micbtndiv = document.getElementById('micbtn');
        micbtndiv.innerHTML = "Mic<br>" + (window.Mic ? "On" : "Off");
        micbtndiv.style.backgroundColor = (window.Mic ? "green" : "gray");

        ///WP goLive
        window.RemoteRecord = data.recording;
        remoteRecorddiv = document.getElementById('remoteRecord_button');
        remoteRecorddiv.innerHTML = " REC ";
        remoteRecorddiv.style.backgroundColor = (window.RemoteRecord ? "red" : "black");

        window.currentPlaylistPosition = data.currentPlaylistPosition;
        //console.log("window.currentPlaylistPosition=",window.currentPlaylistPosition);

        document.getElementById('subject').textContent = data.StationTime;
        globalDate = Date(data.StationTime);


        if (data.playlistUpdateFlag) {
            console.log('trying to update')
            if (Date.now() > lastPlaylistUpdate) {
                console.log('updating')
                golive_cmd("PlaylistUpdateComplete");
                RequestCurrentPlaylist();
                lastPlaylistUpdate = Date.now() + 2000; //WP 11/22
                //window.updatePlaylist = data.playlistUpdateFlag;
            }
            //else{
            //	golive_cmd("PlaylistUpdateComplete");
            //	lastPlaylistUpdate = Date.now()+2000; //WP 11/22
            //	console.log('update blocked')
            //}
        }

        if (lastPlaylistHighLight != window.currentPlaylistPosition) {
            console.log("highlight")
            HighlightTracks();
            lastPlaylistHighLight = window.currentPlaylistPosition;
        }
    }

    window.golive_cmd = function (text) {
        ////golive WP 11/24
        if (text == "NextStart") {
            fadeOutAllActiveSamples();
        }
        ////golive WP 11/24
        //console.log("Sending ", text, " command...");
        websocketConnection.send(JSON.stringify({
            type: "golive",
            "data": {
                type: "cmd",
                "data": text
            }
        }));
    }

    window.ToggleMic = function () {
        if (window.Mic) golive_cmd('MicOff');
        else golive_cmd('MicOn');
        window.Mic = !window.Mic;
        micbtndiv = document.getElementById('micbtn');
        micbtndiv.innerHTML = "Mic<br>" + (window.Mic ? "On" : "Off");
        micbtndiv.style.backgroundColor = (window.Mic ? "green" : "gray");
    }

    window.ToggleAuto = function () {
        if (window.Auto) golive_cmd('AutoOff');
        else golive_cmd('AutoOn');
        window.Auto = !window.Auto;
        autobtndiv = document.getElementById('autobtn');
        autobtndiv.innerHTML = "Auto<br>" + (window.Auto ? "On" : "Off");
        autobtndiv.style.backgroundColor = (window.Auto ? "green" : "red");
    }

    window.ToggleRemoteRecord = function () { //WP go Live
        if (window.RemoteRecord) golive_cmd('recordOff');
        else golive_cmd('recordOn');
        window.RemoteRecord = !window.RemoteRecord;
        remoterecordbtndiv = document.getElementById('remoteRecord_button');
        remoterecordbtndiv.innerHTML = "REC";
        remoterecordbtndiv.style.backgroundColor = (window.RemoteRecord ? "black" : "red");
    }

    window.studioVolume = function () { //WP go Live
        golive_cmd('setGoLiveVolume');
        window.liveMute = !window.liveMute;
        livemutebtndiv = document.getElementById('studio_volume');
        livemutebtndiv.style.backgroundColor = (window.liveMute ? "red" : "black");
    }


    gPort = Number(localStorage.golive_port);

    function playStream(videoElement, hostname, port, path, configuration, reportErrorCB) {
        var l = window.location;
        var wsHost = (hostname != undefined) ? hostname : l.hostname;
        var wsPort = (port != undefined) ? port : gPort;
        var wsPath = (path != undefined) ? path : "ws";
        if (wsPort)
            wsPort = ":" + wsPort;
        var wsUrl = "wss://" + wsHost + wsPort + "/" + wsPath;

        html5VideoElement = videoElement;
        webrtcConfiguration = configuration;
        reportError = (reportErrorCB != undefined) ? reportErrorCB : function (text) {
        };

        websocketConnection = new WebSocket(wsUrl);
        websocketConnection.onerror = () => window.location.href = "https://" + window.location.hostname + ":" + gPort +
            "/?" + window.location.href;
        websocketConnection.addEventListener("message", onServerMessage);

        websocketConnection.onopen = () => golive_cmd("CredentialCheck~|~" + localStorage.username + "~|~" +
            localStorage.password);

        window.requestDataIntervalID = setInterval(function () {
            golive_cmd('RequestData')
        }, 200);

        goLiveState = true;

        document.getElementById('goLiveStateIcon').style.width = "80px";
        document.getElementById("goLiveStateIcon").src = "/live120.png";
        var rtcmenu = document.getElementById("webrtcmenu");
        rtcmenu.innerText = "Close goLive";

    }

    var vidstream = document.getElementById("stream");
    var config = {
        'iceServers': [{
            'urls': 'stun:not.necessary.but.text.required:12345'
        }]
    };
    playStream(vidstream, null, null, null, config, function (errmsg) {
        console.error(errmsg);
    });

    RequestCurrentPlaylist();
    vumeter();
    //golive_cmd("PlaylistUpdateComplete");
}

if (document.getElementById('player')) {
    document.getElementById('player').onclick = function clickEvent(e) {
        var rect = e.currentTarget.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width * 100).toFixed();
        // console.log(x);
        // console.log("JumpToTime~|~" + x);
        golive_cmd("JumpToTime~|~" + x);
    }
}

function jumptotrack() {
    closeMenu();
    if (goLiveState === true) JumpToTrackMode = true;
}

window.local_mic_muted = false;

function mute_local_mic() {
    var mute_button = document.getElementById("mute_button");
    window.local_mic_muted = !window.local_mic_muted;
    mute_button.innerText = window.local_mic_muted ? "UNMUTE" : "MUTE";
    mixedAudioSource.mediaStream.getAudioTracks()[0].enabled = !window.local_mic_muted;
}

/* diego 20221126: The following block was moved from micdialog.js,
   but it's redundant as micdialog.js itself calls enumerateDevices().then(gotDevices).
   This call is removed from startupScript.js to prevent ReferenceError
   as gotDevices is not defined at this point of execution.
navigator.mediaDevices.enumerateDevices()
    .then(gotDevices)
    .catch(errorCallback);
*/

<!-- added 3/12/23 -->
document.onkeyup = function (e) {
    if (e.which == 32) {
        var btn = document.getElementById("newtrack");
        if (btn.style.display == "none" || btn.style.display == "") {
            processVTState();
        }
    }
    ///04/22/23
    if (e.which == 16) {
        //localShift = false;
    }
};

document.onkeydown = function (e) {
    if (e.which == 32) {
        var btn = document.getElementById("waveform");
        if (btn.style.display != "none") {
            e.preventDefault();
        }
    }
    ///04/22/23/////////////////
    //alert(e.which);
    if ((e.which == 69) & e.shiftKey) {
        toggleEditMode()
    }
    ///04/22/23///////////////////////
};

<!-- added 3/12/23 -->


function toggleEditMode() {
    localShift = !localShift;
    var theS = document.getElementById("subject")
    if (localShift) {
        theS.innerHTML = globalDate.toDateString() + " " + globalDate.toLocaleTimeString() + " Edit Mode ";
        theS.style.backgroundColor = "DeepSkyBlue";
    } else {
        theS.innerHTML = globalDate.toDateString() + " " + globalDate.toLocaleTimeString()
        theS.style.backgroundColor = "rgb(190, 190, 190)";
    }
}


////11/13/2023
const target = document.getElementById("waveform");
target.addEventListener("dragover", (event) => {
    event.preventDefault();
});

target.addEventListener("drop", (event) => {

    event.preventDefault();
    event.dataTransfer.files[0].arrayBuffer().then(buffer => {
        var mp3file = writeMp3Tag(buffer, getVoiceTrackName(), 0.0, 0.0);
        getDuration(buffer, mp3file);
    });

    function getDuration(aBuffer, aFile) {
        const audioContext1 = new AudioContext();
        audioContext1.decodeAudioData(aBuffer).then(audioBuffer => {
            curVoiceTrackLengthSecond = audioBuffer.duration;
            intromark = 0;
            nextstart = 0;
            ee3.emit('voicetrackblob', aFile);
        });
    }

    ////11/13/2023

});

console.log("StartupScriptEnd: eqset1 type:", typeof eqset1, "value:", eqset1);
console.log("StartupScriptEnd: eqset2 type:", typeof eqset2, "value:", eqset2);
console.log("StartupScriptEnd: eqset3 type:", typeof eqset3, "value:", eqset3);
console.log("StartupScriptEnd: eqset4 type:", typeof eqset4, "value:", eqset4);
console.log("StartupScriptEnd: eqset5 type:", typeof eqset5, "value:", eqset5);


