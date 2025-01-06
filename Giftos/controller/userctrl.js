const session = require("express-session");
const User = require("../model/userModel");
const ProductColl = require("../model/productModel");
const cartColl = require("../model/cartModel");
const wishListColl = require("../model/wishlistModel");
const CoupenColl = require("../model/coupenModel");
const CategoryColl = require("../model/categoryModel");
const AddressColl = require("../model/addressModel");
const OrderColl = require("../model/orderModel");
const WalletColl = require("../model/walletModel");
const OfferColl = require("../model/offerModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const env = require("dotenv").config();
const razorpayInstance = require("../config/razopayConfig");
const { errorMonitor } = require("nodemailer/lib/xoauth2");

let sessionName;
let coupenerr;
let discPrice = 0;
let stockerr;
let grand_total;
let totalQuantity;
let addresses;

const homepage = async function (req, res) {
  try {
    const userId = req.session.user_id;
    let user = await User.findById(userId);
    let latestProducts = await ProductColl.find({
      CreatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })
      .populate("Category")
      .sort({ CreatedAt: -1 })
      .limit(10);
    latestProducts = latestProducts.filter(
      (product) => product.Category && product.Category.Status == "Listed"
    );
    if (user && user.Status) {
      console.log("loged user is : ============" + user);
      let sessionName = userId;
      let userdata = await User.findOne({ _id: user });
      console.log("loged user is : ============" + userdata);

      return res.render("user/index", {
        sessionName,
        latestProducts,
        userdata,
      });
    }

    // let latestProducts=await ProductColl.find({createdAt:{ $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }})
    res.render("user/index", { latestProducts });
  } catch (error) {
    console.log("error in render homepage: " + error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription:
        "An unexpected error occurred while trying to load the homepage.",
      link: req.headers.referer || "/",
    });
  }
};

const shop = async function (req, res) {
  try {
    const currentPage = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (currentPage - 1) * limit;
    const user = req.session.user_id;
    let latestProducts = await ProductColl.find({
      CreatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).populate('Category')
      .sort({ CreatedAt: -1 })
      .skip(skip)
      .limit(limit);

    latestProducts = latestProducts.filter((product) =>product.Category && product.Category.Status==='Listed')
    let totalProducts = await ProductColl.countDocuments({
      CreatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    let totalPages = Math.ceil(totalProducts / limit);
    if (user) {
      let sessionName = user;
      let userdata = await User.findOne({ _id: user });
      res.render("user/shop", {
        sessionName,
        latestProducts,
        userdata,
        currentPage,
        totalPages,
      });
    } else {
      res.render("user/shop", { latestProducts, currentPage, totalPages });
    }
  } catch (error) {
    console.log("error in shoe section" + error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription:
        "An unexpected error occurred while trying to load the shoap.",
      link: req.headers.referer || "/",
    });
  }
};

const contactpage = async function (req, res) {
  try {
    const user = req.session.user_id;
    if (user) {
      sessionName = user;
      let userdata = await User.findOne({ _id: user });
      res.render("user/contact", { sessionName, userdata });
    } else {
      res.render("user/contact");
    }
  } catch (error) {
    console.log("error in why us " + error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription:
        "An unexpected error occurred while trying to load the why us.",
      link: req.headers.referer || "/",
    });
  }
};

const testimonialpage = function (req, res) {
  const user = req.session.user_id;
  sessionName = user;
  res.render("user/testimonial", { sessionName });
};

const whyus = async function (req, res) {
  try {
    const user = req.session.user_id;
    if (user) {
      sessionName = user;
      let userdata = await User.findOne({ _id: user });
      res.render("user/why", { sessionName, userdata });
    } else {
      res.render("user/why");
    }
  } catch (error) {
    console.log("error in why us " + error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription:
        "An unexpected error occurred while trying to load the why us.",
      link: req.headers.referer || "/",
    });
  }
};

//get catogery items
const categoryget = async function (req, res) {
  let newArrivals;
  try {
    const catId = req.params.id;
    const searchTerm = req.query.query || '';
    console.log('searchTerm is : ', searchTerm)
    const currentPage=parseInt(req.query.page)  || 1
    const limit= 9
    const skip=(currentPage-1)*limit


    let sort;
        if(req.query.sort){
          sort = req.query.sort

        }else if(req.session.sort){
          sort=req.session.sort
        }
      
        console.log('sort',sort)

        switch (sort) {
          case 'popularity':
            sortCriteria = { popularity: -1 };
            break;
          case 'priceLowToHigh':
            sortCriteria = { RegularPrice: 1 };
            break;
          case 'priceHighToLow':
            sortCriteria = { RegularPrice: -1 };
            break;
          case 'ratings':
            sortCriteria = { averageRating: -1 };
            break;
          case 'newArrivals':
            sortCriteria = { CreatedAt: -1 };
            break;
          case 'aToZ':
            sortCriteria = { Productname: 1 };
            break;
          case 'zToA':
            sortCriteria = { Productname: -1 };
            break;
          case 'inventory':
            sortCriteria = { Stock: -1 };
            break;
          default:
            sortCriteria = {};
            break;
      }
      req.session.sort=sort;
      let products=[]
      if (searchTerm) {
           console.log('come to search term : ', searchTerm)
           const startsWithRegex = new RegExp(`^${searchTerm}`, 'i');
           const startsWithProducts = await ProductColl.find({
              //  isDeleted: false,
               Productname: { $regex: startsWithRegex },Category:catId 
           })
           .populate({
              path: 'Category', // Assuming 'category' is a reference field in the Product model
              match: { Status: 'Listed' } // Fetch products with 'Listed' categories only
           })
           .sort(sortCriteria)
           .collation({ locale: 'en', strength: 2 })
           .skip(skip)
           .limit(limit);
  
  
           const containsRegex = new RegExp(searchTerm, 'i');
           const containsProducts = await ProductColl.find({
              //  isDeleted: false,
               Productname: { $regex: containsRegex },Category:catId,
               _id: { $nin: startsWithProducts.map(p => p._id) } 
           })
            .populate({
              path: 'Category', // Assuming 'category' is a reference field in the Product model
              match: { Status: 'Listed' } // Fetch products with 'Listed' categories only
            })
           .sort(sortCriteria)
           .collation({ locale: 'en', strength: 2 })
           .skip(skip)
           .limit(limit);
  
            products = [...startsWithProducts, ...containsProducts];
            products = products.filter(product => product.Category && product.Category.Status === 'Listed');
            // console.log('serched prodducts',products)
            // products = products.slice(skip,(skip + limit));
           
       }else{
         products = await ProductColl.find({ Category: catId }).populate('Category').sort(sortCriteria).skip(skip).limit(limit);
         console.log('sort method ===', req?.session?.sort)
         if(req.session.sort === 'newArrivals'|| sort === 'newArrivals'){
          let sortCriteria = { CreatedAt: -1 }
           newArrivals='New Arrivals'
              products=await ProductColl.find({ Category: catId}).sort(sortCriteria).populate({
                path: 'Category', // Assuming 'category' is a reference field in the Product model
                match: { Status: 'Listed' } // Fetch products with 'Listed' categories only
              }).skip(skip).limit(limit);
         }
           products= products.filter((product) => product.Category && product.Category.Status ==='Listed')
       }

         let totalProducts;
         if (searchTerm) {
          console.log('search term totalproducts===', searchTerm)
            const searchRegex = new RegExp(searchTerm, 'i');
            const startsWithProducts = await ProductColl.find({
                  // isDeleted: false,
                  Productname: { $regex: searchRegex },Category:catId
            });

            const containsRegex = new RegExp(searchTerm, 'i');
            const containsProducts = await ProductColl.find({
               //  isDeleted: false,
                Productname: { $regex: containsRegex },Category:catId,
                _id: { $nin: startsWithProducts.map(p => p._id) } 
            })
            totalProducts=containsProducts.length + startsWithProducts.length
         } else {
            totalProducts = await ProductColl.countDocuments({ Category: catId});
         }
         console.log('totalproducts',totalProducts)
         let totalPages=Math.ceil(totalProducts/limit)
         console.log('totoal pages ==',totalPages)
    // let products = await ProductColl.find({ Category: catId }).populate('Category').sort(sortCriteria);
    // console.log('sort method ===', req?.session?.sort)
    // if(req.session.sort === 'newArrivals'|| sort === 'newArrivals'){
    //   let sortCriteria = { CreatedAt: -1 }
    //   newArrivals='New Arrivals'
    //          products=await ProductColl.find({ Category: catId}).sort(sortCriteria).populate({
    //             path: 'Category', // Assuming 'category' is a reference field in the Product model
    //             match: { Status: 'Listed' } // Fetch products with 'Listed' categories only
    //         });
    //  }
    // products= products.filter((product) => product.Category && product.Category.Status ==='Listed')
    const categoryName = await CategoryColl.findById(catId).select("Categoryname");
    const allcategory = await CategoryColl.find({});
    // console.log('new products===', products)
    res.render("user/categoryProducts", {
      newArrivals,
      products,
      categoryName,
      allcategory,
      searchTerm,
      totalPages,
      currentPage,
      sort
    });
  } catch (error) {
    console.log("erron in categoryget" + error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription:
        "An unexpected error occurred while trying to load the Catogrypage.",
      link: req.headers.referer || "/products/viewAllProducts",
    });
  }
};

// search for products
const search = async function (req, res) {
  try {
    const user = req.session.user_id;
    const sessionName = user;
    // let allproducts=await ProductColl.find({})
    let allcategory = await CategoryColl.find({});
    console.log("this is all catogery" + allcategory);
    const searchQuery = req.body.query;
    console.log("search query: ", searchQuery);
    const startsWithRegex = new RegExp(`^${searchQuery}`, "i");
    const products = await ProductColl.find({
      Productname: { $regex: startsWithRegex },
    });
    console.log(products);
    res.render("user/allProducts", { products, allcategory, sessionName });
  } catch (error) {
    console.log("error in search" + error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription:
        "An unexpected error occurred while trying to load the page.",
      link: req.headers.referer || "/",
    });
  }
};

const loginpage = async function (req, res, next) {
  try {
    const user = await User.findOne({ _id: req.session.user_id });
    if (user && user.Status) {
      return res.redirect("/");
    }
    const message = req.session.message;
    err = req.session.logErr;
    req.session.logErr = null;
    req.session.message = null;
    res.render("user/userLogin", { err, message });
  } catch (error) {
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription:
        "An unexpected error occurred while trying to load the loginpage.",
      link: req.headers.referer || "/",
    });
  }
};

const signup = function (req, res) {
  try {
    res.render("user/signup");
  } catch (error) {
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription:
        "An unexpected error occurred while trying to load the signup page.",
      link: req.headers.referer || "/",
    });
  }
};

//otplogin
const otplogin = function (req, res) {
  try {
    var User = req.session.user_id;
    if (User) {
      res.redirect("/");
    } else {
      otp = req.session.otp;
      data = req.session.otpData;
      invalid = req.session.InvalidOtp;
      err = req.session.otpErr;

      req.session.otpErr = null;
      req.session.InvalidOtp = null;
      res.render("user/otpLogin", { otp, data, err, invalid });
    }
  } catch (error) {
    console.log(error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription:
        "An unexpected error occurred while trying to load the otplogin.",
      link: req.headers.referer || "/",
    });
  }
};

const response = {};

function generateOTP() {
  let otp = Math.random() * 1000000;
  otp = Math.floor(otp);
  return otp;
}
//otp verification
const otpverification = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email);

    if (!email) return res.status(404).json({ message: "email is required" });

    let checkuser = await User.findOne({ Email: email });

    if (checkuser) {
      console.log(checkuser);
      if (checkuser.Status) {
        console.log(checkuser.Status);
        otpEmail = checkuser.Email;
        genOtp = generateOTP();
        response.otp = { genOtp, expiresAt: Date.now() + 5 * 60 * 1000 };
        console.log(response.otp);
        let otp = response.otp;

        let mailTransporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.NODEMAILER_EMAIL,
            pass: process.env.NODEMAILER_PASSWORD, // Your Zoho password or app password (if 2FA is enabled)
          },
        });

        let details = {
          from: process.env.NODEMAILER_EMAIL,
          to: otpEmail,
          subject: "GIFTOS Verification",
          text:
            genOtp +
            " is your GIFTOS verification code. Do not share OTP with anyone ",
        };

        mailTransporter.sendMail(details, (err) => {
          if (err) {
            console.log("otp sent error : " + err);
            return res.status(500).json({ message: "failed to send otp" });
          } else {
            console.log("OTP Send Successfully ");
            res.json({ success: true, message: "OTP sent successfully!" });
          }
        });

        //   response.User = checkuser
        //   response.status = true
        // if (response.status) {
        //   req.session.otp = response.otp;
        //   req.session.otpData = req.body;
        //   req.session.otpUser = response.User;
        //   res.redirect('/otp_login')
        // }
        // else {
        //   req.session.otpErr = "Entered email is blocked!";
        //   res.redirect('/otp_login');
        //   req.session.otpErr = null;
        // }
      } else {
        res.render("user/otpLogin");
      }
    } else if (!data.Email) {
      console.log("email is not provided");
      req.session.otpErr = null;
      req.session.InvalidOtp = null;
      res.render("user/otpLogin");
    } else {
      try {
        console.log("email is not registerd");
        req.session.otpErr = "Email not registered!";
        res.redirect("/otp_login");
      } catch (err) {
        console.log(err.message);
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
    // let errMessage = "An error occurred, please try again later.";
    // res.render('user/otpLogin', { err: errMessage });
  }
};

/////////verify OTP
const verifyotp = async (req, res) => {
  console.log("verifying OTP");
  try {
    const { email, otp } = req.body;
    console.log("verifying OTP  after storing OTP");
    console.log(response.otp);

    if (response.otp == undefined || response.otp == null) {
      return res.status(400).json({ message: "OTP expired or invalid." });
    }
    console.log(otp);

    const { genOtp: storedOtp, expiresAt } = response.otp;
    console.log(storedOtp);
    if (Date.now() > expiresAt) {
      console.log("time checked");
      delete response.otp; // Remove expired OTP
      console.log("otp dleted");
      return res.status(400).json({ message: "OTP expired." });
    }
    console.log("checking each OTP to check eaauel");
    if (otp != storedOtp)
      return res.status(400).json({ message: "Invalid OTP." });
    console.log("about to delete OTP ");
    delete response.otp;
    const userData = await User.findOne({ Email: email });
    req.session.user_id = userData._id;
    res.json({ success: true, message: "OTP verified. Login successful!" });
  } catch (error) {
    console.log("somthing has happedn in " + error.message);
    res.status(500).json({ error });
  }
};

//login validaton
const loginvalidation = async function (req, res) {
  const userEmail = req.body.email;
  const password = req.body.password;

  try {
    const userData = await User.findOne({ Email: userEmail });
    if (!userData) {
      req.session.logErr = "Email or Password is incorrect";
      return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(password, userData.Password);

    if (!isMatch) {
      req.session.logErr = "Email or Password is incorrect";
      return res.redirect("/login");
    }

    if (userData && userData.Status && isMatch) {
      console.log("validation seccessfull");
      // session['user_id']=true;
      req.session.user_id = userData._id;
      console.log(userData._id);
      setTimeout(() => {
        res.redirect("/");
      }, 1000);
    } else {
      req.session.logErr = "Your account is blocked!";
      res.redirect("/login");
      // res.render("users/userLogin", { message: "Email and Password are incorrect" });
    }
  } catch (err) {
    console.log("loginvalidation erorr");
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred in login validation.",
      link: req.headers.referer || "/",
    });
  }
};

//forgot password page
const forgotPasswordget = async (req, res) => {
  console.log("forgot password page");
  res.render("user/forgotPassword");
};

// forgot password validation
const forgotPasswordpost = async function (req, res) {
  try {
    const { email } = req.body;
    console.log(email);

    if (!email) {
      res.json({ message: "email is required" });
      return;
    }
    let checkuser = await User.findOne({ Email: email });

    if (checkuser) {
      console.log(checkuser);
      if (checkuser.Status === true) {
        console.log(checkuser.Status);
        otpEmail = checkuser.Email;
        genOtp = generateOTP();
        response.otp = { genOtp, expiresAt: Date.now() + 5 * 60 * 1000 };
        console.log(response.otp);
        let otp = response.otp;

        let mailTransporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.NODEMAILER_EMAIL, // Your Zoho email address
            pass: process.env.NODEMAILER_PASSWORD, // Your Zoho password or app password (if 2FA is enabled)
          },
        });

        let details = {
          from: process.env.NODEMAILER_EMAIL,
          to: otpEmail,
          subject: "GIFTOS Verification",
          text:
            genOtp +
            " is your GIFTOS verification code. Do not share OTP with anyone ",
        };

        mailTransporter.sendMail(details, (err) => {
          if (err) {
            console.log(err);
            return res.json({ message: "failed to send otp" });
          } else {
            console.log("OTP Send Successfully ");
            res.json({ success: true, message: "OTP sent successfully!" });
          }
        });

        function generateOTP() {
          let otp = Math.random() * 1000000;
          otp = Math.floor(otp);
          return otp;
        }
        //   response.User = checkuser
        //   response.status = true
        // if (response.status) {
        //   req.session.otp = response.otp;
        //   req.session.otpData = req.body;
        //   req.session.otpUser = response.User;
        //   res.redirect('/otp_login')
        // }
        // else {
        //   req.session.otpErr = "Entered email is blocked!";
        //   res.redirect('/otp_login');
        //   req.session.otpErr = null;
        // }
      } else if (checkuser.Status === false) {
        // User is blocked
        console.log("User is blocked");
        res.json({ message: "This user is blocked by the Admin" });
      } else {
        // Handle unexpected cases (optional)
        console.log("Unexpected Status value");
        return res.json({ message: "Unexpected Status value" });
      }
    }
    //  else if(!data.Email){
    //      console.log('email is not provided')
    //      req.session.otpErr=null
    //      req.session.InvalidOtp=null
    //    return res.render('user/otpLogin')
    //   }
    else {
      try {
        console.log("email is not registerd");
        req.session.otpErr = "Email not registered!";
        return res.json({ message: "emiail not found" });
        // res.redirect('/otp_login');
      } catch (err) {
        console.log(err.message);
      }
    }
  } catch (error) {
    console.log(error.message);
    return res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: error.message,
      errorDescription: "error in sending otp",
      link: "/login",
    });
    // res.status(500).json({error: error.message});
    // let errMessage = "An error occurred, please try again later.";
    // res.render('user/otpLogin', { err: errMessage });
  }
};

//forgotPassword otp verification
const forget_otpverify = async function (req, res) {
  try {
    const { email, otp } = req.body;
    console.log("verifying OTP  after storing OTP");
    console.log(response.otp);

    if (response.otp == undefined || response.otp == null) {
      return res.status(400).json({ message: "OTP expired or invalid." });
    }
    console.log(otp);

    const { genOtp: storedOtp, expiresAt } = response.otp;
    console.log(storedOtp);
    if (Date.now() > expiresAt) {
      console.log("time checked");
      delete response.otp; // Remove expired OTP
      console.log("otp dleted");
      return res.status(400).json({ message: "OTP expired." });
    }
    console.log("checking each OTP to check eaauel");
    if (otp != storedOtp)
      return res.status(400).json({ message: "Invalid OTP." });
    console.log("about to delete OTP ");
    delete response.otp;
    const userData = await User.findOne({ Email: email });
    req.session.user_id = userData._id;
    res.json({ success: true, message: "OTP verified. Login successful!" });

    // otp = req.session.otp
    // userOtp = req.body.digit
    // var user = req.session.otpUser
    // console.log(otp, userOtp);
    // if (otp == userOtp) {
    //   req.session.user = user.Username
    //   req.session.user_id = user._id
    //   req.session.otp = null
    //   console.log("success");
    //   res.redirect('/')
    // } else {
    //   req.session.InvalidOtp = "Invalid Otp"
    //   console.log("err");
    //   res.redirect('/otpLogin')
    //   req.session.InvalidOtp= null
    // }
  } catch (error) {
    console.log("somthing has happedn in " + error.message);
    res.status(500).json({ error });
  }
};

//forget change password page
const frgtchangePasswordget = async function (req, res) {
  console.log("change password page");
  const message = req.session.message;
  res.render("user/forgetChangePassword", { message });
  req.session.message = null;
};

//forget password change
const frgtchangePasswordpost = async function (req, res) {
  try {
    let email = req.body.email;
    let password = req.body.newPassword;
    let user = await User.findOne({ Email: email });
    if (user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.updateOne(
        { Email: email },
        { $set: { Password: hashedPassword } }
      );
      const message = "password updated successfully";
      req.session.message = message;
      return res.redirect("/login");
    } else {
      console.log("invalid email id in in frgtchangepassword");
      const message = "Email not registered!use correct email";
      req.session.message = message;
      res.redirect("user/forgetChangePassword");
      message = null;
    }
  } catch (error) {
    console.log("error in forgetchange password post", error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: error.message,
      link: req.headers.referer || "/",
    });
  }
};

let signupErr;
let message;
// user signup vaidation------------
const usersignupval = async function (req, res, next) {
  const usersignupvall = {
    Username: req.body.name,
    Password: req.body.password,
    Confirmpassword: req.body.conformpassword,
    Mobilenumber: req.body.phonenumber,
    Email: req.body.email,
    ReferralCode: req.body.referralCode,
    Status: true,
  };

  console.log(usersignupvall);

  try {
    // Check if email already exists in the database
    let signupval = await User.findOne({ Email: usersignupvall.Email });
    if (signupval) {
      console.log("usrer alredy exist");
      return res.render("user/signup", {
        signupErr: "Email already exists!",
        message,
      });
    }

    const genOtp = generateOTP();
    console.log("otp is  :" + genOtp);
    let mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "giftos986.@gmail.com",
        pass: "dqai pnig wnxh cdzr",
      },
    });

    let details = {
      from: "giftos986.@gmail.com",
      to: usersignupvall.Email,
      subject: "GIFTOS Sign up Verification",
      text:
        genOtp +
        " is your GIFTOS verification code. Do not share OTP with anyone ",
    };

    mailTransporter.sendMail(details, (err) => {
      if (err) {
        console.log("sign up otp sent error : " + err.message);
        return res.status(500).json({ message: "filed to send otp" });
      } else {
        console.log("opt send seccssfully" + genOtp);
        req.session.otp = genOtp;
        req.session.userData = usersignupvall;
        res.render("user/signupOtpPage");
      }
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    return res.render("user/signup", {
      signupErr: "An error occurred during signup. Please try again later.",
      message,
    });
  }
};

//signup otp verification
const verifySignupOTP = async function (req, res) {
  try {
    const { otp } = req.body;
    console.log(otp + "=======" + req.session.otp);

    if (otp == req.session.otp) {
      console.log("otp is matchig");
      const user = req.session.userData;
      const passwordHash = await bcrypt.hash(user.Password, 10);
      console.log("password has been hashed " + passwordHash);
      let referralUser = null;
      if (user.ReferralCode && user.ReferralCode.trim() !== "") {
        referralUser = await User.findOne({ ReferralCode: user.ReferralCode });
        console.log("referralUser", referralUser);
        if (!referralUser) {
          return res.status(500).json({
            success: false,
            message: "Wallet Operation Failed",
            description:
              "An error occurred while processing wallet transactions.",
          });
        }
      }

      const saveUser = new User({
        Username: user.Username,
        Password: passwordHash,
        Mobilenumber: user.Mobilenumber,
        Email: user.Email,
        ReferralCode: generateReferralCode(),
        Status: true,
      });
      await saveUser.save();

      if (referralUser) {
        const referalOffer = await OfferColl.findOne({
          type: "Referral",
          isActive: true,
        });
        console.log("refferalOffer", referalOffer);
        if (referalOffer) {
          const hasRedeemed = referralUser.RedeemedOffers.some((offer) =>
            offer.offerId.equals(referalOffer._id)
          );
          if (!hasRedeemed) {
            const wallet =
              (await WalletColl.findOne({ userId: referralUser._id })) ||
              new WalletColl({
                userId: referralUser._id,
                balance: 0,
                transactions: [],
              });
            console.log("wallet", wallet);
            const rewardOffer = referalOffer.discountValue;
            wallet.balance += rewardOffer;
            wallet.transactions.push({
              type: "credit",
              amount: rewardOffer,
              description: `Refferal bonus for new signin up ${saveUser._id}`,
              transactionDate: new Date(),
            });
            await wallet.save();

            const saveUserWallet =
              (await WalletColl.findOne({ userId: saveUser._id })) ||
              new WalletColl({
                userId: saveUser._id,
                balance: 0,
                transactions: [],
              });
            const saveUserrewardOffer = 50;
            saveUserWallet.balance += saveUserrewardOffer;
            saveUserWallet.transactions.push({
              type: "credit",
              amount: saveUserrewardOffer,
              description: `Refferal bonus for new signin up ${saveUser._id}`,
              transactionDate: new Date(),
            });
            await saveUserWallet.save();
            console.log("refferal bonus added to wallet");
            referralUser.RedeemedOffers.push({ offerId: referalOffer._id });
            await referralUser.save();
          } else {
            console.log("user already redeemed refferal offer");
          }
        }
      }

      res.json({ success: true, redirectUrl: "/login" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP, try again" });
    }
  } catch (error) {
    console.log("erron in veryfiying otp " + error.message);
    return res.status(500).json({ message: "an error occurred" });
  }
};
const generateReferralCode = () => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};

//resnd signup otp
const resentSignupOtp = async function (req, res) {
  try {
    const { Email } = req.session.userData;
    console.log("resend otp for" + Email);
    const genOtp = generateOTP();
    console.log("otp is  :" + genOtp);
    let mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "giftos986.@gmail.com",
        pass: "dqai pnig wnxh cdzr",
      },
    });

    let details = {
      from: "giftos986.@gmail.com",
      to: Email,
      subject: "GIFTOS Sign up Verification",
      text:
        genOtp +
        " is your GIFTOS verification code. Do not share OTP with anyone ",
    };

    mailTransporter.sendMail(details, (err) => {
      if (err) {
        console.log("sign up otp sent error : " + err.message);
        return res.status(500).json({ message: "filed to send otp" });
      } else {
        console.log("opt Resend seccssfully" + genOtp);
        req.session.otp = genOtp;
        //  req.session.userData= usersignupvall
        res
          .status(200)
          .json({ success: true, message: "OTP resent successfully" });
      }
    });
  } catch (error) {
    console.log("error in otp resneding session : " + error.message);
    res.status(500).json({ success: false, message: "an error occurred" });
  }
};

//single product details session-----------
const productDetailsget = async function (req, res) {
  let cartProductIds;
  let isCartItem;
  let iswishItem
  try {
    const user_id = req.session.user_id;
    const sessionName = user_id;
    let product_id = req.params.id;
    if (user_id) {
      const userCart = await cartColl.findOne({ UserId: user_id });
      console.log(user_id);
      if (userCart && userCart.Product) {
        cartProductIds = userCart.Product.map((product) =>
          product.item.toString()
        );

        isCartItem = cartProductIds.includes(product_id);
        if (isCartItem) {
          console.log("product is allredy in the cart");
        } else {
          console.log("product is not in the cart");
        }
        
        const userWishlist = await wishListColl.findOne({ UserId: user_id });
        if (userWishlist && userWishlist.Product) {
          wishProductIds = userWishlist.Product.map((product) =>
            product.item.toString()
          );
          iswishItem = wishProductIds.includes(product_id);
          if (iswishItem) {
            console.log("product is allredy in the wishlist");
          } else {
            console.log("product is not in the wishlist");
          }
        }

      } else {
        console.log("user cart not found");
      }
    } else {
      console.log("user is not logged in");
    }
    let product = await ProductColl.findOne({ _id: product_id });
    // let related_products=await ProductColl.find({Category: product.Category}).sort({CreatedAt:-1}).limit(6)
    let related_products = await ProductColl.aggregate([
      { $match: { Category: product.Category } }, // Filter by category
      { $sample: { size: 6 } }, // Randomly select 6 products
    ]);
    console.log(product);
    if (product.Stock < 1) {
      console.log("product is out of stock" + product.Stock);
      stockerr = "product is not available";
    }
    res.render("user/productDetails", {
      sessionName,
      product,
      related_products,
      stockerr,
      isCartItem,
      iswishItem
    });
    req.session.prodid = null;
    stockerr = undefined;
  } catch (error) {
    console.log("erron in prouctdetailsget" + error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: error.message,
      errorDescription: "somthing wrong in getting product details",
      link: req.headers.referer || "/",
    });
  }
};

// Add to cart session
const addtoCart = async function (req, res, next) {
  try {
    const usersession = req.session.user_id;
    if (!usersession) {
      return res.redirect("/login");
    }
    console.log("User cart has session");
    const prodId = req.params.id;
    const userId = req.session.user_id;

    if (!mongoose.Types.ObjectId.isValid(prodId)) {
      return res.status(400).send("Invalid product ID");
    }

    // check if product available
    const product = await ProductColl.findOne({ _id: prodId });
    //  if(ifAvaliable.Stock<=0){
    //   stockerr='sorry, this product currently has no stock'
    //    return res.redirect(`/productdetails/${prodId}`)
    //  }

    if (product.Status !== "Available" || product.Stock < 1) {
      stockerr = "sorry,this product is not available or out of stock";
      return res.redirect(`/productdetails/${prodId}`);
      // return res.status(400).redirect(`/product/view/${productId}?message=${encodeURIComponent(message)}`);
    }
    let discountValue = product.SalePrice
      ? product.RegularPrice - product.SalePrice
      : 0;
    const proObj = {
      item: new mongoose.Types.ObjectId(prodId),
      quantity: 1,
      discountValue,
    };

    const userCart = await cartColl.findOne({ UserId: userId });
    if (userCart) {
      let proExist = await cartColl.findOne({
        $and: [
          { UserId: userId },
          { "Product.item": new mongoose.Types.ObjectId(prodId) },
        ],
      });

      if (proExist) {
        const productInCart = proExist.Product.find(
          (item) => item.item.toString() === prodId
        );
        if (productInCart) {
          const totalQuantity = productInCart.quantity;
          if (totalQuantity >= product.MaxPerPerson) {
            stockerr =
              "Sorry, you can only add a maximum of " +
              product.MaxPerPerson +
              " items in your cart at a time";
            return res.redirect(`/productdetails/${prodId}`);
          }

          await cartColl.updateOne(
            {
              UserId: userId,
              "Product.item": new mongoose.Types.ObjectId(prodId),
            },
            { $inc: { "Product.$.quantity": 1 } }
          );
        }
      } else {
        await cartColl.updateOne(
          { UserId: userId },
          { $push: { Product: proObj } }
        );
      }
    } else {
      const cartObj = {
        UserId: userId,
        Product: [proObj],
      };
      await cartColl.insertMany([cartObj]);
    }

    res.redirect("/adduserCart");
  } catch (error) {
    console.log(
      "error occured while addo cart",
      error,
      "=======",
      error.message
    );
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred while add to cart.",
      link: req.headers.referer || "/",
    });
  }
};

// Cart user get and coupen apply session
const userCart = async function (req, res, next) {
  try {
    const user = req.session.user_id;
    const sessionName = user;

    const productCart = await cartColl.aggregate([
      { $match: { UserId: user } },
      { $unwind: "$Product" },
      {
        $project: {
          item: "$Product.item",
          quantity: "$Product.quantity",
          discountValue: "$Product.discountValue",
        },
      },
      {
        $lookup: {
          from: "productdatas",
          localField: "item",
          foreignField: "_id",
          as: "products",
        },
      },
      {
        $project: {
          item: 1,
          quantity: 1,
          discountValue: 1,
          Product: { $arrayElemAt: [{ $ifNull: ["$products", [{}]] }, 0] },
        },
      },
    ]);

    for (let i = 0; i < productCart.length; i++) {
      if (
        productCart[i].Product &&
        (productCart[i].Product.SalePrice ||
          productCart[i].Product.RegularPrice)
      ) {
        const totalPrice =
          productCart[i].quantity *
          (productCart[i].Product.SalePrice ||
            productCart[i].Product.RegularPrice);
        productCart[i].totalPrice = totalPrice;

        const subTotal= productCart[i].quantity * productCart[i].Product.RegularPrice;
        productCart[i].subTotal = subTotal;

        const totaDiscValue=productCart[i].quantity * productCart[i].discountValue;
        console.log( "totaldiscvalue",totaDiscValue)
        productCart[i].totaDiscValue = totaDiscValue;

      } else {
        productCart[i].totalPrice = 0;
        productCart[i].totaDiscValue = 0;

      }
    }

    grand_total = productCart.reduce(
      (sum, cart) => sum + (cart.totalPrice || 0),
      0
    );
    totalQuantity = productCart.reduce(
      (sum, cart) => sum + (cart.quantity || 0),
      0
    );
    sub_total = productCart.reduce(
      (sum, cart) => sum + (cart.subTotal || 0),
      0
    );
    discountValue= productCart.reduce(
      (sum, cart) => sum + (cart.totaDiscValue || 0),
      0
    );

    // ==========copuen session================================
    let coupen = req.session.coupen;
    if (coupen) {
      console.log("dlskdlfkslfdsf  " + coupen);
      console.log("coupen session is not empty " + coupen);
      const value = await CoupenColl.findOne({ CoupenCode: coupen });
      console.log("value: " + value);
      if (grand_total < value.MinimumPrice) {
        console.log("minimum prise not reached");
        coupenerr =
          "minimum prise not reached plesae purchase upto " +
          value.MinimumPrice;
      } else {
        discPrice = value.DiscountPrice;
        grand_total -= value.DiscountPrice;
        console.log("discount applied");
        var success = "Discount applied" + value.DiscountPrice;
        const cart = await cartColl.findOne({ UserId: user }).lean();
        if (cart) {
          const result = await cartColl.updateOne(
            { UserId: user },
            { $set: { discountPrice: value.DiscountPrice } }
          );
          // cart.discountPrice= value.DiscountPrice
          console.log("discount price added to cart" + cart.discountPrice);
          console.log(result);
        }
        await User.updateOne(
          { _id: user },
          { $addToSet: { UsedCoupen: coupen } }
        );
      }
    }
    res.render("user/cart", {
      productCart,
      grand_total,
      totalQuantity,
      sessionName,
      coupenerr,
      success,
      discPrice,
      sub_total,
      discountValue
    });
    coupen = null;
    req.session.coupen = null;
    carterr = null;
    coupenerr = null;
    success = null;
  } catch (error) {
    console.log(
      "an error occurred while user cart",
      error,
      "=====",
      error.message
    );
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred while looking usercart.",
      link: req.headers.referer || "/",
    });
  }
};

///update cart=======================================
const updateCart = async (req, res) => {
  console.log("reached update cart=================");

  const { productId, change } = req.body;
  const userId = req.session.user_id;

  if (!productId || change === undefined) {
    throw new Error("Missing productId or change value.");
  }

  if (!userId) {
    console.log("user id is not defined in update cart");
    return res
      .status(401)
      .json({ success: false, message: "User not logged in" });
  }

  try {
    // Update the quantity in the cart
    const updateQuantityResult = await cartColl.updateOne(
      {
        UserId: userId,
        "Product.item": new mongoose.Types.ObjectId(productId),
      },
      { $inc: { "Product.$.quantity": change } },
      console.log("cart updated in database")
    );
    console.log("quantity updated in database");

    // const updateDiscountResult = await cartColl.updateOne(
    //   {
    //     UserId: userId,
    //     "Product.item": new mongoose.Types.ObjectId(productId),
    //   },
    //   [
    //     {
    //       $set: {
    //         "Product.discountValue": {
    //           $multiply: ["$Product.$.quantity", "$Product.$.discountValue"]
    //         }
    //       }
    //     }
    //   ]
    // );
    // console.log("Discount value updated in database");
    // const updateDiscountResult = await cartColl.updateOne(
    //   {
    //     UserId: userId,
    //     "Product.item": new mongoose.Types.ObjectId(productId),
    //   },
    //   [
    //     {
    //       $set: {
    //         Product: {
    //           $map: {
    //             input: "$Product",
    //             as: "prod",
    //             in: {
    //               $cond: {
    //                 if: {
    //                   $eq: [
    //                     "$$prod.item",
    //                     new mongoose.Types.ObjectId(productId),
    //                   ],
    //                 },
    //                 then: {
    //                   $mergeObjects: [
    //                     "$$prod",
    //                     {
    //                       discountValue: {
    //                         $multiply: [
    //                           "$$prod.quantity",
    //                           "$$prod.discountValue",
    //                         ],
    //                       },
    //                     },
    //                   ],
    //                 },
    //                 else: "$$prod",
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //   ]
    // );

    console.log("Discount value updated in database");

    if (updateQuantityResult.modifiedCount === 0) {
      // if(updateResult.modifiedCount === 0){
      console.log("modifyid count is 0");
      return res
        .status(400)
        .json({ success: false, message: "Failed to update quantity" });
    }
    const userCart = await cartColl.aggregate([
      { $match: { UserId: userId } },
      { $unwind: "$Product" },
      {
        $lookup: {
          from: "productdatas",
          localField: "Product.item",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $addFields: {
          productDetails: { $arrayElemAt: ["$productDetails", 0] }, // Access first element of productDetails
        },
      },
      {
        $project: {
          item: "$Product.item",
          quantity: "$Product.quantity",
          discountValue: "$Product.discountValue",
          productDetails: 1, // Include product details in the response
          RegularPrice: "$productDetails.RegularPrice",
          productPrice: {
            $cond: {
              if: {
                $or: [
                  { $eq: ["$productDetails.SalePrice", null] },
                  { $eq: ["$productDetails.SalePrice", []] },
                  { $not: ["$productDetails.SalePrice"] },
                  { $eq: ["$productDetails", null] },
                ],
              },
              then: "$productDetails.RegularPrice",
              else: "$productDetails.SalePrice",
            },
          },
        },
      },
    ]);
    let sub_total=0
    let grandTotal = 0;
    let totalQuantity = 0;
    let totalDiscountValue=0;
    console.log("userCart==" + userCart);
    userCart.forEach((cartItem) => {
      sub_total +=cartItem.quantity * cartItem.RegularPrice
      totalDiscountValue += cartItem.quantity * cartItem.discountValue
      if (cartItem.productPrice) {
        grandTotal += cartItem.quantity * cartItem.productPrice;
        totalQuantity += cartItem.quantity;
        console.log("regularPrice=" + cartItem.RegularPrice);
        console.log("salePrice=" + cartItem.productPrice);
        console.log("discountValue=" + cartItem.discountValue);
      }
    });
    console.log('subtotal', sub_total);
    const updatedProduct = userCart.find(
      (item) => item.item.toString() === productId
    );
    console.log("updatedProduct==" + updatedProduct);
    console.log("cart upadate about to end");
    res.json({
      success: true,
      sub_total,
      totalDiscountValue,
      grandTotal,
      totalQuantity,
      discountValue: updatedProduct?.discountValue || null,
      regularPrice: updatedProduct?.RegularPrice || null,
      productPrice: updatedProduct?.productPrice || null,
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//delete cart item=================================
const deleteCart = async function (req, res) {
  try {
    const User = req.session.user_id;
    const product_id = req.params.id;
    console.log(product_id);
    const deletedItem = await cartColl.updateOne(
      { UserId: User },
      { $pull: { Product: { item: product_id } } }
    );
    console.log(deletedItem);
    res.redirect("/adduserCart");
  } catch (error) {
    console.log("an error occured in delete cart", error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred while deleting cart.",
      link: req.headers.referer || "/",
    });
  }
};

// coupen management================================
const coupenApply = async function (req, res) {
  try {
    const userId = req.session.user_id;
    const sessionName = userId;
    const coupenCode = req.body.couponCode;
    const TotalPrice = req.body.TotalPrice;
    console.log("coupen code" + coupenCode);
    console.log("totalPrice" + TotalPrice);
    const totalPriceFloat = parseFloat(TotalPrice);

    if (!coupenCode || isNaN(totalPriceFloat)) {
      return res
        .status(400)
        .json({
          isValid: false,
          message: "Coupon code and total price are required.",
        });
    }

    let checkcoupen = await CoupenColl.findOne({ CoupenCode: coupenCode });
    console.log(checkcoupen);

    if (checkcoupen && checkcoupen.Status) {
      let usedcoupen = await User.findOne({
        _id: userId,
        UsedCoupons: { $in: [coupenCode] },
      });
      console.log("useduserfind " + usedcoupen);

      if (usedcoupen == null || usedcoupen == undefined) {
        let date = new Date();

        let expireDate = new Date(checkcoupen.ExpireDate); 
        console.log(date ,'====', expireDate)
        if (date < expireDate) {
          if (checkcoupen.MinimumPrice <= totalPriceFloat) {
            req.session.coupen = coupenCode;
            // sucess = "coupen applied successfully";

            let discountAmount = 0;

            if (checkcoupen.DiscountType === "Percentage") {
              discountAmount =
                totalPriceFloat -
                totalPriceFloat * (checkcoupen.DiscountPrice / 100);
            } else if (checkcoupen.DiscountType === "Amount") {
              discountAmount = totalPriceFloat - checkcoupen.DiscountPrice;
            } else {
              return res
                .status(400)
                .json({
                  isValid: false,
                  message: "Invalid coupon discount type.",
                });
            }
            discountAmount = discountAmount > 0 ? discountAmount : 0;

            return res.json({
              isValid: true,
              discountAmount,
              couponId: checkcoupen._id,
            });
          } else {
            // coupenerr = "coupen minimum price not met";
            return res
              .status(400)
              .json({
                isValid: false,
                message: `Coupon minimum price (${checkcoupen.MinimumPrice})  not met.`,
              });
          }
        } else {
          // coupenerr = "coupen expired";
          return res
            .status(400)
            .json({ isValid: false, message: "Coupon Expired." });
        }
      } else {
        // coupenerr = "coupen alredy used";
        return res
          .status(400)
          .json({ isValid: false, message: "Coupon code alredy used." });
      }
    } else {
      // coupenerr = "coupen not found";
      return res
        .status(400)
        .json({
          isValid: false,
          message: "Invalid or Not Active.",
        });
    }

    // res.redirect("/adduserCart");
  } catch (error) {
    console.log("error in coupen applying", error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred while applying copen.",
      link: req.headers.referer || "/adduserCart",
    });
  }
};

//  checkout cart session
const checkoutget = async function (req, res, next) {
  try {
    let userId = req.session.user_id;
    let sessionName = userId;
    let user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    let { cartMessage, addressMessage } = req.query;

    if (userId) {
      let userAddress = await AddressColl.findOne({
        UserId: req.session.user_id,
      });
      let addresses = userAddress?.Address;

      let cart;

      let totalCartPrice = 0;
      let totalDiscountAmount = 0;
      let subTotal=0
      // let totalCartPages = 1;
      // let currentCartPage = cartPage;
      try {
        cart = await cartColl
          .findOne({ UserId: userId })
          .populate("Product.item");

        if (cart && cart.Product.length > 0) {
          console.log('product available in cart')
          for (let i = 0; i < cart.Product.length; i++) {
            const item = cart.Product[i];
            console.log(
              "product item in checkout get" + item + " ===" + item.id
            );
            try {
              const product = await ProductColl.findById(item.item._id);

              const isProductAvailable = (product) => {
                return (
                  product && product.Status === "Available" && product.Stock > 0
                );
              };

              if (!isProductAvailable(product)) {
                cart.Product.splice(i, 1);
                i--;
                continue;
              }

              if (product.Stock < item.quantity) {
                item.quantity = product.Stock;
              }
              
              // item.price = product.SalePrice || product.RegularPrice;
               // Use SalePrice if available, else RegularPrice
              item.totalPrice = product.RegularPrice * item.quantity; // Total price based on effective price
              totalDiscountAmount += (item.quantity * item.discountValue);// Discount amount
               subTotal+=item.totalPrice 
              item.discountAmount = (item.quantity * item.discountValue)
              item.finalTotalPrice = item.totalPrice-item.discountAmount ||item.totalPrice; // Adjust if you add discounts later

              // item.finalTotalPrice = (product.SalePrice || product.RegularPrice) * item.quantity;

              totalCartPrice += item.finalTotalPrice;
              // totalDiscount += item.discount * item.quantity;
            } catch (productError) {
              console.error(
                `Error fetching product for item ${item.item_id}:`,
                productError
              );
              cart.Product.splice(i, 1); // Remove item if there's an error with the product
              i--;
            }
          }

          cart.totalCartPrice = cart.Product.reduce(
            (sum, item) => sum + item.finalTotalPrice,
            0
          );
          if (cart.discountPrice && cart.discountPrice < totalCartPrice) {
            cart.finalTotalCartPrice = totalCartPrice - cart.discountPrice;
            cart.discountPrice = totalCartPrice - cart.finalTotalCartPrice;
            console.log("totaldiscountPrice", cart.discountPrice);
          } else {
            console.log("no totaldiscount");
            cart.finalTotalCartPrice = totalCartPrice;
          }
          await cart.save();

          // const totalCartItems = cart.items.length;
          // totalCartPages = Math.ceil(totalCartItems / cartLimit);
          // currentCartPage = Math.max(1, Math.min(cartPage, totalCartPages));

          // paginatedCartItems = cart.items.slice((currentCartPage - 1) * cartLimit, currentCartPage * cartLimit);
        } else {
          cartMessage = "Your cart is empty.";
          cart = { Product: [], totalCartPrice: 0 }; // Default cart if no items
        }
      } catch (cartError) {
        console.error("Error fetching cart:", cartError.message);
        cartMessage = "Error loading cart.";
        cart = { items: [], totalCartPrice: 0 }; // Default empty cart on error
      }
      console.log("rendering checkout");
      return res.render("user/checkOut", {
        addresses,
        sessionName,
        totalCartPrice,
        user,
        cartId: cart._id || null,
        // addresses: paginatedAddresses,
        cart: {
          subTotal,
          product: cart.Product, // Ensure it's referred as 'product'
          totalCartPrice: totalCartPrice,
          finalTotalCartPrice: cart.finalTotalCartPrice,
          totalDiscount: totalDiscountAmount || 0,
        },
        cartMessage,
        // currentAddressPage,
        // currentCartPage,
        // totalCartPages,
        // totalAddressPages,

        // addressMessage,
        // addressLimit,
        // cartLimit,
      });
    } else {
      res.status(404).json("not found");
    }
  } catch (error) {
    console.log("error occured in checkout get", error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred while checkout.",
      link: req.headers.referer || "/adduserCart",
    });
  }
};
// }

//Wishlist
const wishListget = async function (req, res) {
  const userId = req.session.user_id;
  const sessionName = userId;
  // productWish = await productinfo.find()
  if (userId) {
    console.log("rached to wishlist");
    const wishProduct = await wishListColl.aggregate([
      {
        $match: { UserId: userId },
      },
      { $unwind: "$Product" },
      { $project: { item: "$Product.item", quantity: "$Product.quantity" } },
      {
        $lookup: {
          from: "productdatas",
          localField: "item",
          foreignField: "_id",
          as: "products",
        },
      },
      { $unwind: { path: "$products", preserveNullAndEmptyArrays: false } }, // Ensures no undefined products

      { $project: { item: 1, quantity: 1, Product: "$products" } },
    ]);
    // console.log(wishProduct);

    res.render("user/wishList", { sessionName, wishProduct });
  } else {
    res.redirect("/login");
  }
};

// wishList post--------------

const wishListPost = async function (req, res, next) {
  const sessionName = req.session.user_id;
  if (sessionName == null) {
    res.redirect("/login");
  } else {
    const proId = req.params.id;
    const userId = req.session.user_id;
    console.log("javaddadaaaaaali", proId);
    console.log(userId);

    const proObj = {
      item: new mongoose.Types.ObjectId(proId),
      quantity: 1,
    };

    const userCart = await wishListColl.findOne({ UserId: userId });

    if (userCart) {
      let proExist = await wishListColl.findOne({
        $and: [
          { UserId: userId },
          { "Product.item": new mongoose.Types.ObjectId(proId) },
        ],
      });
      console.log(proExist);

      if (proExist != null && proExist != "") {
        await wishListColl.updateOne(
          { "Product.item": new mongoose.Types.ObjectId(proId) },
          { $inc: { "Product.$.quantity": 1 } }
        );
      } else {
        await wishListColl.updateOne(
          { UserId: userId },
          { $push: { Product: proObj } }
        );
      }
    } else {
      let wishObj = {
        UserId: userId,
        Product: [proObj],
      };
      await wishListColl.insertMany([wishObj]);
    }
    res.redirect("/wishList");
  }
};

//wishdelete

const wishDelete = async function (req, res) {
  const User = req.session.user_id;
  const product_id = req.params.id;
  console.log(product_id);
  const deletedItem = await wishListColl.updateOne(
    { UserId: User },
    { $pull: { Product: { item: new mongoose.Types.ObjectId(product_id) } } }
  );
  console.log(deletedItem);
  res.redirect("/wishlist");
};

//user-porfiel
const userProfile = async function (req, res) {
  const userId = req.session.user_id;
  const sessionName = userId;
  if (userId) {
    const user = await User.findById(userId);
    res.render("user/userProfile", { user, sessionName });
  } else {
    res.redirect("/login");
  }
};

//edit-profile
const editProfile = async function (req, res) {
  const userId = req.session.user_id;
  const user = await User.findById(userId);
  const sessionName = userId;
  if (userId) {
    // const user = await User.findById(userId);
    res.render("user/editProfile", { sessionName, user });
  } else {
    res.redirect("/login");
  }
};

//update-profile
const updateProfile = async function (req, res) {
  const userId = req.session.user_id;
  const sessionName = userId;
  if (userId) {
    console.log(req.body);
    const update = {};
    for (const key in req.body) {
      if (
        req.body[key] !== null &&
        req.body[key] !== undefined &&
        req.body[key] !== ""
      ) {
        update[key] = req.body[key];
      }
    }
    console.log("user profile updated data = " + update);
    // const user = await User.findByIdAndUpdate({ _id: userId }, { $set: update });
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    );

    console.log(user);
    res.redirect("/user-profile");
  } else {
    res.redirect("/login");
  }
};
let passerrmsg;
const editPasswordget = async function (req, res) {
  const sessionName = req.session.user_id;
  if (sessionName) {
    res.render("user/changePassword", { sessionName, passerrmsg: passerrmsg });
    passerrmsg = null;
  } else {
    res.redirect("/login");
  }
};

// edit userprofile password
const editPasswordPost = async function (req, res, next) {
  try {
    console.log("reached edit password post");

    const userId = req.session.user_id;
    const { CurrentPassword, NewPassword, ConfirmPassword } = req.body;
    console.log('current password '+ CurrentPassword + ' new passowrd '+ NewPassword + ' confirmpassword '+ ConfirmPassword)
    if (NewPassword !== ConfirmPassword) {
      passerrmsg = "Passwords do not match";
      res.redirect("/editpassword");
      return;
    }
    let user = await User.findOne({ _id: userId });
    // const currenthashedPassword = await bcrypt.hash(CurrentPassword, 10);
    console.log( 'existing passowrd',user.Password);
    const isMatch = await bcrypt.compare(CurrentPassword, user.Password);
    if (isMatch) {
      console.log(
        `user password in update password ${user.Password} and ${CurrentPassword}`
      );
      const hashedPassword = await bcrypt.hash(NewPassword, 10);
      await User.updateOne(
        { _id: userId },
        { $set: { Password: hashedPassword } }
      );
      return res.redirect("/user-profile?success=true");
    } else {
      console.log("password is wrong");
      passerrmsg = "Current Password is wrong";
      return res.redirect("/editpassword");
    }
  } catch (error) {
    console.log("error in userprofile update password ", error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred edit passowrd.",
      link: req.headers.referer || "/user-profile",
    });
  }
};

//User Adress get session
const userAddressget = async function (req, res) {
  let userAddress1;
  let userAddress;
  let totalPages;
  // let currrentPage;
  try {
    const userId = req.session.user_id;
    const currentPage = parseInt(req.query.page) || 1;
    const limit = 1;
    const skip = (currentPage - 1) * limit;
    // const totalAddresses = await AddressColl.countDocuments({ UserId: userId })
    // const totalPages=Math.ceil(totalAddresses/limit)
    const sessionName = userId;
    if (userId) {
      userAddress1 = await AddressColl.findOne({ UserId: userId }).lean();
      if (userAddress1) {
        userAddress = userAddress1.Address.slice(skip, skip + limit);
        totalPages = userAddress1.Address.length;
        const user = await User.findById({ _id: userId }).lean();
        res.render("user/userAddress", {
          user,
          userAddress,
          sessionName,
          totalPages,
          currentPage,
        });
      } else {
        console.log("user dont have address");
        res.render("user/userAddress", {
          userAddress,
          sessionName,
          totalPages,
          currentPage,
        });
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log("error in user address get =" + error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred while getting address.",
      link: req.headers.referer || "/user-profile",
    });
  }
};

// addAddress
const addAddressget = async function (req, res) {
  try {
    const userId = req.session.user_id;
    const sessionName = userId;
    if (userId) {
      res.render("user/addAddress", { sessionName });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log("error in add address get " + error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred while fetching page.",
      link: req.headers.referer || "/user-profile",
    });
  }
};

// addAddress post
const addAddresspost = async function (req, res) {
  try {
    const userId = req.session.user_id;
    if (!userId) {
      return res.status(404).send("User not found.");
    }
    const {
      name,
      houseName,
      street,
      city,
      state,
      pincode,
      phone,
      altPhone,
      redirectPath,
    } = req.body;

    if (
      !name ||
      !houseName ||
      !street ||
      !city ||
      !state ||
      !pincode ||
      !phone
    ) {
      if (redirectPath === "/checkout") {
        return res.redirect(
          `/checkout?addressMessage=${encodeURIComponent(
            "All required fields must be filled."
          )}`
        );
      } else {
        return res.status(400).render("addAddress", {
          title: "Add Address",
          activePage: "addAddress",
          user,
          errors: ["All required fields must be filled."],
          formData: req.body,
        });
      }
    }

    const pincodeNumber = Number(pincode);
    if (
      isNaN(pincodeNumber) ||
      pincodeNumber < 100000 ||
      pincodeNumber > 999999
    ) {
      if (redirectPath === "/checkout") {
        return res.redirect(
          `/checkout?addressMessage=${encodeURIComponent(
            "Pincode must be a valid 6-digit number."
          )}`
        );
      } else {
        return res.status(400).render("addAddress", {
          title: "Add Address",
          activePage: "addAddress",
          user,
          errors: ["Pincode must be a valid 6-digit number."],
          formData: req.body,
        });
      }
    }

    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(phone)) {
      if (redirectPath === "/checkout") {
        return res.redirect(
          `/checkout?addressMessage=${encodeURIComponent(
            "phone number must be a valid 10-digit number."
          )}`
        );
      } else {
        return res.status(400).render("addAddress", {
          title: "Add Address",
          activePage: "addAddress",
          user,
          errors: ["Phone number must be a valid 10-digit number."],
          formData: req.body,
        });
      }
    }

    if (altPhone && !phonePattern.test(altPhone)) {
      if (redirectPath === "/checkout") {
        return res.redirect(
          `/checkout?addressMessage=${encodeURIComponent(
            "Alternate phone number must be a valid 10-digit number."
          )}`
        );
      } else {
        return res.status(400).render("addAddress", {
          title: "Add Address",
          activePage: "addAddress",
          user,
          errors: ["Alternate phone number must be a valid 10-digit number."],
          formData: req.body,
        });
      }
    }
    const user = await User.findById({ _id: userId });
    const address = await AddressColl.findOne({ UserId: user._id });
    if (!address) {
      const newAddress = new AddressColl({
        UserId: user._id,
        Address: [
          {
            name: name,
            houseName: houseName,
            street: street,
            city: city,
            state: state,
            pincode: pincode,
            phone: phone,
            altPhone: altPhone,
          },
        ],
      });
      await newAddress.save();
      console.log("created new address instance");
    } else {
      address.Address.push({
        name,
        houseName,
        street,
        city,
        state,
        pincode,
        phone,
        altPhone,
      });
      await address.save();
      console.log("add address to address list");
    }

    if (redirectPath === "/checkout") {
      return res.redirect(
        `/checkout?addressMessage=${encodeURIComponent(message)}`
      );
    } else {
      res.redirect("/user-address?success=true");
      // return res.redirect(`/addresses/${user._id}?message=${encodeURIComponent(message)}`);
    }
  } catch (error) {
    console.log("error in add address post " + error.message);
    res.render("user/error", { error });
  }
};

// Delete an anddress
const deleteAddress = async function (req, res) {
  try {
    const userId = req.session.user_id;
    const addressElem = parseInt(req.params.id);
    console.log(addressElem);
    const user = await User.findById({ _id: userId });
    const address = await AddressColl.findOne({ UserId: user._id });
    if (address) {
      address.Address.splice(addressElem, 1);
      await address.save();
      console.log("deleted address from address list");
    }
    res.redirect("/user-address");
  } catch (error) {
    console.log("error in delete address " + error.message);
    res.render("user/error", { error });
  }
};

// Edit an address
const editAddressget = async function (req, res, next) {
  try {
    const addressId = req.query.id;
    const userId = req.session.user_id;
    const sessionName = userId;
    const address = await AddressColl.findOne({ "Address._id": addressId });
    if (!address) {
      return res.render("user/error", { error: "Address not found" });
    }
    const editAddress = address.Address.find((item) => {
      return item._id.toString() === addressId.toString();
    });
    if (!editAddress) {
      return res.render("user/error", { error: "Address not found" });
    }
    res.render("user/editUserAddress", { address: editAddress, sessionName });
  } catch (error) {
    console.log("error in edit address get " + error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription:
        "An unexpected error occurred in fetching edit address page.",
      link: req.headers.referer || "/user-profile",
    });
  }
};

// Edit an address post
const editAddresspost = async function (req, res) {
  try {
    console.log("reached address post");

    const addressId = req.query.id || req.params.addressId;
    console.log(addressId);
    // const redirectPath= req?.body?.redirectPath
    const userId = req.session.user_id;
    const address = await AddressColl.findOne({ "Address._id": addressId });
    const {
      name,
      houseName,
      street,
      city,
      state,
      pincode,
      phone,
      altPhone,
      redirectPath,
    } = req.body;
    if (!address) {
      return res.render("user/error", { error: "Address not found" });
    }

    if (
      !name ||
      !houseName ||
      !street ||
      !city ||
      !state ||
      !pincode ||
      !phone
    ) {
      const message = "All required fields must be filled.";
      if (redirectPath === "/checkout") {
        return res.redirect(
          `/checkout?addressMessage=${encodeURIComponent(message)}`
        );
      } else {
        return res
          .status(400)
          .redirect(
            `/edit-address/${addressId}?message=${encodeURIComponent(message)}`
          );
      }
    }

    const pincodeNumber = Number(pincode);
    if (
      isNaN(pincodeNumber) ||
      pincodeNumber < 100000 ||
      pincodeNumber > 999999
    ) {
      const message = "Pincode must be a valid 6-digit number.";
      if (redirectPath === "/checkout") {
        return res.redirect(
          `/checkout?addressMessage=${encodeURIComponent(message)}`
        );
      } else {
        return res
          .status(400)
          .redirect(
            `/editAddress/${addressId}?message=${encodeURIComponent(message)}`
          );
      }
    }

    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(phone)) {
      const message = "Phone number must be a valid 10-digit number.";
      if (redirectPath === "/checkout") {
        return res.redirect(
          `/checkoutaddressMessage=${encodeURIComponent(message)}`
        );
      } else {
        return res
          .status(400)
          .redirect(
            `/editAddress/${addressId}?message=${encodeURIComponent(message)}`
          );
      }
    }

    if (altPhone && !phonePattern.test(altPhone)) {
      const message = "Alternate phone number must be a valid 10-digit number.";
      if (redirectPath === "/checkout") {
        return res.redirect(
          `/checkout?addressMessage=${encodeURIComponent(message)}`
        );
      } else {
        return res
          .status(400)
          .redirect(
            `/editAddress/${addressId}?message=${encodeURIComponent(message)}`
          );
      }
    }

    await AddressColl.updateOne(
      { "Address._id": addressId },
      {
        $set: {
          "Address.$.name": req.body.name,
          "Address.$.houseName": req.body.houseName,
          "Address.$.street": req.body.street,
          "Address.$.city": req.body.city,
          "Address.$.state": req.body.state,
          "Address.$.pincode": req.body.pincode,
          "Address.$.phone": req.body.phone,
          "Address.$.altPhone": req.body.altPhone,
        },
      }
    );
    console.log("adress edited successfully");
    const successMessage = "Address edited successfully!";
    if (redirectPath === "/checkout") {
      return res.redirect(
        `/checkout?addressMessage=${encodeURIComponent(successMessage)}`
      );
    } else {
      // res.redirect(`/addresses/${user._id}?message=${encodeURIComponent(successMessage)}&page=${currentPage}`);
      res.redirect("/user-address");
    }
  } catch (error) {
    console.log("Error in editposting address: " + error.message);
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred while editing  address.",
      link: req.headers.referer || "/user-profile",
    });
  }
};

// ORDER SESSION
const confirmOrder = async (req, res) => {
  try {
    console.log("reached confirm order");
    const { cartId } = req.params;
    const { addressId, paymentMethod, couponId } = req.body;

    const user = await User.findById(req.session.user_id);
    if (!user) {
      console.log("User not found in confirmOrder");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const cart = await cartColl.findById(cartId);
    if (!cart || !cart.Product.length) {
      console.log("Cart not found in confirmOrder");
      return res
        .status(400)
        .json({ success: false, message: "Your cart is empty" });
    }

    if (paymentMethod !== "Cash on Delivery" && paymentMethod !== "Online") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment method selected" });
    }
    console.log("payment method===" + paymentMethod);

    let totalCartPrice = cart.finalTotalCartPrice;
    // for (let item of cart.Product) {
    //   const product = await ProductColl.findById(item.item);
    //   console.log('produuct id==',item.item)
    //   if (!product || product.Stock < item.quantity) continue;

    //   totalCartPrice +=
    //     (product.SalePrice || product.RegularPrice) * item.quantity;
    // }
    console.log("totalCartPrice=" + totalCartPrice);
    // if (cart.finalTotalCartPrice !== totalCartPrice) {
    //   cart.totalCartPrice = cart.Product.reduce((sum, item) => sum + item.totalPrice, 0);
    //     cart.finalTotalCartPrice = totalCartPrice;
    //     await cart.save();
    //     return res.status(409).redirect(`/checkout?cartMessage=Price updated. Review before payment.`);
    // }

    const userAddress = await AddressColl.aggregate([
      { $match: { UserId: user._id } },
      { $unwind: "$Address" },
      { $match: { "Address._id": new mongoose.Types.ObjectId(addressId) } },
      { $replaceRoot: { newRoot: "$Address" } },
    ]);
    console.log("User Addres in confirmOrder==" + userAddress[0]);

    if (!userAddress.length) {
      console.log("Address not found in confirmOrder");
      return res.status(400).json({
        success: false,
        message: "Address not found.",
      });
    }
    let discountAmount = 0;
    let couponCode;
    if (couponId) {
      const coupon = await CoupenColl.findById(couponId);
      if (!coupon) {
        console.log("Coupon not found in confirmOrder");
        return res.status(400).json({
          success: false,
          message: "Coupon not found.",
        });
      }
      if (coupon.expiryDate < new Date()) {
        console.log("Coupon has expired in confirmOrder");
        return res.status(400).json({
          success: false,
          message: "Coupon has expired",
        });
      }
      if (coupon.MinimumPrice < totalCartPrice) {
        if (coupon.DiscountType == "Amount") {
          discountAmount = coupon.DiscountPrice;
          couponCode = coupon.CoupenCode;
        }
      } else {
        console.log(coupon.MinimumPrice, totalCartPrice);
        console.log("Coupon can't be applied on this amount in confirmOrder");
        return res.status(400).json({
          success: false,
          message: "Coupon can't be applied on this amount.",
        });
      }

      // discountAmount = (coupon.discountPercentage / 100) * totalCartPrice;
    } else {
      console.log("coupen id not found");
    }

    let productsArray = [];
    for (let item of cart.Product) {
      const product = await ProductColl.findById(item.item);
      product.Stock -= item.quantity;
      await product.save();

      productsArray.push({
        productId: product._id,
        name: product.Productname, // Assuming `Name` is the field for product name
        price:product.RegularPrice,
        discountAmount:item.discountValue*item.quantity,
        discountPrice:product.SalePrice?product.RegularPrice-product.SalePrice : product.RegularPrice, // Use SalePrice if available, otherwise RegularPrice
        quantity: item.quantity,
        total: (product.SalePrice || product.RegularPrice) * item.quantity, // Calculate total for this item
      });
    }
    if (paymentMethod === "Cash on Delivery") {
      const order = new OrderColl({
        orderedUser: user._id,
        orderStatus: "Pending", // Set default order status
        products: productsArray, // Attach the built products array
        date: new Date(),
        coupenDiscount: discountAmount, 
        grandTotal: totalCartPrice-discountAmount , // Calculate grand total
        shippingAddress: userAddress[0], // Shipping address
        paymentDetails: {
          paymentMethod: paymentMethod,
        },
        cartId: cart._id,
        deliveryDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Example: 7-day delivery
      });
      await order.save();

      const TotalPrice = totalCartPrice - discountAmount;
      // Add the coupon to the user's used list
      user.UsedCoupons.push(couponCode);
      await user.save();
      console.log("order saved successfully");
      await cartColl.findByIdAndDelete(cartId);

      return res
        .status(200)
        .json({ CODsuccess: true, cartId: cart._id, TotalPrice });

      // return res.status(200).json({ success: true, TotalPrice: totalCartPrice - cart.discountPrice });
    } else if (paymentMethod === "Online") {
      const razorpayOrder = await razorpayInstance.orders.create({
        // amount: totalCartPrice  * 100,
        amount: (totalCartPrice - cart.discountPrice) * 100,

        currency: "INR",
      });
      console.log("raozorpay order" + razorpayOrder);
      if (!razorpayOrder) {
        return res.render("user/error", {
          res,
          errorCode: 400,
          errorMessage: "Online payment issue",
          errorDescription: "error in confirm order section at else if case",
          link: "/checkout",
        });
      }
      console.log("online order created");

      return res.status(200).json({
        OnlinePayment: true,
        razorpayOrderId: razorpayOrder.id,
        amount: totalCartPrice - cart.discountPrice,
        // amount: totalCartPrice ,
        razor_key_id: process.env.RAZORPAY_KEY_ID,
        addressId,
        cartId,
        couponId,
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment method" });
    }
  } catch (error) {
    console.error("Error during order confirmation:", error);
    return res
      .status(500)
      .json({ success: false, message: "Order confirmation failed." });
  }
};

// ORDER CONFIRMED
const orderConfirmed = async (req, res) => {
  try {
    console.log("reached order confirmed=");
    const user = await User.findById(req.session.user_id);
    const { cartId } = req.params;
    const { totalPrice } = req.query;
    const sessionName = user;
    if (!user) {
      // return renderErrorPage(res, 404, "User not found", "User needs to log in.", req.headers.referer || '/');
      const message = "user not found";
      return res.status(401).send(message);
    }

    const order = await OrderColl.findOne({ cartId });
    console.log("orderconfiremed -oreder" + order);

    if (!order || order.length === 0) {
      // return renderErrorPage(res, 404, "Order not found", "Check the order page ,Please Check all details", req.headers.referer || '/');
      const message = "Order not found";
      return res.status(401).send(message);
    }

    res.render("user/orderConfirm", {
      title: "Order Confirmed",
      user,
      order,
      totalPrice,
      sessionName,
    });
  } catch (error) {
    console.error("Error during order confirmated bill:", error);
    // return renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred. Please try again later.", '/')
    res.status(500).json({ success: false, message: "Order confirm failed." });
  }
};

// LOAD ORDER PAGE
const LoadOrderPage = async (req, res) => {
  try {
    // const { page = 1, limit = 3 } = req.query;
    const currentPage=parseInt(req.query.page)  || 1
    const limit= 2
    const skip=(currentPage-1)*limit
    const user = await User.findById(req.session.user_id);
    const sessionName = user;
    if (!user) {
      // return renderErrorPage(res, 404, 'User Not Found', 'The user associated with the session was not found.', '/back-to-home');
      return res.status(404).json("user not found");
    }

    // const ordersDetailList = await OrderColl.aggregate([
    //     { $match: { userId: user._id } },

    //     {
    //         $lookup: {
    //             from: "products",
    //             localField: "productId",
    //             foreignField: "_id",
    //             as: "productDetails"
    //         }
    //     },

    // ]);

    const userOrders = await OrderColl.find({ orderedUser: user }).sort({
      date: -1,
    }).skip(skip).limit(limit);

    const totalOrder = await OrderColl.countDocuments({ orderedUser: user });
    console.log('total order',totalOrder)
    const totalPages = Math.ceil(totalOrder / limit);


    if (!userOrders.length) {
      //return renderErrorPage(res, 404, 'No Orders Found', 'This user has no orders to display.', '/back-to-home');
      return res.render("user/orderMngtPage", {
        title: "My Orders",
        user,
        orders: [],
        sessionName,
        currentPage : currentPage,
        totalPages : totalPages
      });
    }

    // const sortedOrdersDetailList = ordersDetailList.sort((a, b) => {
    //     const dateA = a.createdAt ? new Date(a.createdAt) : a._id.getTimestamp();
    //     const dateB = b.createdAt ? new Date(b.createdAt) : b._id.getTimestamp();
    //     return dateB - dateA;
    // });
    // const totalOrder = sortedOrdersDetailList.length;
    // const totalPages = Math.ceil(totalOrder / limit);
    // const currentPage = Math.max(1, Math.min(page, totalPages));
    // const paginatedOrder = sortedOrdersDetailList.slice((currentPage - 1) * limit, currentPage * limit);

    res.render("user/orderMngtPage", {
      title: "Order List",
      user,
      orders: userOrders,
      sessionName,
      currentPage,
      totalPages,
    });
  } catch (error) {
    console.error("Error loading orders: ", error.message);

    // renderErrorPage(res, 500, 'Internal Server Error', 'An error occurred while loading the orders.', '/back-to-home'O());
    res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred load order page.",
      link: req.headers.referer || "/",
    });
  }
};

// CANCEL OREDER SESSION
const cancelOrder = async (req, res) => {
  try {
    const user = req.session.user_id;
    const orderId = req.params.orderId;
    const order = await OrderColl.findOne(new mongoose.Types.ObjectId(orderId));
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }
    console.log("userorder==" + order);

    if (order.orderStatus === "Cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Item is already cancelled." });
    }

    const updateOrder = await OrderColl.findByIdAndUpdate(
      { _id: new mongoose.Types.ObjectId(orderId) },
      { $set: { orderStatus: "Cancelled", cancellationDate: new Date() } },
      { new: true }
    );

    if (!updateOrder) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to cancel order." });
    }

    for (const product of order.products) {
      const updatePorductResult = await ProductColl.updateOne(
        { _id: product.productId },
        { $inc: { Stock: product.quantity } }
      );
      console.log(updatePorductResult.modifiedCount);
      // console.log("Product quantity update result:", updatePorductResult);

      //managing wallet
      if (order.paymentDetails.status === "Paid") {
        const refundAmount = order.grandTotal;
        const walletDoc = await WalletColl.findOne({
          userId: order.orderedUser,
        });
        if (!walletDoc) {
          const walletDoc = new WalletColl({
            userId: order.orderedUser,
            balance: refundAmount,
            transactions: [
              {
                type: "credit",
                amount: refundAmount,
                description: `Refund for cancelled order ${order._id}`,
              },
            ],
          });
          await walletDoc.save();
        } else {
          walletDoc.balance += refundAmount;
          walletDoc.transactions.push({
            type: "credit",
            amount: refundAmount,
            description: `Refund for cancelled order ${order._id}`,
          });
          await walletDoc.save();
        }

        await OrderColl.updateOne(
          { _id: orderId },
          {
            $set: {
              " orderStatus": "Refunded",
              "paymentDetails.refundAmount": refundAmount,
              "paymentDetails.refundStatus": "Full",
            },
          }
        );
      }else if(order.paymentDetails.status === "Pending"){
          await OrderColl.updateOne(
            { _id: orderId },
            {
              $set: {
                'paymentDetails.status':'Cancelled'
              },
            }
          );
        }else if(order.paymentDetails.status === "Refunded"){
      }
    }

    return res
      .status(200)
      .json({ success: true, message: "Order cancelled !" });
  } catch (error) {
    console.error("Errorin canceling order session: ", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to cancel order session." });
  }
};

// RETURN ORDER
const returnOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const user_id = req.session.user_id;
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(401).json({success:false, message:"User not found"});
    }
    const order = await OrderColl.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.orderStatus === "Returned" || order.orderStatus === "Return Request") {
      return res.status(400).json({ success: false, message: "Order is already returned" });
    }
    if (order.paymentDetails.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "Order is cancelled" });
    }

    const updateResult= await OrderColl.updateOne(
      {_id: order._id},
      {$set:{'orderStatus' : 'Return Request'}}
    )
    if (updateResult.modifiedCount === 0) {
      console.log("Failed to return order");
      return res.status(500).json({ success: false, message: "Failed to return order" });
    }
    for(let product of order.products){
      const updateProductResult = await ProductColl.updateOne(
        { _id: product.productId },
        { $inc: { Stock: product.quantity } }
      );
      console.log("Product quantity update result:", updateProductResult);
    }
    return res.status(200).json({ success: true, message: "Order returned successfully" });


  } catch (error) {
    console.error("Error in order Return Request:", error);
    
    if (error.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid Order or Item ID.' });
    }

    return res.status(500).json({ success: false, message: 'An internal server error occurred while Return Request the order.' });
  }
  
}

// ONLINE PAYMENT
const onlinePayment = async function (req, res) {
  try {
    const user_id = req.session.user_id;
    const user = await User.findOne({ _id: user_id });
    const { razorpayOrderId, paymentId, cartId, addressId, couponId } =
      req.query;

    if (!razorpayOrderId || !paymentId) {
      console.log("razorpayorder id or payment id not provided");
      return res.render("user/error", {
        res,
        errorCode: 400,
        errorMessage: "missing razorpayorder id or paymentid",
        errorDescription:
          "missing razorpayorder id or paymentid please try again later",
        link: req.headers.referer || "/",
      });
    }
    console.log("cart id ===" + cartId);
    let cart = await cartColl.findOne({ _id: cartId });
    if (!cart) {
      console.log("cart not found");
      return res.render("user/error", {
        res,
        errorCode: 404,
        errorMessage: "cart not found",
        errorDescription: "cart not found please try again later",
        link: req.headers.referer || "/",
      });
    }
    if (!cart.Product.length) {
      return res.render("user/error", {
        res,
        errorCode: 404,
        errorMessage: "your cart is empty",
        errorDescription: "your cart is empty please try again late",
        link: "/",
      });
    }
    const addressObjectId = new mongoose.Types.ObjectId(addressId);
    console.log("user id " + user._id);
    const userAddress = await AddressColl.aggregate([
      { $match: { UserId: user._id } },
      { $unwind: "$Address" },
      { $match: { "Address._id": new mongoose.Types.ObjectId(addressId) } },
      { $replaceRoot: { newRoot: "$Address" } },
    ]);

    if (!userAddress.length) {
      console.log("shipping address not found" + addressObjectId);
      return res.render("user/error", {
        res,
        errorCode: 400,
        errorMessage: "shipping address not found",
        errorDescription:
          "shipping address could not be found please try again",
        link: "/",
      });
    }

    let discountAmount = 0;
    let couponCode;
    if (couponId) {
      const coupon = await CoupenColl.findById(couponId);
      if (!coupon) {
        console.log("Coupon not found in confirmOrder");
        return res.status(400).json({
          success: false,
          message: "Coupon not found.",
        });
      }
      if (coupon.expiryDate < new Date()) {
        console.log("Coupon has expired in confirmOrder");
        return res.status(400).json({
          success: false,
          message: "Coupon has expired",
        });
      }
      if (coupon.MinimumPrice < cart.totalCartPrice) {
        if (coupon.DiscountType == "Amount") {
          discountAmount = coupon.DiscountPrice;
          couponCode = coupon.CoupenCode;
        }
      } else {
        console.log(coupon.MinimumPrice, cart.totalCartPrice);
        console.log("Coupon can't be applied on this amount in confirmOrder");
        return res.status(400).json({
          success: false,
          message: "Coupon can't be applied on this amount.",
        });
      }

      // discountAmount = (coupon.discountPercentage / 100) * totalCartPrice;
    } else {
      console.log("coupen id not found");
    }

    let productsArray = [];
    for (let item of cart.Product) {
      const product = await ProductColl.findById(item.item);

      productsArray.push({
        productId: product._id,
        name: product.Productname, // Assuming `Name` is the field for product name
        price:product.RegularPrice,
        discountAmount:item.discountValue*item.quantity || 0,
        // discountPrice:product.SalePrice?product.RegularPrice-item.discountValue: product.RegularPrice,
        quantity: item.quantity,
        total: (product.SalePrice || product.RegularPrice) * item.quantity, // Calculate total for this item
      });
    }

    const order = new OrderColl({
      orderedUser: user_id,
      orderStatus: "Confirmed", // Set default order status
      products: productsArray, // Attach the built products array
      date: new Date(),
      coupenDiscount: discountAmount?discountAmount : 0, // Total discount applied
      grandTotal: cart.totalCartPrice - discountAmount, // Calculate grand total
      shippingAddress: userAddress[0], // Shipping address
      paymentDetails: {
        paymentMethod: "Online Payment",
        status: "Paid",
      },
      cartId: cart._id,
      deliveryDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Example: 7-day delivery
    });
    await order.save();
    const TotalPrice = cart.totalCartPrice - discountAmount;
    await cartColl.findByIdAndDelete(cartId);
    user.UsedCoupons.push(couponCode);
    await user.save();
    console.log("order saved successfully");

    return res.redirect(`/orderconfirm/${cart._id}?totalPrice=${TotalPrice}`);
  } catch (e) {
    console.error("Error processing payment: ", e.message);
    return res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "error processing payment",
      errorDescription: "error processing payment please try again",
      link: "/",
    });
  }
};

// restoreProductQuantities
const restoreProductQuantities = async function (req, res) {
  try {
    const { cartId } = req.query;
    const cart = await cartColl.findById(cartId);
    if (!cart) {
      console.log("cart not found");
      return res.status(404).json({
        success: false,
        message: "cart not found",
      });
    }
    for (let item of cart.Product) {
      const product = await ProductColl.findById(item.item);
      if (product) {
        product.Stock += item.quantity;
      }
      await product.save();
    }

    res.json({
      success: true,
      message: "Product quantities restored successfully",
    });
  } catch (error) {
    console.log("error in restoring product quantity");
    res
      .status(500)
      .json({
        success: false,
        message: "Error in restoring product quantities",
      });
  }
};

// WALLET SESSION
const walletget = async function (req, res) {
  try {
    const user_id = req.session.user_id;
    const sessionName = user_id;
    const user = await User.findById(user_id);
    if (!user) {
      console.log("user not found");
      return res.render("user/error", {
        res,
        errorCode: 404,
        errorMessageessage: "User not found",
        errorDescription: "User not found please login",
        link: "/",
      });
    }
    const wallet = await WalletColl.findOne({ userId: user_id });
    res.render("user/wallet", { wallet: wallet, sessionName });
  } catch (error) {
    console.log("error in getting wallet");
    const backLink = req.headers.referer || "/";
    return res.render("user/error", {
      res,
      errorCode: 500,
      errorMessage: "Internal Server Error",
      errorDescription:
        "An unexpected error occurred while loading your wallet. Please try again later",
      link: backLink,
    });
  }
};
//logout session
const logout = function (req, res, next) {
  req.session.user_id = null;
  setTimeout(() => {
    res.redirect("/");
  }, 1000);
};

module.exports = {
  loginpage,
  loginvalidation,
  usersignupval,
  verifySignupOTP,
  resentSignupOtp,
  forgotPasswordget,
  forgotPasswordpost,
  forget_otpverify,
  frgtchangePasswordget,
  frgtchangePasswordpost,
  homepage,
  signup,
  contactpage,
  testimonialpage,
  whyus,
  categoryget,
  search,
  shop,
  logout,
  otplogin,
  otpverification,
  verifyotp,
  productDetailsget,
  userCart,
  addtoCart,
  updateCart,
  deleteCart,
  checkoutget,
  confirmOrder,
  orderConfirmed,
  LoadOrderPage,
  cancelOrder,
  returnOrder,
  onlinePayment,
  restoreProductQuantities,
  wishListget,
  wishListPost,
  wishDelete,
  userProfile,
  editProfile,
  updateProfile,
  editPasswordget,
  editPasswordPost,
  userAddressget,
  addAddressget,
  addAddresspost,
  deleteAddress,
  editAddressget,
  editAddresspost,
  coupenApply,
  walletget,
};
