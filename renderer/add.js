'use strict'

const { ipcRenderer, ipcMain } = require('electron')

var project //current data
var projectOriginal //original data once saved
var projectID //name on last save -- to delete

var toFillRowsEthogram = 0
var toFillRowsSubjects = 0
var toFillRowsObservations = 0
var observationFiles = {}
let closeAfter = false

var page = 0 // 0 == ethogram, 1 == subjects, 2 == observations

//CHOOSING A PAGE
/*
document.getElementById('ethogramPage').addEventListener('click', () => {
  document.getElementById('ethogram').style.display = "inline"
  document.getElementById('subjects').style.display = "none"
  document.getElementById('observations').style.display = "none"
  renderEthogramTable();
  Array.from(document.querySelectorAll('.nav-item')).forEach(function(el) { 
    el.classList.remove('active');
  });
  document.getElementById('ethogramPage').classList.add("active")
  page = 0
})

document.getElementById('subjectPage').addEventListener('click', () => {
  document.getElementById('ethogram').style.display = "none"
  document.getElementById('subjects').style.display = "inline"
  document.getElementById('observations').style.display = "none"
  renderSubjectsTable();
  Array.from(document.querySelectorAll('.nav-item')).forEach(function(el) { 
    el.classList.remove('active');
  });
  document.getElementById('subjectPage').classList.add("active")
  page = 1
})

document.getElementById('observationsPage').addEventListener('click', () => {
  document.getElementById('ethogram').style.display = "none"
  document.getElementById('subjects').style.display = "none"
  document.getElementById('observations').style.display = "inline"
  renderObservationsTable();
  Array.from(document.querySelectorAll('.nav-item')).forEach(function(el) { 
    el.classList.remove('active');
  });
  document.getElementById('observationsPage').classList.add("active")
  page = 2
})
*/

//Rendering Ethogram Page
ipcRenderer.on('projectJson', (event, project) => {
  this.project = project
  this.projectOriginal = project
  this.projectID = project.name
  document.getElementById("project-name-span").innerHTML = this.project.name;
  renderEthogramTable()
  renderObservationsTable()
}, '')

function saveProject(){
    if(document.getElementById("rename").value!=""){
        ipcRenderer.send('project-name-uniqueness', document.getElementById("rename").value)
    }else{
        let success = true 
        success = saveEthogramTable() && success
        success = saveObservationsTable() && success
        success = notNamedUntitled() && success
        if(success){
            console.log(project.name)
            document.getElementById("rename-error").innerHTML = ""
            ipcRenderer.send('delete-project', projectID)
            ipcRenderer.send('addProject', project)
            ipcRenderer.send('match-observations', project)
            document.getElementById("project-name-span").innerHTML = project.name;
            document.getElementById("rename").value = ""
            projectID = project.name
            renderEthogramTable()
            renderObservationsTable()
            projectOriginal = project
        }else{
            project = projectOriginal
        }
        if(closeAfter){
            closeAfter = false
            ipcRenderer.send('close-edit-window');
        }
    }
}

ipcRenderer.on('project-name-uniqueness-results', (event, unique) => {
    let success = true 
    if(unique){
        project.name = document.getElementById("rename").value
        console.log(document.getElementById("rename").value)
    }else{
        document.getElementById("rename-error").innerHTML = "A project with this name already exists. Please try a different name."
        success = false
    }
    success = saveEthogramTable() && success
    success = saveObservationsTable() && success
    success = notNamedUntitled() && success
    if(success){
        console.log(project.name)
        document.getElementById("rename-error").innerHTML = ""
        ipcRenderer.send('delete-project', projectID)
        ipcRenderer.send('addProject', project)
        ipcRenderer.send('match-observations', project)
        renderEthogramTable()
        renderObservationsTable()
        document.getElementById("project-name-span").innerHTML = this.project.name;
        document.getElementById("rename").value = ""
        projectID = project.name
        projectOriginal = project
    }else{
        project = projectOriginal
    }if(closeAfter){
        closeAfter = false
        ipcRenderer.send('close-edit-window');
    }
  }, '')

function saveEthogramTable(){
  let ethogram = []
  let shortcutsSoFar = []
  const rows = document.getElementById("ethogram-table-body").getElementsByTagName("tr")
  console.log(rows)
  for(let i = 0; i < rows.length; i++){
    let row = rows[i]
    console.log(row)
    const vals = row.getElementsByTagName("td")
    let behaviorName = vals[0].innerHTML
    let shortcut = vals[1].innerHTML
    let modifiers = vals[2].innerHTML.split(", ")
    let description = vals[3].innerHTML
    if(behaviorName==""){
      continue
    }
    if(vals[0].getElementsByClassName("inputField").length > 0 ){
      behaviorName = vals[0].getElementsByTagName("input")[0].value
      shortcut = vals[1].getElementsByTagName("input")[0].value
      modifiers = vals[2].getElementsByTagName("input")[0].value.split(", ")
      description = vals[3].getElementsByTagName("input")[0].value
    }
    const deleted = vals[4].getElementsByTagName("input")[0].checked
    if(!deleted){
      let behavior = {behaviorName: behaviorName, shortcut: shortcut, modifiers: modifiers, description: description}
      if(shortcutsSoFar.includes(shortcut.toLowerCase())){
          document.getElementById("ethogram-error").innerHTML = "Shortcuts must be unique."
          return false;
      }
      shortcutsSoFar.push(shortcut.toLowerCase())
      ethogram.push(behavior)
    }
  }
  project.ethogram = ethogram
  toFillRowsEthogram = 0
  return true;
}

function saveObservationsTable(){
  if(project.observations == null){
    project.observations = []
  }
  let namesSoFar = []
  const rows = document.getElementById("observation-table-body").getElementsByTagName("tr")
  //test uniqueness
  for(let i = 0; i < rows.length; i++){
    let row = rows[i]
    const vals = row.getElementsByTagName("td")
    let obsName = vals[0].innerHTML
    if(vals[0].getElementsByClassName("inputField").length > 0 ){
      obsName = vals[0].getElementsByTagName("input")[0].value
    }if(obsName==""){
      continue
    }if(namesSoFar.includes(obsName)){
      document.getElementById("observations-error").innerHTML = "Observation names must be unique."
      return false;
    }
    namesSoFar.push(obsName)
  }
  //if all unique, add observations
  for(let i = 0; i < rows.length; i++){
    let row = rows[i]
    const vals = row.getElementsByTagName("td")
    let deleted = vals[3].getElementsByTagName("input")[0].checked
    //ignore if empty
    let observationName = vals[0].innerHTML
    if(observationName==""){
      continue
    }
    //if new -- add file and add to project.observations
    if(vals[0].getElementsByClassName("inputField").length > 0 ){
      observationName = vals[0].getElementsByTagName("input")[0].value
      if(observationName==""){
        continue
      }
      let associatedSubjects = vals[1].getElementsByTagName("input")[0].value.split(", ")
      let videos = [observationFiles[vals[2].getElementsByTagName("div")[0].id]]
      //could be deleted to make you ignore it
      if(!deleted){
        let observation = {projectName: project.name, observationName: observationName, 
        associatedSubjects: associatedSubjects,
        videos: videos}
        project.observations.push(observation)
        ipcRenderer.send('create-observation', observation)
      }
    }
    //if not new, could be deleted or not
    else if(deleted){
      //delete observation happens on match-observations as long as updated in project.observations
      //remove observation from project.observations
      for(let obs in project.observations){
        let name = project.observations[obs].observationName
        if(name === observationName){
          project.observations.splice(obs, 1);
        }
      }
    } 
  }
  toFillRowsObservations = 0
  return true;
}

function notNamedUntitled(){
  if(document.getElementById("rename").value === "untitled"){
    document.getElementById("rename-error").innerHTML = "Project cannot be titled 'untitled'."
    return false;
  }else if(document.getElementById("rename").value === "" && projectID == "untitled"){
    document.getElementById("rename-error").innerHTML = "Project cannot be titled 'untitled'."
    return false;
  }
  return true;
}

function renderEthogramTable(){
  const tableBody = document.getElementById("ethogram-table-body")
  tableBody.innerHTML = ""
  for(let i=0; i<toFillRowsEthogram; i++){
    renderEthogramFillRow()
  }if(project.hasOwnProperty('ethogram')){ //probably won't need this line 
    for(let behavior in project.ethogram){
      behavior = project.ethogram[behavior]
      renderEthogramRow(behavior)
    }
  }
}

/*
function renderSubjectsTable(){
  const tableBody = document.getElementById("subject-table-body")
  tableBody.innerHTML = ""
  let count = 0
  for(let i=0; i<toFillRowsSubjects; i++){
    renderSubjectFillRow()
    count++
  }if(project.hasOwnProperty('subjects')){ //probably won't need this line 
    for(let subject in project.subjects){
      subject = project.subjects[subject]
      count ++
      renderSubjectRow(subject)
    }
  }while(count<5){
    const empty = {subjectName: "", subjectDescription: ""}
    renderSubjectRow(empty)
    count++
  }
}
*/

function renderObservationsTable(){
  const tableBody = document.getElementById("observation-table-body")
  tableBody.innerHTML = ""
  for(let i=0; i<toFillRowsObservations; i++){
    renderObservationFillRow(i)
  }if(project.hasOwnProperty('observations')){ //probably won't need this line 
    for(let observation in project.observations){
      observation = project.observations[observation]
      renderObservationRow(observation)
    }
  }
}

function renderEthogramRow(b){
  const tableBody = document.getElementById("ethogram-table-body")
  const behavior = b["behaviorName"]
  const shortcut = b["shortcut"]
  const modifiers = b["modifiers"]
  const description = b["description"]
  let check = `<input type=checkbox>`
  if(behavior==""){
    check=""
  }
  const newRow = `<tr> 
      <td class="name">`+behavior+`</td>
      <td class="shortcut">`+shortcut+`</td>
      <td class="modifiers">`+modifiers.join(", ")+`</td>
      <td class="description">`+description+`</td>
      <td class="delete">`+check+`</td>
    </tr>`
  tableBody.innerHTML = tableBody.innerHTML + newRow
}

function renderEthogramFillRow(){
  const tableBody = document.getElementById("ethogram-table-body")
  const behavior = `<input type="field" class="inputField">`
  const shortcut = `<input type="field" class="inputField">`
  const modifiers = `<input type="field" class="inputField">`
  const description = `<input type="field" class="inputField">`
  let check = `<input type=checkbox>`
  const newRow = `<tr> 
      <td class="name">`+behavior+`</td>
      <td class="shortcut">`+shortcut+`</td>
      <td class="modifiers">`+modifiers+`</td>
      <td class="description">`+description+`</td>
      <td class="delete">`+check+`</td>
    </tr>`
    tableBody.innerHTML = tableBody.innerHTML + newRow
}
/*
function renderSubjectRow(b){
  const tableBody = document.getElementById("subject-table-body")
  const subjectName = b["subjectName"]
  const subjectDescription = b["subjectDescription"]
  let check = `<input type=checkbox>`
  if(subjectName==""){
    check=""
  }
  const newRow = `<tr> 
      <td scope="row" class="subjectName">`+subjectName+`</td>
      <td class="subjectDescription">`+subjectDescription+`</td>
      <td class="delete">`+check+`</td>
    </tr>`
  tableBody.innerHTML = tableBody.innerHTML + newRow
}

function renderSubjectFillRow(){
  const tableBody = document.getElementById("subject-table-body")
  const subjectName = `<input type="field" class="inputField">`
  const subjectDescription = `<input type="field" class="inputField">`
  let check = `<input type=checkbox>`
  const newRow = `<tr> 
      <td scope="row" class="subjectName">`+subjectName+`</td>
      <td class="subjectDescription">`+subjectDescription+`</td>
      <td class="delete">`+check+`</td>
    </tr>`
  tableBody.innerHTML = tableBody.innerHTML + newRow
}
*/
function renderObservationRow(b){
  const tableBody = document.getElementById("observation-table-body")
  const observationName = b["observationName"]
  const associatedSubjects = b["associatedSubjects"]
  const videos = b["videos"]
  let check = `<input type=checkbox>`
  if(observationName==""){
    check=""
  }
  let splitVideo = videos[0].split('/')
  const newRow = `<tr> 
      <td class="observationName">`+observationName+`</td>
      <td class="associatedSubjects">`+associatedSubjects.join(", ")+`</td>
      <td class="videos">`+splitVideo[splitVideo.length-1] +`</td>
      <td class="delete">`+check+`</td>
    </tr>`
  tableBody.innerHTML = tableBody.innerHTML + newRow
}

function renderObservationFillRow(rowLocation){
  const tableBody = document.getElementById("observation-table-body")
  const observationName = `<input type="field" class="inputField">`
  const associatedSubjects = `<input type="field" class="inputField">`
  const videos = `<img src="../images/file-browser-icon.png" alt="file browser" class="selectBtn"><div class="fileNames" id="row`+rowLocation+`" ></div>`
  let check = `<input type=checkbox>`
  const newRow = `<tr> 
      <td class="observationName">`+observationName+`</td>
      <td class="associatedSubjects">`+associatedSubjects+`</td>
      <td class="videos">`+videos+`</td>
      <td class="delete">`+check+`</td>
    </tr>`
  tableBody.innerHTML = tableBody.innerHTML + newRow
}

document.addEventListener('click',function(e){
    if(e.target && e.target.classList.contains('selectBtn')){
      console.log(e.target.parentNode.getElementsByTagName("div")[0].id)
      ipcRenderer.send('open-dialog', e.target.parentNode.getElementsByTagName("div")[0].id)
   }
});

ipcRenderer.on('file-names', (event, info) => {
  try{
    observationFiles[info["rowID"]] = info["files"][0]
    let span = document.getElementById(info["rowID"])
    let splitVideo = info["files"][0].split('/')
    span.innerHTML = splitVideo[splitVideo.length-1]
  }catch(e){
    console.log(e)
  }
  
}, '')

//  BUTTON RESPONSES

document.getElementById("addRowEthogram").addEventListener('click', () => {
    toFillRowsEthogram++
    renderEthogramTable()
})

document.getElementById("addRowObservations").addEventListener('click', () => {
      toFillRowsObservations++
      renderObservationsTable()
})

document.getElementById('saveProject').addEventListener('click', () => {
  saveProject();
})

document.getElementById('saveAndCloseProject').addEventListener('click', () => {
    closeAfter = true
    saveProject();
})

document.getElementById('close').addEventListener('click', () => {
  ipcRenderer.send('close-edit-window');
})

document.getElementById("deleteProject").addEventListener('click', () => {
  deleteProject()
})

function deleteProject(){
  ipcRenderer.send('delete-project', projectID)
  let toDelete = project
  toDelete.observations = []
  ipcRenderer.send('match-observations', toDelete)
  ipcRenderer.send('close-edit-window');
}

/*
document.getElementById("projectName").addEventListener('dblclick', function (e) {

  document.getElementById("projectName").innerHTML = `<input type="text" id="projectNameEdit" name="projectNameEdit">`
  
  setValue()

  document.getElementById("projectNameEdit").addEventListener("keyup",function search(e) {
    if(e.key == "Enter") {
      setName()
    }
  });
});


function setValue(){
  document.getElementById("projectNameEdit").value = project.name
}

function setName(){
  project.name = document.getElementById("projectNameEdit").value
  document.getElementById("projectName").innerHTML = project.name
}
*/
