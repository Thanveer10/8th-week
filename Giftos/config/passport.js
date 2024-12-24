const passport =require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User= require('../model/userModel')
const path=require('path')
const env= require("dotenv").config()
console.log(process.env.GOOGLE_CLIENT_ID)


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },

  async (accessToken, refreshToken,profile,done) => {
    try {
        let user = await User.findOne({Googleid:profile.id})
        if (user){
            return done(null, user)
        }else{
          user= new User({
                Username: profile.displayName,
                Email: profile.emails[0].value,
                Googleid: profile.id,
            })
            await user.save()
            return  done(null,user)
        }
    } catch (error) {
        console.log("Error in async (accessToken, refreshToken, profile, done)")
        return done(error, null)
    }
  }
));




passport.serializeUser((user,done)=>{
    done(null, user.id)
});

passport.deserializeUser((id,done) =>{
    User.findById(id).then(user=>done(null, user))
   .catch(err=>{
    console.log("Error in passport.deserializeUser")
    done(err, null)
  })
})

module.exports=passport;