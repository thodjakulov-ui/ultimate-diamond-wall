# Ultimate Diamond — Customer Photo Wall

A QR code customers scan to upload a photo. Each photo is auto-edited, waits for your
staff to approve it, then appears on the in-store wall screen. One platform (Cloudinary)
does the upload, editing, storage, and approval queue. Two web pages sit on top of it.

```
Customer scans QR  →  index.html (upload)  →  Cloudinary (auto-edit + hold for review)
                                                      │
                                        staff approve / reject in Cloudinary
                                                      │
                                              wall.html (the screen)
```

Files:
- `index.html` — the upload page (this is what the QR code points to)
- `wall.html` — the in-store display screen
- `api/photos.js` — a tiny server function that lists only approved photos

---

## Step 1 — Create a free Cloudinary account
Go to cloudinary.com and sign up. On the dashboard, copy your **Cloud name**
(a short word near the top). You'll use it in several places.

## Step 2 — (Optional) Upload your logo
If you want your logo stamped in the corner of each wall photo, upload your logo image
in the Media Library. Click it and copy its **Public ID**. Skip this for now if you like —
you can add it later in `wall.html`.

## Step 3 — Create the upload preset (this sets the auto-edit + approval)
In Cloudinary: **Settings → Upload → Upload presets → Add upload preset.**
- **Signing mode:** Unsigned
- **Preset name:** pick something like `wall` (copy it)
- **Folder:** `wall-uploads` (keeps these photos together)
- **Moderation:** set to **Manual**
  - Optional but recommended: add the **Amazon Rekognition AI Moderation** add-on first
    (Settings → Add-ons, has a free tier). Then set moderation to
    `aws_rek_moderation|manual` so obvious bad images auto-reject before staff ever see them.
- Save.

## Step 4 — Get your API key and secret
On the Cloudinary dashboard, copy your **API Key** and **API Secret**. These are only
used by the server function — they never go in the customer or wall pages.

## Step 5 — Put your three public values into index.html
Open `index.html` and set:
```
const CLOUD_NAME        = "your-cloud-name";   // from step 1
const UPLOAD_PRESET     = "wall";              // from step 3
const GOOGLE_REVIEW_URL = "https://...";       // your Google review link (see below)
```
(These are safe to expose — that's why the preset is "unsigned".)

To get your Google review link: in your Google Business Profile, use "Ask for reviews" /
"Get more reviews" to copy your short review link (looks like `https://g.page/r/..../review`),
or use Google's Place ID Finder and use `https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID`.

Note: Google does not allow pre-filling the review text, rating, or photos. The page shows
the customer their blurb with a "Copy my words" button and a one-tap link to your review
form — they paste and post. That copy-paste step is the closest possible to automatic.

## Step 6 — Deploy to Vercel (free, reliable hosting)
1. Create a free account at vercel.com.
2. Easiest path: drag-and-drop the whole `ultimate-diamond-wall` folder onto the Vercel
   dashboard (or push it to GitHub and "Import Project"). No build settings needed.
3. In the project's **Settings → Environment Variables**, add three:
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your API key
   - `CLOUDINARY_API_SECRET` = your API secret
4. Redeploy so the variables take effect.

You now have two live URLs:
- Upload page: `https://your-project.vercel.app/`
- Wall screen:  `https://your-project.vercel.app/wall.html`

## Step 7 — Make the QR code
Use any free QR generator. Point it at your **upload page** URL (the root one).
Because the URL never changes, you only print the code once. Put it on a counter card
or signage near the display.

## Step 8 — Set up the screen
On your in-store TV, tablet, or a Fire Stick / mini PC, open the **wall.html** URL in a
browser and put it in full-screen (kiosk) mode. It checks for new approved photos every
30 seconds on its own.

---

## Daily use — approving photos
When a customer uploads, the photo lands in Cloudinary's moderation queue and does **not**
appear on the wall yet. To approve:

- In Cloudinary, open **Media Library → Moderation tab.**
- Filter to **Manual → Pending.**
- Click **Approve** or **Reject** on each photo.

Approved photos show up on the wall within about 30 seconds. Rejected ones never appear.
You can bookmark the Moderation tab on a staff phone for quick approvals from the floor.

## Adjusting the look of the wall
Open `wall.html` and edit the `TRANSFORM` line near the top of the script to change the
crop, color treatment, or add your logo overlay (instructions are in the comments there).

## A note on cost
A single store's photo volume almost certainly fits Cloudinary's free tier. Just know the
free and lower tiers **suspend** the account if you blow past the monthly limit rather than
charging overage — so glance at your usage dashboard now and then, and upgrade if the wall
ever gets very popular.
