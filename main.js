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
let addObsWindow

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
        const project = new ProjectDataStore({ name: observationID.project })
        let projJson = project.getData()
        codingWindow.send('projectJson', projJson)
      })
      // cleanup
      codingWindow.on('closed', () => {
        codingWindow = null
      })
    }
  })

  ipcMain.on('add-observation-window', (event, projectID) => {
    // if addTodoWin does not already exist
    if (!addObsWindow) {
      // create a new add todo window
      addObsWindow = new Window({
        file: path.join('renderer', 'new-observation.html'),
        width: 630, //330
        height: 440, 
        // close with the main window
        parent: mainWindow,
      })
      addObsWindow.once('show', () => {
        let project = new ProjectDataStore({ name: projectID })
        let projectInfo = project.getData()
        console.log(projectInfo)
        addObsWindow.send('project-info', projectInfo)
      })
      // cleanup
      addObsWindow.on('closed', () => {
        addObsWindow = null
      })
    }
  })
  
  ipcMain.on('addProject', (event, project) => {
    const updatedProjects = projectData.addProject(project.name).projects
    const newProject = new ProjectDataStore({ name: project.name })
    newProject.createProject(project)
    mainWindow.send('projects', updatedProjects)
    let observations = []
    let fullObs = newProject.getData().observations
    for(let obs in fullObs){
      obs = fullObs[obs]
      observations.push(obs.observationName)
    }
    let observationData = {projectName: project.name, observations: observations}
    mainWindow.send('updated-observations', observationData)
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

  ipcMain.on('add-obs-to-proj', (e, obs) => {
    const myProject = new ProjectDataStore({ name: obs.projectName})
    myProject.updateObservations(obs)
    let observations = []
    let fullObs = myProject.getData().observations
    for(let obs in fullObs){
      obs = fullObs[obs]
      observations.push(obs.observationName)
    }
    let observationData = {projectName: obs.projectName, observations: observations}
    mainWindow.send('updated-observations', observationData)
  })

  ipcMain.on('match-observations', (event, project) => {
    const dir = app.getPath('userData')
    const files = fs.readdirSync(dir)
    let observationNames = []
    console.log(project.observations)
    for(let observation in project.observations){
      console.log(project.observations[observation].observationName)
      observationNames.push(project.observations[observation].observationName+".json")
    }
    for (const file of files) {
      console.log(file)
      if(file.substring(0,project.name.length+1)===project.name+"-"){
        console.log("file matches format")
        if(!observationNames.includes(file.substring(project.name.length+1))){
          console.log(file.substring(project.name.length+1))
          console.log("not in obs names")
          try {
            fs.unlinkSync(app.getPath('userData') + "/"+file)
            //file removed
          } catch(err) {}
        }
      }
    }
  })

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

  ipcMain.on('close-coding-window', () => {
    if(codingWindow){
      codingWindow.close();
    }
  })

  ipcMain.on('close-add-obs-window', () => {
    if(addObsWindow){
      addObsWindow.close();
    }
  })

  ipcMain.on("save-codes", (event, observation) => {
    console.log(observation)
    const myObservation = new ObservationDataStore({ name: observation.projectName + "-" + observation.observationName})
    myObservation.updateCodes(observation)
  })

  ipcMain.on("export-observation", (event, observation) => {
    let defaultName  = observation.projectName + "-" + observation.observationName
    var json = observation.data
    console.log(json)
    var fields = Object.keys(json[0])
    var replacer = function(key, value) { return value === null ? '' : value } 
    var csv = json.map(function(row){
      return fields.map(function(fieldName){
        return JSON.stringify(row[fieldName], replacer)
      }).join(',')
    })
    csv.unshift(fields.join(',')) // add header column
    csv = csv.join('\r\n');
    console.log(csv)
    let innerText = csv
    // You can obviously give a direct path without use the dialog (C:/Program Files/path/myfileexample.txt)
    dialog.showSaveDialog({
      title: 'Select the File Path to save',
      defaultPath: path.join(__dirname, '../' + defaultName + ".csv"),
      // defaultPath: path.join(__dirname, '../assets/'),
      buttonLabel: 'Save',
      // Restricting the user to only Text Files.
      filters: [
          {
              name: 'CSV Only',
              extensions: ['csv']
          }, ],
      properties: []
  }).then(file => {
      // Stating whether dialog operation was cancelled or not.
      console.log(file.canceled);
      if (!file.canceled) {
          console.log(file.filePath.toString());
            
          // Creating and Writing to the sample.txt file
          fs.writeFile(file.filePath.toString(), 
                       innerText, function (err) {
              if (err) throw err;
              console.log('Saved!');
          });
      }
  }).catch(err => {
      console.log(err)
  });
  })

  ipcMain.on('open-dialog', (event, rowLocation) => {
    dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
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
  })

  ipcMain.on('open-dialog-two', (event) => {
    dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
          { name: 'Movies', extensions: ['mp4'] }
      ]
    }).then(result => {
      if(!result.canceled){
        console.log(result.filePaths)
        let files = result.filePaths
        if (files !== undefined) {
          addObsWindow.send('selected-file', files[0]);
        } 
      }
    }).catch(err => {
      console.log(err)
    })
  })

  ipcMain.on("project-name-uniqueness", (e, name) => {
    for(let projectName in projectData.projects){
      console.log(projectData.projects[projectName])
      if(projectData.projects[projectName] === name){
        editProjectWin.send('project-name-uniqueness-results', false)
        return
      }
    }
    editProjectWin.send('project-name-uniqueness-results', true)
    return true
  })
}

app.on('ready', main)

app.on('window-all-closed', function () {
  app.quit()
})