'use strict'

const path = require('path')
const { app, ipcMain } = require('electron')

const Window = require('./Window')
const DataStore = require('./DataStore')
const ProjectDataStore = require('./ProjectDataStore')
const ObservationDataStore = require('./ObservationDataStore')
const fs = require('fs')

const { dialog } = require('electron')

require('electron-reload')(__dirname)

// create a new todo store name "Todos Main"
const projectData = new DataStore({ name: 'devDB' })
let editProjectWin
let codingWindow

function main () {
  // todo list window
  let mainWindow = new Window({
    file: path.join('renderer', 'index.html')
  })

  // add todo window

  // TODO: put these events into their own file

  // initialize with todos
  mainWindow.once('show', () => {
    mainWindow.send('projects', projectData.projects)
  })

  ipcMain.on('get-observation-options', (event, projectName) => {
    let observations = []
    let thisProject = new ProjectDataStore({ name: projectName })
    let projectJson = thisProject.getData()
    if(projectJson.hasOwnProperty('observations')){
      for(let obs in projectJson.observations){
        obs = projectJson.observations[obs]
        observations.push(obs.observationName)
      }
    }
    mainWindow.send('observation-options', observations)
  })
  // create add todo window
  ipcMain.on('edit-project-window', (event, projectName) => {
    // if addTodoWin does not already exist
    if (!editProjectWin) {
      // create a new add todo window
      editProjectWin = new Window({
        file: path.join('renderer', 'add.html'),
        width: 1000, //750
        height: 540, //515
        // close with the main window
        parent: mainWindow,
      })
      
      editProjectWin.once('show', () => {
        let name = projectName.name
        let thisProject = new ProjectDataStore({ name: name })
        let projectJson = thisProject.getData()
        projectJson.name = name
        editProjectWin.send('projectJson', projectJson)
      })
      // cleanup
      editProjectWin.on('closed', () => {
        editProjectWin = null
      })
    }
  })

  ipcMain.on('coding-window', (event, observationID) => {
    // if addTodoWin does not already exist
    if (!codingWindow) {
      // create a new add todo window
      codingWindow = new Window({
        file: path.join('renderer', 'coding.html'),
        width: 1200, //1100
        height: 803, //775
        // close with the main window
        parent: mainWindow,
      })
      
      codingWindow.once('show', () => {
        console.log(observationID)
        let thisObservation = new ObservationDataStore({ name: observationID.project + "-" + observationID.observation})
        let obsJson = thisObservation.getData()
        codingWindow.send('obsJson', obsJson)
      })
      // cleanup
      codingWindow.on('closed', () => {
        codingWindow = null
      })
    }
  })
  
  ipcMain.on('addProject', (event, project) => {
    const updatedProjects = projectData.addProject(project.name).projects
    const newProject = new ProjectDataStore({ name: project.name })
    newProject.createProject(project)
    mainWindow.send('projects', updatedProjects)
  })

  ipcMain.on('edit-observation-base-data', (event, observation) => {
    console.log(observation)
    const myObservation = new ObservationDataStore({ name: observation.projectName + "-" + observation.observationName})
    myObservation.editBaseData(observation)
  })

  ipcMain.on('create-observation', (event, observation) => {
    const newObservation = new ObservationDataStore({ name: observation.projectName + "-" + observation.observationName})
    newObservation.createObservation(observation)
  })

  ipcMain.on('match-observations', (event, project) => {
    const dir = app.getPath('userData')
    const files = fs.readdirSync(dir)
    let observationNames = []
    for(let observation in project.observations){
      observationNames.push(observation.observationName)
    }
    for (const file of files) {
      if(file.substring(0,project.name.length+1)===project.name+"-"){
        if(!observationNames.includes(file.substring(project.name.length+1))){
          try {
            fs.unlinkSync(path)
            //file removed
          } catch(err) {}
        }
      }
    }
  })

  //save obs -- delete old if exists and add new -- need to figure out a way to save the extra data from the old one!!
  // actually bc there is no way to edit an observation, might be easier than that -- think thru it!!
  //match obs -- look at all obs under the name, make sure they match the ones in the ipc renderer

  ipcMain.on('delete-project', (event, project) => {
    const updatedProjects = projectData.deleteProject(project).projects
    const path = app.getPath('userData') + "/"+project+".json"
    try {
      fs.unlinkSync(path)
      //file removed
    } catch(err) {}
    mainWindow.send('projects', updatedProjects)
  })

  ipcMain.on('close-edit-window', () => {
    if(editProjectWin){
      editProjectWin.close();
    }
  })

  ipcMain.on('close-edit-window', () => {
    if(editProjectWin){
      editProjectWin.close();
    }
  })


  ipcMain.on('open-dialog', (event, rowLocation) => {
    console.log(rowLocation)
    dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
          { name: 'Movies', extensions: ['mp4'] }
      ]
    }).then(result => {
      console.log(result.canceled)
      if(!result.canceled){
        console.log(result.filePaths)
        let files = result.filePaths
        if (files !== undefined) {
          console.log({files: files, rowID: "row"+rowLocation})
          editProjectWin.send('file-names', {files: files, rowID: rowLocation});
        } 
      }
    }).catch(err => {
      console.log(err)
    })
    /*
    dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
          { name: 'Movies', extensions: ['mp4'] }
      ]
    }), (files) => {
      console.log("hello")
      console.log(files)
        if (files !== undefined) {
          let toPrint = ""
          for(let file in files){
            toPrint += file + ","
          }
        }
        console.log({files: toPrint, rowID: "row"+rowLocation})
        editProjectWin.send('file-names', {files: toPrint, rowID: "row"+rowLocation});
    });*/
  })
}

app.on('ready', main)

app.on('window-all-closed', function () {
  app.quit()
})