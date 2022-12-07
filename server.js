'use strict';
//package to store secret variables
require('dotenv').config();

//package to use a server
const express = require('express');

//package to connect to mongodb db
const myDB = require('./connection');
const { ObjectID } = require('mongodb');

//package for freecodecamp testing
const fccTesting = require('./freeCodeCamp/fcctesting.js');

//packages to start a session 
const session = require('express-session');

//package to allow user to register or login
const passport = require('passport');

//package to authenticate socket
const passportSocketIo = require('passport.socketio');

//package to handle cookies
const cookieParser = require('cookie-parser');

//package to connect to MangoDB
const MongoStore = require('connect-mongo')(session);
// initialize a new memory store, from express-session
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

//import module route
const routes = require('./routes.js'); 

//import module auth
const auth = require('./auth.js');

const app = express();
app.set('view engine', 'pug');
app.set('views', './views/pug');

//connect with client e.g. github
const http = require('http').createServer(app);
const io = require('socket.io')(http);


// set up Passport so you can finally start allowing a user to register or log in to an account
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

//initialize session
app.use(passport.initialize());
app.use(passport.session());


//For FCC testing purposes
fccTesting(app); 
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


myDB(async client => {
  //try to connect to mango db
  const myDataBase = await client.db('database').collection('users');
  
  //instantiate  routes
  routes(app, myDataBase);

  //authentication, serialization, local strategy set-up
  auth(app, myDataBase);
  
  //identify user connected to web socket. from cookie that contains the passport session
  io.use(
    passportSocketIo.authorize({
      cookieParser: cookieParser,
      key: 'express.sid',
      secret: process.env.SESSION_SECRET,
      store: store,
      success: onAuthorizeSuccess,
      fail: onAuthorizeFail
    })
  );
  
  // To listen for client connections to your server
  let currentUsers = 0; //count users
  io.on(
    'connection', (socket) => {
      console.log('A user has connected');
      ++currentUsers;
      //emit the event
      io.emit(
        'user', {
          username: socket.request.user.username,
          currentUsers,
          connected: true
        }
      );
      console.log('user ' + socket.request.user.username + ' connected');
      
      //listen to chat message
      socket.on('chat message', (message) =>{
       //emit the event
        io.emit(
          'chat message', {
            username: socket.request.user.username,
            message: message
          }
        );       
      });
      
      //listen for and handle disconnect
      socket.on('disconnect', () => {
        console.log('A user has disconnected');
        --currentUsers;
        io.emit(
          'user', {
            username: socket.request.user.username,
            currentUsers,
            connected: false
        }
        );
      });
    }
  );
   
  // if not connected to db
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
}); // end connect to db logic


//print port on console
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});

// authorization success callback 
function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');
  accept(null, true);
}

// authorization fail callback
function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}
