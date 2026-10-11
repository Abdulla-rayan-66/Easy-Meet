
import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { AccessToken } from "livekit-server-sdk";
import { randomUUID } from "node:crypto";

const app = express();
const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "Meetora API",
    });
});


app.post("/api/meetings/token", async (req, res) => {
    const { roomName, participantName } = req.body as {
        roomName?: unknown;
        participantName?: unknown;
    };

    if (
        typeof roomName !== "string" ||
        typeof participantName !== "string" ||
        !roomName.trim() ||
        !participantName.trim() ||
        roomName.trim().length > 100 ||
        participantName.trim().length > 80
    ) {
        res.status(400).json({
            error: "Valid roomName and participantName are required",
        });
        return;
    }

    const livekitUrl = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!livekitUrl || !apiKey || !apiSecret) {
        res.status(500).json({
            error: "LiveKit is not configured",
        });
        return;
    }

    try {
        const token = new AccessToken(apiKey, apiSecret, {
            identity: randomUUID(),
            name: participantName.trim(),
            ttl: "1h",
        });

        token.addGrant({
            roomJoin: true,
            room: roomName.trim(),
            canPublish: true,
            canSubscribe: true,
        });

        const jwt = await token.toJwt();

        res.status(200).json({
            token: jwt,
            serverUrl: livekitUrl,
        });
    } catch (error: unknown) {
        console.error("Failed to create LiveKit token:", error);
        res.status(500).json({
            error: "Unable to create meeting token",
        });
    }
});


async function startServer(): Promise<void> {
    if (!mongoUri) {
        throw new Error("MONGODB_URI is not configured in .env");
    }

    await mongoose.connect(mongoUri);

    app.listen(port, () => {
        console.log(`Meetora API running on port ${port}`);
    });
}

startServer().catch((error: unknown) => {
    console.error("Failed to start Meetora API:", error);
    process.exitCode = 1;
});
