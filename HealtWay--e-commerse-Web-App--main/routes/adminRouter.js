const express = require("express");
const router = express.Router();
const adminController1 = require("../controllers/admin/adminController1");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const productController = require("../controllers/admin/productController");
const brandController = require("../controllers/admin/brandController");
const orderController = require("../controllers/admin/orderController");
const orderUserController = require("../controllers/user/orderController");
const couponController = require("../controllers/admin/couponController"); 
const offerController = require("../controllers/admin/offerController"); 
const salesReportController = require("../controllers/admin/salseReportController"); 
const { route } = require("./userRouter");
const {userAuth,adminAuth} = require("../middlewares/auth")

const multer = require("multer");
const upload = require("../helpers/multer");







//Admin loging mnagment 
router.get("/login",adminController1.loadLogin);
router.post("/login",adminController1.login);

router.get("/logout",adminController1.logout)

//Dashboard 
router.get("/",adminAuth,adminController1.loadDashboard);

//Custermer management


router.get("/users",adminAuth,customerController.customerInfo);
router.get("/blockCustomer",adminAuth,customerController.customerBlocked);
router.get("/unblockCustomer",adminAuth,customerController.customerUnblocked);

//Catogory management

router.get("/categories",adminAuth,categoryController.categoryInfo); // Route to list categories with pagination and search
router.post('/category/offer/add/:id',adminAuth,categoryController.addCategoryOffer);// Route to add offer to a category
router.get('/category/offer/remove/:id',adminAuth,categoryController.removeCategoryOffer);// Route to remove offer from a category
                      // Add new category
router.get('/addCategory', adminAuth, categoryController.getAddCategory);
router.post('/addCategory', adminAuth, categoryController.postAddCategory);
                      // Edit category
router.get('/category/edit/:id', adminAuth, categoryController.getEditCategory);
router.post('/category/edit/:id', adminAuth, categoryController.postEditCategory);
                      //Deleting Category
// router.get('/category/delete/:id', adminAuth, categoryController.deleteCategory);
                    //Viewing Single Category
router.get('/category/view/:id', adminAuth, categoryController.viewCategoryDetails);
        // aList and unlist
router.get('/category/list/:id', adminAuth, categoryController.listCategory);
router.get('/category/unlist/:id', adminAuth, categoryController.unlistCategory);

//Brand management
router.get("/brands",adminAuth,brandController.getBrandpage)
router.get("/addBrand",adminAuth,brandController.getAddBrand);
router.post("/addBrand",adminAuth,upload.single("brandImage"),brandController.postAddBrand);

router.get('/brand/block/:id',adminAuth,brandController.blockBrand);
router.get('/brand/unblock/:id',adminAuth,brandController.unblockBrand);
router.get('/brand/delete/:id',adminAuth,brandController.deleteBrand);


//Product management



// Product management
router.get('/addProduct', productController.getProductAddPage);
router.post('/addProduct', adminAuth,upload.fields([
        { name: 'productImage1', maxCount: 1 },
        { name: 'productImage2', maxCount: 1 },
        { name: 'productImage3', maxCount: 1 }
    ]), productController.postAddProduct);
                                //listing product
router.get("/products",productController.getProducts);
router.route('/product/edit/:id')
    .get( productController.getEditProduct)
    .post( upload.fields([
        { name: 'productImage1', maxCount: 1 },
        { name: 'productImage2', maxCount: 1 },
        { name: 'productImage3', maxCount: 1 }
    ]), productController.postEditProduct);


      

                        // Route to view product details
router.get('/product/view/:id',adminAuth, productController.getProductDetails);
                         // Soft delete product route
router.get('/product/delete/:id',adminAuth, productController.softDeleteProduct);
router.get('/product/block/:id',adminAuth,productController.blockProduct);
router.get('/product/unblock/:id',adminAuth,productController.unblockProduct);


                                //listing orders
router.get('/orders',adminAuth,orderController.getAllOrders);

router.post('/orders/update-status/:orderId',adminAuth,orderController.updateOrderStatus);
router.post('/order/cancel/:orderIdOfCartItems/:itemOrderId',adminAuth,orderUserController.cancelOrder);

//      COUPONS

router.get('/coupons',adminAuth,couponController.listAllCoupons);
router.get('/addCoupon',adminAuth,couponController.getAddCoupon);
router.post('/addCoupon',adminAuth,couponController.postAddCoupon);
router.get('/deleteCoupon/:couponId',adminAuth,couponController.deleteCoupon);


//offer 

router.get("/offers",adminAuth,offerController.loadOffers);
router.get("/offerAdd",adminAuth,offerController.getOfferAddPage);
router.post('/offerAdd',adminAuth,upload.single('image'),offerController.postAddOffer);
router.get("/edit-offer/:id",adminAuth,offerController.editOffer);

router.post("/delete-offer/:offerId",adminAuth,offerController.deleteOffer);

router.get("/activate-offer/:offerId", adminAuth, offerController.activateOffer);
router.get("/deactivate-offer/:offerId", adminAuth, offerController.deactivateOffer);


//Report

router.get("/sales-report", adminAuth ,salesReportController.getSalesReport);
router.get('/sales-report-pagination',adminAuth,salesReportController.getSalesReport);
router.get('/sales-report-download',adminAuth,salesReportController.downloadSaleReport);
router.get("/sales-report-filter", adminAuth ,salesReportController.getSalesReport);
module.exports = router