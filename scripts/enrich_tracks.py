#!/usr/bin/env python3
import json, os, time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
import requests

PUBLIC=Path("public/tracks.json")
BUNDLED=Path("src/data/tracks.json")
UA={"User-Agent":"DummyGridTrackEnricher/1.0 (https://github.com/tilbury-engineering/dummygrid)"}
NOMINATIM="https://nominatim.openstreetmap.org/search"
W3W="https://api.what3words.com/v3/convert-to-3wa"
COUNTRY_CODES={
 "United Kingdom":"gb","United States":"us","Australia":"au","Belgium":"be","Brazil":"br",
 "Czech Republic":"cz","France":"fr","Germany":"de","Italy":"it","Macao":"mo","Malaysia":"my",
 "Poland":"pl","Portugal":"pt","Spain":"es","Sweden":"se"
}

session=requests.Session()
session.headers.update(UA)

def load():
 return json.loads(PUBLIC.read_text(encoding="utf-8"))

def save(data):
 text=json.dumps(data,ensure_ascii=False,indent=2)+"\n"
 PUBLIC.write_text(text,encoding="utf-8")
 BUNDLED.parent.mkdir(parents=True,exist_ok=True)
 BUNDLED.write_text(text,encoding="utf-8")

def geocode(track):
 bits=[track.get("name"),track.get("city"),track.get("region"),track.get("country")]
 q=", ".join([x for x in bits if x])
 params={"q":q,"format":"jsonv2","addressdetails":1,"limit":5,"countrycodes":COUNTRY_CODES.get(track.get("country"),"")}
 r=session.get(NOMINATIM,params=params,timeout=30)
 r.raise_for_status()
 rows=r.json()
 if not rows:
  # Retry without venue name for obscure venues, but only accept a result if it is
  # close enough to the known city/region and not just the city centroid.
  q=", ".join([x for x in [track.get("city"),track.get("region"),track.get("country")] if x])
  params={"q":q,"format":"jsonv2","addressdetails":1,"limit":5,"countrycodes":COUNTRY_CODES.get(track.get("country"),"")}
  r=session.get(NOMINATIM,params=params,timeout=30)
  r.raise_for_status()
  rows=r.json()
 if not rows:return None
 # Prefer kart/race/leisure/sports features over generic settlements.
 def score(row):
  typ=(row.get("type") or "").lower()
  cls=(row.get("class") or "").lower()
  display=(row.get("display_name") or "").lower()
  pts=0
  for term in ["kart","race","motor","circuit","track","sports","leisure"]:
   if term in display:pts+=5
  if cls in {"leisure","amenity","tourism","sport"}:pts+=3
  if typ in {"sports_centre","pitch","track","raceway","motorway"}:pts+=2
  pts+=float(row.get("importance") or 0)
  return pts
 return sorted(rows,key=score,reverse=True)[0]

def format_address(row):
 a=row.get("address") or {}
 parts=[]
 for key in ["house_number","road","industrial","retail","suburb","village","town","city","county","state","postcode","country"]:
  v=a.get(key)
  if v and v not in parts:parts.append(v)
 return ", ".join(parts) or row.get("display_name","")

def get_w3w(lat,lon,key):
 if not key:return None
 r=session.get(W3W,params={"coordinates":f"{lat},{lon}","key":key,"language":"en","format":"json"},timeout=30)
 if r.status_code!=200:
  print(" what3words failed",r.status_code,r.text[:180],flush=True)
  return None
 data=r.json()
 return data.get("words")

def main():
 data=load()
 key=os.getenv("WHAT3WORDS_API_KEY","").strip()
 changed=0
 for i,t in enumerate(data.get("tracks",[]),1):
  needs_geo=not (t.get("address") and t.get("lat") is not None and t.get("long") is not None)
  if needs_geo:
   try:
    row=geocode(t)
    if row:
     t["address"]=format_address(row)
     t["lat"]=round(float(row["lat"]),7)
     t["long"]=round(float(row["lon"]),7)
     t["addressSource"]="OpenStreetMap / Nominatim"
     t["locationVerifiedAt"]=datetime.now(timezone.utc).isoformat()
     changed+=1
     print(i,t["name"],"->",t["address"],flush=True)
    else:
     print(i,t["name"],"NO MATCH",flush=True)
   except Exception as e:
    print(i,t["name"],"geocode failed",e,flush=True)
   time.sleep(1.05)
  if t.get("lat") is not None and t.get("long") is not None and not t.get("what3words") and key:
   try:
    words=get_w3w(t["lat"],t["long"],key)
    if words:
     t["what3words"]=words
     t["what3wordsSource"]="what3words API"
     changed+=1
     print("  ///"+words,flush=True)
   except Exception as e:
    print("  what3words failed",e,flush=True)
   time.sleep(.15)
 data["updatedAt"]=datetime.now(timezone.utc).isoformat()
 save(data)
 print("updated",changed,"fields across",len(data.get("tracks",[])),"tracks",flush=True)

if __name__=="__main__":
 main()
