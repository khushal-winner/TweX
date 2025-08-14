import express from "express";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

const app = express();

connectDB();
app.use(express.json());

app.get("/", (req, res) => res.send("Hello World from server!"));

app.get("/api/users", userRoutes);
app.listen(ENV.PORT, () => {
  console.log(`Server is running on port ${ENV.PORT}`);
});
