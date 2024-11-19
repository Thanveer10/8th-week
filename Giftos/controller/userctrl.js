const User=require('../model/user/userModel')
const bcrypt = require('bcrypt');

console.log(__dirname,'public');

const loginpage=function(req,res){
 res.render('user/userLogin')
}
const signup=function(req,req){
res.render('user/signup')
}
const homepage=function(req,res){
res.render('user/index')
}
const shop=function(req,res){
  res.render('user/shop')
}
const contactpage=function(req,res){
  res.render('user/contact')
}
const testimonialpage=function(req,res){
  res.render('user/testimonial')
}
const whyus=function(req,res){
  res.render('user/why')
}

//login validaton
const loginvalidation=async function (req,res){
const userEmail=req.body.email
const password=req.body.password

try{
const userData=User.findOne({Email:userEmail})
if(!userData){
  return  res.render('user/userLogin',{message:'invalid username or psssword'})
}
const isMatch=bcrypt.compare(password,userData.Password)
if(!isMatch){
    return res.render('user/userLogin',{message:'invalid user name or password'})
}

if(userData){
    console.log('validation seccessfull')
req.session.user_id=userData._id
console.log(userData._id)
res.render('user/home')
 }else {
    res.render("users/login", { message: "Email and Password are incorrect" });
  }
}catch(err){
  console.log('loginvalidation erorr')
  console.log(err.message);
  }
}

// user signup vaidation------------
const usersignupval = async function (req, res, next) {
    const usersignupvall = {
      Username: req.body.username,
      Password: req.body.password,
      Confirmpassword: req.body.conformpassword,
      Mobilenumber: req.body.mobilenumber,
      Email: req.body.email,
  
    }
    const salt= await bcrypt.salt(10)
    usersignupvall.Password=await bcrypt.hash(req.body.password,salt)
   
    let signupval = await userinfo.findOne({ Username: usersignupvall.Username })
    if (signupval || usersignupvall.Password != usersignupvall.Confirmpassword) {
      res.redirect('/signup')
    }
    else {
      userinfo.insertMany([usersignupvall])
      console.log(usersignupvall);
      res.redirect('/login')
    }
  }
  
  module.exports={
    loginpage,
    loginvalidation,
    usersignupval,
    homepage,
    signup,
    contactpage,
    testimonialpage,
    whyus,
    shop
  }