
const express=require('express')
const session=require('express-session')
const ProductColl=require('../model/productModel')
const categoryColl=require("../model/categoryModel")
const User=require('../model/userModel')
const sharp= require('sharp')
const path= require('path')
const { link } = require('fs')


const viewAllProducts=async function(req,res){
   try{
      const currentPage=parseInt(req.query.page)  || 1
      const limit= 12
      const skip=(currentPage-1)*limit

      const { sort,sortCategory,categoryId } = req.query;
   
      let sortCriteria = {};
      let newArrivals;
      console.log('sortCategory===',sortCategory)

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
      req.session.sort=sort
      req.session.sortCriteria=sortCriteria;

      // Searching setup
      const searchTerm = req.query.query || '';
      console.log('searchTerm is : ', searchTerm)

      let products = [];

      if (searchTerm) {
            console.log('come to search term : ', searchTerm)
         const startsWithRegex = new RegExp(`^${searchTerm}`, 'i');
         const startsWithProducts = await ProductColl.find({
            //  isDeleted: false,
             Productname: { $regex: startsWithRegex }
         })
         .populate({
            path: 'Category', // Assuming 'category' is a reference field in the Product model
            match: { Status: 'Listed' } // Fetch products with 'Listed' categories only
        })
         // .populate('brand')
         // .populate({
         //     path: 'reviews',
         //     populate: { path: 'user', select: 'name' }
         // })
         .sort(sortCriteria)
         .collation({ locale: 'en', strength: 2 })
         .skip(skip)
         .limit(limit);


         const containsRegex = new RegExp(searchTerm, 'i');
         const containsProducts = await ProductColl.find({
            //  isDeleted: false,
             Productname: { $regex: containsRegex },
             _id: { $nin: startsWithProducts.map(p => p._id) } 
         })
          .populate({
            path: 'Category', // Assuming 'category' is a reference field in the Product model
            match: { Status: 'Listed' } // Fetch products with 'Listed' categories only
        })
         // .populate('brand')
         // .populate({
         //     path: 'reviews',
         //     populate: { path: 'user', select: 'name' }
         // })
         .sort(sortCriteria)
         .collation({ locale: 'en', strength: 2 })
         .skip(skip)
         .limit(limit);

          products = [...startsWithProducts, ...containsProducts];
          products = products.filter(product => product.Category && product.Category.Status === 'Listed');
          console.log('serched prodducts',products)
         //  products = products.slice(skip,(skip + productLimit));
         
     }else{
      if(sort==='newArrivals'){
         newArrivals='New Arrivals'
         products=await ProductColl.find({}).populate({
            path: 'Category', // Assuming 'category' is a reference field in the Product model
            match: { Status: 'Listed' } // Fetch products with 'Listed' categories only
        }).sort(sortCriteria).skip(skip).limit(limit);

      }else{
        let allproducts = await ProductColl.find({})
         .populate('Category')
         // .populate('brand')
         // .populate({
         //     path: 'reviews',
         //     populate: { path: 'user', select: 'name' }
         // })
         .collation({ locale: 'en', strength: 2 })
         .sort(sortCriteria)
         .skip(skip)
         .limit(limit);
         products = allproducts.filter(product => product.Category && product.Category.Status === 'Listed');

      }
     
  }
         let totalProducts;
         if (searchTerm) {
            const searchRegex = new RegExp(searchTerm, 'i');
            totalProducts = await ProductColl.countDocuments({
                  // isDeleted: false,
                  Productname: { $regex: searchRegex }
            });
         } else {
            totalProducts = await ProductColl.countDocuments();
         }

  
      const user=req.session.user_id
      sessionName=user
      // let  totalProducts=await ProductColl.countDocuments()
      console.log('total products ==',totalProducts)
      let totalPages=Math.ceil(totalProducts/limit)
      console.log('totoal pages ==',totalPages)
      let allcategory=await categoryColl.find({})
      // console.log('this is all catogery'+ allcategory);
      console.log('checking searchterm at end',searchTerm)
      if(user){
      let userdata= await User.findOne({_id:user})
     
      res.render('user/allProducts',{sessionName,products,userdata,allcategory,sort:sort,searchTerm,totalPages,currentPage})
      }else{
         // if(sortCategory !== undefined){
         //    console.log('categoryName',categoryId)
         //    products= await ProductColl.find({Category:categoryId})
         //    console.log('reached sortCategory')
         //  return  res.render("user/categoryProducts", {
         //       newArrivals,
         //       products,
         //       categoryName:1,
         //       allcategory,
         //     });
         // }
         res.render('user/allProducts',{products,allcategory,sort:sort,searchTerm,newArrivals,totalPages,currentPage})
      }
   }catch(err){
      console.log('vewallproduct error')
      console.error(err.message)
      res.render('user/error',{res,errorCode:500,errorMessage:'Server Error',errorDescription:"An unexpected error occurred while getting products.",link:req.headers.referer || '/'})

   }
 
}

const addProductget=async function(req,res){
   try{

      const category= await categoryColl.find({})
         console.log(category);
         
      const admin=req.session.admin_id
      if(admin){
         console.log('reached addProductget')
         res.render('admin/addProduct',{sessionName:admin,category})
      }else{
         res.redirect('/admin/')
      }
      
   }catch(err){
     console.log(err.message)
     res.render('admin/error',{res,errorCode:500,errorMessage:'Server Error',errorDescription:"An unexpected error occurred loading product add page.",link:req.headers.referer || '/admin'})

   }  
}

const addProductpost=async function(req,res){
   try{
   const products=req.body;
   console.log(req.body);
   console.log(products);

   const productExists= await ProductColl.findOne({Productname:products.productName})
   if(!productExists){
      let images=[]

      if(req.files && req.files.length>0){
         for(let i=0;i<req.files.length;i++){
            let originalImagePath=req.files[i].path;
             const resizedImagePath=path.resolve('Giftos','public','productsimg','resizedimg',req.files[i].filename)
           
            await sharp(originalImagePath).resize({width:300,height:300}).toFile(resizedImagePath)
            images.push(req.files[i].filename)
         }
      }

      const categoryId= await categoryColl.findOne({Category:products.category})
      console.log('this is the category' + categoryId);
     
      
       if(!categoryId){
         return res.status(400).json({msg:'invalid category name'})
       }

       const proDetails={
         Productname:products.productName,
         RegularPrice:products.regularPrice,
         SalePrice:products.salePrice,
         Stock:products.stock,
         MaxPerPerson:products.maxPerPerson,
         Category:categoryId._id?categoryId._id:null,
         Discription:products.description,
         Productimage:images,
         Status:'Available',
      }
      const newProduct= new ProductColl(proDetails)
      await newProduct.save()
      console.log(newProduct);    
      return res.redirect('/admin/productList')
   }else{
      return res.status(400).json({msg:'Product already exists,please create a new one'})
   }
   
  }catch(error){
   console.log("error in addProducts "+error.message)
  res.render('user/error',{res,errorCode:500,errorMessage:error.message,errorDescription:'error in addProducts'+ error.message,link:'/admin/'})
  }
}


const editProductget=async function (req,res) {

   const sessionName=req.session.admin_id
   if(sessionName){
   const prodId=req.params.id
   console.log(prodId)
   const categorynew= await categoryColl.find({})
   const product=await ProductColl.findById(prodId).populate('Category')
      res.render('admin/editProduct',{sessionName,product,categorynew})
   }else{
      res.redirect('/admin/')
   }
}

const add_editpost=async function(req,res,next){
   try {
      let id2=req.params.id
      const product=await ProductColl.findOne({_id:id2})
      let editImage=req.files
      let image=[]
      if (editImage && editImage.length > 0) {
         console.log('changed image: '+editImage)
         req.files.forEach(file => {
             image.push(file.filename);
         });
     }
     const existingProduct = await ProductColl.findById(id2);
     if (!existingProduct) {
      return res.status(404).send('Product not found');
   }
     const categoryId= await categoryColl.findOne({Category:req.body.category})
     console.log(req.body.category);
     
        console.log(categoryId);
       
      let updateFields={
         Productname: req.body.productname,
         RegularPrice: req.body.regularPrice,
         SalePrice: req.body.salePrice,
         Category: categoryId ? categoryId._id : product.Category,    //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,   //category: req.body.category,
         Stock: req.body.stock,  
         MaxPerPerson: req.body.maxPerPerson,
         Discription: req.body.discription,
         
      }
      if(editImage.length > 0){
          console.log('editImage')
           updateFields.$push ={Productimage:{$each:image}}
      }
       await ProductColl.findByIdAndUpdate(id2,updateFields,{new:true})
       
       // await productinfo.updateOne({_id:new ObjectId(id2)},{$push:{"image":image}})
       res.redirect("/admin/productList")
   } catch (error) {
      console.log('error in editing post ' + error.message)
      res.render('admin/error',{res,errorCode:500,errorMessage:'Server Error',errorDescription:"An unexpected error occurred while edit product.",link:req.headers.referer || '/admin'})
   }
 
  }

module.exports={
   viewAllProducts,
   addProductget,
   addProductpost,
   editProductget,
   add_editpost
}

