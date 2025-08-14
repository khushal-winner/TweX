import asynchandler from "express-async-handler";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

export const getPosts = asynchandler(async (req, res) => {
  const post = await Post.find()
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });

  res.status(200).json({ posts });
});

export const getPost = asynchandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId)
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }
  res.status(200).json({ post });
});

export const getUserPosts = asynchandler(async (req, res) => {
  const { userName } = req.params;
  const user = await User.findOne({ username: userName });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const posts = await Post.find({ user: user._id })
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });
  res.status(200).json({ posts });
});

export const createPost = asynchandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { content } = req.body;
  const imageFile = req.file;

  if (!content && !imageFile) {
    res.status(400);
    throw new Error("Post must have text or image");
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  let imageUrl = "";
  // upload image to cloudinary
  if (imageFile) {
    try {
      // convert buffer to base64 string
      const base64Image = `data:${
        imageFile.mimetype
      };base64,${imageFile.buffer.toString("base64")}`;

      const uploadResponse = await cloudinary.uploader.upload(base64Image, {
        folder: "social_media_posts",
        resource_type: "image",
        transformation: [
          { width: 500, height: 500, crop: "limit" },
          { quality: "auto" },
          { format: "auto" },
        ],
      });

      imageUrl = uploadResponse.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error", error);
      return res.status(500).json({ error: "Failed to upload image" });
    }
  }

  const post = await Post.create({
    user: user._id,
    content: content || "",
    image: imageUrl,
  });
  res.status(200).json({ post });
});

export const likePost = asynchandler(async (req, res) => {
  const { postId } = req.params;
  const { userId } = getAuth(req);

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isLiked = post.likes.includes(user._id);
  if (isLiked) {
    // unlike
    await Post.findOneAndUpdate(
      { _id: postId },
      { $pull: { likes: user._id } },
      { new: true }
    );
  } else {
    // like
    await Post.findOneAndUpdate(
      { _id: postId },
      { $push: { likes: user._id } },
      { new: true }
    );
  }

  // create notification
  if (post.user.toString() !== user._id.toString()) {
    const notification = await Notification.create({
      from: user._id,
      to: post.user,
      type: "like",
      post: post._id,
    });
  }
  res.status(200).json({ post });
});

export const deletePost = asynchandler(async (req, res) => {
  const { postId } = req.params;
  const { userId } = getAuth(req);

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (post.user.toString() !== user._id.toString()) {
    res.status(401);
    throw new Error("Unauthorized");
  }

  await Post.findByIdAndDelete(postId);
  res.status(200).json({ message: "Post deleted successfully" });
});
