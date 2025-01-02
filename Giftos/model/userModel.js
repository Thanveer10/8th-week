const mongoose=require('mongoose')
mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema=mongoose.Schema({
    Username:{
      type:String,
      require:true
    },
    Password:{
        type:String,
        require:false
    },
    Confirmpassword:{
        type:String,
        require:false
    },
    Mobilenumber:{
        type:Number,
        require:false,
        unique:false,
        sparse:true,
        default:null
       
    },
    Googleid:{
        type:String,
        unique:true,
        sparse: true,
        
    },
    Email:{
        type:String,
        require:true
    },
    Status:{
        type:Boolean,
        reqire:true,
        default:true
    },
    UsedCoupons:{
        type:Array,
    },
    ReferralCode: { // Each user has a referral code
        type: String,
        unique: true
    },
    Referrer: { // Track who referred the new user
        type: mongoose.Schema.Types.ObjectId,
        ref: "userDB1",
        default: null
    },
    RedeemedOffers: [{  // Track which referral offers the user has redeemed
        offerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Offer"
        },
        redeemedOn: {
            type: Date,
            default: Date.now
        }
    }],
    ReferralRewards: { // Track the total rewards earned by referring others
        type: Number,
        default: 0
    },
    CreatedAt:{
        type:Date,
        default: Date.now()
    }
})

module.exports=mongoose.model('userDB1',userSchema)