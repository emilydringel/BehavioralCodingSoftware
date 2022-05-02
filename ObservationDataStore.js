'use strict'

const Store = require('electron-store')

class ObservationDataStore extends Store {
  constructor (settings) {
    super(settings)

    // initialize with projects or empty array
    this.observationData = this.get('observationData') || {}
  }

  //should be created with videos and name
  createObservation(observation){
    this.observationData = observation
    return this.saveData()
  }

  editBaseData(observation){
    this.observationData.associatedSubjects = observation.associatedSubjects
    this.observationData.videos = observation.videos
  }

  saveData () {
    // save todos to JSON file
    this.set('observationData', this.observationData)

    // returning 'this' allows method chaining
    return this
  }

  getData(){
      return this.observationData || {}
  }
}

module.exports = ObservationDataStore