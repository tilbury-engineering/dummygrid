#!/usr/bin/env python3
import json,re
from pathlib import Path
SOURCE="https://ebooks.motorsportuk.org/motorsport-uk-ncr-2026-edition-2/0952123001742394230/p18"
VENUES=["Barton Stacey","Bayford Meadows","Bishopscourt","Blackbushe","Boyndie Drome","Buckmore Park","Clay Pigeon Raceway","Crail Raceway","Darley Moor","Dunkeswell","Ellough Park","Fulbeck","Glan-Y-Gors","Hooton Park","Kimbolton","Kirkistown","Larkhall","Littleferry","Llandow","Lydd Kart Circuit","Nutts Corner","P. F. International","Portstewart","Rissington","Rowrah","Rye House","Shenington","Sorel","St. Sampson's","Three Sisters","Warden Law","Whilton Mill","Wombwell Sports Stadium"]
ALIASES={"P. F. International":["PF International","Paul Fletcher International","PFI"],"Kimbolton":["Kimbolton Kart Circuit"],"Larkhall":["Larkhall Circuit"],"Shenington":["Shenington Kart Racing Club"],"Warden Law":["Warden Law Kart Club"],"Whilton Mill":["Whilton Mill Kart Club"],"Rye House":["Rye House Kart Raceway"],"Three Sisters":["Three Sisters Circuit"]}
def norm(s): return re.sub(r"[^a-z0-9]+"," ",(s or "").lower()).strip()
def match(t,name):
 vals=[t.get("name","")]+t.get("aliases",[])
 targets=[name]+ALIASES.get(name,[])
 for v in vals:
  nv=norm(v)
  for x in targets:
   nx=norm(x)
   if nv==nx or (len(nx)>6 and (nx in nv or nv in nx)): return True
 return False
data=json.loads(Path("public/tracks.json").read_text(encoding="utf-8")); tracks=data.get("tracks",[])
matched=0; missing=[]
for name in VENUES:
 hit=next((t for t in tracks if t.get("country")=="United Kingdom" and match(t,name)),None)
 if not hit: missing.append(name); continue
 hit["motorsportUkLicensed"]=True; hit["motorsportUkSource"]=SOURCE; matched+=1
data["motorsportUkImport"]={"source":SOURCE,"listed":len(VENUES),"matched":matched,"unmatched":missing}
Path("public/tracks.json").write_text(json.dumps(data,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
print("Motorsport UK kart venues",len(VENUES),"matched",matched,"unmatched",len(missing))
if missing: print("unmatched:",", ".join(missing))
