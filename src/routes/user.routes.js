
import express from 'express';
import { upload } from '../middleware/multer.middleware.js';
import {  deleteBlog, editBlog, getAllBlogsWithCurentUser, getAllUsers, LikeBlog, login, logout, register, updateUserProfile, uploadBlog } from '../controller/user.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = express.Router();


router.route('/register').post(upload.fields([
  { name: 'avatar', maxCount: 1 }
]), register);


router.route('/login').post(login)
router.route('/uploadBlog').post(
  verifyJWT,
  upload.fields([{ name: 'blogImage', maxCount: 1 }]),
  uploadBlog
)
router.route('/current-user-allUserBlog').get(verifyJWT, getAllBlogsWithCurentUser)
router.route('/edit-blog').post(upload.fields([{ name: 'blogImage', maxCount: 1 }]), verifyJWT, editBlog)
router.route('/delete-blog').post(verifyJWT, deleteBlog)
router.route('/logout').get(verifyJWT, logout)
router.route('/like-blog').post(verifyJWT, LikeBlog)
router.route('/get-all-users').get(verifyJWT, getAllUsers)


router.route('/update-user-profile').post(upload.fields([{ name: 'avatar', maxCount: 1 }]), verifyJWT, updateUserProfile)






export default router;