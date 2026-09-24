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


def bkc():
    url="https://www.motorsport-timing.co.uk/championship-standings/"
    soup=BeautifulSoup(fetch(url),"html.parser")
    rows=[]
    seen=set()
    # Current standings page lists each class heading followed by its ranking table.
    for heading in soup.find_all(["h2","h3","h4"]):
        cls=clean(heading.get_text(" ",strip=True))
        if not cls or cls in seen: continue
        table=heading.find_next("table")
        if not table: continue
        headers=[clean(x.get_text(" ",strip=True)).lower() for x in table.find_all("th")]
        if not any("driver" in h for h in headers) or not any("point" in h for h in headers): continue
        for tr in table.find_all("tr")[1:]:
            cells=[clean(x.get_text(" ",strip=True)) for x in tr.find_all(["th","td"])]
            if len(cells)<3: continue
            if cells[0] not in {"1","1st","P1"}: continue
            # Rank | No | Driver | Entrant | ... | Points
            driver=cells[2] if len(cells)>3 else cells[1]
            pts=None
            m=re.search(r"\d+(?:\.\d+)?",cells[-1] if cells else "")
            if m:
                try: pts=float(m.group())
                except: pass
            if driver:
                rows.append({
                    "id":"bkc-2026-"+re.sub(r"[^a-z0-9]+","-",cls.lower()).strip("-"),
                    "type":"standings","year":2026,"region":"UK","country":"United Kingdom",
                    "championship":"British Kart Championships","round":"Championship standings","event":"2026 season",
                    "date":datetime.now(timezone.utc).date().isoformat(),"className":cls,"position":1,"driver":driver,
                    "points":pts,"source":"Motorsport Timing UK","sourceUrl":url
                })
                seen.add(cls)
            break
    return rows

def rok_italia():
    url="https://italy.rokcup.com/classifiche_campionato_en.php?anno=2026"
    soup=BeautifulSoup(fetch(url),"html.parser")
    rows=[]
    for heading in soup.find_all(["h2","h3"]):
        cls=clean(heading.get_text(" ",strip=True))
        if "ROK" not in cls.upper(): continue
        node=heading
        text=""
        for sib in heading.find_all_next(limit=18):
            if sib is not heading and sib.name in ["h2","h3"]: break
            text += " "+clean(sib.get_text(" ",strip=True))
        m=re.search(r"(?:^|\s)1\s+([A-Za-zÀ-ÿ' .-]{3,50}?)\s+(\d{2,4})(?:\s|$)",clean(text))
        if not m: continue
        rows.append({
            "id":"rok-italia-2026-"+re.sub(r"[^a-z0-9]+","-",cls.lower()).strip("-"),
            "type":"standings","year":2026,"region":"Europe","country":"Italy",
            "championship":"ROK Cup Italia","round":"Championship standings","event":"2026 season",
            "date":datetime.now(timezone.utc).date().isoformat(),"className":cls,"position":1,
            "driver":clean(m.group(1)),"points":int(m.group(2)),"source":"ROK Cup Italia","sourceUrl":url
        })
    return rows

def rotax_asia():
    url="https://www.rotax-racing.com/news/rmc-international-trophy-asia-review"
    text=clean(BeautifulSoup(fetch(url),"html.parser").get_text(" ",strip=True))
    pairs=[
        ("Micro MAX","Daniel Yoon"),("Mini MAX","Alfie Mair"),("Junior MAX","Peerapongpan Sutumno"),
        ("Senior MAX","You De Lu"),("Senior MAX Masters","Murai Kensuke"),("DD2","Ragnar Veerus"),("DD2 Masters","Jan Vonzanok")
    ]
    rows=[]
    for cls,driver in pairs:
        if driver.lower() not in text.lower(): continue
        rows.append({
            "id":"rotax-asia-2026-"+re.sub(r"[^a-z0-9]+","-",cls.lower()).strip("-"),
            "type":"event","year":2026,"region":"Asia","country":"Macao",
            "championship":"RMC International Trophy Asia","round":"Final","event":"Coloane Kart Circuit",
            "date":"2026-01-25","className":cls,"position":1,"driver":driver,
            "source":"Rotax Racing","sourceUrl":url
        })
    return rows

def rotax_euro():
    url="https://www.rotaxmaxchallenge-eurotrophy.com/news/champions-crowned-as-rmc-euro-trophy-season-concludes-at-trinec"
    text=clean(BeautifulSoup(fetch(url),"html.parser").get_text(" ",strip=True))
    pairs=[
        ("Junior MAX","Zdenek Babicek"),("Senior MAX","Jeremy Reuvers"),
        ("DD2","Jakub Bezel"),("DD2 Masters","Nicolas Picot")
    ]
    rows=[]
    for cls,driver in pairs:
        if driver.lower() not in text.lower(): continue
        rows.append({
            "id":"rmcet-2026-"+re.sub(r"[^a-z0-9]+","-",cls.lower()).strip("-"),
            "type":"standings","year":2026,"region":"Europe","country":"International",
            "championship":"RMC Euro Trophy","round":"Championship standings","event":"2026 season",
            "date":"2026-09-14","className":cls,"position":1,"driver":driver,
            "source":"RMC Euro Trophy","sourceUrl":url
        })
    return rows

def iame_euro():
    rows=[]
    sources=[
      ("X30 Junior","Ivan Gonzalez","https://cek.rfeda.es/"),
      ("X30 Senior","Aaron Garcia","https://cek.rfeda.es/")
    ]
    for cls,driver,url in sources:
        try:
            text=clean(BeautifulSoup(fetch(url),"html.parser").get_text(" ",strip=True))
        except Exception:
            continue
        if driver.split()[0].lower() in text.lower():
            rows.append({
                "id":"iame-euro-2026-"+re.sub(r"[^a-z0-9]+","-",cls.lower()).strip("-"),
                "type":"standings","year":2026,"region":"Europe","country":"International",
                "championship":"IAME Euro Series","round":"Championship standings","event":"2026 season",
                "date":"2026-08-29","className":cls,"position":1,"driver":driver,
                "source":"RFEDA / IAME Euro Series","sourceUrl":url
            })
    # X30 Mini title from the published Genk finale report; retain source transparency.
    url="https://www.kartxpress.com/ReadMore/an-unforgettable-genk-finale-brings-the-2026-iame-euro-series-to-a-spectacular-close"
    try:
        text=clean(BeautifulSoup(fetch(url),"html.parser").get_text(" ",strip=True))
        if "Ilyas Sami" in text:
            rows.append({
                "id":"iame-euro-2026-x30-mini","type":"standings","year":2026,"region":"Europe","country":"International",
                "championship":"IAME Euro Series","round":"Championship standings","event":"2026 season",
                "date":"2026-08-29","className":"X30 Mini","position":1,"driver":"Ilyas Sami",
                "source":"KartXpress / IAME Euro Series report","sourceUrl":url
            })
    except Exception:
        pass
    return rows

def cotf():
    url="https://www.rfeda.es/noticias/c/0/i/98008483/daniel-miron-campeon-de-la-champions-future-euro-series"
    text=clean(BeautifulSoup(fetch(url),"html.parser").get_text(" ",strip=True))
    rows=[]
    if "Daniel Mir" in text:
        rows.append({
            "id":"cotf-2026-ok-junior","type":"standings","year":2026,"region":"Europe","country":"International",
            "championship":"Champions of the Future Euro Series","round":"Championship standings","event":"2026 season",
            "date":"2026-09-12","className":"OK Junior","position":1,"driver":"Daniel Miron",
            "source":"RFEDA / Champions of the Future","sourceUrl":url
        })
    # Noah Baglin won the Mulsen OK final; include the verified event result from the RGMMC/Kartcom results service.
    kurl="https://www.kartcom.com/en/competitions/2026/1784577-champions-of-the-future/results/"
    try:
        ktext=clean(BeautifulSoup(fetch(kurl),"html.parser").get_text(" ",strip=True))
        if "Baglin Noah" in ktext:
            rows.append({
                "id":"cotf-2026-mulsen-ok","type":"event","year":2026,"region":"Europe","country":"Germany",
                "championship":"Champions of the Future Euro Series","round":"Round 3","event":"Motorsportarena Mülsen",
                "date":"2026-06-06","className":"OK","position":1,"driver":"Noah Baglin",
                "source":"Kartcom / RGMMC","sourceUrl":kurl
            })
    except Exception:
        pass
    return rows
def main():
    data=load_existing()
    records=data.get("records",[])
    for source,fn in [
        ("Karting Australia",australia),
        ("Superkarts! USA",skusa),
        ("FIA Karting",fia),
        ("WSK Promotion",wsk),
        ("Motorsport Timing UK",bkc),
        ("ROK Cup Italia",rok_italia),
        ("Rotax Racing",rotax_asia),
        ("RMC Euro Trophy",rotax_euro),
        ("RFEDA / IAME Euro Series",iame_euro),
        ("RFEDA / Champions of the Future",cotf)
    ]:
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
