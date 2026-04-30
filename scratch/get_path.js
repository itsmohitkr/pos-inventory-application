const { app } = require('electron');
console.log('UserData:', app.getPath('userData'));
app.quit();
