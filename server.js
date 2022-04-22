//load depedencies
const https = require("https");
const fs = require('fs')
const WebSocket = require('ws');
const express = require('express');
const session = require('express-session');
const path = require('path');
const WebSocketServer = WebSocket.Server;

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
        secret: 'my_secret_key',
        resave: false,
        saveUninitialized: false,
    })
);

//login page
app.get('/', function (req, res) {
    if (req.session.isLoggedIn === true) {
        res.redirect('/home');
    }
    else {
        res.sendFile(path.join(__dirname, 'public/login.html'));
    }
});

app.post('/', function (req, res) {
    const pass = req.body.password;
    // console.log(pass);
    if (pass === 'aaa') {
        req.session.isLoggedIn = true;
        res.redirect('/home');
    }
    else {
        res.redirect('/');
    }
});

//user page for controlling the robot
app.get('/home', function (req, res) {
    if (req.session.isLoggedIn === true) {
        res.sendFile(path.join(__dirname, 'public/home.html'));
    }
    else {
        res.redirect('/');
    }
});

app.post('/home', function (req, res) {
    req.session.destroy(error => {
        res.redirect('/');
    });
});

//robot page to see user's camera
app.get('/robot', function (req, res) {
    res.sendFile(path.join(__dirname, 'public/robot.html'));
});

const httpsServer = https.createServer(serverConfig, app);
httpsServer.listen(8443, '0.0.0.0');

// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls
const wss = new WebSocketServer({ server: httpsServer });

// wss.on("upgrade", (request, socket, head) => {
//     wss.handleUpgrade(request, socket, head, (websocket) => {
//         wss.emit("connection", websocket, request);
//     });
// });

wss.on('connection', function (ws) {
    ws.on('message', function (message) {
        // Broadcast any received message to all clients
        console.log('received: %s', message);
        wss.broadcast(JSON.parse(message));
        if (message.includes("movement")) {
            fs.writeFile("move_data.txt", message, function (err) {
                console.log("movement data received");
                if (err) {
                    console.log(err);
                }
            });
        }
    });
    ws.on('error', function (exc) {
        console.log("ignoring exception: " + exc);
    });
});

wss.broadcast = function (data) {
    // console.log(data);
    this.clients.forEach(function (client) {
        // console.log(client);
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};