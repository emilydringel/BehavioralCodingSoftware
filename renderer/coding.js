const { ipcRenderer, ipcMain } = require('electron')

var video = document.getElementById('video');

ipcRenderer.on('obsJson', (event, obsData) => {
    console.log(obsData)
    if(obsData.videos.length>0){
      var source = document.createElement('source');
      source.setAttribute('src', obsData.videos[0]);
      source.setAttribute('type', 'video/mp4');
      video.appendChild(source);
    }
  }, '')