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
    UsedCoupen:{
        type:Array,
    },
    CreatedAt:{
        type:Date,
        default: Date.now()
    }
})

module.exports=mongoose.model('userDB1',userSchema)