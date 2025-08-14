import asynchandler from "express-async-handler";
import User from "../models/user.model";
import clerkClient from "../lib/clerk";
import { getAuth } from "../utils/auth";

export const getUserProfile = asynchandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.status(200).json(user);
});

export const updateProfile = asynchandler(async (req, res) => {
  const { userId } = getAuth(req);

  const user = await User.findOneAndUpdate({ clerkId: userId }, req.body, {
    new: true,
  });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({ user });
});

export const syncUser = asynchandler(async (req, res) => {
  const { userId } = getAuth(req);

  const existingUser = await User.findOne({ clerkId: userId });
  if (existingUser) {
    res
      .status(200)
      .json({ user: existingUser, message: "User already exists" });
  }

  // create a new user from clerk
  const clerkUser = await clerkClient.users.getUser(userId);
  const userData = {
    clerkId: userId,
    email: clerkUser.emailAddresses[0].emailAddress,
    firstName: clerkUser.firstName || "",
    lastName: clerkUser.lastName || "",
    username: clerkUser.emailAddresses[0].emailAddress.split("@")[0],
    profilePicture: clerkUser.imageUrl || "",
  };

  const user = await User.create(userData);
  res.status(200).json({ user, message: "User created successfully" });
});

export const getCurrentUser = asynchandler(async (req, res) => {
  const { userId } = getAuth(req);

  const user = await User.findOne({ clerkId: userId });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.status(200).json({ user });
});

export const followUser = asynchandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { targetUserId } = req.params;

  if (userId === targetUserId) {
    res.status(400);
    throw new Error("You cannot follow yourself");
  }

  const currentUser = await User.findOne({ clerkId: userId });
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const isFollowing = currentUser.following.includes(targetUserId);
  if (isFollowing) {
    // unfollow
    await User.findOneAndUpdate(
      { clerkId: userId },
      { $pull: { following: targetUserId } },
      { new: true }
    );
    await User.findOneAndUpdate(
      { clerkId: targetUserId },
      { $pull: { followers: userId } },
      { new: true }
    );
  } else {
    // follow
    await User.findOneAndUpdate(
      { clerkId: userId },
      { $push: { following: targetUserId } },
      { new: true }
    );
    await User.findOneAndUpdate(
      { clerkId: targetUserId },
      { $push: { followers: userId } },
      { new: true }
    );
  }

  // create a new notification
  const notification = await Notification.create({
    from: currentUser._id,
    to: targetUserId,
    type: "follow",
  });

  res.status(200).json({ message: isFollowing ? "Unfollowed" : "Followed" });
});
