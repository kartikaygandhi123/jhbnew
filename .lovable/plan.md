# Square article sharing and social footer

## What will change
- Redesign “share as image” into a 1080×1080 news clipping.
- Recreate the homepage masthead at the top: site logo/name and available header advertisement.
- Place the article photo directly below, followed by a fitted headline and concise article text.
- Keep only a small red footer reading “For latest news visit jaihindbharat.com”.
- Keep the existing download and share actions outside the generated image preview.
- Add a compact “Follow us” row with colored Facebook, Instagram, YouTube, and X icons to the main website footer.

## Social previews
- Continue using each article’s own image in Facebook, X, WhatsApp, and other link previews through the article metadata.
- Ensure the image metadata is emitted only when the article has a valid public HTTPS image.

## Technical details
- Update the canvas renderer to fit variable logo, ad, article image, headline, and body content without overflow.
- Use a square JPEG suitable for WhatsApp sharing.
- Reuse current site settings and active header advertisements; no content or admin behavior changes.
- Verify the article page, generated image, footer, and site health after the update.
