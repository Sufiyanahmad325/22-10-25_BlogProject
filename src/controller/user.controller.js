import { User } from "../models/userSchema.models.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import uploadCloudinary from "../utils/cloudinory.js"


export const register = asyncHandler(async (req, res, next) => {
    const { fullName, username, email, password } = req.body

    if ([fullName, username, email, password].some(field => field?.trim() === "")) {
        throw new ApiError("all fields are required", 400)
    }

    const userExists = await User.findOne({
        $or: [
            { email },
            { username }
        ]
    })


    if (userExists) {
        throw new ApiError("user already exists", 409)
    }


    const avatarLocalFilePath =await req.files?.avatar[0]?.path
    console.log('this is your link ' ,avatarLocalFilePath)
    let  uploadAvatarlink = null
   
    if(avatarLocalFilePath){
    const uploadAvatar = await uploadCloudinary(avatarLocalFilePath)
    
    if(uploadAvatar){
        uploadAvatarlink = uploadAvatar?.url
    }
    }


  


    const newUser = await User.create({
        fullName: fullName,
        username,
        email,
        password,
        avatar: uploadAvatarlink
    })

    if (!newUser) {
        throw new ApiError("failed to create user", 500)
    }

    const createdUser =await User.findById(newUser._id).select("-password")

    return res.status(201).json(
        new ApiResponse(201, createdUser, "user created successfully")
    )

})



