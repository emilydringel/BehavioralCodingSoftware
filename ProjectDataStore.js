'use strict'

const Store = require('electron-store')

class ProjectDataStore extends Store {
  constructor (settings) {
    super(settings)

    // initialize with projects or empty array
    this.projectData = this.get('projectData') || {}
  }

  createProject(project){
    this.projectData = project
    return this.saveData()
  }

  saveData () {
    // save todos to JSON file
    this.set('projectData', this.projectData)

    // returning 'this' allows method chaining
    return this
  }

  getData(){
      return this.projectData || {}
  }
}

module.exports = ProjectDataStore