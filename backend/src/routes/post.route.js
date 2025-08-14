import express from "express";
import {
  createPost,
  getPost,
  getPosts,
  getUserPosts,
} from "../controllers/post.controller.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

// public routes
router.get("/", getPosts);
router.post("/:postId", getPost);
router.put("/user/:userName", getUserPosts);

// private routes
router.post("/", protectRoute, upload.single("image"), createPost);
router.put("/:postId/like", protectRoute, likePost);
router.put("/:postId", protectRoute, deletePost);
export default router;
