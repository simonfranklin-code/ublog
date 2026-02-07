
require('dotenv').config();
require('./jobs/logCleaner');
var debug = require('debug')('you blog express app');
var express = require('express');
const fileUpload = require('express-fileupload');
const multer = require('multer');
const path = require('path');
//onst lessMiddleware = require('less-middleware');
var favicon = require('serve-favicon');
var logger = require('morgan');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const flash = require('connect-flash');
const passport = require('passport');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session); // Ensure you have connect-sqlite3 installed
const { body, validationResult } = require('express-validator');
const blogPostRoutes = require('./routes/blogPostRoutes');
const commentRoutes = require('./routes/commentRoutes');
const indexRoutes = require('./routes/index');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const likeRoutes = require('./routes/likeRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const reviewLikeRoutes = require('./routes/reviewLikeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const followerRoutes = require('./routes/followerRoutes');
const chatRoutes = require('./routes/chatRoutes');
const friendRoutes = require('./routes/friendRoutes');
const timelineRoutes = require('./routes/timelineRoutes')
const messageRoutes = require('./routes/messageRoutes');
const apiRoutes = require('./routes/apiRoutes');
const editorRoutes = require('./routes/editorRoutes');
const http = require('http');
const socketIo = require('socket.io');
const passportSocketIo = require('passport.socketio');
const userWithAvatar = require('./models/User');
const Message = require('./models/Message');
const DeepSeekApi = require('./models/DeepSeekApi');
const { initRateLimiter } = require('./middleware/rateLimiter');
// ?? inject io after it�s ready
var app = express();

// Passport config
require('./config/passport')(passport);
// Connect flash
app.use(flash());
// Create HTTP server and wrap Express app
const server = http.createServer(app);

// Set up Socket.IO
const io = socketIo(server);
app.set('io', io); // Optional: attach to app
initRateLimiter(io);
// Set up the session store
const sessionStore = new SQLiteStore({ db: 'sessions.db', dir: './database' });
// Express session middleware
const sessionMiddleware = session({
    store: sessionStore, // Use SQLite store for session persistence
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 days
});

// Use session middleware in Express
app.use(sessionMiddleware);


// Express session
app.use(session({
    store: sessionStore, // Use SQLite store for session persistence
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 * 14 } // 14 days
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
// Use Passport with Socket.IO
io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,       // Same cookie parser middleware
    key: 'connect.sid',               // Name of the cookie used in Express sessions
    secret: 'secret',                 // Session secret
    store: sessionStore,              // Session store (e.g., SQLiteStore)
    success: onAuthorizeSuccess,      // Callback on success
    fail: onAuthorizeFail             // Callback on failure
}));
// Configure storage to keep original filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // ensure 'uploads/' exists
    },
    filename: (req, file, cb) => {
        // Accept only certain file types
        const fileTypes = /jpeg|jpg|png|gif|webp|pdf|html/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        const timestamp = Date.now();

        if (extname && mimetype) {
            cb(null, `${base}-${timestamp}${ext}`);
        } else {
            cb(new Error(`Only images, htmls and PDFs are allowed`));
        }
        //cb(null, file.originalname); // preserve original name
    }
});
// Configure multer for file uploads
const upload = multer({ storage });

// Handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`; // File URL for serving
    res.json({ fileUrl });
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


function onAuthorizeSuccess(data, accept) {
    console.log('successful connection to socket.io');
    accept(); // Allow connection
}

function onAuthorizeFail(data, message, error, accept) {
    if (error) {
        accept(new Error(message)); // Deny connection
    }
}


// Store online users and their details
const onlineUsers = new Map(); // Key: userId, Value: { username, avatar, socketId }
// Store connected clients and their socket IDs
const users = {};
// Handle Socket.IO connections
io.on('connection', (socket) => {
    const user = socket.request.user; // Access authenticated user
    console.log('User connected:', socket.id);
    // Emit the updated user list to all clients
    if (user && user.id) {
        if (onlineUsers.has(user.id)) {
            console.log(`User ${user.username} (${user.id}) already connected.`);
            return;
        }


        console.log(`User connected: ${user.username} (${user.id})`);

        // Register a username to a socket ID
        users[user.id] = socket.id;

        // Add the user to the map
        onlineUsers.set(user.id, {
            username: user.username,
            avatar: user.avatar,
            socketId: socket.id
        });

        // Emit the updated user list to all clients
        const userList = Array.from(onlineUsers.entries()).map(([userId, details]) => ({
            userId,
            username: details.username,
            avatar: details.avatar,
            socketId: details.socketId
        }));
        io.emit('updateUserList', userList);


        // Notify all clients that the user is online
        io.emit('user-online', { userId: user.id, username: user.username, avatar: user.avatar, socketId: socket.id });

        // Join user-specific room
        socket.join(user.id);  // Use the user's ID to join a room

        // Handle receiving a chat message from the client
        socket.on('chatMessage', (msg) => {
            if (!user) {
                return io.emit('chatError', { error: 'User not authenticated' });
            }


            try {
                //const message = await DeepSeekApi.createCompletion(data.message, data.sessionId, user.id);

                io.emit('chatMessage', {
                    avatar: user.avatar,
                    username: user.username,
                    message: msg,
                    id: user.id,
                    socketid: socket.id
                });

            } catch (err) {
                console.error('[Socket.IO] async error:', err);
                socket.emit('chatError', { error: 'AI processing failed', detail: err.message });
            }

        });

        // Handle receiving a chat message from the client
        //socket.on('chatMessage', (msg) => {
        //    if (user) {
        //        io.emit('chatMessage', { avatar: user.avatar, username: user.username, message: msg, id: user.id });
        //    }
        //});

        // Handle receiving a private message
        socket.on('privateMessage', ({ to, message }) => {
            const targetSocketId = users[to]; // Get the recipient's socket ID
            if (targetSocketId) {
                // Send the private message to the target user
                io.to(targetSocketId).emit('privateMessage', {
                    from: user.id,
                    avatar: user.avatar,
                    username: user.username,
                    socketid: targetSocketId,
                    message,
                });
                // Emit acknowledgment back to the sender
                socket.emit('messageDelivered', { to, message });
                console.log(`Private message from ${user.username} to ${to}: ${message}`);
            } else {
                // Notify sender that the recipient is offline or unavailable
                socket.emit('messageFailed', { to, message });
                console.log(`User ${to} not found or offline.`);
            }
        });

        // Handle user disconnecting
        socket.on('disconnect', (reason) => {
            console.log(`User disconnected: ${user.username} (${user.id})`);
            console.log(`[Socket.IO] Disconnected: ${reason}`);
            // Remove user from online users set
            onlineUsers.delete(user.id);
            delete users[user.id];
            // Notify all clients that the user has gone offline
            io.emit('user-offline', { userId: user.id, username: user.username, avatar: user.avatar });
            // Emit the updated user list to all clients
            const userList = Array.from(onlineUsers.entries()).map(([userId, details]) => ({
                userId,
                username: details.username,
                avatar: details.avatar
            }));
            io.emit('updateUserList', userList);
        });


        // Handle user joining a specific room
        socket.on('joinRoom', (userId) => {
            socket.join(userId); // Join a room named after the userId
            console.log(`User ${userId} joined room`);
        });

        socket.on('sendFile', (data) => {
            // Broadcast file link to all users
            io.emit('fileMessage', {
                username: data.username,
                fileUrl: data.fileUrl,
                fileName: data.fileName,
            });
        });

        // Relay signaling data
        socket.on('offer', (data) => {
            console.log('Offer received from:', data.from);
            socket.to(data.to).emit('offer', data);
        });

        socket.on('answer', (data) => {
            console.log('Answer received from:', data.from);
            socket.to(data.to).emit('answer', data);
        });

        socket.on('ice-candidate', (data) => {
            console.log('ICE candidate received from:', data.from);
            console.log('ICE candidate details:', data.candidate);

            // Relay the ICE candidate to the intended recipient
            socket.to(data.to).emit('ice-candidate', data);
        });
    }
});



// Global variables for flash messages and user
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

// Enable files upload
app.use(fileUpload({
    createParentPath: true
}));

// Make io accessible via req.io in all routes and controllers
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.set('trust proxy', 1); // Trust first proxy

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// Set the 'basedir' option for Pug to resolve absolute paths in includes
app.locals.basedir = path.join(__dirname, 'views');
// Bodyparser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.use('/blog/:blogSlug/:slug', blogPostRoutes);
app.use('/comments', commentRoutes);
app.use('/users', userRoutes);
app.use('/', indexRoutes);
app.use('/admin', adminRoutes);
app.use('/likes', likeRoutes);
app.use('/reviews', reviewRoutes);
app.use('/reviewLikes', reviewLikeRoutes);
app.use('/notifications', notificationRoutes);
app.use('/followers', followerRoutes);
app.use('/chat', chatRoutes);
app.use('/friends', friendRoutes);
app.use('/users/timeline', timelineRoutes);
app.use('/messages', messageRoutes);
app.use('/api', apiRoutes);
app.use('/editor', editorRoutes);
// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error handlers
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

// Set the port and start the server
app.set('port', process.env.PORT || 10000);

server.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

module.exports = { app, server, io }; // ?? Export io here