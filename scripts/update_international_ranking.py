#!/usr/bin/env python3
import json, re
from datetime import datetime, timezone
import requests
from bs4 import BeautifulSoup

OUT="public/international-ranking.json"
URL="https://www.fiakarting.com/page/international-karting-ranking-classification"
UA={"User-Agent":"Mozilla/5.0 (compatible; KartGrid-RankingBot/1.0; +https://github.com/tilbury-engineering/dummygrid)"}

def clean(v):
    return re.sub(r"\s+"," ",v or "").strip()

def existing():
    try:
        with open(OUT,"r",encoding="utf-8") as f: return json.load(f)
    except Exception:
        return {"updatedAt":None,"source":{"name":"FIA International Karting Ranking","url":URL,"official":True},"records":[]}

def parse_tables(html):
    soup=BeautifulSoup(html,"html.parser")
    records=[]
    year=datetime.now(timezone.utc).year
    for table in soup.find_all("table"):
        headers=[clean(x.get_text(" ",strip=True)).lower() for x in table.find_all("th")]
        if not headers: continue
        header=" | ".join(headers)
        if "rank" not in header and "position" not in header: continue
        for tr in table.find_all("tr"):
            cells=[clean(x.get_text(" ",strip=True)) for x in tr.find_all("td")]
            if len(cells)<3: continue
            m=re.match(r"^(\d+)",cells[0])
            if not m: continue
            rank=int(m.group(1))
            driver=cells[1]
            nation=cells[2] if len(cells)>2 else ""
            category=cells[3] if len(cells)>3 else ""
            points=None
            for cell in reversed(cells):
                p=re.fullmatch(r"\d+(?:[.,]\d+)?",cell.replace(" ",""))
                if p:
                    try: points=float(cell.replace(",","."))
                    except: pass
                    if points is not None: break
            records.append({"year":year,"rank":rank,"driver":driver,"nation":nation,"category":category,"points":points})
    return records

def main():
    old=existing()
    try:
        r=requests.get(URL,headers=UA,timeout=30)
        r.raise_for_status()
        rows=parse_tables(r.text)
    except Exception as e:
        print("FIA ranking fetch failed; preserving last good dataset:",e)
        return
    if not rows:
        soup=BeautifulSoup(r.text,"html.parser")
        scripts=[x.get("src") for x in soup.find_all("script") if x.get("src")]
        print("No structured FIA ranking rows detected; preserving last good dataset.")
        print("FIA page script assets:", json.dumps(scripts[:40]))
        apex_bits=[]
        for tag in soup.find_all(["script","iframe","div"]):
            raw=str(tag)
            if "apex" in raw.lower() or "ax." in raw.lower():
                apex_bits.append(raw[:3000])
        print("FIA Apex embed markup:", json.dumps(apex_bits[:20]))
        lowhtml=r.text.lower()
        for needle in ("axiframe","apex-timing","international-karting-ranking","classification"):
            positions=[m.start() for m in re.finditer(re.escape(needle),lowhtml)]
            for pos in positions[:12]:
                print("FIA HTML context",needle,":",r.text[max(0,pos-1200):pos+2400])
        try:
            loader=requests.get("https://www.apex-timing.com/live-timing/tools/ax.iframe.js",headers=UA,timeout=30).text
            print("Apex iframe loader length:",len(loader))
            print("Apex iframe loader:",loader[:12000])
        except Exception as e:
            print("Apex iframe loader fetch failed:",e)
        for src in scripts:
            if not src or "main." not in src:
                continue
            asset=requests.compat.urljoin(URL,src)
            try:
                js=requests.get(asset,headers=UA,timeout=30).text
                low=js.lower()
                for needle in ("ranking","classification","apex-timing","axiframe","iframe","live-timing","src=","apex","apiBaseUrl","this.apiBaseUrl=","apiBaseUrl=","/api/v1/standings","getCompetitionStandings","getChampionships"):
                    pos=low.find(needle)
                    if pos>=0:
                        print("FIA main bundle hint",needle,":",js[max(0,pos-500):pos+1500])
            except Exception as e:
                print("FIA main bundle inspection failed:",e)
        candidates=sorted(set(re.findall(r"https?://[^\\\"'\\s<>]+|/(?:api|ajax|ranking|ikr)[A-Za-z0-9_?&=./%-]*",r.text,re.I)))
        print("FIA page endpoint candidates:", json.dumps(candidates[:60]))
        return
    seen=set(); clean_rows=[]
    for row in rows:
        key=(row["year"],row["rank"],row["driver"],row["nation"],row["category"])
        if key in seen: continue
        seen.add(key); clean_rows.append(row)
    payload={"updatedAt":datetime.now(timezone.utc).isoformat(),"source":{"name":"FIA International Karting Ranking","url":URL,"official":True},"records":clean_rows}
    with open(OUT,"w",encoding="utf-8") as f: json.dump(payload,f,ensure_ascii=False,indent=2)
    print("Indexed",len(clean_rows),"FIA ranking rows")

if __name__=="__main__": main()
