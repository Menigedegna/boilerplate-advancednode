//package to allow user to register or login
const passport = require('passport');

//package to connect to mongodb db
const { ObjectID } = require('mongodb');

//package to authenticate user
const LocalStrategy = require('passport-local');

//package to hash password
const bcrypt = require('bcrypt');

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
}//end module

