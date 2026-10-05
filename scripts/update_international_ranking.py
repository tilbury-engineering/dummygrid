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

def show(path,params=None):
    try:
        r=requests.get(API+path,params=params or {},headers=UA,timeout=30)
        print("FIA API",path,"params",params or {},"status",r.status_code,"url",r.url)
        print("FIA API body",r.text[:12000])
        return r
    except Exception as e:
        print("FIA API request failed",path,params,e)

def main():
    # Direct structured API discovered in FIA's production frontend bundle.
    # Probe catalogue first; its response/error exposes the required identifiers.
    for params in ({},{"limit":"10000"},{"year":str(datetime.now(timezone.utc).year)},{"year":"2025"},{"year":"2024"}):
        show("/api/v1/standings",params)
    # Probe result validation so required parameter names are explicit.
    for params in ({},{"year":str(datetime.now(timezone.utc).year)}):
        show("/api/v1/standings/result",params)
    print("Probe only: preserving",len(existing().get("records",[])),"last-good ranking records")

if __name__=="__main__": main()
