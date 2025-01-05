const express=require('express')
const nocache=require('nocache')
const path=require('path')
const admin_router=express.Router()
const admin_ctrl=require('../controller/adminctrl')
const category_ctrl=require('../controller/category-ctrl')
const adminAuth=require('../middleware/adminAuth')
const multer = require('multer');
const upload = multer();

admin_router.use(express.json())
admin_router.use(express.urlencoded({extended:true}))
admin_router.use(express.static(path.join(__dirname,'../public')))


admin_router.get('/',admin_ctrl.adminLogin)
admin_router.post('/login',admin_ctrl.adminLoginValidation)
admin_router.get('/adminlogout',adminAuth,admin_ctrl.adminLogout)
admin_router.get('/adminHome',adminAuth,admin_ctrl.dashBoard)

admin_router.get('/productList',adminAuth,admin_ctrl.productList)
admin_router.get('/addProduct',adminAuth,admin_ctrl.productList)
admin_router.get('/deleteproduct/:id',adminAuth,admin_ctrl.deleteProduct)

//category Management
admin_router.get('/category',adminAuth,category_ctrl.categoryget)
admin_router.post('/category',adminAuth,category_ctrl.categoryPost)
admin_router.get('/editCategory/:id',adminAuth,category_ctrl.editCategoryget)
admin_router.get('/categoryDelete/:id',adminAuth,category_ctrl.categoryDelete)
admin_router.post('/category/:id',adminAuth,category_ctrl.editCategoryLast)


admin_router.get('/userlist',adminAuth,admin_ctrl.userListget)
admin_router.get('/Block/:id',adminAuth,admin_ctrl.blockUser)
admin_router.get('/Unblock/:id',adminAuth,admin_ctrl.unblockUser)
admin_router.get('/deleteOne/:id',adminAuth,admin_ctrl.deleteOne)
admin_router.get('/orderlist',adminAuth,admin_ctrl.orderListget)
admin_router.post('/orders/update-status/:orderId',adminAuth,admin_ctrl.updateOrderStatus);

// COUPEN SESSION
admin_router.get('/coupenadmin',adminAuth,admin_ctrl.coupenListget)
admin_router.post('/coupenadmin',adminAuth,admin_ctrl.coupenListpost)
admin_router.get('/coupenEdit/:id',adminAuth,admin_ctrl.coupenEditget)
admin_router.post('/updateCoupen',adminAuth,admin_ctrl.updateCoupen)
admin_router.get('/coupenDelete/:id',adminAuth,admin_ctrl.coupenDelete)

// ORDER SESSIONS
admin_router.get('/Orderview/:id',adminAuth,admin_ctrl.ordeviewget)

//OFFER SESSIONS
admin_router.get('/offers',adminAuth,admin_ctrl.offerListget)
admin_router.post('/addOffer', upload.none(),adminAuth,admin_ctrl.addOffer)
admin_router.get('/edit-offer/:id',adminAuth,admin_ctrl.offerEditget)
admin_router.post('/updateOffer', upload.none(),adminAuth,admin_ctrl.updateOffer)
admin_router.get("/activate-offer/:id",adminAuth,admin_ctrl.activateOffer)
admin_router.get("/deactivate-offer/:id",adminAuth,admin_ctrl.deactivateOffer)
admin_router.post('/delete-offer/:offerId',adminAuth,admin_ctrl.deleteOffer)




//sales repot
admin_router.get('/salesreport',adminAuth,admin_ctrl.salesReportget)
admin_router.get('/sales-report-filter',adminAuth,admin_ctrl.salesReportget)









module.exports=admin_router

