const mongoose=require('mongoose')
mongoose.connect('mongodb://localhost:27017/userDB')

const coupenSchema=new mongoose.Schema({
  CoupenCode:{
        type:String,
        required:true
    },
   DiscountPrice:{
        type:Number,
        required:true
    },
    CreateDate:{
        type:String,
        required:true
    }, 
   
    MinimumPrice:{
        type:Number,
        required:true
    },
  
    ExpireDate:{
        type:String,
        required:true
    },
    
    DiscountType:{
        type:String,
        required:true
    },

    Status:{
        type:Boolean,
        required:true
    },
  
});
module.exports=new mongoose.model("coupendata", coupenSchema)

