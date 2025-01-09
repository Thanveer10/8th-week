const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { Admin } = require("../model/adminModel");
const Users = require("../model/userModel");
const Products = require("../model/productModel");
const CategoryColl = require("../model/categoryModel");
const OrderColl = require("../model/orderModel");
const CoupenColl = require("../model/coupenModel");
const OfferColl = require("../model/offerModel");
const moment = require('moment');
const { render } = require("ejs");
const mongoose = require("mongoose");
const PDFDocument = require('pdfkit')
const ExcelJS= require('exceljs');
const { format } = require("morgan");


let coupenAdded;
let coupenAddedError;
// calculating the offer price 
function salePrice(product){
  const reqularPrice= product.RegularPrice;
  let offeredPrice;
  for (offer of product.AppliedOffers){
    if(offer.discountType === 'amount'){
      offeredPrice = reqularPrice - offer.discountValue;
    }
    else if(offer.discountType === 'percentage'){
      offeredPrice = reqularPrice - (reqularPrice * offer.discountValue / 100);
      offeredPrice=Math.floor(offeredPrice)
    }
  }
return offeredPrice;
}

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
      let orderCount= await OrderColl.countDocuments();
      let totalRevenue = await OrderColl.aggregate([{$unwind:"$products"},
        { $group: { _id: null, totalRevenue: { $sum: "$TotalPrice" } } },
      ]);
      let latesOrders = await OrderColl.find({}).sort({ date: -1 }).limit(5);
      let latestMembers = await Users.find({}).sort({ CreatedAt: -1 }).limit(5);
      console.log(latesOrders);
      console.log("latest mambers ========= " + latestMembers);
      console.log("orderCount =", orderCount);
      res.render("admin/adminHome", {
        sessionName,
        latestMembers,
        latesOrders,
        orderCount
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

// geting sale data for admin dashboard cart
const salesDataget= async (req, res, next) => {
  try{
  const filter = req.query.filter 
  console.log('sales fileter', filter)
  let startDate = new Date()
  let endDate = new Date()
  let format ;
  switch (filter) {
    case "yearly":
     startDate = new Date(startDate.getFullYear(),0,1);
     format="%Y"
     break;
    case "monthly":
     startDate = new Date(startDate.getFullYear(),startDate.getMonth(),1);
     format="%Y-%m"
     break;
    case "weekly": 
      dayofweek = startDate.getDay()
      startDate.setDate(startDate.getDate()- dayofweek);
      startDate.setHours(0,0,0,0)
      format = "%Y-%U";
      break;
    default:
      startDate = new Date(startDate.getFullYear(),0,1);
      format="%Y"
  }
  endDate.setHours(23,59,59,999)
  console.log('start date===', startDate, '==end date===', endDate)

  let salesData= await OrderColl.aggregate([
    {$match:
      {deliveryDate: { $gte: new Date(startDate), $lt: new Date(endDate) }
      }
    },
    {$unwind:'$products'},
    {$group:{
      _id: { $dateToString: { format: format, date:'$deliveryDate' } },
      totalSales:{$sum:'$grandTotal'},
      totalDicount:{$sum:'$products.discountAmount'},
      orderCount: {$sum: 1}, 
      }
    },
 ])
 console.log('saledata======',salesData)

 res.json(salesData)
}catch(e) {
  console.error(e);
  res.status(500).json({message: `error fetching sales data ${e.message}`});
}
}

const topProducts = async (req, res) => {
  try {
      const topProducts = await OrderColl.aggregate([
          { $unwind: "$products" },
          {
              $group: {
                  _id: "$products.productId",
                  totalSales: { $sum: "$products.quantity" }
              }
          },
          {
            $lookup: {
              from: "productdatas", // Join with the products collection
              localField: "_id",
              foreignField: "_id",
              as: "productDetails"
            }
          },
          { $unwind: "$productDetails" },
          { $sort: { totalSales: -1 } },
          { $limit: 10 }
      ]);
      console.log('topProducts===', topProducts);
      console.log(topProducts[0].productDetails)
      res.json(topProducts);
          } catch (error) {
              console.error('error getting top products:',error);
              res.status(500).json({ message: "Error fetching top products", error });
  }
};

const categoryChartget = async (req, res) => {
  try {
    const topCategories = await OrderColl.aggregate([
      { $unwind: "$products" },
      {
        $lookup: {
          from: "productdatas", // Join with the products collection
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },

      {
        $lookup: {
          from: "categories", // Join with the categories collection
          localField: "productDetails.Category", // Match the category ID
          foreignField: "_id", // ID in the categories collection
          as: "categoryDetails"
        }
      },
      { $unwind: "$categoryDetails" },
      {
        $group: {
          _id: "$categoryDetails.Category", // Group by category
          totalSales: { $sum: "$products.quantity" },
          // totalRevenue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);
  console.log('topCategories', topCategories)

    res.json(topCategories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching top categories" });
  }
}


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
    const currentPage = req.query.page || 1;
    const limit = 5;
    const skip = (currentPage - 1) * limit;
    const sessionName = req.session.admin_id;
    if (!sessionName) {
      return res.redirect("/admin/");
    }
    let message;
    let allOrders = await OrderColl.find({}).populate("orderedUser").sort({date:-1}).skip(skip).limit(limit);
    if (allOrders && allOrders.length < 1) {
      message = "NO orders";
    }
    const totalOrders = await OrderColl.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);

    if (sessionName) {
      res.render("admin/orderList", { sessionName, allOrders, message,totalPages,currentPage });
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
    let currentOrderStatus = await OrderColl.findById(order_id);
    console.log(currentOrderStatus.Status);
    if (currentOrderStatus.orderStatus == "Delivered") {
      return res
        .status(400)
        .json({ error: "Cannot update delivered order status" });
    }

    let order = await OrderColl.findByIdAndUpdate(
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
    console.log(req.body, req.body.coupenStatus)
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
          DiscountType: req.body.discountType,
          Status: req.body.coupenStatus
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
      let order = await OrderColl.findById(orderId).populate("orderedUser");
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

// OFFER SESSIONS
const offerListget= async function (req, res) {
  try {
    const currentPage = req.query.page || 1 
    const limit = 10;
    const skip = (currentPage - 1) * limit;

    const sessionName = req.session.admin_id;
  const offers = await OfferColl.find({}) .populate({ path: 'product', select: 'Productname ' }).populate({ path: 'category', select: 'Category' }).skip(skip).limit(limit)
  const categories = await CategoryColl.find({Status:'Listed'})
  const products= await Products.find({Status:'Available'})
  const totalOffer = await OfferColl.countDocuments()
  const totalPages = Math.ceil(totalOffer / limit);
  if (sessionName) {
    res.render("admin/offerList", { sessionName, offers,categories,products,totalPages,currentPage});
  } else {
    return res.redirect("/admin/");
  }
  } catch (error) {
    console.log('error in offerlistget ' + error.message)
    res.render("admin/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred while loading dashboard",
      link: req.headers.referer || "/admin",
    });
  }
  
}

const addOffer= async function (req, res) {
 try {
  const { type, title, discountType, discountValue, details, category, product } = req.body;
  console.log('req.body====' + type, title, discountType, discountValue, details, category, product )
  // const image = req.file ? req.file.filename : null;

  if (!type || !title || !discountType || !discountValue || isNaN(discountValue) || discountValue <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid input. Please check all required fields.' });
  }

   if (type === 'Referral') {
      const existingReferralOffer = await OfferColl.findOne({ type: 'Referral' , isActive :true });

      if (existingReferralOffer) {
          return res.status(400).json({ success: false, message: 'Referral offer already exists.' });
      }
  }
  const newOffer = new OfferColl({
      type,
      title,
      discountType,
      discountValue,
      details,
      category: type === 'Category' ? category : undefined,
      product: type === 'Product' ? product : undefined,
  });

  await newOffer.save();

  if(newOffer.type === 'Category') {
     const products= await Products.find({Category: newOffer.category})
     for(const product of products) {
      product.AppliedOffers.push({
        offerId: newOffer._id,
        discountValue: newOffer.discountValue,
        discountType: newOffer.discountType
    });

      product.SalePrice= salePrice(product)
      await product.save()
     }
  }else if(newOffer.type === 'Product'){
    const product= await Products.findById(newOffer.product)
    if(product){
      product.AppliedOffers.push({
        offerId: newOffer._id,
        discountValue: newOffer.discountValue,
        discountType: newOffer.discountType
    });

      product.SalePrice= salePrice(product)
      await product.save()
    }
  }
  res.status(200).json({ success: true, message: 'Offer added successfully' });
 } catch (error) {
  console.log('error in addoffer admin' + error.message)
  res.status(500).json({ success: false, message: 'Server error: ' + error.message });
}
}

const offerEditget= async function (req, res) {
  try {
    const sessionName = req.session.admin_id;
    const offerId = req.params.id;
    const offer = await OfferColl.findById(offerId)
    const products= await Products.find({Status:'Available'})
    const categories =  await CategoryColl.find({Status:'Listed'})
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }
    res.render('admin/offerEdit', { offer ,sessionName,products,categories});
  } catch (error) {
    console.log('error in offereditget' + error.message)
    res.render("admin/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred while loading edit page",
      link: req.headers.referer || "/admin/offers",
    });
  }
}
const updateOffer = async function (req, res) {
  try {
    const { type, discountValue, discountType, category, product: productId } = req.body;
    console.log('req.body', { type, discountValue, discountType, category, productId });
    const offerId = req.query.offerId;
    console.log('offerId', offerId);

    // Find the existing offer
    const existingOffer = await OfferColl.findById(offerId);
    if (!existingOffer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Step 1: Remove the effects of the old offer
    console.log('Removing the effects of the old offer');
    if (existingOffer.type === 'Category') {
      const products = await Products.find({ Category: existingOffer.category });
      for (const prod of products) {
        // Remove the offer from AppliedOffers
        prod.AppliedOffers = prod.AppliedOffers.filter(offer => offer.offerId.toString() !== offerId);

        // Recalculate SalePrice
        prod.SalePrice = salePrice(prod);
        await prod.save();
      }
      console.log('Removed category offer');
    } else if (existingOffer.type === 'Product') {
      let product = await Products.findById(existingOffer.product);
      if (product) {
        // Remove the offer from AppliedOffers
        product.AppliedOffers = product.AppliedOffers.filter(offer => offer.offerId.toString() !== offerId);

        // Recalculate SalePrice
        product.SalePrice = salePrice(product);
        await product.save();
        console.log('Removed product offer');
      } else {
        console.log('Product not found');
      }
    }

    // Step 2: Update the offer with new details
    existingOffer.type = type;
    existingOffer.discountValue = discountValue;
    existingOffer.discountType = discountType;
    existingOffer.category = category || null;
    existingOffer.product = productId || null;
    await existingOffer.save();

    // Step 3: Apply the updated offer
    console.log('Applying updated offer');
    if (type === 'Category') {
      const products = await Products.find({ Category: category });
      for (const prod of products) {
        prod.AppliedOffers.push({
          offerId: existingOffer._id,
          discountValue: discountValue,
          discountType: discountType,
        });

        prod.SalePrice = salePrice(prod);
        await prod.save();
      }
    } else if (type === 'Product') {
      console.log('Product details', productId);
      let product = await Products.findById(productId);
      if (product) {
        console.log('Product', product);
        product.AppliedOffers.push({
          offerId: existingOffer._id,
          discountValue: discountValue,
          discountType: discountType,
        });

        product.SalePrice = salePrice(product);
        await product.save();
      } else {
        console.log('Product not found');
      }
    }

    res.status(200).json({ success: true, message: 'Offer Updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};



const activateOffer= async function (req,res){
  try {
    const offerId = req.params.id
    const offer = await OfferColl.findByIdAndUpdate(offerId, { isActive: true }, { new: true });
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }
    if(offer.type === 'Category') {
      const products= await Products.find({Category: offer.category})
      for(const product of products) {
       product.AppliedOffers.push({
         offerId: offer._id,
         discountValue: offer.discountValue,
         discountType: offer.discountType
     });
  
       product.SalePrice= salePrice(product)
       await product.save()
      }
   }else if(offer.type === 'Product'){
     const product= await Products.findById(offer.product)
     if(product){
       product.AppliedOffers.push({
         offerId: offer._id,
         discountValue: offer.discountValue,
         discountType: offer.discountType
     });
  
       product.SalePrice= salePrice(product)
       await product.save()
     }else{
      console.log("Product not found")
      res.redirect('/admin/offers')
     }
   }
    res.redirect('/admin/offers')
  } catch (error) {
    console.log('error in activate offer', error.message)
    res.redirect('/admin/offers');
  }
}

const deactivateOffer= async function (req, res) {
  try {
    const offerId = req.params.id;
    const offer = await OfferColl.findByIdAndUpdate(offerId, { isActive: false }, { new: true });
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }
    const products= await Products.find({"AppliedOffers.offerId":offerId})
    for(const product of products) {
      product.AppliedOffers = product.AppliedOffers.filter((o) => o.offerId.toString()!== offerId);
      product.SalePrice= salePrice(product)
      await product.save()
    }
    res.redirect('/admin/offers');
  } catch (error) {
    console.log('error in deactivateOffer admin' + error.message)
    res.redirect('/admin/offers');
    // res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
}


const deleteOffer = async (req, res) => {
  try {
    console.log('reached deleteOffer')
      const offerId = req.params.offerId;

      const offer = await OfferColl.findById(offerId);
      if (!offer) {
          return res.status(404).json({ success: false, message: 'Offer not found' });
      }

      await OfferColl.findByIdAndDelete(offerId);

      if (!offer.isActive) {
        res.redirect('/admin/offers?status=success');
          // return res.status(200).json({ success: true, message: 'Inactive offer deleted without affecting products.' });
      }

      if (offer.type === 'Category') {
          const offerProducts = await Products.find({ Category: offer.category });

          for (let product of offerProducts) {
              product.AppliedOffers = product.AppliedOffers.filter(
                  appliedOffer => appliedOffer.offerId.toString() !== offerId
              );

              product.SalePrice = salePrice(product);
              await product.save();
          }

      } else if (offer.type === 'Product') {
          const offerProduct = await Products.findById(offer.product);
          if (!offerProduct) {
            res.redirect('/admin/offers?status=failed');
              // return res.status(404).json({ success: false, message: 'Product not found' });
          }

          offerProduct.AppliedOffers = offerProduct.AppliedOffers.filter(
              appliedOffer => appliedOffer.offerId.toString() !== offerId
          );

          offerProduct.SalePrice = salePrice(offerProduct);
          await offerProduct.save();
      }
      console.log('delete product successfully')
      res.redirect('/admin/offers?status=success');
      // res.status(200).json({ success: true, message: 'Offer deleted successfully' });

  } catch (error) {
    console.log('error in offerlistget ' + error.message)
    res.render("admin/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred while loading dashboard",
      link: req.headers.referer || "/admin",
    });  }
};


//sales report
const salesReportget = async function (req, res) {
  try{
    const sessionName= req.session.admin_id
    const { startDate, endDate, reportType = 'custom', page = 1 ,format} = req.query;
    const currentPage = parseInt(req.query.page) || 1;
    const pageSize = 5;

    let start = null, end = null;
    switch (reportType) {
      case 'daily':
        start = moment().startOf('day').toDate();
        end = moment().endOf('day').toDate();
        break;
      case 'weekly':
        start = moment().startOf('isoWeek').toDate();
        end = moment().endOf('isoWeek').toDate();
        break;
      case 'yearly':
        start = moment().startOf('year').toDate();
        end = moment().endOf('year').toDate();
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          end = new Date(endDate);
          if (startDate === endDate || startDate && endDate) end.setHours(23, 59, 59, 999);
        }
        break;
    }
    console.log(start,'  ====', end);
    const query = start && end ? { date: { $gte: start, $lte: end } } : {};
    const orders= await OrderColl.find(query)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .populate('products.productId')
      .sort({date:-1});

      const totalOrdersCount = await OrderColl.countDocuments(query);
      console.log(totalOrdersCount)
      const totalPages = Math.ceil(totalOrdersCount / pageSize);
   
    const saleData= await OrderColl.aggregate([
      {$match:query},
      {$unwind: "$products" },
      {$group:{
        _id: null,
        totalSales: {$sum:"$grandTotal"},
        totalDiscount: {$sum:"$products.discountAmount"},
        // totalOrders: {$sum:1},
        totalCouponDeduction: {$sum:"$coupenDiscount"}
      }}
    ])

    const reportData =saleData.length > 0 ? saleData[0] : {
      totalSales: 0,
      totalDicount: 0,
      totalOrders: 0,
      totalCouponDeduction: 0
    }
    reportData.totalOrders = totalOrdersCount;

    if (req.xhr) {
      return res.json({ orders, totalPages, currentPage: page });
    }
    res.render('admin/salesReport', {
      sessionName,
      orders,
      reportData,
      totalPages,
      currentPage: parseInt(currentPage),
      startDate: start ? moment(start).format('YYYY-MM-DD') : '',
      endDate: end ? moment(end).format('YYYY-MM-DD') : '',
      reportType
    })
  }catch(err) {
    console.log('error in salesReportget'+ err.message)
    res.render("admin/error", {
      res,
      errorCode: 500,
      errorMessage: "Server Error",
      errorDescription: "An unexpected error occurred while loading sales report",
      link: req.headers.referer || "/admin",
    });  
  }
};


const downloadSaleReport = async (req, res) => {
  try {
    const { startDate, endDate, reportType = 'custom', format } = req.query;

    let start = null, end = null;

    switch (reportType) {
      case 'daily':
        start = moment().startOf('day').toDate();
        end = moment().endOf('day').toDate();
        break;
      case 'weekly':
        start = moment().startOf('isoWeek').toDate();
        end = moment().endOf('isoWeek').toDate();
        break;
      case 'yearly':
        start = moment().startOf('year').toDate();
        end = moment().endOf('year').toDate();
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          end = new Date(endDate);
          if (startDate === endDate || startDate && endDate) end.setHours(23, 59, 59, 999);
        }
        break;
      default:
        throw new Error('Invalid report type provided.');
    }

    const query = start && end ? { date: { $gte: start, $lte: end } } : {};

    const orders = await OrderColl.find(query).sort({date :-1});
    if (!orders) {
      throw new Error('Failed to retrieve orders.');
    }

    const totalOrdersCount = await OrderColl.countDocuments(query);


    const salesData= await OrderColl.aggregate([
      {$match:query},
      {$unwind: "$products" },
      {$group:{
        _id: null,
        totalSales: {$sum:"$grandTotal"},
        totalDiscount: {$sum:"$products.discountAmount"},
        // totalOrders: {$sum:1},
        totalCouponDeduction: {$sum:"$coupenDiscount"}
      }}
    ])


    const reportData = salesData.length > 0 ? salesData[0] : {
      totalSales: 0,
      totalOrders: 0,
      totalDiscount: 0,
      totalCouponDeduction: 0,
    };
    reportData.totalOrders = totalOrdersCount;

    if (format === 'pdf') {
      return generatePDFReport(orders, reportData, res);
    } else if (format === 'excel') {
      return generateExcelReport(orders, reportData, res);
    } else {
      throw new Error('Invalid format specified. Supported formats are pdf and excel.');
    }

  } catch (error) {
    console.error('Error generating sales report:', error);

    return res.status(500).json({
      error: error.message || 'An unexpected error occurred while generating the sales report.'
    });
  }
};


const adminLogout = async function (req, res) {
  console.log("reached admin logout");
  req.session.admin_id = null;
  setTimeout(() => {
    res.redirect("/admin");
  }, 1000);
};



const generatePDFReport = (orders, reportData, res) => {
  const doc = new PDFDocument();
  const fileName = `sales_report_${moment().format('YYYYMMDDHHmmss')}.pdf`;
  
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  res.setHeader('Content-Type', 'application/pdf');

  doc.pipe(res);

  doc.fontSize(20).text('Sales Report', { align: 'center' });
  doc.moveDown();
  
  // Report Summary
  doc.fontSize(12).text(`Total Sales: ₹${reportData.totalSales}`);
  doc.text(`Total Orders: ${reportData.totalOrders}`);
  doc.text(`Total Discount: ₹${reportData.totalDiscount}`);
  doc.text(`Total Coupon Deduction: ₹${reportData.totalCouponDeduction}`);
  doc.moveDown();

  // Orders Table
  doc.fontSize(15).text('Order Details', { underline: true });
  orders.forEach(order => {
    order.products.forEach(product => {
    doc.moveDown();
    doc.fontSize(10).text(`Order ID: ${order._id}`);
    doc.text(`Product Name: ${product.name}`);
    doc.text(`Quantity: ${product.quantity}`);
    doc.text(`Total Price: ₹${product.total}`);
    })
  });

  doc.end();
}

// Function to generate Excel report
const generateExcelReport = async (orders, reportData, res) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sales Report');

  // Report Summary
  sheet.addRow(['Total Sales', reportData.totalSales]);
  sheet.addRow(['Total Orders', reportData.totalOrders]);
  sheet.addRow(['Total Discount', reportData.totalDiscount]);
  sheet.addRow(['Total Coupon Deduction', reportData.totalCouponDeduction]);
  sheet.addRow([]);

  // Table Header
  sheet.addRow(['Order ID', 'Product Name', 'Quantity', 'Total Price']);
  
  // Populate the order rows
  orders.forEach(order => {
    order.products.forEach(product => {
    //   sheet.addRow([order._id.toString(), product.name, product.quantity, product.total]);
    // });
    sheet.addRow([
      order._id.toString(),
      product.name,
      product.quantity,
      product.total,
    ]);
   })
  });

  const fileName = `sales_report_${moment().format('YYYYMMDDHHmmss')}.xlsx`;
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  await workbook.xlsx.write(res);
  res.end();
};
module.exports = {
  adminLogin,
  adminLoginValidation,
  dashBoard,
  salesDataget,
  topProducts,
  categoryChartget,
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
  coupenDelete,
  offerListget,
  addOffer,
  activateOffer,
  deactivateOffer,
  offerEditget,
  updateOffer,
  deleteOffer,
  downloadSaleReport
};
