import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trackAerialImage, trackImageCandidates} from '../src/track-imagery.js';
import audit from '../src/data/track-imagery-audit.json' with {type:'json'};
const tracks = JSON.parse(readFileSync(new URL('../public/tracks.json', import.meta.url))).tracks;
const records = readFileSync(new URL('../audits/track-images/2026-10-28.jsonl', import.meta.url), 'utf8').trim().split('\n').map(JSON.parse);
assert.equal(records.length, tracks.length);
const byId = new Map(records.map(r => [r.id, r]));
for (const track of tracks) {
  const image = trackAerialImage(track);
  const approved = byId.get(track.id).status === 'source_and_delivery_checked';
  assert.equal(Boolean(image), approved, track.id);
  if (image) {
    const bbox = new URL(image.url).searchParams.get('bbox').split(',').map(Number);
    assert(bbox.every(Number.isFinite));
    assert(bbox[0] < bbox[2] && bbox[1] < bbox[3]);
    assert(Math.abs((bbox[2]-bbox[0])/(bbox[3]-bbox[1])-16/9) < 0.001);
    assert(byId.get(track.id).imageSha256);
  }
}
const track = tracks.find(t => audit.entries[t.id] && t.osmSource);
assert.equal(trackAerialImage({...track, osmSource:'https://www.openstreetmap.org/node/0'}), null);
assert.equal(trackAerialImage({...track, id:'new-unreviewed-venue'}), null);
const noSource = tracks.find(t => audit.entries[t.id] && !t.osmSource);
assert.equal(trackAerialImage({...noSource, name:'Different venue'}), null);
assert.deepEqual(trackImageCandidates({id:'new', images:[{url:'https://example.com/unreviewed.jpg'}]}), []);
assert.deepEqual(trackImageCandidates({id:'new', images:[{url:'javascript:alert(1)',verified:true}]}), []);
console.log(`Audit gating and image bounds passed for all ${tracks.length} records.`);
