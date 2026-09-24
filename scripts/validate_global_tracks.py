#!/usr/bin/env python3
import json,re,sys
from pathlib import Path
data=json.loads(Path("public/tracks.json").read_text(encoding="utf-8")); tracks=data.get("tracks",[])
errors=[]; ids=set()
for i,t in enumerate(tracks):
 tid=t.get("id"); name=(t.get("name") or "").strip()
 if not tid or tid in ids: errors.append(f"duplicate/missing id at {i}: {tid}")
 ids.add(tid)
 if not name: errors.append(f"missing name: {tid}")
 if re.fullmatch(r"Karting venue \d+",name,re.I): errors.append(f"synthetic name: {tid}")
 if not t.get("country"): errors.append(f"missing country: {tid}")
 if not t.get("continent"): errors.append(f"missing continent: {tid} country={t.get('country')}")
 if t.get("lat") is None or t.get("long") is None: errors.append(f"missing coordinates: {tid}")
 if len(errors)>=50: break
countries={t.get("country") for t in tracks if t.get("country") and t.get("country")!="Unknown"}
continents={t.get("continent") for t in tracks if t.get("continent")}
print(f"tracks={len(tracks)} countries={len(countries)} continents={len(continents)}")
if len(tracks)<1000: errors.append("global directory unexpectedly below 1000 tracks")
if len(countries)<100: errors.append("global directory unexpectedly below 100 countries")
if len(continents)<6: errors.append("global directory unexpectedly below 6 continents")
if errors:
 print("\n".join(errors),file=sys.stderr); raise SystemExit(1)
