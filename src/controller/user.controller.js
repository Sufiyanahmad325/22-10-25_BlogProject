import Post from "../models/postSchema.models.js"
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


    const avatarLocalFilePath = await req.files?.avatar[0]?.path
    console.log('this is your link ', avatarLocalFilePath)
    let uploadAvatarlink = null

    if (avatarLocalFilePath) {
        const uploadAvatar = await uploadCloudinary(avatarLocalFilePath)

        if (uploadAvatar) {
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

    const createdUser = await User.findById(newUser._id).select("-password")

    return res.status(201).json(
        new ApiResponse(201, createdUser, "user created successfully")
    )

})


export const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body

    if ([email, password].some(field => field?.trim() === "")) {
        throw new ApiError("all fields are required", 400)
    }

    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError("invalid credentials", 401)
    }

    const isPasswordMatched = await user.isCorrectPassword(password)

    if (!isPasswordMatched) {
        throw new ApiError("invalid credentials", 401)
    }

    const token = await user.generateAccessToken()

    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken", token, option).json(
        new ApiResponse(200, { user, token }, "login successful")
    )

})






export const uploadBlog = asyncHandler(async (req, res, next) => {
    const { title, content, tags } = req.body;

    if (!title || !content) {
        throw new ApiError("title and content are required", 400);
    }

    const post = await Post.create({
        title,
        content,
        tags: tags || [],       // optional tags
        author: req.user._id    // login user से
    });

    if (!post) {
        throw new ApiError("failed to create post", 500);
    }

    return res.status(201).json(
        new ApiResponse(201, post, "post created successfully")
    );
});








export const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user


    const userDetails = await Post.find({ author: user._id })

    if (!userDetails) {
        throw new ApiError("no user found", 404)
    }

    return res.status(200).json(
        new ApiResponse(200, { user: user, userBlog: userDetails }, "user found successfully")
    )

})



export const editBlog = asyncHandler(async (req, res) => {
    const { title, content, blogId } = req.body
    const user = req.user

    if (!title || !content) {
        throw new ApiError("title and content are required", 400)
    }

    const findOnlyMyblog = await Post.find({ author: user._id })


    if (!findOnlyMyblog) {
        throw new ApiError(400, "you do not have permission to edit this blog becouse you do not have any blog")
    }

    const userEditBlog = await Post.findByIdAndUpdate(
        { _id: blogId, author: user._id }, // if both match then blog will be updated
        {
            title,
            content
        }, { new: true }
    )


    if (!userEditBlog) {
        throw new ApiError("failed to update blog", 500)
    }
    return res.status(200).json(
        new ApiResponse(200, userEditBlog, "blog updated successfully")
    )

})




export const  deleteBlog = asyncHandler(async(req,res,next)=>{

        const {blogId} = req.body
        const user = req.user 

        if(!blogId){
            throw new ApiError("blog id is required",400)
        }

        const deleteMyblog = await Post.findByIdAndDelete({_id:blogId, author:user._id})

        if(!deleteMyblog){
            throw new ApiError("you do not have permission to delete this blog or blog not found",403)
        }

        const  userBlog =await Post.find({author:user._id})
        if(!userBlog){
            throw new ApiError("no user found",404)
        }

        res.status(200).json(
            new ApiResponse(200 , userBlog , "blog deleted successfully")
        )

})





export const logout = asyncHandler(async(req,res,next)=>{
    const options = {
        httpOnly: true,
        secure: true
    }
    res.clearCookie("accessToken" , options)
    res.status(200).json(
        new ApiResponse(200, null , "logout successfully")
    )
})



export const changePassword = asyncHandler(async(req,res,next)=>{
        const {oldPassword , newPassword} = req.body

        if (oldPassword === newPassword) {
            throw new ApiError("new password cannot be same as old password", 400);
        }


        if([oldPassword , newPassword].some(field => field?.trim() === "")){
            throw new ApiError("all fields are required",400)
        }

        const user = req.user 

        const isPasswordMatched = await user.isCorrectPassword(oldPassword)
        if(!isPasswordMatched){
            throw new ApiError("old password is incorrect",400)
        }


        user.password = newPassword
        await user.save()

})



export const LikeBlog = asyncHandler(async (req, res, next) => {
    const { blogId } = req.body;
    const user = req.user;

    if (!blogId) {
        throw new ApiError("blog id is required", 400);
    }

    const blog = await Post.findById(blogId);
    if (!blog) {
        throw new ApiError("blog not found", 404);
    }

    // check if user already liked the blog
    if (blog.likes.includes(user._id)) {
        // unlike
        blog.likes.pull(user._id);
        user.likes.pull(blog._id);
    } else {
        // like
        blog.likes.push(user._id);
        user.likes.push(blog._id);
    }

    await blog.save();
    await user.save();

    res.status(200).json(
        new ApiResponse(200, blog, "Blog like status updated successfully")
    );
});





