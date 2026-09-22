# Final mobile header and sharing polish

## What will change
- Show header advertisements on phones, sharing the available width cleanly when two ads are active.
- Tighten the square share graphic masthead: larger left-aligned logo with minimal outer spacing and one or two ads filling the remaining width.
- Replace generic social symbols in article sharing, the website footer, and generated share graphics with recognizable brand logos and brand colors.
- Remove the smile, save, Facebook, and overflow icons from homepage feed cards; add a clear “Read More...” link to each full article.
- Use the Jai Hind Bharat logo for loading placeholders.

## Technical details
- Keep the existing advertisement controls, article links, metadata, and e-paper behavior unchanged.
- Pass up to two active header ads into the share-image renderer and divide its ad region evenly.
- Preserve the 1080×1080 JPEG output and compact article layout.
- Check phone and desktop layouts, generated image dimensions, interactions, and site health after the changes.
