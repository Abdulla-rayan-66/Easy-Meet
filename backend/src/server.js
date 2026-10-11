import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
const app = express();
const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI;
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.get("/api/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "Easy-Meet API",
    });
});
async function startServer() {
    if (!mongoUri) {
        throw new Error("MONGODB_URI is not configured in .env");
    }
    await mongoose.connect(mongoUri);
    app.listen(port, () => {
        console.log(`Easy-Meet API running on port ${port}`);
    });
}
startServer().catch((error) => {
    console.error("Failed to start Easy-Meet API:", error);
    process.exitCode = 1;
});
