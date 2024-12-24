require('dotenv').config()
const express=require('express')
const cookieParser=require('cookie-parser')
const path=require('path')
const loging=require('morgan')
const session=require('express-session')
const nocache=require('nocache')
const mongoose=require('mongoose')
const passport=require('./config/passport')
const app=express()
const PORT = process.env.PORT || 8000;
const DB_URI=process.env.DB_URI
const SECKRET_KEY=process.env.SECRET_KEY
mongoose.connect(DB_URI)

.then(()=>{
    console.log('connected to database');
    
}).catch(err=>{
    console.error('database connection error:',err)
    process.exit(1)
})


app.use(session({secret:SECKRET_KEY,resave:false,saveUninitialized:false,cookie:{secure:false,maxAge:60000*60}}))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(nocache())
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});
app.use(cookieParser())
app.use(loging('dev'))
app.use(express.static(path.join(__dirname,'public')))




app.use(passport.initialize())
app.use(passport.session())


app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')


const userRoute = require('./routes/usersRout')
const adminRoute = require('./routes/adminRout')
const productsRoute = require('./routes/productsRoute')

app.use('/',userRoute)

app.get('/auth/google',passport.authenticate('google', {scope:['profile', 'email']}))
app.use('/product',productsRoute)
app.use('/admin',adminRoute)

// Middleware to handle 404 errors (Page Not Found)
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/admin')) {
        res.status(404).render('admin/error', {
            errorCode: 404,
            errorMessage: "Admin Page Not Found",
            errorDescription: "The page you're looking for in the admin panel doesn't exist or might have been moved.",
            link: req.headers.referer || '/admin', // Go back to the admin page
        });
    } else {
        res.status(404).render('user/error', {
            errorCode: 404,
            errorMessage: "Page Not Found",
            errorDescription: "The page you're looking for doesn't exist or might have been moved.",
            link: req.headers.referer || '/', // Go back to the homepage
        });
    }
});



app.listen(PORT,()=>{
    console.log('server started');
} )  
