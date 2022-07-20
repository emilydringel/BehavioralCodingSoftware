// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

'use strict'

const { ipcRenderer } = require('electron')

let currentProjects = {}

let activeProject = null

let openProjectTemplate = `<div id="settings">
    <img id="settings-icon" src="../images/settings-icon.png" alt="Settings">
    </div>
    <div id="project-body">
    <div id="project-name">
        <span id="project-name-span"></span>
    </div>
    <div id="inner-data">
        Open Observation: <br>
        <ul id="observation-list">
            <li><button id="new-obs">New Observation</button></li>
        </ul>
        Export Data:
        <ul>
            <li><button class="export-button" disabled>Export as Folder</button></li>
            <li><button class="export-button" disabled>Export as Sheet</button></li>
        </ul>
        <span class="error">*Note: These export buttons do not currently <br>work. For now, export each observation <br>individually.*</span>
    </div>
    </div>`

// on receiving projects
ipcRenderer.on('projects', (event, projects) => {
  // create project list 
  const projectList = document.getElementById('projects')
  // create html string
  document.getElementById("project-list").innerHTML = `<li class ="nav-item active" id="nav-header-parent">
  <div id="nav-header">Projects</div>
</li>`
  for(let i=0; i<projects.length; i++){
    let newHTML =`<li class ="nav-item">
      <button id="`+projects[i]+`" class = "nav-link project">`
      +projects[i]+`</button></li>`
    console.log(newHTML)
    document.getElementById("project-list").innerHTML += newHTML;
  }
  let addProjectButton = `<li class ="nav-item"><button id="add-project">New Project</button></li>`
  document.getElementById("project-list").innerHTML += addProjectButton;
  currentProjects=projects
}, '')
/*
document.getElementById("createProject").addEventListener('click', function(event) {
  let val = document.getElementById("projectName").value
  if(unique(val)){
    let jsonName = {"name": val}
    ipcRenderer.send('edit-project-window',jsonName)
    reset(true)
  }else{
    document.getElementById('uniquenessError').innerHTML = "Error: A project with this name already exists. Please choose a new name."
  }
});

function unique(projectName){
  for(let i=0; i<currentProjects.length; i++){
    console.log(currentProjects[i].name)
    if(currentProjects[i].name == projectName){
      return false;
    }
  }
  return true;
}
*/

document.addEventListener('click', function(e){
  if(e.target && e.target.classList.contains('project')){
    ipcRenderer.send('get-observation-options', e.target.id)
    activeProject = e.target.id
    e.target.classList.add("active")
  }if(e.target && e.target.classList.contains('observation')){
    let project = activeProject
    let observation = e.target.id
    let observationID = {"project": project, "observation": observation}
    ipcRenderer.send('coding-window', observationID)
  }if(e.target && e.target.id == "add-project"){
    let val = "untitled"
    let jsonName = {"name": val}
    ipcRenderer.send('edit-project-window',jsonName)
  }if(e.target && e.target.id == "settings-icon"){
    let val = activeProject
    let jsonName = {"name": val}
    ipcRenderer.send('edit-project-window',jsonName)
  }if(e.target && e.target.id == "settings"){
    let val = activeProject
    let jsonName = {"name": val}
    ipcRenderer.send('edit-project-window',jsonName)
  }if(e.target && e.target.id == "new-obs"){
    ipcRenderer.send('add-observation-window', activeProject)
  }
})
/*
document.getElementById("settings-icon").addEventListener('click', function(event) {
  let val = document.getElementById("projects").value
  let jsonName = {"name": val}
  ipcRenderer.send('edit-project-window',jsonName)
  reset(true)
});

document.getElementById("observationProjects").addEventListener('change', function(event){
  ipcRenderer.send('get-observation-options', this.value)
});
*/

ipcRenderer.on('observation-options', (event, observations) => {
  document.getElementById("project-section").innerHTML = openProjectTemplate
  for(let i=0; i<observations.length; i++){
    let newHTML = `<li><button id="`+observations[i]+`" class="observation">`+observations[i]+`</button></li>`
    document.getElementById("observation-list").innerHTML = newHTML + document.getElementById("observation-list").innerHTML
  }
  document.getElementById("project-name-span").innerHTML = activeProject
}, '')

ipcRenderer.on('updated-observations', (event, observationData) => {
  if(observationData.projectName!=activeProject){
    return
  }
  document.getElementById("project-section").innerHTML = openProjectTemplate
  for(let i=0; i<observationData.observations.length; i++){
    let newHTML = `<li><button id="`+ observationData.observations[i]+`" class="observation">`+observationData.observations[i]+`</button></li>`
    document.getElementById("observation-list").innerHTML = newHTML + document.getElementById("observation-list").innerHTML
  }
  document.getElementById("project-name-span").innerHTML = activeProject
}, '')
/*
document.getElementById("openObservation").addEventListener('click', function(event) {
  let project = document.getElementById("observationProjects").value
  let observation = document.getElementById("observations").value
  let observationID = {"project": project, "observation": observation}
  ipcRenderer.send('coding-window', observationID)
  reset(true)
});
*/

