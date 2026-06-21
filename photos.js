// Lists only photos your staff have APPROVED, with each customer's blurb and name.
// Hardened version: uses Node's built-in https (no fetch), and reports any real
// error in plain text instead of crashing.
//
// Environment variables (Vercel → Settings → Environment Variables):
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

const https = require("https");

module.exports = async (req, res) => {
  try {
    const cloud  = process.env.CLOUDINARY_CLOUD_NAME;
    const key    = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;

    if (!cloud || !key || !secret) {
      res.status(500).json({
        error: "Missing environment variables",
        present: { CLOUDINARY_CLOUD_NAME: !!cloud, CLOUDINARY_API_KEY: !!key, CLOUDINARY_API_SECRET: !!secret }
      });
      return;
    }

    const auth = Buffer.from(`${key}:${secret}`).toString("base64");
    const path = `/v1_1/${cloud}/resources/image/moderations/manual/approved?max_results=100&context=true`;

    const data = await new Promise((resolve, reject) => {
      const r = https.request(
        { hostname: "api.cloudinary.com", path, method: "GET", headers: { Authorization: `Basic ${auth}` } },
        (resp) => {
          let body = "";
          resp.on("data", (c) => (body += c));
          resp.on("end", () => {
            try { resolve(JSON.parse(body)); }
            catch (e) { reject(new Error("Cloudinary returned: " + body.slice(0, 200))); }
          });
        }
      );
      r.on("error", reject);
      r.end();
    });

    if (data.error) {
      res.status(500).json({ error: "Cloudinary: " + (data.error.message || JSON.stringify(data.error)) });
      return;
    }

    const decUrl = (v) => {
      if (!v) return "";
      try {
        let s = String(v).replace(/-/g, "+").replace(/_/g, "/");
        while (s.length % 4) s += "=";
        return Buffer.from(s, "base64").toString("utf8");
      } catch { return ""; }
    };

    const photos = (data.resources || [])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((x) => {
        const ctx = (x.context && x.context.custom) || {};
        return { public_id: x.public_id, version: x.version, blurb: decUrl(ctx.b), name: decUrl(ctx.n) };
      });

    res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=40");
    res.status(200).json({ cloud, photos });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
};
