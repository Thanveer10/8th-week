const mongoose=require('mongoose')
mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema=mongoose.Schema({
    username:{
      type:String,
      require:true
    },
    Password:{
        type:String,
        require:true
    },
    Confirmpassword:{
        type:String,
        require:true
    },
    Mobilenumber:{
        type:Number,
        require:true
    },
    Email:{
        type:String,
        require:true
    },
    Status:{
        type:Boolean,
        require:true
    },
})

module.exports=mongoose.model('userDB1',userSchema)