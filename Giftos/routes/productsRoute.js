const express=require('express')
// const nocache=require('nocache')
const path=require('path')
const product_ctrl=require('../controller/product-ctrl')
const Upload=require('../fileUpload/upload')
const adminAuth=require('../middleware/adminAuth')
const userAuth=require('../middleware/userAuth')

const product_route=express.Router()
try{

    product_route.use(express.static(path.join(__dirname,'../public')));
}catch(err){
    console.log(err.message);
    
}

console.log(path.join(__dirname,'../public'))
product_route.use(express.json());
product_route.use(express.urlencoded({ extended: true }));


product_route.get('/products',product_ctrl.viewAllProducts)
product_route.get('/addProduct',adminAuth,product_ctrl.addProductget)
product_route.post('/addproduct',adminAuth,Upload.array('images',4),product_ctrl.addProductpost) 

product_route.get('/editproduct/:id',adminAuth,product_ctrl.editProductget)
product_route.post('/productList/:id',adminAuth,Upload.array('Productimage',4),product_ctrl.add_editpost)


module.exports=product_route
