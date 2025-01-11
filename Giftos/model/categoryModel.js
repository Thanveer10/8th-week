const mongoose= require("mongoose")
mongoose.connect("mongodb://localhost:27017/userDB")

const categorySchema=new mongoose.Schema({
    Category:{
        type:String,
        require:true,
    },
    Discription:{
        type:String,
        // require:true
    },
    OfferPrice: {
        type: Number,
        min: [0, 'Offer price must be a positive number'],
        default: null
    },
    Edit:{
        type:String,
        
    },
   
    Status: {
        type: String,
        enum: ['Listed', 'Unlisted'],
        default: 'Listed'

    },
    IsDeleted: {
        type: Boolean,
        default: false, 
      },
})
module.exports=mongoose.model('category',categorySchema)