const mongoose=require('mongoose')
// require('dotenv').config()
const {Schema}= mongoose
mongoose.connect("mongodb://localhost:27017/userDB")


const productSchema=new Schema({
    Productname:{
        type:String,
        required:true
    },
    Brand:{
        type:String,
        // require:true
    },
    RegularPrice: {
        type: Number,
        required: true
    },
    SalePrice: {
        type: Number,
        // required: true
    },
    AppliedOffers: [
        {
            offerId: {
                type: Schema.Types.ObjectId,
                ref: "Offer"
            },
            discountValue: Number,   
            discountType: String     
        }
    ],
    Category:{
        type:Schema.Types.ObjectId,
        ref:"category",
        required:true
    },
    Stock:{
        type:Number,
        required:true
    },
    Discription:{
        type:String,
        required:true
    },
    Productimage:{
        type:[String],
        required:true
    } ,
    Status:{
        type:String,
        enum:["Available","Out of stock","Discountinued"],
        required:true,
        default:"Available"
    },
    CreatedAt:{
        type:Date,
        default:Date.now

    },MaxPerPerson: {
         type: Number, 
         required: false,  // Maximum limit per person
         default: 10
     }, 

        
})
productSchema.index({ Productname: 1 }, { collation: { locale: 'en', strength: 2 } });

module.exports= mongoose.model("productdata",productSchema)

