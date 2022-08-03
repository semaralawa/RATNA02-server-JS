//load depedencies
const https = require("https");
const fs = require('fs')
const WebSocket = require('ws');
const express = require('express');
const session = require('express-session');
const path = require('path');

//init websocket
const WebSocketServer = WebSocket.Server;

//port to listen
const HTTPS_PORT = 443;

// set password
const WEB_PASSWORD = 'aaa';

//TLS
const serverConfig = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
};

const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

//express session
app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: false,
    })
);

//login page
app.get('/', function (req, res) {
    if (req.session.isLoggedIn === true) {
        res.redirect('/control');
    }
    else {
        res.sendFile(path.join(__dirname, 'public/login.html'));
    }
});

app.post('/', function (req, res) {
    const pass = req.body.password;
    // console.log(pass);
    if (pass === WEB_PASSWORD) {
        req.session.isLoggedIn = true;
        res.redirect('/control');
    }
    else {
        console.log('wrong password')
        res.redirect('/');
    }
});

//user page for controlling the robot
app.get('/control', function (req, res) {
    if (req.session.isLoggedIn === true) {
        res.sendFile(path.join(__dirname, 'public/control.html'));
    }
    else {
        res.redirect('/');
    }
});

app.post('/logout', function (req, res) {
    req.session.destroy(error => {
        res.redirect('/');
    });
});

//robot page to see user's camera
app.get('/robot', function (req, res) {
    res.sendFile(path.join(__dirname, 'public/robot.html'));
});

const httpsServer = https.createServer(serverConfig, app);
httpsServer.listen(HTTPS_PORT, '0.0.0.0');

// Create a server for handling websocket calls
const wss = new WebSocketServer({ server: httpsServer });

wss.on('connection', function (ws) {
    ws.on('message', function (message) {
        // Broadcast any received message to all clients
        console.log('received: %s', message);
        wss.broadcast(JSON.parse(message));
    });
    ws.on('error', function (exc) {
        console.log("error: " + exc);
    });

    ws.onclose = function (event) {
        console.log('client disconnected');
        var aaa = {};
        aaa['movement'] = 'stop';
        wss.broadcast(aaa);
    };

    console.log('new client connected');
    var aaa = {};
    aaa['movement'] = 'stop';
    wss.broadcast(aaa);
});

wss.broadcast = function (data) {
    this.clients.forEach(function (client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

console.log("server has started");