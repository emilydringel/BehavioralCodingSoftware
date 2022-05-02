'use strict'

const Store = require('electron-store')

class DataStore extends Store {
  constructor (settings) {
    super(settings)

    // initialize with projects or empty array
    this.projects = this.get('projects') || []
  }

  saveProjects () {
    // save todos to JSON file
    this.set('projects', this.projects)

    // returning 'this' allows method chaining
    return this
  }

  getProjects () {
    this.projects = this.get('projects') || []

    return this
  }

  addProject (project) {
    this.projects = [ ...this.projects, project ]
    return this.saveProjects()
  }

  deleteProject (name) {
    // filter out the target todo
    var index = this.projects.indexOf(name);
    if (index > -1) {
       this.projects.splice(index, 1);
    }

    return this.saveProjects()
  }
}

module.exports = DataStore