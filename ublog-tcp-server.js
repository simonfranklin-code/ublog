const tls = require('tls');
const fs = require('fs');

const options = {
    key: fs.readFileSync('ublog-key.pem'),
    cert: fs.readFileSync('ublog-cert.pem'),
    // This is necessary only if using client certificate authentication.
    requestCert: true,
    // This is necessary only if the client uses a self-signed certificate.
    rejectUnauthorized: true,
};

const server = tls.createServer(options, (socket) => {
    console.log('server connected',
        socket.authorized ? 'authorized' : 'unauthorized');
    socket.on('error', (err) => {
        console.error('Socket error:', err);
    });
    socket.write('welcome!\n');
    socket.on('data', (data) => {
        console.log('Received data:', data.toString());
        // Here you can handle the incoming data as needed
    });
    socket.setEncoding('utf8');
    socket.pipe(socket);
});

server.listen(8000, () => {
    console.log('server bound');
});