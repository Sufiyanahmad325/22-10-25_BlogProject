import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new Schema({
    fullName: {
        type: String,
        required: [true, "name is required"],
        trim: true
    },
    username: {
        type: String,
        required: [true, "username is required"],
        trim: true,
        unique: true,
        lowercase: true
    },

    email: {
        type: String,
        required: [true, "email is required"],
        trim: true,
        unique: true,
        lowercase: true

    },

    avatar: {
        type: String, // couldinary url
    },

    password: {
        type: String,
        required: [true, "password is required"],
    },
    likes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post"   
        }
    ],
    bookmarkedPost: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ],
    bio:{
        type:String,
        default:""
    }
}, { timestamps: true })



userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})


userSchema.methods.generateAccessToken = async function () {
    return jwt.sign({
        _id:this._id,
        fullName:this.fullName,
        username:this.username,
        email:this.email
    } ,
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn:process.env.ACCESS_TOKEN_EXPIRY}
)
}


userSchema.methods.isCorrectPassword = async function (password) {
    return await bcrypt.compare(password , this.password)
}


export const User = mongoose.model('User' , userSchema)


