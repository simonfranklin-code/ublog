const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
    name: 'ublog Service',
    description: 'ublog Windows Service.',
    script: path.join(__dirname, 'app.js'), // Path to your Node.js script
    // Optionally define the user credentials
    // user: {
    //   account: 'username',
    //   password: 'password'
    // }
});

// Listen for the "install" event, which indicates the service was installed
svc.on('install', function () {
    console.log('Service installed');
    svc.start();
});

// Listen for the "alreadyinstalled" event, which indicates the service is already installed
svc.on('alreadyinstalled', function () {
    console.log('Service is already installed');
});

// Listen for the "start" event, which indicates the service was started
svc.on('start', function () {
    console.log('Service started');
});

// Install the service
svc.install();
