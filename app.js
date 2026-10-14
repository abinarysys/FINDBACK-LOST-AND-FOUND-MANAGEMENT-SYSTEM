const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const flash = require('connect-flash');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 's3cr3t',
    resave: false,
    saveUninitialized: false
}));

// flash 
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.set('io', io);

// web socket
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

// middlewares
const authMiddleware = require('./middleware/auth-middleware.js')
const userMiddleware = require('./middleware/user-middleware.js')
const upload = require('./middleware/upload-middleware.js');

//using the middleware
app.use(userMiddleware);

// routers
app.use('/', require('./routers/landing-router'));
app.use('/auth', require('./routers/auth-router'));
app.use('/fb', require('./routers/feedback-router.js'))
app.use('/lost', require('./routers/lostItem-router.js'))
app.use("/found", require("./routers/foundItem-router.js"))

server.listen(4000, () => {
    console.log('FINDBACK running at http://localhost:4000');
});
