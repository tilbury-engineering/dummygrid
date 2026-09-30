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
        candidates=sorted(set(re.findall(r'https?://[^"\\'\\s<>]+|/(?:api|ajax|ranking|ikr)[A-Za-z0-9_?&=./%-]*',r.text,re.I)))
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
