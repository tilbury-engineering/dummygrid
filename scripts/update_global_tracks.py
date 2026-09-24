#!/usr/bin/env python3
import json, math, re, time, hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import requests
import reverse_geocoder as rg
import pycountry
import pycountry_convert as pc

PUBLIC=Path("public/tracks.json")
SUMMARY=Path("public/tracks-summary.json")
OVERPASS_ENDPOINTS=[
 "https://overpass-api.de/api/interpreter",
 "https://overpass.kumi.systems/api/interpreter",
 "https://overpass.private.coffee/api/interpreter"
]
UA={"User-Agent":"DummyGridGlobalTracks/1.0 (+https://github.com/tilbury-engineering/dummygrid)"}
session=requests.Session();session.headers.update(UA)

BBOXES={
 "Europe":(34,-25,72,45),
 "Africa":(-36,-20,38,55),
 "North America West":(5,-170,84,-120),
 "North America Central":(5,-120,84,-90),
 "North America East":(5,-90,84,-50),
 "South America":(-60,-90,15,-30),
 "Asia":(5,25,80,180),
 "Oceania":(-50,95,10,180)
}

def query_for_bbox(box):
 s,w,n,e=box
 return f"""[out:json][timeout:90];
(
  nwr[\"sport\"=\"karting\"]({s},{w},{n},{e});
  nwr[\"attraction\"=\"karting\"]({s},{w},{n},{e});
  nwr[\"amenity\"=\"karting\"]({s},{w},{n},{e});
  nwr[\"karting\"=\"yes\"]({s},{w},{n},{e});
);
out center tags;"""


CONTINENT_BY_CC={
 "GB":"Europe","IE":"Europe","FR":"Europe","DE":"Europe","IT":"Europe","ES":"Europe","PT":"Europe","BE":"Europe","NL":"Europe","LU":"Europe","CH":"Europe","AT":"Europe","DK":"Europe","NO":"Europe","SE":"Europe","FI":"Europe","IS":"Europe","PL":"Europe","CZ":"Europe","SK":"Europe","HU":"Europe","RO":"Europe","BG":"Europe","GR":"Europe","HR":"Europe","SI":"Europe","RS":"Europe","BA":"Europe","ME":"Europe","MK":"Europe","AL":"Europe","EE":"Europe","LV":"Europe","LT":"Europe","UA":"Europe","MD":"Europe","BY":"Europe","TR":"Europe","CY":"Europe","MT":"Europe",
 "US":"North America","CA":"North America","MX":"North America","GT":"North America","BZ":"North America","SV":"North America","HN":"North America","NI":"North America","CR":"North America","PA":"North America","CU":"North America","DO":"North America","JM":"North America","TT":"North America","BS":"North America","BB":"North America",
 "BR":"South America","AR":"South America","CL":"South America","PE":"South America","CO":"South America","EC":"South America","UY":"South America","PY":"South America","BO":"South America","VE":"South America","GY":"South America","SR":"South America",
 "ZA":"Africa","BW":"Africa","NA":"Africa","ZW":"Africa","ZM":"Africa","AO":"Africa","MZ":"Africa","KE":"Africa","TZ":"Africa","UG":"Africa","RW":"Africa","ET":"Africa","GH":"Africa","NG":"Africa","CI":"Africa","SN":"Africa","MA":"Africa","DZ":"Africa","TN":"Africa","EG":"Africa","MU":"Africa","MG":"Africa",
 "AU":"Oceania","NZ":"Oceania","FJ":"Oceania","PG":"Oceania","NC":"Oceania","MP":"Oceania",
 "AW":"North America","PR":"North America","GP":"North America","MQ":"North America",
 "GF":"South America","FO":"Europe","GG":"Europe","IM":"Europe","JE":"Europe","LI":"Europe","MC":"Europe","AX":"Europe","RU":"Europe","XK":"Europe",
 "BN":"Asia","PS":"Asia","SY":"Asia","TJ":"Asia","TM":"Asia",
 "DJ":"Africa","GA":"Africa","TG":"Africa",
 "JP":"Asia","CN":"Asia","HK":"Asia","MO":"Asia","TW":"Asia","KR":"Asia","KP":"Asia","IN":"Asia","PK":"Asia","BD":"Asia","LK":"Asia","NP":"Asia","TH":"Asia","MY":"Asia","SG":"Asia","ID":"Asia","PH":"Asia","VN":"Asia","KH":"Asia","LA":"Asia","MM":"Asia","AE":"Asia","SA":"Asia","QA":"Asia","BH":"Asia","KW":"Asia","OM":"Asia","IL":"Asia","JO":"Asia","LB":"Asia","IR":"Asia","IQ":"Asia","KZ":"Asia","UZ":"Asia","AZ":"Asia","GE":"Asia","AM":"Asia"
}

def norm(s):
 # Unicode-aware so names in Cyrillic, Korean, Arabic, etc. dedupe correctly.
 return re.sub(r"[^\w]+"," ",(s or "").casefold(),flags=re.UNICODE).replace("_"," ").strip()

def slugify(s):
 base=re.sub(r"[^a-z0-9]+","-",norm(s)).strip("-")
 return base[:70] or "kart-track"

def hav_km(a,b,c,d):
 R=6371.0
 p1,p2=math.radians(a),math.radians(c)
 dp=math.radians(c-a);dl=math.radians(d-b)
 x=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
 return 2*R*math.asin(math.sqrt(x))

def continent_name(cc):
 if not cc:return ""
 try:
  code=pc.country_alpha2_to_continent_code(cc.upper())
  return {"AF":"Africa","AS":"Asia","EU":"Europe","NA":"North America","SA":"South America","OC":"Oceania","AN":"Antarctica"}.get(code,"")
 except:
  return CONTINENT_BY_CC.get(cc.upper(),"")

def country_name(cc):
 try:return pycountry.countries.get(alpha_2=cc.upper()).name
 except:return cc.upper()

def fetch_one(query,label):
 last=None
 for endpoint in OVERPASS_ENDPOINTS:
  for i in range(2):
   try:
    print("querying",label,endpoint,flush=True)
    r=session.post(endpoint,data={"data":query},timeout=140)
    if r.status_code in (429,502,503,504):
     time.sleep(4*(i+1));continue
    r.raise_for_status()
    return r.json().get("elements",[])
   except Exception as e:
    last=e
    print(" overpass failed",label,endpoint,e,flush=True)
    time.sleep(3*(i+1))
 if last:raise last
 return []

def fetch_overpass():
 merged={}
 with ThreadPoolExecutor(max_workers=3) as pool:
  futs={pool.submit(fetch_one,query_for_bbox(box),label):label for label,box in BBOXES.items()}
  for fut in as_completed(futs):
   label=futs[fut]
   try:
    rows=fut.result()
   except Exception as e:
    print(label,"SKIPPED after all mirrors failed:",e,flush=True)
    continue
   print(label,"elements",len(rows),flush=True)
   for el in rows:
    key=(el.get("type"),el.get("id"))
    merged[key]=el
 return list(merged.values())

def coords(el):
 if "lat" in el and "lon" in el:return float(el["lat"]),float(el["lon"])
 c=el.get("center") or {}
 if "lat" in c and "lon" in c:return float(c["lat"]),float(c["lon"])
 return None,None

def osm_url(el):
 typ=el.get("type");oid=el.get("id")
 return f"https://www.openstreetmap.org/{typ}/{oid}" if typ and oid else ""

def address_from_tags(t):
 street=t.get("addr:street")
 num=t.get("addr:housenumber")
 city=t.get("addr:city") or t.get("addr:town") or t.get("addr:village")
 pc=t.get("addr:postcode")
 country=t.get("addr:country")
 parts=[]
 if street:parts.append(((num+" ") if num else "")+street)
 for x in [city,pc,country]:
  if x and x not in parts:parts.append(x)
 return ", ".join(parts)

def choose_name(t,el):
 # Do not publish anonymous OSM geometry as fake-looking venue names.
 return (t.get("name") or t.get("operator") or t.get("brand") or "").strip()

def classify(t):
 indoor=str(t.get("indoor","")).lower() in ("yes","true","1") or bool(t.get("building"))
 return "Indoor" if indoor else "Outdoor"

def likely_duplicate(existing,name,lat,lon):
 nn=norm(name)
 best=None;bestd=99999
 for t in existing:
  if t.get("lat") is None or t.get("long") is None:continue
  d=hav_km(lat,lon,float(t["lat"]),float(t["long"]))
  if d>3:continue
  en=norm(t.get("name"))
  overlap=bool(nn and en and (nn in en or en in nn or len(set(nn.split())&set(en.split()))>=2))
  if overlap and d<bestd:
   best=t;bestd=d
 return best

def cleanup_existing(tracks):
 # Remove anonymous placeholders created by the first OSM import and collapse
 # duplicate OSM geometries that describe the same named venue.
 cleaned=[];pruned_generic=0;merged_nearby=0
 for t in tracks:
  if t.get("source")=="OpenStreetMap global karting import" and re.fullmatch(r"Karting venue \d+",t.get("name") or "",re.I):
   pruned_generic+=1
   continue
  name_key=norm(t.get("name"))
  duplicate=None
  if t.get("source")=="OpenStreetMap global karting import" and name_key and t.get("lat") is not None and t.get("long") is not None:
   for e in cleaned:
    if e.get("source")!="OpenStreetMap global karting import" or norm(e.get("name"))!=name_key:
     continue
    if e.get("lat") is None or e.get("long") is None:
     continue
    if hav_km(float(t["lat"]),float(t["long"]),float(e["lat"]),float(e["long"]))<=0.15:
     duplicate=e;break
  if duplicate:
   for key in ("website","address","addressSource","city","region","continent","osmSource"):
    if not duplicate.get(key) and t.get(key):duplicate[key]=t[key]
   merged_nearby+=1
  else:
   cleaned.append(t)
 by_country={c.name:c.alpha_2 for c in pycountry.countries}
 aliases={"United Kingdom":"GB","United States":"US","Russia":"RU","Russian Federation":"RU","South Korea":"KR","Korea, Republic of":"KR","Taiwan, Province of China":"TW","Czech Republic":"CZ","Macao":"MO","Kosovo":"XK","XK":"XK"}
 for t in cleaned:
  if not t.get("continent"):
   cc=aliases.get(t.get("country")) or by_country.get(t.get("country"))
   if cc:t["continent"]=continent_name(cc)
 return cleaned,pruned_generic,merged_nearby

def main():
 data=json.loads(PUBLIC.read_text(encoding="utf-8"))
 tracks,pruned_generic,merged_nearby=cleanup_existing(data.get("tracks",[]))
 print("cleanup generic",pruned_generic,"nearby duplicates",merged_nearby,flush=True)
 elems=fetch_overpass()
 raw=[]
 for el in elems:
  lat,lon=coords(el)
  if lat is None:continue
  tags=el.get("tags") or {}
  # A usable directory entry needs a human-readable venue identity.
  if not choose_name(tags,el):
   continue
  raw.append((el,tags,lat,lon))
 print("overpass elements",len(elems),"named venues",len(raw),flush=True)

 # Offline nearest-city/country resolution in one batch.
 geo=rg.search([(x[2],x[3]) for x in raw],mode=1) if raw else []
 added=0;merged=0;seen_ids={t.get("id") for t in tracks}
 for (el,tags,lat,lon),g in zip(raw,geo):
  name=choose_name(tags,el)
  dup=likely_duplicate(tracks,name,lat,lon)
  cc=(tags.get("addr:country") or tags.get("country") or g.get("cc") or "").upper()
  country=country_name(cc) if cc else "Unknown"
  city=tags.get("addr:city") or tags.get("addr:town") or tags.get("addr:village") or g.get("name") or ""
  region=tags.get("addr:state") or g.get("admin1") or ""
  website=tags.get("website") or tags.get("contact:website") or ""
  addr=address_from_tags(tags)
  src=osm_url(el)
  if dup:
   # Never overwrite curated/verified values; only fill gaps.
   if not dup.get("website") and website:dup["website"]=website
   if not dup.get("city") and city:dup["city"]=city
   if not dup.get("region") and region:dup["region"]=region
   if not dup.get("country") and country!="Unknown":dup["country"]=country
   if not dup.get("continent") and cc:dup["continent"]=continent_name(cc)
   dup.setdefault("osmSource",src)
   merged+=1
   continue

  base=slugify(name)
  hid=hashlib.sha1(f"{el.get('type')}:{el.get('id')}".encode()).hexdigest()[:8]
  tid=base
  if tid in seen_ids:tid=f"{base}-{hid}"
  seen_ids.add(tid)
  rec={
   "id":tid,"name":name,"city":city,"region":region,"country":country,
   "continent":continent_name(cc),"series":[],"website":website,
   "source":"OpenStreetMap global karting import","osmSource":src,
   "address":addr,"lat":round(lat,7),"long":round(lon,7),
   "addressSource":"OpenStreetMap" if addr else "",
   "venueType":classify(tags),"kartType":"Unknown"
  }
  tracks.append(rec);added+=1

 tracks.sort(key=lambda t:((t.get("country") or "ZZZ"),(t.get("name") or "")))
 data["tracks"]=tracks
 data["updatedAt"]=time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
 data["globalImport"]={"source":"OpenStreetMap / Overpass","elements":len(elems),"namedVenues":len(raw),"added":added,"merged":merged,"prunedGeneric":pruned_generic,"mergedNearby":merged_nearby}
 text=json.dumps(data,ensure_ascii=False,separators=(",",":"))+"\n"
 PUBLIC.write_text(text,encoding="utf-8")
 country_counts={}
 continent_counts={}
 for t in tracks:
  country=t.get("country") or "Unknown"
  continent=t.get("continent") or "Unknown"
  country_counts[country]=country_counts.get(country,0)+1
  continent_counts[continent]=continent_counts.get(continent,0)+1
 summary={
  "updatedAt":data["updatedAt"],
  "totalTracks":len(tracks),
  "countryCount":len([x for x in country_counts if x!="Unknown"]),
  "countries":dict(sorted(country_counts.items())),
  "continents":dict(sorted(continent_counts.items()))
 }
 SUMMARY.write_text(json.dumps(summary,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
 print("added",added,"merged",merged,"total",len(tracks),"countries",summary["countryCount"],flush=True)

if __name__=="__main__":main()
