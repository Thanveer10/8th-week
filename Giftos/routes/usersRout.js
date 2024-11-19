const express=require('express')
const nocache=require('nocache')
const path=require('path')
const user_ctrl=require('../controller/userctrl')

const user_route=express.Router()


user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

console.log("========================================================" + __dirname)
user_route.use(express.static(path.join(__dirname,'./public')));

console.log(__dirname,'public');

user_route.use(nocache())
// user_route.use(express.static(path))
user_route.get('/',nocache(),user_ctrl.homepage)
user_route.get('/shop',nocache(),user_ctrl.shop)
user_route.get('/contact',nocache(),user_ctrl.contactpage)
user_route.get('/testimonial',nocache(),user_ctrl.testimonialpage)
user_route.get('/whyUs',nocache(),user_ctrl.whyus)


user_route.get('/login',user_ctrl.loginpage)
user_route.post('/login',user_ctrl.loginvalidation)

user_route.get('/signup',user_ctrl.signup)
user_route.post('/signup',user_ctrl.usersignupval)


user_route.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});



module.exports=user_route

