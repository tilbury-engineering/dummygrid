#!/usr/bin/env python3
import json, os, time, re
from difflib import SequenceMatcher
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
import requests
from bs4 import BeautifulSoup

PUBLIC=Path("public/tracks.json")
UA={"User-Agent":"DummyGridTrackEnricher/1.0 (https://github.com/tilbury-engineering/dummygrid)"}
NOMINATIM="https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE="https://nominatim.openstreetmap.org/reverse"
W3W="https://api.what3words.com/v3/convert-to-3wa"
GKU_BASE="https://gokartinguk.com"
GKU_BROWSE=GKU_BASE+"/browse-location/"
_gku_index=None
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
 text=json.dumps(data,ensure_ascii=False,separators=(",",":"))+"\n"
 PUBLIC.write_text(text,encoding="utf-8")


def norm(text):
 return re.sub(r"[^a-z0-9]+"," ",(text or "").lower()).strip()

def gku_get(url):
 for attempt in range(5):
  r=session.get(url,timeout=30)
  if r.status_code==429:
   wait=2*(attempt+1)
   print(" GoKartingUK rate limited; sleeping",wait,"sec",flush=True)
   time.sleep(wait)
   continue
  r.raise_for_status()
  time.sleep(.8)
  return r
 raise RuntimeError("GoKartingUK rate limit persisted for "+url)

def _walk_json(obj):
 if isinstance(obj,dict):
  yield obj
  for v in obj.values():yield from _walk_json(v)
 elif isinstance(obj,list):
  for v in obj:yield from _walk_json(v)

def gku_index():
 global _gku_index
 if _gku_index is not None:return _gku_index
 try:
  r=gku_get(GKU_BROWSE)
  soup=BeautifulSoup(r.text,"html.parser")
  idx=[]
  for a in soup.find_all("a",href=True):
   href=a.get("href") or ""
   if "/tracks/" not in href:continue
   name=" ".join(a.stripped_strings).strip()
   if not name:continue
   idx.append({"name":name,"norm":norm(name),"url":href if href.startswith("http") else GKU_BASE+href})
  _gku_index=idx
 except Exception as e:
  print(" GoKartingUK index failed",e,flush=True)
  _gku_index=[]
 return _gku_index

def gku_lookup(track):
 if track.get("country")!="United Kingdom":return None
 names=[track.get("name") or "",*(track.get("aliases") or [])]
 norms=[norm(x) for x in names if x]
 best=None;best_score=0
 for item in gku_index():
  score=max(SequenceMatcher(None,n,item["norm"]).ratio() for n in norms)
  # Prefer exact containment for common directory naming differences.
  if any(n and (n in item["norm"] or item["norm"] in n) for n in norms):score+=0.35
  if score>best_score:
   best_score=score;best=item
 if not best or best_score<0.72:return None
 try:
  r=gku_get(best["url"])
  soup=BeautifulSoup(r.text,"html.parser")
  address=None;lat=None;lon=None
  for tag in soup.find_all("script",type="application/ld+json"):
   try:data=json.loads(tag.string or tag.get_text())
   except:continue
   for obj in _walk_json(data):
    if address is None and isinstance(obj.get("address"),dict):
     a=obj["address"]
     vals=[a.get("streetAddress"),a.get("addressLocality"),a.get("addressRegion"),a.get("postalCode"),a.get("addressCountry")]
     vals=[str(x).strip() for x in vals if x]
     if len(vals)>=2:address=", ".join(dict.fromkeys(vals))
    geo=obj.get("geo")
    if isinstance(geo,dict):
     try:
      lat=float(geo.get("latitude"));lon=float(geo.get("longitude"))
     except:pass
  # Fallback to explicit geo attributes/JS if present.
  if lat is None or lon is None:
   txt=r.text
   mlat=re.search(r'(?:latitude|lat)["\'\s:=]+(-?\d{1,3}\.\d+)',txt,re.I)
   mlon=re.search(r'(?:longitude|lng|lon)["\'\s:=]+(-?\d{1,3}\.\d+)',txt,re.I)
   if mlat and mlon:
    lat=float(mlat.group(1));lon=float(mlon.group(1))
  if not address:
   text=" ".join(soup.stripped_strings)
   pc=re.search(r"\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b",text,re.I)
   # Only use this fallback as a partial postal address, never invent a street.
   if pc:
    address=", ".join([x for x in [track.get("city"),track.get("region"),pc.group(1).upper(),"United Kingdom"] if x])
  if address or (lat is not None and lon is not None):
   return {"address":address,"lat":lat,"long":lon,"source":"GoKartingUK verified venue listing","url":best["url"]}
 except Exception as e:
  print(" GoKartingUK lookup failed",track.get("name"),e,flush=True)
 return None

def query_variants(track):
 name=track.get("name") or ""
 city=track.get("city") or ""
 region=track.get("region") or ""
 country=track.get("country") or ""
 aliases=list(track.get("aliases") or [])
 stripped=re.sub(r"\b(karting|kart|circuit|raceway|club|motorsport|racing|centre|center|indoor|outdoor|activity|activities)\b"," ",name,flags=re.I)
 stripped=re.sub(r"\s+"," ",stripped).strip(" -")
 variants=[name,*aliases]
 if stripped and stripped.lower()!=name.lower():variants.append(stripped)
 if city:variants.append(city+" karting")
 if name.lower().startswith("teamsport") and city:variants.append("go karting "+city)
 seen=set();out=[]
 for v in variants:
  q=", ".join([x for x in [v,city,region,country] if x])
  k=q.lower()
  if k not in seen:
   seen.add(k);out.append(q)
 return out

def geocode(track):
 target=norm(track.get("name"))
 city=norm(track.get("city"))
 generic={"kart","karting","raceway","circuit","club","centre","center","motorsport","racing","team","track","speed","indoor","outdoor","activity","activities"}
 target_tokens={x for x in target.split() if len(x)>=3 and x not in generic}
 aliases=[norm(x) for x in (track.get("aliases") or [])]

 def score(row):
  display=norm(row.get("display_name"))
  a=row.get("address") or {}
  row_city=norm(a.get("city") or a.get("town") or a.get("village") or a.get("municipality") or "")
  name_sim=max([SequenceMatcher(None,target,display[:max(len(target)*2,25)]).ratio()]+[SequenceMatcher(None,a,display[:max(len(a)*2,25)]).ratio() for a in aliases])
  token_hits=sum(1 for x in target_tokens if x in display)
  city_match=bool(city and (city in display or city==row_city))
  cls=(row.get("class") or "").lower()
  typ=(row.get("type") or "").lower()
  venueish=cls in {"leisure","amenity","tourism","sport"} or typ in {"sports_centre","track","raceway"}
  return (token_hits*5)+(3 if city_match else 0)+(2 if venueish else 0)+name_sim+float(row.get("importance") or 0)

 candidates=[]
 for q in query_variants(track):
  params={"q":q,"format":"jsonv2","addressdetails":1,"limit":6,"countrycodes":COUNTRY_CODES.get(track.get("country"),"")}
  r=session.get(NOMINATIM,params=params,timeout=30)
  r.raise_for_status()
  candidates.extend(r.json())
  time.sleep(1.05)
  if candidates:
   # Stop early once we have a strong distinctive-name match.
   ranked=sorted(candidates,key=score,reverse=True)
   display=norm(ranked[0].get("display_name"))
   hits=sum(1 for x in target_tokens if x in display)
   if hits>=1 and (not city or city in display or len(target_tokens)>=2):
    break
 if not candidates:return None

 ranked=sorted(candidates,key=score,reverse=True)
 best=ranked[0]
 display=norm(best.get("display_name"))
 token_hits=sum(1 for x in target_tokens if x in display)
 city_match=bool(city and city in display)
 alias_match=any(a and SequenceMatcher(None,a,display[:max(len(a)*2,25)]).ratio()>=0.55 for a in aliases)
 # Conservative acceptance. A distinctive venue token/alias must match;
 # city-only candidates are never saved unless the venue name itself contains the city.
 if not alias_match and target_tokens and token_hits<1:
  return None
 if city and not city_match and len(target_tokens)<2 and not alias_match:
  return None
 return best

def geocode_exact_address(address,country):
 if not address:return None
 params={"q":address,"format":"jsonv2","addressdetails":1,"limit":1,"countrycodes":COUNTRY_CODES.get(country,"")}
 r=session.get(NOMINATIM,params=params,timeout=30);r.raise_for_status()
 rows=r.json()
 time.sleep(1.05)
 return rows[0] if rows else None

def reverse_location(lat,lon):
 params={"lat":lat,"lon":lon,"format":"jsonv2","addressdetails":1,"zoom":18}
 r=session.get(NOMINATIM_REVERSE,params=params,timeout=30);r.raise_for_status()
 data=r.json()
 time.sleep(1.05)
 return data if data and data.get("address") else None

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
    if t.get("address") and (t.get("lat") is None or t.get("long") is None):
     exact=geocode_exact_address(t["address"],t.get("country"))
     if exact:
      t["lat"]=round(float(exact["lat"]),7)
      t["long"]=round(float(exact["lon"]),7)
      t["locationVerifiedAt"]=datetime.now(timezone.utc).isoformat()
      changed+=1
      print(i,t["name"],"->",t["address"],"[verified address geocode]",flush=True)
      continue
    gku=gku_lookup(t)
    if gku:
     if (gku.get("lat") is None or gku.get("long") is None) and gku.get("address"):
      exact=geocode_exact_address(gku["address"],t.get("country"))
      if exact:
       gku["lat"]=float(exact["lat"]);gku["long"]=float(exact["lon"])
     if not gku.get("address") and gku.get("lat") is not None and gku.get("long") is not None:
      rev=reverse_location(gku["lat"],gku["long"])
      if rev:gku["address"]=format_address(rev)
    if gku and gku.get("address") and gku.get("lat") is not None and gku.get("long") is not None:
     t["address"]=gku["address"]
     t["lat"]=round(float(gku["lat"]),7)
     t["long"]=round(float(gku["long"]),7)
     t["addressSource"]=gku["source"]
     t["locationSourceUrl"]=gku["url"]
     t["locationVerifiedAt"]=datetime.now(timezone.utc).isoformat()
     changed+=1
     print(i,t["name"],"->",t["address"],"[GoKartingUK]",flush=True)
    else:
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
