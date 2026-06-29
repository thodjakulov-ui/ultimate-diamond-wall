// Lists approved photos with each couple's name and group id. Hardened (built-in https).
// Env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

const https = require("https");

module.exports = async (req, res) => {
  try {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME, key = process.env.CLOUDINARY_API_KEY, secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloud || !key || !secret) { res.status(500).json({ error: "Missing environment variables" }); return; }
    const auth = Buffer.from(`${key}:${secret}`).toString("base64");
    const path = `/v1_1/${cloud}/resources/image/moderations/manual/approved?max_results=100&context=true`;
    const data = await new Promise((resolve, reject) => {
      const r = https.request({ hostname: "api.cloudinary.com", path, method: "GET", headers: { Authorization: `Basic ${auth}` } },
        (resp) => { let b = ""; resp.on("data", c => b += c); resp.on("end", () => { try { resolve(JSON.parse(b)); } catch (e) { reject(new Error("Cloudinary: " + b.slice(0,200))); } }); });
      r.on("error", reject); r.end();
    });
    if (data.error) { res.status(500).json({ error: "Cloudinary: " + (data.error.message || "") }); return; }
    const decUrl = (v) => { if (!v) return ""; try { let s = String(v).replace(/-/g,"+").replace(/_/g,"/"); while (s.length % 4) s += "="; return Buffer.from(s,"base64").toString("utf8"); } catch { return ""; } };
    const photos = (data.resources || [])
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((x) => { const ctx = (x.context && x.context.custom) || {}; return { public_id: x.public_id, version: x.version, name: decUrl(ctx.n), group: ctx.g || "" }; });
    res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=40");
    res.status(200).json({ cloud, photos });
  } catch (e) { res.status(500).json({ error: String(e && e.message ? e.message : e) }); }
};
