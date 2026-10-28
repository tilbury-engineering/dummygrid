import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";

const read=path=>readFileSync(path,"utf8");
const parse=path=>{
  assert.ok(existsSync(path),path+" must exist");
  const data=JSON.parse(read(path));
  process.stdout.write("VALID JSON "+path+"\n");
  return data;
};
// Validate all generated public data, not just the subset currently displayed.
const sources=[
  "public/tracks.json","public/tracks-summary.json","public/asns.json",
  "public/results.json","public/results-normalized.json","public/results-providers.json",
  "public/timing-results.json","public/international-ranking.json","public/news.json",
  "src/data/tracks-seed.json","src/data/track-imagery-audit.json"
];
for(const path of sources)parse(path);
const tracks=parse("public/tracks.json").tracks;
assert.ok(Array.isArray(tracks)&&tracks.length>0,"Track directory cannot silently publish empty");
const normalized=parse("public/results-normalized.json");
assert.ok(Array.isArray(normalized.events),"Normalized event archive must be an array");
for(const entry of normalized.events){
  assert.ok(entry.championship&&entry.className&&entry.sourceUrl,"Result must retain provenance");
  assert.ok(Array.isArray(entry.classifications)&&entry.classifications.length>0,"Result must contain indexed positions");
}
const navigation=read("src/KartGridNavigation.jsx");
const main=read("src/main.jsx");
const history=read("src/KartingHistory.jsx");
for(const phrase of ["My KartGrid","Merchandise","Buy & Sell","Team Hub","Driver Hub","AI Coach","Directory","Legacy"]){
  assert.ok(navigation.includes(phrase),"Missing member/menu feature: "+phrase);
}
assert.ok(main.includes('parts[0]==="history-of-karting"'),"History route must resolve");
assert.ok(history.includes("HISTORY OF KARTING"),"History page must render");
assert.ok(main.includes('<TrackCardImage track={t}/>'),"Track detail must use audited imagery fallback");
assert.ok(main.includes("Save local preview"),"News drafts must not be labelled public");
assert.ok(main.includes("partial index"),"Partial results must have truthful labels");
assert.ok(main.includes('error:"Could not load "+path'),"Public-data failures must be detectable");
console.log("PASS: KartGrid release data integrity and key public navigation checks");
