const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:{
        type: String,
    },
    email:{
        type:String,
        unique:true
    },
    password:{
        type: String,
    },
    activeStatus:{
        type: Boolean,
        default: false
    }
},
{
    timestamps: true,

}
);

module.exports = mongoose.model("user",userSchema)

// module.exports = User = mongoose.model("user",userSchema)