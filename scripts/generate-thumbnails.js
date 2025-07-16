// scripts/generate-thumbnails.js
const { createClient } = require("@supabase/supabase-js");
const sharp = require("sharp");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET = "images";
const THUMBNAIL_PREFIX = "thumbnails/";
const THUMB_WIDTH = 700;
const THUMB_HEIGHT = 700;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.");
  process.exit(1);
}

const valid_images = [
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752563874622_IMG_6616.jpeg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752564133577_IMG_5535.jpeg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752564769967_IMG_7598.jpeg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752564891153_IMG_7429.jpeg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752565077841_hainam.jpg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752565304366_IMG_3147.jpeg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752566241464_IMG_5108.jpeg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752566410661_IMG_9280.jpeg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752566495498_IMG_5419.jpeg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752563792727_IMG_8931.jpeg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752566823301_IMG_8285.jpeg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752566538904_IMG_7753.jpeg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752566966024_rintaro,jpg.jpg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752567010316_bravado_cafe.jpg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752566300212_IMG_8417%202.jpeg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752564072920_IMG_6377.jpeg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752598144421_IMG_7453.jpeg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752649165089_equator_coffee.jpg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752648955556_motoring_coffee.jpeg",
  "https://ktulfgdnuooptgufjqcf.supabase.co/storage/v1/object/public/images/thumbnails/1752651192878_riseandgrind.jpg",
];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function listAllFiles(prefix = "") {
  let files = [];
  let page = 0;
  let done = false;
  while (!done) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: 1000, offset: page * 1000 });
    if (error) throw error;
    if (!data || data.length === 0) break;
    files = files.concat(data.filter((f) => f.name && !f.name.endsWith("/")));
    if (data.length < 1000) done = true;
    page++;
  }
  return files;
}

async function fileExists(path) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(THUMBNAIL_PREFIX, { search: path.split("/").pop() });
  if (error) return false;
  return data && data.some((f) => f.name === path.split("/").pop());
}

async function processAllImages() {
  // List root and uploads/ folder
  const rootFiles = await listAllFiles("");
  let uploadFiles = [];
  try {
    uploadFiles = await listAllFiles("uploads");
  } catch {}
  const allFiles = rootFiles.concat(uploadFiles);
  const imageFiles = allFiles.filter((f) => /\.(jpg|jpeg|png)$/i.test(f.name));

  for (const file of imageFiles) {
    const thumbPath = `${THUMBNAIL_PREFIX}${file.name}`;
    // Skip if thumbnail exists
    if (await fileExists(file.name)) {
      console.log(`Thumbnail exists for ${file.name}, skipping.`);
      continue;
    }
    console.log(`Processing ${file.name}...`);
    // Download original
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(
        file.name.startsWith("uploads/") ? file.name : `uploads/${file.name}`
      );
    if (error || !data) {
      console.error(`Failed to download ${file.name}:`, error);
      continue;
    }
    const arrayBuffer = await data.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    // Generate thumbnail
    let thumbBuffer;
    try {
      thumbBuffer = await sharp(inputBuffer)
        .rotate() // <-- auto-orient based on EXIF
        .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: "inside" })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch (err) {
      console.error(`Failed to process ${file.name}:`, err);
      continue;
    }
    // Upload thumbnail
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(thumbPath, thumbBuffer, {
        upsert: true,
        contentType: "image/jpeg",
      });
    if (uploadError) {
      console.error(
        `Failed to upload thumbnail for ${file.name}:`,
        uploadError
      );
    } else {
      console.log(`Thumbnail created for ${file.name}`);
    }
  }
  console.log("Done!");
}

/**
 * Remove all images (and thumbnails) from Supabase Storage that are NOT in the valid list.
 * @param {string[]} validUrls - Array of valid public URLs.
 */
async function removeUnusedImages(validUrls) {
  // Extract storage paths from valid URLs
  const validPaths = new Set(
    validUrls
      .map((url) => {
        const m = url.match(/\/object\/public\/images\/(.+)$/);
        return m ? m[1] : null;
      })
      .filter(Boolean)
  );

  // List all files in root, uploads, and thumbnails, and build full paths
  const folders = ["", "uploads", "thumbnails"];
  const allFiles = (
    await Promise.all(
      folders.map((folder) =>
        listAllFiles(folder).then((files) =>
          files.map((f) => ({
            ...f,
            fullPath: folder ? `${folder}/${f.name}` : f.name,
          }))
        )
      )
    )
  ).flat();

  console.log("Valid paths:", Array.from(validPaths));
  console.log(
    "All files:",
    allFiles.map((f) => f.fullPath)
  );

  // Delete files not in validPaths
  const unused = allFiles.filter((f) => !validPaths.has(f.fullPath));
  if (!unused.length) return console.log("No unused files to delete.");

  for (const file of unused) {
    console.log(`Deleting: ${file.fullPath}`);
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([file.fullPath]);
    if (error) console.error(`Failed to delete ${file.fullPath}:`, error);
  }
  console.log("Unused files deleted.");
}

async function main() {
  await removeUnusedImages(valid_images);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
