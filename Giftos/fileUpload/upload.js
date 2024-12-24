var express=require('express');
const multer=require('multer')
const fs = require('fs');
const path = require('path');

let upload;

const uploadPath = path.join(__dirname, '../public/productsimg');
console.log(path.join(__dirname, '../public/productsimg'))
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}
try {
    const storage=multer.diskStorage({
        destination:uploadPath,
        filename:(req,file,cb)=>{
            cb(null,file.originalname)
        }
    })
    upload=multer({
        storage:storage,
        fileFilter:function(req,file,callback){
            if (
                file.mimetype == "image/jpeg" ||
                file.mimetype == "image/png"
            ) {
                callback(null, true); // Accept the file
            } else {
                console.log("Only jpg and png files are supported");
                callback(null, false); // Reject the file
            }
    
        },limits:{
            fileSize:1024* 1024* 2
        }
    })
} catch (error) {
    console.log('erron in multer diskstorage',error.message);
    
}



module.exports=upload


// const multer=require("multer");

// const path=require("path");

// const storage=multer.diskStorage({
//   destination:function(req,file,cb){
//     cb(null,path.join(__dirname,'public/productimages/'));
//   },
//   filename:function(req,file,cb){
//     const name=Date.now()+'-'+file.originalname;
//  cb(null,name);
//   }
// });

// const upload=multer({storage:storage})

// module.exports =upload