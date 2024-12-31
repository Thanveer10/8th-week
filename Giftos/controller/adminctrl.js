const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { Admin } = require("../model/adminModel");
const Users = require("../model/userModel");
const Products = require("../model/productModel");
const Categorycoll = require("../model/categoryModel");
const Ordercoll = require("../model/orderModel");
const CoupenColl = require("../model/coupenModel");
const { render } = require("ejs");
const mongoose = require("mongoose");


let coupenAdded;
let coupenAddedError;

//Admin data
const createAdmin = async () => {
  const hashedPassword = await bcrypt.hash("10101010", 10);
  const adminDatabase = {
    Username: "admin",
    Email: "admin@gmail.com",
    Password: hashedPassword,
    Mobile: "8590847332",
    isAdmin: true,
  };
  //for existing user
  const existingAdmin = await Admin.findOne({
    $or: [{ Email: adminDatabase.Email }, { Mobile: adminDatabase.Mobile }],
  });

  if (!existingAdmin) {
    await new Admin(adminDatabase).save();
    console.log("admin saved");
  } else {
    console.log("alredy have admin");
  }
};

createAdmin();

const adminLogin = function (req, res) {
  const admin = req.session.admin_id;
  try {
    if (admin) {
      return res.redirect("/admin/adminHome");
    } else {
      let message = req.session.message;
      req.session.message = null;
      res.render("admin/adminLogin", { message });
    }
  } catch (err) {
    console.log("adminLoginError");
    res.render("admin/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred while admin login.",
      link: req.headers.referer || "/admin",
    });
  }
};

//admin login validation
const adminLoginValidation = async function (req, res, next) {
  const adminvalidation = {
    Email: req.body.Email,
    Password: req.body.Password,
  };
  console.log(
    "=========== " + adminvalidation.Password + "====" + adminvalidation.Email
  );

  try {
    let adminvalidate = await Admin.findOne({ Email: adminvalidation.Email });
    console.log("admin" + adminvalidate);

    if (adminvalidate && adminvalidate.isAdmin) {
      const password = await bcrypt.compare(
        adminvalidation.Password,
        adminvalidate.Password
      );
      if (password) {
        console.log(" i am admin");
        req.session.admin_id = adminvalidate._id;
        return res.redirect("/admin/adminhome");
      } else {
        req.session.message = "Incorrect email or password";
        console.log("not admin");
        return res.redirect("/admin");
      }
    } else {
      req.session.message = "Incorrect email or password";
      console.log("not admin");
      return res.redirect("/admin");
    }
  } catch (err) {
    console.log("somthing is wrong in adminLoginValidation " + err.message);
    res.render("admin/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred while login validation",
      link: req.headers.referer || "/admin",
    });
  }
};

//dashboard
const dashBoard = async function (req, res) {
  try {
    let sessionName = req.session.admin_id;
    if (sessionName) {
      // const users=await Users.find({})
      let latesOrders = await Ordercoll.find({}).sort({ date: -1 }).limit(5);
      let latestMembers = await Users.find({}).sort({ CreatedAt: -1 }).limit(5);
      console.log(latesOrders);
      console.log("latest mambers ========= " + latestMembers);
      res.render("admin/adminHome", {
        sessionName,
        latestMembers,
        latesOrders,
      });
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log("error in admin dashboard", error.message);
    res.render("admin/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred while loading dashboard",
      link: req.headers.referer || "/admin",
    });
  }
};

//admin  get product list
const productList = async function (req, res) {
  sessionName = req.session.admin_id;
  const currentPage = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (currentPage - 1) * limit;

  const products = await Products.find({})
    .populate("Category")
    .sort({ CreatedAt: -1 })
    .skip(skip)
    .limit(limit);
  const totalProducts = await Products.countDocuments();
  const totalPages = Math.ceil(totalProducts / limit);
  if (sessionName) {
    res.render("admin/productList", {
      sessionName,
      products,
      totalPages,
      currentPage: currentPage,
    });
  } else {
    res.redirect("/admin/");
  }
};

//delete product
const deleteProduct = async function (req, res) {
  console.log("reached delete product");
  const productid = req.params.id;
  await Products.deleteOne({ _id: productid });
  console.log("reached delete product");
  res.redirect("/admin/productList");
};

//user list
const userListget = async function (req, res) {
  const sessionName = req.session.admin_id;
  const currentPage = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (currentPage - 1) * limit;

  const allUsers = await Users.find({})
    .sort({ CreatedAt: -1 })
    .skip(skip)
    .limit(limit);
  const totalUsers = await Users.countDocuments();
  const totalPages = Math.ceil(totalUsers / limit);
  if (sessionName) {
    res.render("admin/userList", {
      sessionName,
      allUsers,
      totalPages,
      currentPage,
    });
  } else {
    res.redirect("/admin/");
  }
};

const blockUser = async function (req, res) {
  const user_id = req.params.id;
  const user = await Users.updateOne(
    { _id: user_id },
    { $set: { Status: false } }
  );

  console.log(user);
  res.redirect("/admin/userlist");
};

const unblockUser = async function (req, res) {
  const user_id = req.params.id;
  const user = await Users.updateOne(
    { _id: user_id },
    { $set: { Status: true } }
  );
  console.log(user);
  res.redirect("/admin/userlist");
};

const deleteOne = async function (req, res) {
  const user_id = req.params.id;
  const user = await Users.deleteOne({ _id: user_id });
  res.redirect("/admin/userlist");
};

//order list
const orderListget = async function (req, res) {
  try {
    const sessionName = req.session.admin_id;
    if (!sessionName) {
      return res.redirect("/admin/");
    }
    let message;
    let allOrders = await Ordercoll.find({}).populate("orderedUser").sort({date:-1});
    if (allOrders && allOrders.length < 1) {
      message = "NO orders";
    }
    if (sessionName) {
      res.render("admin/orderList", { sessionName, allOrders, message });
    } else {
      return res.redirect("/admin/");
    }
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

//  update order Status
const updateOrderStatus = async function (req, res) {
  try {
    const order_id = req.params.orderId;
    const status = req.body.status;

    // Validate the status
    const validStatuses = [
      "Pending",
      "Confirmed",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    let currentOrderStatus = await Ordercoll.findById(order_id);
    console.log(currentOrderStatus.Status);
    if (currentOrderStatus.orderStatus == "Delivered") {
      return res
        .status(400)
        .json({ error: "Cannot update delivered order status" });
    }

    let order = await Ordercoll.findByIdAndUpdate(
      order_id,
      { $set: { orderStatus: status } },
      { new: true }
    );
    console.log(order);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Status updated successfully" });
  } catch (error) {
    console.log("error in admin side update order status", error.message);
    res.status(500).send("Internal Server Error");
  }
};

//coupen list and management
const coupenListget = async function (req, res) {
  const sessionName = req.session.admin_id;
  let allCoupens = await CoupenColl.find({});
  let successMessage =coupenAdded;
  let errorMessage = coupenAddedError;
  coupenAdded=null;
  coupenAdded=null;
  if (sessionName) {
    console.log(coupenAdded, coupenAdded,successMessage);
    res.render("admin/coupenList", { sessionName, allCoupens,success:successMessage,error:errorMessage });
  } else {
    return res.redirect("/admin/");
  }
};

const coupenListpost = async function (req, res) {
  try{
  let coupen = req.body;
  console.log(coupen + "========================" + req.body);

  coupen.Status = true; 
  await CoupenColl.insertMany([coupen]);
  coupenAdded='Coupen added successfully'
  res.redirect("/admin/coupenadmin");
  } catch(error) {
    console.log("error in admin side coupenListpost", error.message);
    coupenAddedError='Failed to add coupen'
    res.redirect("/admin/coupenadmin");
  }
};

const coupenEditget= async function (req, res) {
  const sessionName = req.session.admin_id;
  const coupenId=req.params.id
  const editCoupen = await CoupenColl.findOne({_id:coupenId})
  if(sessionName) {
    res.render("admin/coupenEdit",{Coupen:editCoupen,sessionName:sessionName})
  }else{
    return res.redirect("/admin/");
  }
}

const updateCoupen= async function (req,res)
{
  try {
    const coupenId=new mongoose.Types.ObjectId(req.body.coupenId) 
    const selectedCoupen = await CoupenColl.findOne({_id:coupenId})
    console.log(selectedCoupen)
    console.log(req.body)
    if(selectedCoupen){
      const updatedCoupen = await CoupenColl.updateOne(
        {_id: coupenId},
        {
        $set:{
          CoupenCode: req.body.coupenCode,
          DiscountPrice:req.body.discountPrice,
          CreateDate: req.body.createDate,
          MinimumPrice: req.body.minimumPrice,
          ExpireDate: req.body.expireDate,
          DiscountType: req.body.discountType
        }
      }
      
    );
    console.log(updatedCoupen)
      if(updatedCoupen.matchedCount===0){
        res.status(500).send('copen update failed')
        console.log('failed' + updatedCoupen.matchedCount)
      }else{
        res.send('coupen upadated successfully')
      }
    }
  } catch (error) {
    console.log(error.message)
    res.render('admin/error', {res,errorCode:500,errorMessage:'an error occurred',errorDescription:'somthing wrong while updating coupen',link:'/admin/coupenadmin'})
  }

}

const coupenDelete= async function(req, res){
  try{
    const coupenId=req.params.id
    const selectedCoupen=await CoupenColl.deleteOne({_id: coupenId})
  return res.status(200).send('coupen deleted successfully')
  } catch (error) {
    console.log(error.message)
    res.status(500).send('error occurred while deleting coupen')
  }
}
const ordeviewget = async function (req, res) {
  try {
    console.log("reached admin ordeview");
    const orderId = req.params.id;
    const admin = req.session.admin_id;
    const sessionName = admin;
    if (admin) {
      let order = await Ordercoll.findById(orderId).populate("orderedUser");
      if (order) {
        res.render("admin/orderView", { order, sessionName });
      } else {
        res.send("order not found");
      }
    } else {
      return res.redirect("/admin/");
    }
  } catch (error) {
    console.log("error in admin orverview", error.message);
    res.render("user/error", { error });
  }
};

//sales report
const salesReportget = function (req, res) {};

const adminLogout = async function (req, res) {
  console.log("reached admin logout");
  req.session.admin_id = null;
  setTimeout(() => {
    res.redirect("/admin");
  }, 1000);
};

module.exports = {
  adminLogin,
  adminLoginValidation,
  dashBoard,
  adminLogout,
  productList,
  deleteProduct,
  userListget,
  blockUser,
  unblockUser,
  deleteOne,
  orderListget,
  updateOrderStatus,
  ordeviewget,
  salesReportget,
  coupenListget,
  coupenListpost,
  coupenEditget,
  updateCoupen,
  coupenDelete
};
