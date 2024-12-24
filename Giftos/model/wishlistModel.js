const mongoose=require('mongoose')
mongoose.connect('mongodb://localhost:27017/userDB')


const wishlistSchema=new mongoose.Schema({
    UserId:{
        type:String,
        require:true
    },
    Product:{
        type:Array,
        require:true
    } 
        
})

module.exports=new mongoose.model("wishlistdata",wishlistSchema)

