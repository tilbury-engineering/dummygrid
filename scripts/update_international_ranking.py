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
    soup=BeautifulSoup(html,"html.parser"); records=[]; year=datetime.now(timezone.utc).year
    for table in soup.find_all("table"):
        headers=[clean(x.get_text(" ",strip=True)).lower() for x in table.find_all("th")]
        if not headers or ("rank" not in " | ".join(headers) and "position" not in " | ".join(headers)): continue
        for tr in table.find_all("tr"):
            cells=[clean(x.get_text(" ",strip=True)) for x in tr.find_all("td")]
            if len(cells)<3: continue
            m=re.match(r"^(\d+)",cells[0])
            if not m: continue
            points=None
            for cell in reversed(cells):
                if re.fullmatch(r"\d+(?:[.,]\d+)?",cell.replace(" ","")):
                    try: points=float(cell.replace(",",".")); break
                    except: pass
            records.append({"year":year,"rank":int(m.group(1)),"driver":cells[1],"nation":cells[2],"category":cells[3] if len(cells)>3 else "","points":points})
    return records

def main():
    try:
        r=requests.get(URL,headers=UA,timeout=30); r.raise_for_status(); rows=parse_tables(r.text)
    except Exception as e:
        print("FIA ranking fetch failed; preserving last good dataset:",e); return
    if not rows:
        print("No structured FIA ranking rows detected; preserving last good dataset.")
        soup=BeautifulSoup(r.text,"html.parser")
        scripts=[x.get("src") for x in soup.find_all("script") if x.get("src")]
        for src in scripts:
            if not src or "main." not in src: continue
            asset=requests.compat.urljoin(URL,src)
            try:
                js=requests.get(asset,headers=UA,timeout=30).text
                # Pull environment/config assignments and contexts around the known standings methods.
                for pattern in (r'apiBaseUrl.{0,300}',r'apiBaseUrl.{0,1200}',r'https?://[^"\'\\ ]+',r'/api/v1/standings[^"\' ]*'):
                    matches=re.findall(pattern,js,re.I)
                    print("FIA bundle config matches",pattern,":",json.dumps(matches[:80]))
                low=js.lower()
                for needle in ("getchampionships","getcompetitionstandings","international-karting-ranking","ranking","standings/result","apibaseurl"):
                    start=0
                    for _ in range(12):
                        pos=low.find(needle,start)
                        if pos<0: break
                        print("FIA bundle context",needle,":",js[max(0,pos-2500):pos+4500])
                        start=pos+len(needle)
            except Exception as e:
                print("FIA main bundle inspection failed:",e)
        return
    seen=set(); clean_rows=[]
    for row in rows:
        key=(row["year"],row["rank"],row["driver"],row["nation"],row["category"])
        if key not in seen: seen.add(key); clean_rows.append(row)
    payload={"updatedAt":datetime.now(timezone.utc).isoformat(),"source":{"name":"FIA International Karting Ranking","url":URL,"official":True},"records":clean_rows}
    with open(OUT,"w",encoding="utf-8") as f: json.dump(payload,f,ensure_ascii=False,indent=2)
    print("Indexed",len(clean_rows),"FIA ranking rows")

if __name__=="__main__": main()
