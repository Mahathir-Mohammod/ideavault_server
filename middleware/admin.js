import { auth } from "../auth.js";
import { fromNodeHeaders } from "better-auth/node";

/**
 * Middleware that verifies the user session and checks for admin role.
 * Attaches userId and session to the request object on success.
 */
export async function requireAdmin(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (session.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: admin access required" });
    }

    req.userId = session.user.id;
    req.session = session;
    next();
  } catch (err) {
    console.error("Admin middleware error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
