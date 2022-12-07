//package to allow user to register or login
const passport = require('passport');

//package to hash password
const bcrypt = require('bcrypt');

//module to instantiate  routes
module.exports = function (app, myDataBase) {
  
  // render the index '/' page
  app.route('/').get((req, res) => {
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please log in',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
    });
  });

  //accept the POST request and authenticate the user
  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  })

  //Only render profile page if user is unauthenticated, else directo to home page
  app.route('/profile').get(ensureAuthenticated, (req,res) => {
    res.render('profile', {username: req.user.username});
  });
  
  //register new user
  app.route('/register').post(
    // FIRST ARG: Register the new user
    (req, res, next) => {
      
      //hash password
      const hash = bcrypt.hashSync(req.body.password, 12);
      
      // Query database with findOne
      myDataBase.findOne({ username: req.body.username }, (err, user) => {
        // If there is an error, call next with the error
        if(err) return next(err);
        
        // If a user is returned, redirect back to home
        else if(user) res.redirect('/');
        
        // If user is not found in db, try to insert user to db
        else{
          // If a user is not found and no errors occur, then insertOne
          myDataBase.insertOne({
            username: req.body.username,
            password: hash
          }, (err, doc) => {
            //if there is an error when inserting user to db
            if (err) res.redirect('/');
            //if user is successfully inserted to db
            else next(null, doc.ops[0]);
          });//end insertOne database logic
        }

      });//end findOne database logic
    },
    // SECOND ARG: Authenticate the new user, else redirect to profile
    passport.authenticate('local', {failureRedirect: '/' }), (req, res, next) => {
      res.redirect('/profile');
    }
  );
  
  //handle logout
  app.route('/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/');
  });
  
  //call passport to authenticate 'github'
  app.route('/auth/github')
    .get(passport.authenticate('github'));

  //chat on github
  app.route('/chat')
    .get(ensureAuthenticated, (req,res) => {
    res.render('chat', { user: req.user });
  });
  
  //call passport to authenticate 'github' with a failure redirect to /, and then if that is successful redirect to /chat
  app.route('/auth/github/callback')
    .get(passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
    req.session.user_id = req.user.id;
    res.redirect('/chat');
  });  
  
  //handle missing pages
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
  
}//end module


// middleware to check if user is authenticated before redirecting route
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};  
