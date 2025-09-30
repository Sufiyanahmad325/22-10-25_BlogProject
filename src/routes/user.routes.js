
import express from 'express';
import { upload } from '../middleware/multer.middleware.js';
import { editBlog, getCurrentUser, login, register, uploadBlog } from '../controller/user.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = express.Router();


router.route('/register').post(upload.fields([
    { name: 'avatar', maxCount: 1 }
]), register);


router.route('/login').post(login)
router.route('/uploadBlog').post(verifyJWT,uploadBlog)
router.route('/current-user').get(verifyJWT,getCurrentUser)
router.route('/edit-blog').post(verifyJWT,editBlog)





export default router;