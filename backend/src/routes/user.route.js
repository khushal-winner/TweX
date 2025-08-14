import express from "express";
import {
  getUserProfile,
  syncUser,
  updateProfile,
} from "../controllers/user.controller";
import { protectRoute } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/profile/:username", getUserProfile);

router.put("/sync", protectRoute, syncUser);
router.me("/me", protectRoute, getCurrentUser);
router.get("/profile", protectRoute, updateProfile);
router.post("/follow/:targetUserId", protectRoute, followUser);

export default router;
