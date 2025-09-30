// models/Post.js
import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  tags: [String], // optional tags array
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true // हर post का author ज़रूरी
  },
  isPublished: {
    type: Boolean,
    default: true // false भी कर सकते हो drafts के लिए
  }
}, {
  timestamps: true // createdAt, updatedAt
});

// index for faster queries (optional)
postSchema.index({ title: "text", content: "text", tags: "text" });

const Post = mongoose.model("Post", postSchema);
export default Post;
