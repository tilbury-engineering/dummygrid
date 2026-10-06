#!/usr/bin/env python3
import json
from datetime import datetime, timezone
import requests

OUT="public/international-ranking.json"
PAGE_URL="https://www.fiakarting.com/page/international-karting-ranking-classification"
API="https://backend.fiakarting.com"
UA={"User-Agent":"Mozilla/5.0 (compatible; KartGrid-RankingBot/1.0; +https://github.com/tilbury-engineering/dummygrid)","Accept":"application/json"}

def existing():
    try:
        with open(OUT,"r",encoding="utf-8") as f: return json.load(f)
    except Exception: return {"records":[]}

def get(path,params=None):
    r=requests.get(API+path,params=params or {},headers=UA,timeout=30)
    print("FIA API",path,"params",params or {},"status",r.status_code,"url",r.url)
    print("FIA API body",r.text[:16000])
    return r

def main():
    try:
        catalogue=get("/api/v1/standings",{"limit":"10000"}).json()
        items=[x for x in catalogue.get("items",[]) if x.get("hasResults")]
        print("FIA standings catalogue",len(catalogue.get("items",[])),"items;",len(items),"with results")
        # Use real published standings records to discover the result endpoint's identifier contract.
        sample=next((x for x in items if x.get("year",{}).get("value")=="2026"),items[0] if items else None)
        if sample:
            print("FIA sample standing",json.dumps({k:sample.get(k) for k in ("id","uuid","alias","title")},ensure_ascii=False))
            probes=[
                {"id":sample.get("id")},{"nid":sample.get("id")},{"node":sample.get("id")},
                {"standings":sample.get("id")},{"standingsId":sample.get("id")},{"standingId":sample.get("id")},
                {"uuid":sample.get("uuid")},{"alias":sample.get("alias")},
            ]
            for params in probes:
                try: get("/api/v1/standings/result",params)
                except Exception as e: print("FIA result probe failed",params,e)
        else:
            print("No FIA standings with results found")
    except Exception as e:
        print("FIA catalogue probe failed; preserving last good dataset:",e)
    print("Probe only: preserving",len(existing().get("records",[])),"last-good ranking records")

if __name__=="__main__": main()
