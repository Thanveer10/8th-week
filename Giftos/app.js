const express=require('express')
const cookieParser=require('cookie-parser')
const path=require('path')
const loging=require('morgan')
const session=require('express-session')
const nocache=require('nocache')

const app=express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(nocache())
app.use(cookieParser())
app.use(loging('dev'))
app.use(express.static(path.join(__dirname,'public')))

app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')
app.use(session({secret:'secret-key',resave:false,saveUninitialized:true,cookie:{secure:false,maxAge:60000}}))

const userRoute=require('./routes/usersRout')
// const adminRoute=require('./routes/adminRout.js')

app.use('/',userRoute)
// app.use('/',adminRoute)

//catch error pass to handler

app.use((req,res,next)=>{
    const err=new Error('not found')
    console.log(err.message)
    err.status=404
    next(err)
})

//hndler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500);

    // Render the error page
    res.render('user/error', { error: err });
});

app.use((req, res, next) => {
    if (res.statusCode === 404) {
        console.log(`Static file not found: ${req.url}`);
    }
    next();
});


app.listen(4000,()=>{
    console.log('server started');
} )  
