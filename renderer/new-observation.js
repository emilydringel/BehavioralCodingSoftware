'use strict'

const { ipcRenderer, ipcMain } = require('electron')

let chosenVideo = null
let projectName = null
let projectData = null

ipcRenderer.on('project-info', (e, projectInfo) => {
    document.getElementById("project-name-span").innerHTML = projectInfo.name
    projectName = projectInfo.name
    projectData = projectInfo
});

document.getElementById("select-video").addEventListener('click',function(e){
    ipcRenderer.send('open-dialog-two')
});

ipcRenderer.on('selected-file', (event, info) => {
      let span = document.getElementById("selected-video")
      let splitVideo = info.split('/')
      chosenVideo = info
      span.innerHTML = splitVideo[splitVideo.length-1]
  }, '')

document.getElementById("save-and-return").addEventListener('click', () => {
    if(save()){
        ipcRenderer.send('close-add-obs-window')
    }
})

document.getElementById("save-and-code").addEventListener('click', () => {
    if(save()){
        ipcRenderer.send('close-add-obs-window')
        let obsData = {project: projectName, observation: document.getElementById("observation-name").value}
        ipcRenderer.send('coding-window', obsData)
    }
})

function save(){
    let name = document.getElementById("observation-name").value
    Array.from(document.querySelectorAll('.error')).forEach((el) => el.remove());
    let success = true
    if(duplicateName(name)){
        let errorMessage = `<div class="error">An observation with this name already exists. Please use a new name.</div>`
        document.getElementById("name").innerHTML += errorMessage
        success = false
    }if(name == ""){
        let errorMessage = `<div class="error">Please name your observation.</div>`
        document.getElementById("name").innerHTML += errorMessage
        success = false
    }
    let subjects = document.getElementById("subjects").value.split(", ")
    if(subjects == ""){
        let errorMessage = `<div class="error">At least one subject is required.</div>`
        document.getElementById("subj").innerHTML += errorMessage
        success = false
    }if(chosenVideo == null){
        let errorMessage = `<div class="error">Please select a video.</div>`
        document.getElementById("vids").innerHTML += errorMessage
        success = false
    }
    if(!success){
        return success
    }
    let observation = {projectName: projectName, observationName: name, 
        associatedSubjects: subjects,
        videos: [chosenVideo]}
    ipcRenderer.send('create-observation', observation)
    ipcRenderer.send('add-obs-to-proj', observation)
    return success
}

function duplicateName(name){
    console.log(projectData)
    for(let obs in projectData.observations){
        if(projectData.observations[obs].observationName == name){
            return true
        }
    }
    return false
}