var selectedTrack = -1;
var new_modal = document.getElementById("newtrack");
var new_cls = document.getElementById("newclose");
var searchedList = [];
var masterFlag = false;
var canReorder = true; ///07/2023

function insertNewTrack() {	

	if (closebtnClicked() === false){return;}  ;//WP 032423	
    
	selectedTrack = -1;
    closeMenu();
    new_modal.style.display = "block";	
		
	returnMasterLibrary(); //WP 11/22	
	returnCategoryList(document.getElementById("categoryList")) ;  //WP 11/22

    var searchtext = document.getElementById("searchtext");
    searchtext.value = "";
    var newtracklist = document.getElementById("newtracklist");
    newtracklist.innerHTML = '';

    var table = document.getElementById("playedgraph");
    table.innerHTML = '';
    var days = 7 + 1;
    var hours = 24 + 1;
    var abbreviations = ['','S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (let i = 0; i < days; i++) {
        var row = table.insertRow();
        for (let j = 0; j < hours; j++) {
            var cell = row.insertCell();
            cell.style.fontSize = '50%';
            cell.style.width = (100 / hours) + '%';
            if (i)
                // if (j) text = '0';
                if (j) text = '';
                else text = abbreviations[i];
            else text = j;
            cell.innerHTML = text;
        }
    }
}

new_cls.addEventListener('click', function (event) {
    new_modal.style.display = "none";
	stopPreview(); //04/12/23
});

function searchTrack() {
	
    if (masterLibraryList.length == 0) {
        console.log("no master library found");
        return;
    }	
	
	//////04/21/23
	masterLibraryList.sort((a, b) => {    
	    let fa = a.TrackName.toLowerCase(),
        fb = b.TrackName.toLowerCase();
		if (fa < fb) {
			return -1;
		}
		if (fa > fb) {
			return 1;
		}
		return 0;	
	});
	//////04/21/23

    var searchtext = document.getElementById("searchtext").value;
	var searchCategory = document.getElementById("categoryList").value;
	
	if(searchCategory == "All Categories"){searchCategory = "*"}
	
    var idx = 0;
    var newtracklist = document.getElementById("newtracklist");
    while (newtracklist.firstChild)
        newtracklist.firstChild.remove();
    
    var table = document.getElementById("newtracklist");
    table.innerHTML = '';    
		
    var headers = [
        'Name',                   
        'IntroTime',
		'Length',
		'Category'    
    ];
	
    var header = table.createTHead();
    var row = header.insertRow();
    headers.forEach(element => {        
        var cell = row.insertCell();
        cell.style = "font-size: 15px";
		cell.style.color = 'black';
        cell.innerHTML = "<b>" + element + "</b>";
    });
    
    searchedList = [];
    for (var i = 0; i < masterLibraryList.length; i++) {
        if (masterLibraryList[i].TrackName.toLowerCase().includes(searchtext.toLowerCase()) & (masterLibraryList[i].Category.toLowerCase() == searchCategory.toLowerCase() | searchCategory == "*")) {
            searchedList[idx++] = masterLibraryList[i];
            var row = table.insertRow();            
            row.onclick = requestPlayedGraph.bind(this, masterLibraryList[i]);
			                        
            var cell = row.insertCell();			
            cell.style.fontSize = "15px";
            cell.style.width = "60%";
            cell.innerHTML = masterLibraryList[i].TrackName;
			cell.ondblclick  = RequestOriginalTrack.bind(this, masterLibraryList[i]);
            
            var cell = row.insertCell();			
            cell.style.fontSize = "15px";
            cell.style.width = "10%";
            cell.innerHTML = getHMS(masterLibraryList[i].IntroTime);
                        
            var cell = row.insertCell();		
            cell.style.fontSize = "15px";
            cell.style.width = "10%";
            cell.innerHTML = getHMS(masterLibraryList[i].TrackLengthSeconds);            
			
			var cell = row.insertCell();		
            cell.style.fontSize = "15px";
            cell.style.width = "20%";
            cell.innerHTML = masterLibraryList[i].Category;			
			
        }
    }
	
}

//////04/21/23
function checkFlag() {
    if(masterFlag === true) {
       window.setTimeout(checkFlag, 100); /* this checks the flag every 100 milliseconds*/
    } else {		
		var theL = document.getElementById("historyLabel");		
		theL.innerHTML = 'Track Category Moved';	  
		searchTrack();
    }
}

function moveTrackCategory(){
	
	var oJSON = {};
    oJSON.MethodName = 'MoveTrackCategory';
	oJSON.User = username.value;
	oJSON.PW = password.value;
	oJSON.Track = selectedTrack.File;
	oJSON.toCat = document.getElementById("categoryMoveList").value;
	oJSON.FromCat = selectedTrack.Category;
	
	var theL = document.getElementById("historyLabel");		
	theL.innerHTML = 'Moving Track Please Wait';
	
	var req = new XMLHttpRequest();
	req.open('POST', GetServeUrl() + '/jsonAjaxRPC', false);
	req.onload = function() {
								
        console.log("received: ", req.response);		
        if (req.response == JSON.stringify(oJSON)) {
            console.log("response same as request: error");			
            return;
        } 
		else 
		{	
		
			returnMasterLibrary();				
			checkFlag();	
		}
	}	
	
	req.send(JSON.stringify(oJSON))		
}
//////04/21/23
////////////////////

function requestPlayedGraph(track) {
    selectedTrack = track;
	var loopDate = new Date(globalDate);
    console.log("selectedTrack: ", masterLibraryList.indexOf(track));    
    console.log("Track clicked: ", track);	

	//var today = new Date();
	//console.log( today.getDay());
	//console.log( today.getHours());
	
    var oJSON = {};
    oJSON.MethodName = 'RequestPlayedGraph';
	oJSON.User = username.value;
	oJSON.PW = password.value;
    oJSON.Artist = track.TrackName.split('-')[0];
    oJSON.Title = track.TrackName.split('-')[1];    

    var req = new XMLHttpRequest();
    req.open('POST', GetServeUrl() + '/jsonAjaxRPC', false);
    req.onload = function() {
        console.log("received: ", req.response);		
        if (req.response == JSON.stringify(oJSON)) {
            console.log("response same as request: error");
            return;
        } else {
			
			///032423
			var theL = document.getElementById("historyLabel");	
			
			////041223
			var theTrackName = oJSON.Artist + " - " +	 oJSON.Title
			var previewTrack = '<div style="align-items: center;" ><button id="previewTrack" onclick="previewTrack(\''+ encodeURI(track.File) +'\')" style="width: 45%;" >Preview ' +  theTrackName + '</button> MOVE TO: ';
			var CategoryList = '<select onchange="moveTrackCategory()" name="moveCategories" id="categoryMoveList" size="1" style="height: 30px; width: 45%; margin: 2px 2px 2px;">Category List</select></div>';			
			theL.innerHTML = previewTrack + CategoryList;
			stopPreview();			
			returnCategoryList(document.getElementById("categoryMoveList")) ;  //WP 11/22
			////////////////////////////////
			
			//theL.innerText = previewTrack + "Played History " + oJSON.Artist + " - " +	 oJSON.Title
			
            var graph = JSON.parse(req.response);
            // console.log(graph.PlayedGraph);
            
            var table = document.getElementById("playedgraph");			  			
            table.innerHTML = '';			
            var days = 7 + 1;
            var hours = 24 + 1;
            var abbreviations = ['','S', 'M', 'T', 'W', 'T', 'F', 'S'];
            for (let i = 0; i < days; i++) {
                var row = table.insertRow();
                for (let j = 0; j < hours; j++) {
                    var property = i.toString() + ',' + j.toString();
                    played = 0;
                    if (graph.PlayedGraph[property]) {
                        played = graph.PlayedGraph[property];
                    }
					
                    var cell = row.insertCell();											
					cell.style = "border: 1px solid black;  border-radius: 2px;"
					if ( j == loopDate.getHours() && i == loopDate.getDay()+1 ){						
						cell.style.backgroundColor = "orange";						
						}
                    cell.style.fontSize = '50%';
					cell.style.color = 'black';					
                    cell.style.width = (100 / hours) + '%';                    
                    if (i) {
                        if (j) {
                            if (played) {
                                // text = played;
                                cell.style.backgroundColor = "Green";
                            }
                            else text = '';                            
                        }
                        else {
							cell.style.color = 'white';
                            text = abbreviations[i];
                        }
                    }
                    else {
                        text = j;
                    }
                    cell.innerHTML = text;                                        					
                }
            }
        }
    }    
    req.send(JSON.stringify(oJSON));
    // console.log("sent: ", JSON.stringify(oJSON));
}

function insertTrackClicked() {
    var newtracklist = document.getElementById("newtracklist");
   
   if (curID == -1) {
        //alert("Please select track in playlist");
		curID = window.currentPlaylistPosition - 1;
        //return
    }
    if (selectedTrack < 0) {
        alert("Please select track to insert");
        return
    }

    extractedFile.remove(plsFileFullName);
    extractedFile.file(plsFileFullName, AddNewTrack(selectedTrack.TrackName, selectedTrack.Category, selectedTrack.File, selectedTrack.TrackLengthSeconds, selectedTrack.IntroTime));
    ParsePLS(extractedFile);

    new_modal.style.display = "none";
    if (goLiveState === true) 
	{
		var eptNm = zipFileName + " DONE.zip";
		fileOTW(eptNm);	
		exportVTDone();
	}
	
	SaveExtractedFileToIndexDB(); ///WP 12/22
	
	//////// 02/23 WP
	closebtnClicked();
	//////////
}

function readMasterLibrary(file) {
    var reader = new FileReader();

    reader.onload = function (event) {
        // console.log("in getmetadata", event.target.result);
        var countHeader = new DataView(event.target.result, 0, 4);
        var recordCnt = reverseUint32(countHeader.getUint32(0));
        var idx = 0;
        var curPos = 4;

        while (idx < recordCnt) {
            var rowHeader = new DataView(event.target.result, curPos, 2);
            curPos += 2;
            var rowLength = reverseUint16(rowHeader.getUint16(0));
            var rowTrack = decode('ascii', new Uint8Array(event.target.result, curPos, rowLength));
            curPos += rowLength;
            var trackInfo = rowTrack.split("^^");			
			if(trackInfo.length == 7){////04/23/23
            masterLibraryList.push({
                TrackName:          trackInfo[0],
                Category:           trackInfo[1],
                File:               trackInfo[2],
                TrackLengthSeconds: trackInfo[3],
                IntroTime:          trackInfo[4],
                Year:               trackInfo[5],
                Genre:              trackInfo[6]
            });}
			else{////04/23/23
			masterLibraryList.push({
                TrackName:          trackInfo[0],
                Category:           trackInfo[1],
                File:               trackInfo[2],
                TrackLengthSeconds: trackInfo[3],
                IntroTime:          trackInfo[4],
                Year:               trackInfo[5],
                Genre:              trackInfo[6],
				PlayCount:			trackInfo[7].split('~')[0],
				TuneOuts:			trackInfo[7].split('~')[1],
				Ratio:			    trackInfo[7].split('~')[2]
            });}								
					
            // console.log(TrackName, Category, File, TrackLengthSeconds, IntroTime, Year, Genre);
            idx++;
        }
		masterFlag = false;
		displayStats();
    };

    // In case that the file couldn't be read
    reader.onerror = function (event) {
        console.error("An error ocurred reading the file: ", event);
		masterFlag = false;
    };

    // Read file as an ArrayBuffer, important !
    reader.readAsArrayBuffer(file);	
			
}

function reverseUint32(synch) {
    const mask = 0xff;
    let b1 = synch & mask;
    let b2 = (synch >> 8) & mask;
    let b3 = (synch >> 16) & mask;
    let b4 = (synch >> 24) & mask;

    return b4 | (b3 << 8) | (b2 << 16) | (b1 << 24);
}

function reverseUint16(synch) {
    const mask = 0xff;
    let b1 = synch & mask;
    let b2 = (synch >> 8) & mask;

    return b2 | (b1 << 8);
}

async function returnMasterLibrary(theCategory = "") //WP 11/22 ///04/23/23 theCategory
	{
	var oJSON = {};
    oJSON.MethodName = 'RequestMasterLibrary';
	oJSON.User = username.value;
	oJSON.PW = password.value;
	
	///04/23/23
	if (theCategory != ""){
		oJSON.Category = theCategory;		
	}
	///04/23/23
	
	masterFlag = true;
	
	var req = new XMLHttpRequest();
	req.open('POST', GetServeUrl() + '/jsonAjaxRPC', true);
	req.responseType = 'blob'; //<- returns the raw-response-content as a JavaScript-Blob-Object (createObjectURL expects a BLOB-object as a param)
	
	req.onload = function() {
		var unzip = new JSZip();
		unzip.loadAsync(req.response).then(function(extracted) 
		{			
			//extractedFile = extracted; //WP 12/22 caused missing tracks
			masterLibraryList = [];
			extracted.forEach(function(relPath, file) 
			{
				if (relPath.endsWith("masterLibraryRemote.txt"))
				{
					file.async('blob').then(function(content) 
					{
					readMasterLibrary(content);					
					});
				}	
			});				
		}); 				  	
	}
  
  req.send(JSON.stringify(oJSON)); 
  
  req.onerror = function() {
    alert("An error occurred during the connection for master Library");
    // elem.style.display = "none";
    // setProgress(elem, 0);
	masterFlag = false;
  }
	
}

function returnCategoryList(thelist)
{
	
	var oJSON = {};

    oJSON.MethodName = 'RequestCategoryList';
    oJSON.User = username.value;
    oJSON.PW = password.value;

    var req = new XMLHttpRequest();
    req.open('POST', GetServeUrl() + '/jsonAjaxRPC', true); 
    req.onload = function() {
      var resJson = JSON.parse(req.response);
      //var thelist = document.getElementById("categoryList");
      while (thelist.firstChild)
        thelist.firstChild.remove();
	
	    var option = document.createElement('option');
		option.value = "All Categories";
        option.text = "All Categories";
        thelist.appendChild(option);
		 
      Object.keys(resJson).forEach(key => {
        var option = document.createElement('option');
		option.value = resJson[key];
        option.text = resJson[key];
        thelist.appendChild(option);
      });

      thelist.selectedIndex = 0;  	  
    }
	
	req.send(JSON.stringify(oJSON));
	
    req.onerror = function() {
      alert("An error occurred during the connection");
      var thelist = document.getElementById("categoryList");
      while (thelist.firstChild)
        thelist.firstChild.remove();
    }
	
	
}

function RequestOriginalTrack(theTrack) {
  
	var oJSON = {};
	oJSON.MethodName = 'RequestOriginalTrack';
	oJSON.User = username.value;
	oJSON.PW = password.value;
	oJSON.track1 = theTrack.File;
	
	var elem = document.querySelector('.circlePercent');
	elem.style.display = "block";

	var req = new XMLHttpRequest();
	req.open('POST', GetServeUrl() + '/jsonAjaxRPC', true);
	req.responseType = 'blob';
	req.onload = function() {		
		var unzip = new JSZip();
		unzip.loadAsync(req.response)
		.then(function(extracted) {
		extracted.forEach(function(relPath, file) {		  
		relPath = relPath.split(".")[0];  		  
        if (theTrack.File != "" ) { 
            file.async('blob').then(function(content) {
            extractedFile.file("Music/Tracks/" + theTrack.File, content);
            //SaveExtractedFileToIndexDB(false);
			importTrack(theTrack.Category);
            var blb_content = new Blob([content], { type: "audio" });
			editWaveFormEvent.emit("newtrack", blb_content, "test Name", document.getElementById("newImportTrack").clientWidth);
			importTrackPath = blb_content;
			importTrackName = theTrack.File.split('\\').pop().split('/').pop();			
			document.getElementById("importCart").value = importTrackName;
			//document.getElementById("importCategoryList").value = theTrack.Category;
			new_modal.style.display = "none";
          });
        }  
		});
    });
	
    elem.style.display = "none";
    setProgress(elem, 0);
	};
	
	req.send(JSON.stringify(oJSON));
  
	req.onerror = function() {
		alert("An error occurred during the connection");
		elem.style.display = "none";
		setProgress(elem, 0);
	}
	
	req.addEventListener("progress", function(evt){
		if (evt.lengthComputable) {
			var percentComplete = evt.loaded / evt.total * 100;
			// console.log("Upload ", Math.round(percentComplete) + "% complete.");
			setProgress(elem, percentComplete);
		}
	});
}

function RowDoubleClicked(e)
{
	var row = e.target.parentNode;
	row.style.backgroundColor = "rgb(0, 120, 215)";
	var rowID = row.id;
	var theFile = displayedList.Items[Number(rowID)];
	//theFile = theFile.split('\\').pop().split('/').pop();		
	RequestOriginalTrack(theFile);		
}


////04/23/23
function showStats(){
	
	returnMasterLibrary(document.getElementById("categoryList").value) ;
	
}

function displayStats()
{
	
	if (masterLibraryList.length == 0) {
        console.log("no master library found");
        return;
    }	
	
	//////04/21/23
	masterLibraryList.sort((a, b) => {    
	    let fa = parseInt(a.Ratio),
        fb = parseInt(b.Ratio);
		if (fa < fb) {
			return -1;
		}
		if (fa > fb) {
			return 1;
		}
		return 0;	
	});
	//////04/21/23

    var searchtext = document.getElementById("searchtext").value;
	var searchCategory = document.getElementById("categoryList").value;
	
	if(searchCategory == "All Categories"){return;}
	
    var idx = 0;
    var newtracklist = document.getElementById("newtracklist");
    while (newtracklist.firstChild)
        newtracklist.firstChild.remove();
    
    var table = document.getElementById("newtracklist");
    table.innerHTML = '';    
		
    var headers = [
        'Name',                   
        'PlayedCount',
		'TuneOuts',
		'Ratio'    
    ];
	
    var header = table.createTHead();
    var row = header.insertRow();
    headers.forEach(element => {        
        var cell = row.insertCell();
        cell.style = "font-size: 15px";
		cell.style.color = 'black';
        cell.innerHTML = "<b>" + element + "</b>";
    });
    
    searchedList = [];
    for (var i = 0; i < masterLibraryList.length; i++) {
        if (masterLibraryList[i].TrackName.toLowerCase().includes(searchtext.toLowerCase()) & (masterLibraryList[i].Category.toLowerCase() == searchCategory.toLowerCase() | searchCategory == "*")) {
			
			var TheStats = masterLibraryList[i].StatData			
			
            searchedList[idx++] = masterLibraryList[i];
            var row = table.insertRow();            
            row.onclick = requestPlayedGraph.bind(this, masterLibraryList[i]);
                        
            var cell = row.insertCell();			
            cell.style.fontSize = "15px";
            cell.style.width = "60%";
            cell.innerHTML = masterLibraryList[i].TrackName;
			cell.ondblclick  = RequestOriginalTrack.bind(this, masterLibraryList[i]);
            
            var cell = row.insertCell();			
            cell.style.fontSize = "15px";
            cell.style.width = "10%";
            cell.innerHTML = masterLibraryList[i].PlayCount;
                         
            var cell = row.insertCell();		
            cell.style.fontSize = "15px";
            cell.style.width = "10%";
            cell.innerHTML = masterLibraryList[i].TuneOuts;   
			
			var cell = row.insertCell();		
            cell.style.fontSize = "15px";
            cell.style.width = "20%";
            cell.innerHTML = masterLibraryList[i].Ratio;		
			
        }
    }
	
	
}