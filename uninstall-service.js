const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
    name: 'ublog Service',
    script: path.join(__dirname, 'app.js')
});

// Listen for the "uninstall" event, which indicates the service was uninstalled
svc.on('uninstall', function () {
    console.log('Service uninstalled');
});

// Uninstall the service
svc.uninstall();
