# Image assets

The homepage carousel follows one example transaction through three stages.
Edit `manifest.json` to replace the images in this order.

1. **Fund escrow** shows payment held.
2. **Review delivery** shows delivery under review.
3. **Release payment** shows payment released.

Each entry needs a `src` under `/assets/` and meaningful `alt` text. Use
landscape WebP images around 1,440 pixels wide. Keep the subject near the
center so it remains visible in the mobile layout.

The homepage reads the manifest at runtime. Upload the new image files
alongside the updated manifest to change the art without rebuilding the app.
