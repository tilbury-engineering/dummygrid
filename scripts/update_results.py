#!/usr/bin/env python3
import json, re
from datetime import datetime, timezone
import requests
from bs4 import BeautifulSoup

OUT="public/results.json"
UA={"User-Agent":"Mozilla/5.0 (compatible; DummyGrid-ResultsBot/1.0; +https://github.com/tilbury-engineering/dummygrid)"}

def fetch(url):
    r=requests.get(url,headers=UA,timeout=25)
    r.raise_for_status()
    return r.text

def load_existing():
    try:
        with open(OUT,"r",encoding="utf-8") as f:return json.load(f)
    except Exception:return {"records":[]}

def replace_source(records, source, new_rows):
    kept=[r for r in records if r.get("source")!=source]
    return kept+new_rows if new_rows else records

def clean(x):
    return re.sub(r"\s+"," ",x or "").strip()

def australia():
    url="https://www.karting.net.au/karting-australia/champions/australian-kart-championship-stars-of-karting-cik-championship-round-winners/"
    soup=BeautifulSoup(fetch(url),"html.parser")
    rows=[]
    # Official page contains a year/round winners table. Parse 2026 rows if present.
    table=None
    for t in soup.find_all("table"):
        if "2026" in clean(t.get_text(" ",strip=True)) and "KZ2" in clean(t.get_text(" ",strip=True)):
            table=t;break
    if not table:return rows
    trs=table.find_all("tr")
    headers=[]
    current_year=None
    rounds=[]
    for tr in trs:
        cells=[clean(x.get_text(" ",strip=True)) for x in tr.find_all(["th","td"])]
        if not cells:continue
        if any("Rd 1" in c for c in cells):
            rounds=cells
            continue
        if cells[0]=="2026":
            current_year=2026
            continue
        if current_year!=2026:continue
        cls=cells[0]
        if cls in {"KZ2","KA2","X30","TaG 125","KA3 Snr","KA3 Jnr","Cadet 12","Cadet 9"}:
            event_names=["Coffs Harbour, NSW","Ipswich, QLD","Townsville, QLD","Seymour, VIC","Bolivar, SA"]
            dates=["2026-03-15","2026-05-17","2026-07-05","2026-09-06","2026-10-18"]
            for idx,winner in enumerate(cells[1:6]):
                winner=clean(winner)
                if not winner:continue
                rows.append({
                    "id":f"akc-2026-r{idx+1}-{re.sub('[^a-z0-9]+','-',cls.lower()).strip('-')}",
                    "type":"event","year":2026,"region":"Australia","country":"Australia",
                    "championship":"Australian Kart Championship","round":f"Round {idx+1}",
                    "event":event_names[idx],"date":dates[idx],"className":cls.replace("Snr","Senior").replace("Jnr","Junior"),
                    "position":1,"driver":winner,"team":"","source":"Karting Australia","sourceUrl":url
                })
    return rows

def skusa():
    url="https://superkartsusa.com/national/skusa-pro-tour/series-points.html"
    soup=BeautifulSoup(fetch(url),"html.parser")
    text=clean(soup.get_text(" ",strip=True))
    classes=["MICRO SWIFT","MINI SWIFT","KA100 JUNIOR","KA100 SENIOR","X30 JUNIOR","KA100 MASTER","PRO X30","PRO SHIFTER"]
    rows=[]
    for cls in classes:
        m=re.search(re.escape(cls)+r".{0,120}?1st\s+([A-Za-zÀ-ÿ' .-]+?)\s+(\d+(?:\.\d+)?)\b",text,re.I)
        if not m:continue
        driver=clean(m.group(1)); points=float(m.group(2))
        rows.append({
            "id":"skusa-2026-"+re.sub(r"[^a-z0-9]+","-",cls.lower()).strip("-"),
            "type":"standings","year":2026,"region":"USA","country":"United States",
            "championship":"SKUSA Pro Tour","round":"Championship standings","event":"2026 season",
            "date":datetime.now(timezone.utc).date().isoformat(),"className":cls.title().replace("Ka100","KA100").replace("X30","X30"),
            "position":1,"driver":driver,"points":points,"source":"Superkarts! USA","sourceUrl":url
        })
    return rows

def fia():
    url="https://www.fiakarting.com/championshipstandings/2026-fia-karting-team-championship-standings-junior"
    soup=BeautifulSoup(fetch(url),"html.parser")
    rows=[]
    for tr in soup.find_all("tr"):
        cells=[clean(x.get_text(" ",strip=True)) for x in tr.find_all(["th","td"])]
        if len(cells)>=3 and cells[0] in {"1","1st"}:
            team=cells[1]
            pts=re.findall(r"\d+",cells[-1])
            rows.append({
                "id":"fia-2026-team-junior-1","type":"standings","year":2026,"region":"Global","country":"International",
                "championship":"FIA Karting Team Championship","round":"Championship standings","event":"2026 season",
                "date":datetime.now(timezone.utc).date().isoformat(),"className":"Junior","position":1,"driver":team,
                "points":int(pts[-1]) if pts else None,"source":"FIA Karting","sourceUrl":url
            })
            break
    return rows

def wsk():
    url="https://www.wskarting.it/NEWS/1821"
    soup=BeautifulSoup(fetch(url),"html.parser")
    text=clean(soup.get_text(" ",strip=True))
    pairs=[
        ("KZ2","Max Orlov"),("OK","Qarrar Firhand"),("OK Junior","Matvei Dergunov"),
        ("MINI U10","Sasha Miras Y Munoz"),("MINI Gr.3","Mair"),("OK-N Junior","Hedfors"),("OK-N","Giudice")
    ]
    rows=[]
    for cls,driver in pairs:
        if driver.lower() in text.lower():
            rows.append({
                "id":"wsk-2026-euro-"+re.sub(r"[^a-z0-9]+","-",cls.lower()).strip("-"),
                "type":"event","year":2026,"region":"Europe","country":"Italy","championship":"WSK Euro Series",
                "round":"Round 3 / Championship finale","event":"Cremona Circuit","date":"2026-07-11",
                "className":cls,"position":1,"driver":driver,"source":"WSK Promotion","sourceUrl":url
            })
    return rows

def main():
    data=load_existing()
    records=data.get("records",[])
    for source,fn in [("Karting Australia",australia),("Superkarts! USA",skusa),("FIA Karting",fia),("WSK Promotion",wsk)]:
        try:
            fresh=fn()
            if fresh: records=replace_source(records,source,fresh)
            print(source,len(fresh))
        except Exception as e:
            print(source,"refresh failed:",e)
    # stable dedupe
    seen=set(); out=[]
    for r in sorted(records,key=lambda x:(str(x.get("date","")),x.get("championship",""),x.get("className","")),reverse=True):
        key=r.get("id") or (r.get("championship"),r.get("round"),r.get("className"),r.get("driver"))
        if str(key) in seen:continue
        seen.add(str(key));out.append(r)
    with open(OUT,"w",encoding="utf-8") as f:
        json.dump({"updatedAt":datetime.now(timezone.utc).isoformat(),"records":out},f,ensure_ascii=False,indent=2)
        f.write("\n")
    print("wrote",len(out),"records")

if __name__=="__main__":main()
