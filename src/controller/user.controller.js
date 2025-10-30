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

    const newUser = await User.create({
        fullName: fullName,
        username,
        email,
        password,
        avatar: null
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

    const cookieOptions = {
        httpOnly: true,     // ⛔ JS can't access this cookie
        secure: false, // ✅ only HTTPS in prod
        sameSite: "lax",    // ✅ prevents CSRF issues but allows normal navigation
        path: "/",           // ✅ accessible from entire site
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    const userDetails = await User.findById(user._id).select("-password")


    return res.status(200).cookie("accessToken", token, cookieOptions).json(
        new ApiResponse(200, { user: userDetails, token }, "login successful")
    )

})






export const uploadBlog = asyncHandler(async (req, res, next) => {
    try {
        const { title, content, tags, category } = req.body;
        console.log('req.body', req.body);

        if (!title.trim() || !content.trim() || !category.trim()) {
            throw new ApiError(400, "Title, content, and category are required");
        }

        const imageLocalPath = req.files?.blogImage?.[0]?.path;
        let blogImageUrl = null;

        if (imageLocalPath) {
            const uploadedImage = await uploadCloudinary(imageLocalPath);
            if (uploadedImage?.url) {
                blogImageUrl = uploadedImage.url;
            }
        }

        const post = await Post.create({
            title,
            content,
            category,
            authorName: req.user.fullName,
            writerAvatar: req.user.avatar || null,
            tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
            author: req.user._id,
            blogImage: blogImageUrl,
        });

        if (!post) {
            throw new ApiError(500, "Failed to create blog post");
        }

        return res
            .status(201)
            .json(new ApiResponse(201, post, "Blog post uploaded successfully"));
    } catch (error) {
        console.error("Error uploading blog:", error);
        next(error);
    }
});








export const getAllBlogsWithCurentUser = asyncHandler(async (req, res) => {
    const user = req.user


    const allUserBlog = await Post.find()

    if (!allUserBlog) {
        throw new ApiError("no user found", 404)
    }

    return res.status(200).json(
        new ApiResponse(200, { user: user, allUserBlog: allUserBlog }, "user found successfully")
    )

})



export const editBlog = asyncHandler(async (req, res) => {
    const { title, content , category , blogId } = req.body
    const user = req.user

    if (!title || !content || !blogId || !category) {
        throw new ApiError("title and content are required", 400)
    }

    const findBlog = await Post.findOne({ _id: blogId, author: user._id })
    if (!findBlog) {
        throw new ApiError("you do not have permission to edit this blog or blog not found", 403)
    }


    const avatarLocalFilePath = await req.files?.blogImage?.[0]?.path
    let uploadAvatarlink = null

    if (avatarLocalFilePath) {
        const uploadAvatar = await uploadCloudinary(avatarLocalFilePath)

        if (uploadAvatar) {
            uploadAvatarlink = uploadAvatar?.url
        }
    }

      

    const editedBlog = await Post.findByIdAndUpdate(
        { _id: blogId, author: user._id }, // if both match then blog will be updated
        {
            title : title || findBlog.title,
            content:content || findBlog.content,
            blogImage: uploadAvatarlink || findBlog.blogImage,
            category : category || findBlog.category
        }, { new: true }
    )


    if (!editedBlog) {
        throw new ApiError("failed to update blog", 500)
    }
    return res.status(200).json(
        new ApiResponse(200, editedBlog, "blog updated successfully")
    )

})




export const deleteBlog = asyncHandler(async (req, res, next) => {

    const { blogId } = req.body
    const user = req.user

    if (!blogId) {
        throw new ApiError("blog id is required", 400)
    }

    const deleteMyblog = await Post.findByIdAndDelete({ _id: blogId, author: user._id })

    if (!deleteMyblog) {
        throw new ApiError("you do not have permission to delete this blog or blog not found", 403)
    }

    const usersBlog = await Post.find({ author: user._id })
    if (!usersBlog) {
        throw new ApiError("no user found", 404)
    }

    res.status(200).json(
        new ApiResponse(200, usersBlog, "blog deleted successfully")
    )

})





export const logout = asyncHandler(async (req, res, next) => {
    const options = {
        httpOnly: true,
        secure: true
    }
    res.clearCookie("accessToken", options)
    res.status(200).json(
        new ApiResponse(200, null, "logout successfully")
    )
})



export const changePassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body

    if (oldPassword === newPassword) {
        throw new ApiError("new password cannot be same as old password", 400);
    }


    if ([oldPassword, newPassword].some(field => field?.trim() === "")) {
        throw new ApiError("all fields are required", 400)
    }

    const user = req.user

    const isPasswordMatched = await user.isCorrectPassword(oldPassword)
    if (!isPasswordMatched) {
        throw new ApiError("old password is incorrect", 400)
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

    const blog = await Post.findById({_id:blogId}); //mujhe aayse dena hai _blogId but front
    if (!blog) {
        throw new ApiError("blog not found", 404);
    }


    const isAvailable = blog.likes.filter((blog)=> blog._id.toString() === user._id.toString()).length > 0


    // check if user already liked the blog
    if (isAvailable) {
        // unlike
        blog.likes.pull(user._id);
    } else {
        // like
        blog.likes.push(user._id);
    }
    await blog.save({ validateBeforeSave: false }); // ✅ validation skip

    res.status(200).json(
        new ApiResponse(200, blog, "Blog like status updated successfully")
    );
});



export const getAllUsers = asyncHandler(async (req, res, next) => {
    const user = req.user

    const allUsers = await User.find().select("-password")
    if (allUsers.length === 0) {
        throw new ApiError("no user found", 404);
    }

    res.status(200).json(
        new ApiResponse(200, allUsers, "all users fetched successfully")
    )
})





export const getSingleUser = asyncHandler(async (req, res, next) => {
    const { userId } = req.userId

    if (!userId) {
        throw new ApiError("user id is required", 400)
    }

    const singleUser = await User.findById(userId).select("-password")

    if (!singleUser) {
        throw new ApiError("no user found", 404)
    }

    res.status(200).json(
        new ApiResponse(200, singleUser, "user fetched successfully")
    )

})




export const updateUserProfile = asyncHandler(async (req, res, next) => {
    console.log('this is reqest body =>>>>>>> ', req.body)
    const { fullName, username, email, bio } = req.body

    const user = req.user
    const avatarLocalFilePath = await req.files?.avatar?.[0]?.path

    let uploadAvatarlink = null

    if (avatarLocalFilePath) {
        const uploadAvatar = await uploadCloudinary(avatarLocalFilePath)
        if (uploadAvatar) {
            uploadAvatarlink = uploadAvatar?.url
        }
    }


    const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
            fullName: fullName?.trim() || user.fullName,
            username: username?.trim() || user.username,
            email: email?.trim() || user.email,
            avatar: uploadAvatarlink || user.avatar,
            bio: bio?.trim() || user.bio || 'there is no bio'
        },
        { new: true }
    ).select("-password");


    if (!updatedUser) {
        throw new ApiError("failed to update user profile", 500)
    }


    const option = {
        secure: true,
        httpOnly: true
    }

    const accessToken = await updatedUser.generateAccessToken()

    res.status(200).cookie('accessToken', accessToken, option).json(
        new ApiResponse(200, updatedUser, "user profile updated successfully")
    )


})










