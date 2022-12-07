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

//import module route
const routes = require('./routes.js'); 

//import module auth
const auth = require('./auth.js');

const app = express();
app.set('view engine', 'pug');
app.set('views', './views/pug');

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
    
  // if not connected to db
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
}); // end connect to db logic


//print port on console
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});


