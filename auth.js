//package to allow user to register or login
const passport = require('passport');

//package to connect to mongodb db
const { ObjectID } = require('mongodb');

//package to authenticate user
const LocalStrategy = require('passport-local');

//package to hash password
const bcrypt = require('bcrypt');

//package to authenticate user on github
const GitHubStrategy = require('passport-github');

//module to authenticate user
module.exports = function (app, myDataBase) {
  
  // authenticate user   
  passport.use(new LocalStrategy((username, password, done) => {
    myDataBase.findOne({ username: username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) return done(err);
      if (!user) return done(null, false);
      // if (password !== user.password) return done(null, false);
      if (!bcrypt.compareSync(password, user.password)) return done(null, false)
      return done(null, user);
    });
  }));
  
  // Serialization   
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  
  // deserialization
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
      done(null, doc);
    });
  });
  
  //social authentication
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://freecodecamp-mariamawit-boilerplate-advancednode.glitch.me/auth/github/callback"
  },
    function(accessToken, refreshToken, profile, cb) {
      //Database logic : add to db profile returned by github 
      myDataBase.findOneAndUpdate(
        { id: profile.id },
        {
          $setOnInsert: {
            id: profile.id,
            username: profile.username,
            name: profile.displayName || 'John Doe',
            photo: profile.photos[0].value || '',
            email: Array.isArray(profile.emails)
              ? profile.emails[0].value
              : 'No public email',
            created_on: new Date(),
            provider: profile.provider || ''
          },
          $set: {
            last_login: new Date()
          },
          $inc: {
            login_count: 1
          }
        },
        { upsert: true, new: true },
        (err, doc) => {
          return cb(null, doc.value);
        }
      );//end db insert profile
    }
  ));
  
}//end module
