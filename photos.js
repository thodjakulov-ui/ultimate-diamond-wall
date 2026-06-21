// Runs on Vercel as /api/photos — returns only photos your staff have APPROVED,
// along with each customer's blurb and name. Your API secret stays on the server.
//
// Environment variables (set in Vercel → Settings → Environment Variables):
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET

module.exports = async (req, res) => {
  const cloud  = process.env.CLOUDINARY_CLOUD_NAME;
  const key    = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud || !key || !secret) {
    return res.status(500).json({ error: "Missing Cloudinary environment variables." });
  }

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const url  = `https://api.cloudinary.com/v1_1/${cloud}/resources/image/moderations/manual/approved?max_results=100&context=true`;

  const dec = v => { try { return v ? Buffer.from(v, "base64url").toString("utf8") : ""; } catch { return ""; } };

  try {
    const r = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    const data = await r.json();

    const photos = (data.resources || [])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(x => {
        const ctx = (x.context && x.context.custom) || {};
        return {
          public_id: x.public_id,
          version: x.version,
          blurb: dec(ctx.b),
          name: dec(ctx.n)
        };
      });

    res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=40");
    return res.status(200).json({ cloud, photos });
  } catch (e) {
    return res.status(500).json({ error: "Could not load photos." });
  }
};
