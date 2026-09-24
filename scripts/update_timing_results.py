#!/usr/bin/env python3
import json,re,time,os
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

OUT=Path("public/timing-results.json")
UA={"User-Agent":"Mozilla/5.0 (compatible; DummyGridTimingBot/1.0; +https://github.com/tilbury-engineering/dummygrid)"}
BASE="https://systems.alphatiming.co.uk"
SERIES={
 "ukc":"Ultimate Karting Championship",
 "bkc":"The Kart Championship",
 "nkc":"National Kart Cup",
 "accesskarting":"Access Karting",
 "wmkc":"Whilton Mill Kart Club"
}
session=requests.Session();session.headers.update(UA)

def get(url):
 for attempt in range(6):
  r=session.get(url,timeout=30)
  if r.status_code==429:
   wait=2.5*(attempt+1)
   print(" rate limited; sleeping",wait,"sec",flush=True)
   time.sleep(wait)
   continue
  r.raise_for_status()
  time.sleep(.65)
  return r.text
 raise RuntimeError("Alpha Timing rate limit persisted for "+url)

def clean(x): return re.sub(r"\s+"," ",x or "").strip()

def load_existing():
 try:return json.loads(OUT.read_text())
 except:return {"providers":{"alpha":{}}}

def parse_events(slug):
 soup=BeautifulSoup(get(f"{BASE}/{slug}"),"html.parser")
 events=[];seen=set()
 # Completed Alpha meetings are linked from the championship page using /e/<internalEventId>.
 # /event/<id> links are largely upcoming/public event pages and are not the correct result ID.
 for a in soup.find_all("a",href=True):
  href=a["href"]
  m=re.search(rf"/{re.escape(slug)}/e/(\d+)$",href)
  if not m: continue
  eid=m.group(1)
  if eid in seen: continue
  card=a
  for _ in range(5):
   if not getattr(card,"parent",None):break
   card=card.parent
   txt=clean(card.get_text(" ",strip=True))
   if re.search(r"20\d{2}",txt) and len(txt)<650:break
  txt=clean(card.get_text(" ",strip=True))
  title=clean(a.get_text(" ",strip=True)) or txt
  events.append({"id":eid,"title":title,"summary":txt,"url":urljoin(BASE,href)})
  seen.add(eid)
 return events

def classify_type(text):
 t=text.lower()
 if "practice" in t:return "Practice"
 if "qualifying" in t:return "Qualifying"
 if "heat" in t:return "Heat"
 if "prefinal" in t or "pre-final" in t or "super heat" in t:return "PreFinal"
 if "final" in t or "repechage" in t:return "Final"
 return "Session"

def parse_event(slug,eid,event_url=None):
 url=event_url or f"{BASE}/{slug}/e/{eid}"
 soup=BeautifulSoup(get(url),"html.parser")
 title=clean(soup.find("h1").get_text(" ",strip=True) if soup.find("h1") else "")
 body=clean(soup.get_text(" ",strip=True))
 dm=re.search(r"(\d{2}/\d{2}/\d{4})\s*-\s*(\d{2}/\d{2}/\d{4})",body)
 sessions=[];seen=set()
 for a in soup.find_all("a",href=True):
  href=a["href"]
  m=re.search(rf"/{re.escape(slug)}/e/(\d+)/s/(\d+)(?:/result)?$",href)
  if not m:continue
  internal_eid=m.group(1); sid=m.group(2)
  if sid in seen:continue
  parent=a
  for _ in range(5):
   if not getattr(parent,"parent",None):break
   parent=parent.parent
   txt=clean(parent.get_text(" ",strip=True))
   if ("Finished" in txt or "Live" in txt or "Scheduled" in txt) and len(txt)<800:break
  txt=clean(parent.get_text(" ",strip=True))
  label=clean(a.get_text(" ",strip=True)) or txt
  race=re.search(r"Race\s*(\d+)\s*:\s*(.+?)(?:\s+Finished|\s+Live|\s+Scheduled|$)",txt,re.I)
  winner=re.search(r"(?:Practice|Qualifying|Heat|PreFinal|Final) Winner:\s*(.+?)(?:\s{2,}|$)",txt,re.I)
  sessions.append({
   "id":sid,"eventId":str(eid),"internalEventId":internal_eid,
   "raceNumber":int(race.group(1)) if race else None,
   "name":clean(race.group(2)) if race else label,
   "type":classify_type(txt),"winner":clean(winner.group(1)) if winner else None,
   "text":txt,"url":urljoin(BASE,href.rstrip("/")+"/result")
  })
  seen.add(sid)
 return {"id":str(eid),"title":title or clean(body[:100]) or f"Event {eid}","dateStart":dm.group(1) if dm else None,"dateEnd":dm.group(2) if dm else None,"url":url,"sessions":sessions}

def parse_session(slug,eid,sid,url=None):
 url=url or f"{BASE}/{slug}/e/{eid}/s/{sid}/result"
 soup=BeautifulSoup(get(url),"html.parser")
 title=clean((soup.find("h1") or {}).get_text(" ",strip=True) if soup.find("h1") else "")
 body=clean(soup.get_text(" ",strip=True))
 meta={}
 m=re.search(r"Laps\s+(\d+)",body,re.I)
 if m:meta["laps"]=int(m.group(1))
 m=re.search(r"Start\s+(\d{1,2}:\d{2})",body,re.I)
 if m:meta["start"]=m.group(1)
 # Pick table with strongest result-like header set.
 best=None;score=-1
 for t in soup.find_all("table"):
  heads=[clean(x.get_text(" ",strip=True)) for x in t.find_all("th")]
  joined=" ".join(heads).lower()
  sc=sum(k in joined for k in ["pos","no","name","driver","gap","time","laps","chassis","engine","team"])
  if sc>score:best=t;score=sc
 headers=[clean(x.get_text(" ",strip=True)) for x in best.find_all("thead")[0].find_all("th")] if best and best.find("thead") else []
 rows=[]
 if best:
  tbody=best.find("tbody") or best
  for tr in tbody.find_all("tr"):
   cells=[clean(td.get_text(" ",strip=True)) for td in tr.find_all("td")]
   if cells:rows.append(cells)
 return {"id":str(sid),"eventId":str(eid),"title":title or "Session result","url":url,"meta":meta,"headers":headers,"rows":rows}

# Each run advances the archive by one completed meeting per Alpha series.
def main():
 old=load_existing()
 out={"updatedAt":datetime.now(timezone.utc).isoformat(),"providers":{"alpha":{}}}
 for slug,name in SERIES.items():
  print("\nSERIES",slug,name,flush=True)
  try: events=parse_events(slug)
  except Exception as e:
   print(" event index failed",e,flush=True)
   prev=old.get("providers",{}).get("alpha",{}).get(slug,{})
   out["providers"]["alpha"][slug]=prev
   continue
  print(" events",len(events),flush=True)
  # Preserve the archive and add at most one new completed meeting per series on each run.
  # This deliberately limits traffic to Alpha Timing and allows the archive to grow safely.
  prev_series=old.get("providers",{}).get("alpha",{}).get(slug,{"events":{}})
  event_map=dict(prev_series.get("events",{}))
  added=0
  for e in events:
   eid=e["id"]
   existing=event_map.get(eid)
   if existing and existing.get("sessions") and existing.get("sessionData"):
    continue
   print("  indexing completed event",eid,e["title"][:70],flush=True)
   try: ev=parse_event(slug,eid,e.get("url"))
   except Exception as ex:
    print("   event failed",ex,flush=True);continue
   if not ev["sessions"]:
    print("   no sessions on completed link",flush=True)
    continue
   print("   sessions",len(ev["sessions"]),flush=True)
   sess_data={}
   for n,sess in enumerate(ev["sessions"]):
    try:
     sd=parse_session(slug,eid,sess["id"],sess.get("url"))
     sess_data[sess["id"]]=sd
     if n%8==0: print("    classified",n+1,"/",len(ev["sessions"]),"rows",len(sd.get("rows",[])),flush=True)
    except Exception as ex:
     print("    session",sess["id"],"failed",ex,flush=True)
   ev["sessionData"]=sess_data
   event_map[eid]=ev
   added=1
   break
  print(" added",added,"archive events",len(event_map),flush=True)
  out["providers"]["alpha"][slug]={"name":name,"events":event_map}
 OUT.write_text(json.dumps(out,ensure_ascii=False,separators=(",",":")))
 print("\nwrote",OUT,OUT.stat().st_size,"bytes",flush=True)

if __name__=="__main__":main()
