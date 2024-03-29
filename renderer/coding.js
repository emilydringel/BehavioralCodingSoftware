const { ipcRenderer, ipcMain } = require('electron')

var video = document.getElementById('video');
var observationDetails;
var projectDetails;

var currentSubject = null;
var currentTime = 0;
var emptyDataRows = 6; 
var lastDataRow = null;
var frameTime = 1/30;
var currentData;

document.getElementById("video").addEventListener("timeupdate", function(e){
  currentTime = this.currentTime
});

ipcRenderer.on('obsJson', (event, obsData) => {
    observationDetails = obsData
    if(obsData.videos.length>0){
      var source = document.createElement('source');
      source.setAttribute('src', obsData.videos[0]);
      source.setAttribute('type', 'video/mp4');
      video.appendChild(source);
    }
    document.getElementById("project-name").innerHTML = observationDetails.projectName
    document.getElementById("observation-name").innerHTML = observationDetails.observationName
    if(!observationDetails.hasOwnProperty('data')){
      observationDetails.data = [];
    }
    fillData()
  }, '')

  ipcRenderer.on('projectJson', (event, projData) => {
    projectDetails = projData
    fillEthogram()
    fillSubjects()
  }, '')

  //
  function fillData(){
    const tableBody = document.getElementById("data-table-body")
    tableBody.innerHTML = "";
    let count = 0;
    for(row in observationDetails.data){
      row = observationDetails.data[row]
      tableBody.innerHTML = tableBody.innerHTML + 
      `<tr class="dataRow" id=`+ row.behavior + row["startTime"] +`> 
          <td class="time">`+ (row.startTime/60).toString().substring(0,5)+`</td>
          <td class="endtime">`+ (row.endTime/60).toString().substring(0,5)+`</td>
          <td class="involvedSubject">`+row.subject+`</td>
          <td class="behavior">`+row.behavior+`</td>
          <td class="modifier">`+row.modifier+`</td>
        </tr>`
      count++
    }
    emptyDataRows=6-count;
    lastDataRow = tableBody.lastChild
    while(count<6){
      tableBody.innerHTML = tableBody.innerHTML + `<tr> 
          <td class="time"></td>
          <td class="endtime"></td>
          <td class="involvedSubject"></td>
          <td class="behavior"></td>
          <td class="modifier"></td>
        </tr>`
      count++
    }
  }
  //
  function fillEthogram(){
    const tableBody = document.getElementById("behavior-table-body")
    tableBody.innerHTML = ""
    let count = 0
    for(row in projectDetails.ethogram){
      renderEthogramRow(projectDetails.ethogram[row])
      count++
    }while(count<11){
      const empty = {behaviorName: "", shortcut: ""}
      renderEthogramRow(empty)
      count++
    }
  }

  function renderEthogramRow(row){
    const tableBody = document.getElementById("behavior-table-body")
    const behavior = row["behaviorName"]
    const shortcut = row["shortcut"]
    const newRow = `<tr class="behavior" id="`+behavior+`"> 
        <td class="name">`+behavior+`</td>
        <td class="shortcut">`+shortcut+`</td>
      </tr>`
    tableBody.innerHTML = tableBody.innerHTML + newRow
  }

  //figure out how to call
  function fillSubjects(){
    const tableBody = document.getElementById("subject-table-body")
    tableBody.innerHTML = ""
    let count = 0
    for(s in observationDetails.associatedSubjects){
      let subjectName = observationDetails.associatedSubjects[s]
      const newRow = `<tr class="subject" id="`+subjectName+`"> 
        <td class="subjectName">`+subjectName+`</td>
      </tr>`
      tableBody.innerHTML = tableBody.innerHTML + newRow
      count++;
    }while(count<3){
      const newRow = `<tr> 
        <td class="subjectName"></td>
      </tr>`
      tableBody.innerHTML = tableBody.innerHTML + newRow
      count++;
    }
  }

  document.addEventListener('dblclick',function(e){
    if(e.target && e.target.classList.contains('subject')){
      Array.from(document.querySelectorAll('.selectedSubject')).forEach((el) => el.classList.remove('selectedSubject'));
      e.target.classList.add('selectedSubject')
      currentSubject = e.target.id
    }else if(e.target && e.target.parentNode.classList.contains('subject')){
      Array.from(document.querySelectorAll('.selectedSubject')).forEach((el) => el.classList.remove('selectedSubject'));
      e.target.parentNode.classList.add('selectedSubject')
      currentSubject = e.target.parentNode.id
    }else if(e.target && e.target.classList.contains('dataRow')){
      Array.from(document.querySelectorAll('.selectedData')).forEach((el) => el.classList.remove('selectedData'));
      e.target.classList.add('selectedData')
    }else if(e.target && e.target.parentNode.classList.contains('dataRow')){
      Array.from(document.querySelectorAll('.selectedData')).forEach((el) => el.classList.remove('selectedData'));
      e.target.parentNode.classList.add('selectedData')
    }
});

document.addEventListener('click', function(e){
  Array.from(document.querySelectorAll('.selectedData')).forEach((el) => el.classList.remove('selectedData'));
})

document.addEventListener('keyup', function(e){
  if(e.key === "Backspace"){
    //remove from data
    let behaviorName = document.getElementsByClassName('selectedData')[0].getElementsByClassName("behavior")[0]
    let info = document.getElementsByClassName('selectedData')[0].id
    for(datum in observationDetails.data){
      if(observationDetails.data[datum]["behavior"] + observationDetails.data[datum]["startTime"] === info){
        observationDetails.data.splice(datum, 1);
      }
    }
    if(lastDataRow == document.getElementsByClassName('selectedData')[0]){
      lastDataRow = lastDataRow.previousSibling
    }
    Array.from(document.querySelectorAll('.selectedData')).forEach((el) => el.remove());
    if(observationDetails.data.length<6){
        let tableBody = document.getElementById("data-table-body")
        let newRow = document.createElement("tr")
        newRow.innerHTML = `<td class="time"></td>
        <td class="endtime"></td>
        <td class="involvedSubject"></td>
        <td class="behavior"></td>
        <td class="modifier"></td>`
        tableBody.appendChild(newRow)
        emptyDataRows++;
    }
  }else if(document.getElementsByClassName("selectedData").length > 0){
    Array.from(document.querySelectorAll('.selectedData')).forEach((el) => el.classList.remove('selectedData'));
  }
})

document.addEventListener('keypress', function(e){
  for(row in projectDetails.ethogram){
    if(e.key == projectDetails.ethogram[row].shortcut){
      //start behavior
      let data = {}
      data.startTime = currentTime;
      data.subject = currentSubject;
      if(!currentSubject){
        data.subject = "";
      }
      data.behavior = projectDetails.ethogram[row].behaviorName;
      data.endTime = "";
      data.modifier = "";
      applyModifiers(data, projectDetails.ethogram[row])
    }else if(e.key == projectDetails.ethogram[row].shortcut.toUpperCase()){
      //end behavior
      let endTime = currentTime;
      let maxStartTime = 0;
      let maxStartTimeCodeIndex = null;
      for(code in observationDetails.data){
        if(observationDetails.data[code].behavior == projectDetails.ethogram[row].behaviorName 
          && observationDetails.data[code].startTime >= maxStartTime
          && observationDetails.data[code].startTime <= endTime
          && observationDetails.data[code].endTime == ""){
            maxStartTime == observationDetails.data[code].startTime;
            maxStartTimeCodeIndex = code;
        }
      }
      observationDetails.data[maxStartTimeCodeIndex].endTime = endTime;
      let htmlNode = document.getElementById(observationDetails.data[maxStartTimeCodeIndex].behavior + observationDetails.data[maxStartTimeCodeIndex].startTime)
      let endTimes = htmlNode.getElementsByClassName("endtime")
      endTimes[0].innerHTML = (endTime/60).toString().substring(0,5);
    }
  }if(isFinite(e.key)&&document.getElementById("options").style.display=="block"){
    let choice = document.getElementById("option"+e.key)
    let modifier = choice.innerHTML.substring(3)
    document.getElementById("modifierDiv").style.display="none"
    document.getElementById("options").style.display="none"
    currentData.modifier = modifier
    log(currentData)
    
  }if (document.getElementById("video").paused) { 
    console.log(e.code)
    if (e.key === ",") { //left arrow
        //one frame back
        document.getElementById("video").currentTime = Math.max(0, document.getElementById("video").currentTime - frameTime);
        currentTime = document.getElementById("video").currentTime

    } else if (e.key === ".") { //right arrow
        //one frame forward
        //Don't go past the end, otherwise you may get an error
        document.getElementById("video").currentTime = Math.max(0, document.getElementById("video").currentTime + frameTime);
        currentTime = document.getElementById("video").currentTime
    
      }
  }
})

function applyModifiers(data, ethogramRow){
  currentData = data
  if(ethogramRow.modifiers[0] == ""){
    log(data)
  }else if(ethogramRow.modifiers[0] == "*"){
    document.getElementById("modifierDiv").style.display="block"
    document.getElementById("create-your-own").style.display="block"
  }else{
    document.getElementById("options").innerHTML = ""
    for(i in ethogramRow.modifiers){
      let modifier = ethogramRow.modifiers[i];
      let num = parseInt(i)+1
      let text = num + ") " + modifier
      let myDiv = document.createElement("div")
      myDiv.id = "option" + num
      myDiv.innerHTML = text
      document.getElementById("options").append(myDiv)
    }
    document.getElementById("modifierDiv").style.display="block"
    document.getElementById("options").style.display="block"
    //for each modiier -- give it a shortcut and make it an option
  }
}

function log(data){  
  observationDetails.data.push(data)
  const dataHTML = `<td scope="row" class="time">`+ (data["startTime"]/60).toString().substring(0,5) +`</td>
    <td class="endtime"></td>
    <td class="involvedSubject">`+data["subject"]+`</td>
    <td class="behavior">`+data["behavior"]+`</td>
    <td class="modifier">`+data["modifier"]+`</td>`
  const newNode = document.createElement('tr');
  newNode.innerHTML = dataHTML;
  newNode.classList.add("dataRow")
  newNode.id = data["behavior"] + data["startTime"];
  const tableBody = document.getElementById("data-table-body")
  if(lastDataRow==null){
    tableBody.prepend(newNode)
    lastDataRow = tableBody.firstChild
  }else{
    tableBody.insertBefore(newNode, lastDataRow.nextSibling)
    lastDataRow = lastDataRow.nextSibling
  }if(emptyDataRows>0){
    tableBody.lastChild.remove()
    emptyDataRows--;
  }
}

document.getElementById("chooseModifier").addEventListener('click', function(event) {
  let val = document.getElementById("modifier").value
  document.getElementById("modifierDiv").style.display="none"
  document.getElementById("create-your-own").style.display="none"
  currentData.modifier = val
  log(currentData)
});

document.getElementById("saveProject").addEventListener('click', function(e){
  ipcRenderer.send('save-codes', observationDetails)
})

document.getElementById("saveAndCloseProject").addEventListener('click', function(e){
  ipcRenderer.send('save-codes', observationDetails)
  ipcRenderer.send('close-coding-window')
})

document.getElementById("close").addEventListener('click', function(e){
  ipcRenderer.send('close-coding-window')
})

document.getElementById("export").addEventListener('click', function(e){
  ipcRenderer.send('export-observation', observationDetails)
})
