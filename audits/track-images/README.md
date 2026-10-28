# Track image audit — 28 October 2026

All 2,982 directory records were assessed. **2,776 passed source-location and image-delivery checks. 206 are withheld.**

This is not a claim that every photograph was individually authenticated by visual inspection. A named mapped venue, or documented manual source review, establishes the location. The image checks establish that its aerial view can be downloaded and decoded. Imagery can predate current layouts, and indoor circuits appear as buildings.

## Method

- Compare each record with its linked OpenStreetMap feature, including its current names, karting tags, lifecycle flags and coordinates.
- For missing links, search nearby mapped venues; require a strong, unambiguous name match or documented review.
- Exclude identified pit lanes, corners and straights from venue-image approval. Do not delete the directory records.
- Re-centre approved images on the source location. Where mapped bounds exist, include them with 20% padding and a minimum 900 m ground width. Point-only locations do not establish complete circuit boundaries.
- Request every approved image at 640 × 360 pixels; decode it and reject flat or blank responses. Record its check time and SHA-256 hash.
- 21 approved image centres moved by more than 100 m from the imported coordinates. Corrected crops were sampled visually, not all images.
- Gate runtime imagery against this audit manifest. New records and changed source identities receive “Image awaiting verification”. Failed image loads receive “Track image unavailable”.

## Results

| Result | Records |
| --- | ---: |
| closed_or_disused | 11 |
| missing_source | 74 |
| name_mismatch | 4 |
| not_tagged_karting | 3 |
| source_and_delivery_checked | 2,776 |
| track_segment_not_venue | 114 |

## Evidence and limits

[Every record](2026-10-28.jsonl) contains its result and source. The runtime manifest in `src/data/track-imagery-audit.json` contains the approved image bounding boxes. Manual exceptions include their supporting references. No generic or generated image is substituted for an unverified venue.

Some source queries timed out or were rate limited; unresolved venues remain withheld. OpenStreetMap is community-maintained and does not establish whether a venue is currently trading. Historical and ambiguous names require further verification.

Location data: © OpenStreetMap contributors, ODbL. Imagery: Esri, Vantor, Earthstar Geographics and the GIS User Community. Imagery is loaded from the provider at runtime; image files are not redistributed in this repository.
