import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { requireAuth } from "./middleware/auth.js";
import { accountBooksRouter } from "./routes/accountBooks.js";
import { entriesRouter, entryByIdRouter } from "./routes/entries.js";
import { exportRouter } from "./routes/export.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function isLocalDevOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsOrigins.includes(origin)) {
        callback(null, origin);
        return;
      }
      if (process.env.NODE_ENV !== "production" && isLocalDevOrigin(origin)) {
        callback(null, origin);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(requireAuth);

app.use("/account-books", accountBooksRouter);
app.use("/account-books/:bookId/entries", entriesRouter);
app.use("/account-books/:bookId", exportRouter);
app.use("/entries", entryByIdRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
