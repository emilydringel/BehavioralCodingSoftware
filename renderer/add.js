'use strict'

const { ipcRenderer, ipcMain } = require('electron')




var project //current data
var projectID //name on last save -- to delete

var toFillRowsEthogram = 0
var toFillRowsSubjects = 0
var toFillRowsObservations = 0

var page = 0 // 0 == ethogram, 1 == subjects, 2 == observations

//CHOOSING A PAGE
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

//Rendering Ethogram Page
ipcRenderer.on('projectJson', (event, project) => {
  this.project = project
  this.projectID = project.name
  document.getElementById("projectName").innerText = this.project.name;
  renderEthogramTable()
}, '')

function saveProject(){
  if(page == 0){
    saveEthogramTable()
  }else if(page == 1){
    saveSubjectsTable()
  }else{
    saveObservationsTable()
  }
  ipcRenderer.send('delete-project', projectID)
  ipcRenderer.send('addProject', project)
  ipcRenderer.send('match-observations', project)
  if(page == 0){
    renderEthogramTable()
  }else if(page == 1){
    renderSubjectsTable()
  }else{
    renderObservationsTable()
  }
}

function saveEthogramTable(){
  let ethogram = []
  const rows = document.getElementById("ethogram-table-body").getElementsByTagName("tr")
  console.log(rows)
  for(let i = 0; i < rows.length - 1; i++){
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
      ethogram.push(behavior)
    }
  }
  project.ethogram = ethogram
  toFillRowsEthogram = 0
}

function saveSubjectsTable(){
  let subjects = []
  const rows = document.getElementById("subject-table-body").getElementsByTagName("tr")
  console.log(rows)
  for(let i = 0; i < rows.length - 1; i++){
    let row = rows[i]
    console.log(row)
    const vals = row.getElementsByTagName("td")
    let subjectName = vals[0].innerHTML
    let subjectDescription = vals[1].innerHTML
    if(subjectName==""){
      continue
    }
    if(vals[0].getElementsByClassName("inputField").length > 0 ){
      subjectName = vals[0].getElementsByTagName("input")[0].value
      subjectDescription = vals[1].getElementsByTagName("input")[0].value
    }
    const deleted = vals[2].getElementsByTagName("input")[0].checked
    if(!deleted){
      let subject = {subjectName: subjectName, subjectDescription: subjectDescription}
      subjects.push(subject)
    }
  }
  project.subjects = subjects
  toFillRowsSubjects = 0
}

function saveObservationsTable(){
  let observations = []
  const rows = document.getElementById("observation-table-body").getElementsByTagName("tr")
  console.log(rows)
  for(let i = 0; i < rows.length - 1; i++){
    let row = rows[i]
    console.log(row)
    const vals = row.getElementsByTagName("td")
    let observationName = vals[0].innerHTML
    let associatedSubjects = vals[1].innerHTML.split(", ")
    let videos = vals[2].innerHTML.split(", ")
    if(observationName==""){
      continue
    }
    if(vals[0].getElementsByClassName("inputField").length > 0 ){
      observationName = vals[0].getElementsByTagName("input")[0].value
      associatedSubjects = vals[1].getElementsByTagName("input")[0].value.split(", ")
      videos = vals[2].getElementsByTagName("div")[0].innerHTML.split(", ")
      console.log(videos)
    }
    const deleted = vals[3].getElementsByTagName("input")[0].checked
    if(!deleted){
      let observation = {projectName: project.name, observationName: observationName, 
      associatedSubjects: associatedSubjects,
      videos: videos}
      observations.push(observation)
      if(project.hasOwnProperty('observationName')){
        if(project.observations.includes(observationName)){
          ipcRenderer.send('edit-observation-base-data', observation)
        }else{
          ipcRenderer.send('create-observation', observation)
        }
      }else{
        ipcRenderer.send('create-observation', observation)
      }

      
      //if project.obs already has the observation -- just need to edit that observation to include the new data
      //if project.obs doesn't already have the observation -- need to create a new observation
    }
  }
  project.observations = observations 
  toFillRowsObservations = 0
}

function renderEthogramTable(){
  const tableBody = document.getElementById("ethogram-table-body")
  tableBody.innerHTML = ""
  let count = 0
  for(let i=0; i<toFillRowsEthogram; i++){
    renderEthogramFillRow()
    count++
  }if(project.hasOwnProperty('ethogram')){ //probably won't need this line 
    for(let behavior in project.ethogram){
      behavior = project.ethogram[behavior]
      count ++
      renderEthogramRow(behavior)
    }
  }while(count<5){
    const empty = {behaviorName: "", shortcut: "", modifiers: [], description: ""}
    renderEthogramRow(empty)
    count++
  }
}

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

function renderObservationsTable(){
  const tableBody = document.getElementById("observation-table-body")
  tableBody.innerHTML = ""
  let count = 0
  for(let i=0; i<toFillRowsObservations; i++){
    renderObservationFillRow(i)
    count++
  }if(project.hasOwnProperty('observations')){ //probably won't need this line 
    for(let observation in project.observations){
      observation = project.observations[observation]
      count ++
      renderObservationRow(observation)
    }
  }while(count<5){
    const empty = {observationName: "", 
      associatedSubjects: [],
      videos: []}
    renderObservationRow(empty)
    count++
  }
}

/* ADD RENDER SUBJECTS AND OBSERVATIONS */

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
      <td scope="row" class="name">`+behavior+`</td>
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
      <td scope="row" class="name">`+behavior+`</td>
      <td class="shortcut">`+shortcut+`</td>
      <td class="modifiers">`+modifiers+`</td>
      <td class="description">`+description+`</td>
      <td class="delete">`+check+`</td>
    </tr>`
    tableBody.innerHTML = tableBody.innerHTML + newRow
}

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

function renderObservationRow(b){
  const tableBody = document.getElementById("observation-table-body")
  const observationName = b["observationName"]
  const associatedSubjects = b["associatedSubjects"]
  const videos = b["videos"]
  let check = `<input type=checkbox>`
  if(observationName==""){
    check=""
  }
  const newRow = `<tr> 
      <td scope="row" class="observationName">`+observationName+`</td>
      <td class="associatedSubjects">`+associatedSubjects.join(", ")+`</td>
      <td class="videos">`+videos.join(", ")+`</td>
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
      <td scope="row" class="observationName">`+observationName+`</td>
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
    let span = document.getElementById(info["rowID"])
    span.innerHTML = info["files"].join(", ")
  }catch(e){
    console.log(e)
  }
  
}, '')

//  BUTTON RESPONSES

document.getElementById("addRow").addEventListener('click', () => {
  if(page == 0){
    toFillRowsEthogram++
    renderEthogramTable()
  }else if(page == 1){
    toFillRowsSubjects++
    renderSubjectsTable()
  }else{
    toFillRowsObservations++
    renderObservationsTable()
  }
})

document.getElementById('saveProject').addEventListener('click', () => {
  saveProject();
  projectID = project.name
})

document.getElementById('saveAndCloseProject').addEventListener('click', () => {
  saveProject();
  ipcRenderer.send('close-edit-window');
})

document.getElementById('close').addEventListener('click', () => {
  ipcRenderer.send('close-edit-window');
})

document.getElementById("delete-icon").addEventListener('click', () => {
  deleteProject()
})

function deleteProject(){
  ipcRenderer.send('delete-project', projectID)
  ipcRenderer.send('close-edit-window');
}

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

