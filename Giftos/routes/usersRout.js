const express=require('express')
const nocache=require('nocache')
const path=require('path')
const user_ctrl=require('../controller/userctrl')
const passport=require('passport')
const user_route=express.Router()
const userAuth=require('../middleware/userAuth')


user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));
user_route.use(express.static(path.join(__dirname,'../public')));
console.log(path.join(__dirname,'../public'));
user_route.use(nocache())

// Middleware to pass session data to EJS templates and clear it afterward
user_route.use((req, res, next) => {
  // Pass session messages to the template
  res.locals.successmsg = req.session.successmsg;
  // res.locals.passerrmsg = req.session.passerrmsg;
  
  // Clear session messages after they're passed to the template
  req.session.successmsg = null;
  // req.session.passerrmsg = null;
  
  next(); // Move to the next middleware or route handler
});

user_route.get('/',nocache(),user_ctrl.homepage)
user_route.get('/shop',nocache(),user_ctrl.shop)
user_route.get('/contact',nocache(),user_ctrl.contactpage)
user_route.get('/testimonial',nocache(),user_ctrl.testimonialpage)
user_route.get('/whyUs',nocache(),user_ctrl.whyus)
user_route.get('/category/:id',user_ctrl.categoryget)
user_route.post('/search',user_ctrl.search)

user_route.get('/login',user_ctrl.loginpage)
user_route.post('/login',user_ctrl.loginvalidation)
user_route.get('/otp_login',nocache(),user_ctrl.otplogin)
user_route.post('/otp_login',user_ctrl.otpverification)
user_route.post('/verifyOTP',user_ctrl.verifyotp)
user_route.get('/logout',user_ctrl.logout)

user_route.get('/forgotpassword',user_ctrl.forgotPasswordget)
user_route.post('/forgotpassword',user_ctrl.forgotPasswordpost)
user_route.post('/forgetpassword-otpverify',nocache(),user_ctrl.forget_otpverify)
user_route.get('/frgtchange-password',userAuth,user_ctrl.frgtchangePasswordget)
user_route.post('/frgtPasschange',userAuth,user_ctrl.frgtchangePasswordpost)



user_route.get('/signup',user_ctrl.signup)
user_route.post('/signup',user_ctrl.usersignupval)
user_route.post('/verifysignupOTP',user_ctrl.verifySignupOTP)
user_route.post('/resend-signup-otp',user_ctrl.resentSignupOtp)

user_route.get('/auth/google',passport.authenticate('google', {scope:['profile', 'email']}))

user_route.get('/auth/google/callback',passport.authenticate('google', {failureRedirect: '/signup', failureFlash: true }),
(req,res) =>{
  req.session.user_id=req.user._id
  console.log("User session established after login/signup:", req.session.userId);
  res.redirect('/')
})

user_route.get('/productdetails/:id', user_ctrl.productDetailsget)
user_route.get('/addtocart/:id',nocache(),userAuth,user_ctrl.addtoCart)
user_route.get('/adduserCart',userAuth,user_ctrl.userCart)
user_route.post('/cart/update',userAuth, user_ctrl.updateCart);
user_route.get('/deletecart/:id',nocache(),userAuth,user_ctrl.deleteCart)

user_route.post('/coupenapply',userAuth,user_ctrl.coupenApply)

user_route.get('/checkout',userAuth,user_ctrl.checkoutget)
user_route.post('/checkout/addAddress',userAuth,user_ctrl.addAddresspost)
user_route.post('/checkout/editAddress/:addressId',userAuth,user_ctrl.editAddresspost);


// ORDRER
user_route.post('/checkout/:cartId',userAuth,user_ctrl.confirmOrder);
user_route.get('/orderconfirm/:cartId',userAuth,user_ctrl.orderConfirmed);
user_route.get('/viewOrder',userAuth,user_ctrl.LoadOrderPage);
user_route.post('/cancelOrder/:orderId',userAuth,user_ctrl.cancelOrder)
user_route.post('/returnRequest/:orderId',userAuth,user_ctrl.returnOrder)

// online Payment
user_route.get('/payment/success',userAuth,user_ctrl.onlinePayment)
user_route.post("/online-payment-failed/restore-cart-items/:cartId",userAuth,user_ctrl.restoreProductQuantities);


user_route.get('/wallet',userAuth,user_ctrl.walletget)

user_route.get('/wishlist',userAuth,user_ctrl.wishListget)
user_route.get('/wishlist/:id',userAuth,user_ctrl.wishListPost)
user_route.get('/wishdelete/:id',userAuth,user_ctrl.wishDelete)


user_route.get('/user-profile',userAuth,user_ctrl.userProfile)
user_route.get('/edit-profile',userAuth,user_ctrl.editProfile)
user_route.post('/update-profile',userAuth,user_ctrl.updateProfile)
user_route.get('/editpassword',userAuth,user_ctrl.editPasswordget)
user_route.post('/editpassword',userAuth,user_ctrl.editPasswordPost)

user_route.get('/user-address',userAuth,user_ctrl.userAddressget)
user_route.get('/add-address',userAuth,user_ctrl.addAddressget)
user_route.post('/add-address',userAuth,user_ctrl.addAddresspost)
user_route.get('/delete-address/:id',userAuth,user_ctrl.deleteAddress)
user_route.get('/edit-address',userAuth,user_ctrl.editAddressget)
user_route.post('/edit-address',userAuth,user_ctrl.editAddresspost)






  
user_route.use((err, req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
    console.error('the error happend her' + err.stack);
    res.status(500).send('Something went wrong!');
   
});



module.exports=user_route

