// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

'use strict'

const { ipcRenderer } = require('electron')

// delete todo by its text value ( used below in event listener)
/*
const deleteTodo = (e) => {
  ipcRenderer.send('delete-todo', e.target.textContent)
}
*/

let currentProjects = {}

// on receive todos
ipcRenderer.on('projects', (event, projects) => {
  // get the todoList ul
  const projectList = document.getElementById('projects')
  // create html string
  let newHTML = `<option value="none" selected disabled hidden>Select an Option</option>`
  for(let i=0; i<projects.length; i++){
    newHTML += `<option value="` + projects[i]+`">`+projects[i]+`</option>`
  }
  document.getElementById("projects").innerHTML = newHTML;
  document.getElementById("observationProjects").innerHTML = newHTML;
  currentProjects=projects
}, '')

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

document.getElementById("openProject").addEventListener('click', function(event) {
  let val = document.getElementById("projects").value
  let jsonName = {"name": val}
  ipcRenderer.send('edit-project-window',jsonName)
  reset(true)
});

function reset(bool){
  if(bool){
    document.getElementById('uniquenessError').innerHTML=""
    document.getElementById('projectName').value=""
    document.getElementById('projects').selectedIndex = 0;
    document.getElementById('observations').selectedIndex = 0;
  }
 
}

document.getElementById("observationProjects").addEventListener('change', function(event){
  ipcRenderer.send('get-observation-options', this.value)
});

ipcRenderer.on('observation-options', (event, observations) => {
  let newHTML = `<option value="none" selected disabled hidden>Select an Option</option>`
  for(let i=0; i<observations.length; i++){
    newHTML += `<option value="` + observations[i]+`">`+observations[i]+`</option>`
  }
  document.getElementById("observations").innerHTML = newHTML;
}, '')

document.getElementById("openObservation").addEventListener('click', function(event) {
  let project = document.getElementById("observationProjects").value
  let observation = document.getElementById("observations").value
  let observationID = {"project": project, "observation": observation}
  ipcRenderer.send('coding-window', observationID)
  reset(true)
});