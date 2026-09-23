#!/usr/bin/env python3
import json, re, html, hashlib, time, os
from datetime import datetime, timezone
from urllib.parse import quote, urlparse
from difflib import SequenceMatcher
import requests, feedparser
from googlenewsdecoder import gnewsdecoder
from bs4 import BeautifulSoup

OUT = "public/news.json"
UA = {"User-Agent":"Mozilla/5.0 (compatible; KARTGRID-NewsBot/1.0; +https://github.com/tilbury-engineering/dummygrid)"}
QUERIES = [
  "karting",
  "SKUSA karting",
  "USPKS karting",
  "Stars Championship Series karting",
  "Challenge of the Americas karting",
  "ROK Cup USA karting",
  "United States kart racing",
  "American kart racing",
  "New Castle Motorsports Park karting",
  '"kart racing"',
  '"go kart" racing',
  "karting FIA",
  "karting Rotax",
  "karting IAME",
  "karting WSK",
  "karting SKUSA",
  "karting British",
  "karting Australia",
  "karting Europe",
  "karting USA",
  "karting site:vroomkart.com",
  "karting site:motorsport.com",
  "karting site:autosport.com",
  "karting site:karting.co.uk",
  "karting site:kartcom.com",
  "karting site:fia.com",
  "karting site:motorsportuk.org"
]

COUNTRIES = {
 "United Kingdom":["uk","britain","british","england","english","scotland","scottish","wales","welsh","northern ireland","silverstone","whilton","pf international","fulbeck","rowrah"],
 "United States":["usa","u.s.","united states","american","skusa","supernationals","superkarts usa","challenge of the americas","uspks","us pro kart series","route 66 sprint series","stars championship series","florida winter tour","rok cup usa","florida","california","texas","las vegas","charlotte","new castle motorsports park","road america"],
 "Australia":["australia","australian","victoria","queensland","new south wales","melbourne","sydney"],
 "Italy":["italy","italian","lonato","sarno","franciacorta","cremona","ugento"],
 "France":["france","french","le mans"],
 "Germany":["germany","german","wackersdorf","mülsen","mulsen"],
 "Spain":["spain","spanish","zuera","valencia"],
 "Belgium":["belgium","belgian","genk"],
 "Sweden":["sweden","swedish","kristianstad"],
 "Finland":["finland","finnish"],
 "Netherlands":["netherlands","dutch"],
 "Portugal":["portugal","portuguese"],
 "Czech Republic":["czech","třinec","trinec"],
 "Bahrain":["bahrain","sakhir"],
 "UAE":["uae","dubai","abu dhabi"],
 "Saudi Arabia":["saudi","riyadh","jeddah"],
 "South Africa":["south africa","south african"],
 "Brazil":["brazil","brazilian"],
 "Argentina":["argentina","argentine"],
 "Japan":["japan","japanese","suzuka"],
 "China":["china","chinese","macau"],
 "India":["india","indian"]
}
CONTINENT = {
 "United Kingdom":"Europe","Italy":"Europe","France":"Europe","Germany":"Europe","Spain":"Europe","Belgium":"Europe","Sweden":"Europe","Finland":"Europe","Netherlands":"Europe","Portugal":"Europe","Czech Republic":"Europe",
 "United States":"North America","Australia":"Oceania","Bahrain":"Asia","UAE":"Asia","Saudi Arabia":"Asia","Japan":"Asia","China":"Asia","India":"Asia","South Africa":"Africa","Brazil":"South America","Argentina":"South America"
}

def clean(s):
    return re.sub(r"\s+"," ", BeautifulSoup(html.unescape(s or ""), "html.parser").get_text(" ", strip=True)).strip()

def norm_title(s):
    s = clean(s).lower()
    s = re.sub(r"\b(live|video|watch|preview|report|results?|breaking|exclusive)\b"," ",s)
    s = re.sub(r"[^a-z0-9 ]+"," ",s)
    return re.sub(r"\s+"," ",s).strip()

def similar(a,b):
    a,b=norm_title(a),norm_title(b)
    if not a or not b: return False
    ratio=SequenceMatcher(None,a,b).ratio()
    sa,sb=set(a.split()),set(b.split())
    jac=len(sa&sb)/max(1,len(sa|sb))
    return ratio>=0.84 or jac>=0.72

def classify(text):
    t=(" "+clean(text).lower()+" ")
    hits=[]
    for country, words in COUNTRIES.items():
        if any((" "+w.lower()+" ") in t or w.lower() in t for w in words):
            hits.append(country)
    country=hits[0] if hits else "Global"
    continent=CONTINENT.get(country,"Global")
    return country,continent

def image_from_entry(e):
    for key in ("media_content","media_thumbnail"):
        vals=getattr(e,key,[]) or []
        if vals and vals[0].get("url"): return vals[0]["url"]
    enc=getattr(e,"enclosures",[]) or []
    for x in enc:
        if (x.get("type") or "").startswith("image") and x.get("href"): return x["href"]
    return ""

def resolve_and_image(url):
    try:
        original=url
        if "news.google.com/" in url:
            try:
                decoded=gnewsdecoder(url, interval=None)
                if isinstance(decoded,dict) and (decoded.get("status") or decoded.get("success")) and decoded.get("decoded_url"):
                    original=decoded["decoded_url"]
            except Exception:
                pass
        r=requests.get(original,headers=UA,timeout=6,allow_redirects=True)
        final=r.url
        soup=BeautifulSoup(r.text,"html.parser")
        og=soup.find("meta",property="og:image") or soup.find("meta",attrs={"name":"twitter:image"})
        img=og.get("content","") if og else ""
        canon=soup.find("link",rel="canonical")
        canonical=canon.get("href","") if canon else final
        return canonical or final, img
    except Exception:
        return url,""

def fetch_google(q, hl="en-GB", gl="GB", ceid="GB:en"):
    url="https://news.google.com/rss/search?q="+quote(q)+"&hl="+hl+"&gl="+gl+"&ceid="+ceid
    feed=feedparser.parse(url,request_headers=UA)
    rows=[]
    for e in feed.entries[:40]:
        title=clean(getattr(e,"title",""))
        if not re.search(r"\bkart(ing|s)?\b|\bgo[- ]?kart",title,re.I):
            summary=clean(getattr(e,"summary",""))
            if not re.search(r"\bkart(ing|s)?\b|\bgo[- ]?kart",summary,re.I): continue
        source=getattr(getattr(e,"source",{}),"title","") or (getattr(e,"source",{}) or {}).get("title","") or "Original source"
        raw=getattr(e,"link","")
        date=getattr(e,"published","")
        try: iso=datetime(*e.published_parsed[:6],tzinfo=timezone.utc).isoformat()
        except Exception: iso=date
        desc=clean(getattr(e,"summary",""))
        desc=re.sub(r"\s+[A-Za-z0-9 .&'’-]+$","",desc).strip()
        country,continent=classify(title+" "+desc+" "+source)
        ql=q.lower()
        if country=="Global":
            us_hint=any(k in ql for k in ["skusa","uspks","stars championship","challenge of the americas","rok cup usa","united states","american kart","new castle"])
            au_hint=any(k in ql for k in ["australia","australian"])
            if us_hint:
                country,continent="United States","North America"
            elif au_hint:
                country,continent="Australia","Oceania"
        rows.append({"title":title,"summary":desc[:420],"url":raw,"source":clean(source),"published":iso,"country":country,"continent":continent,"image":image_from_entry(e),"sources":[]})
    return rows

def main():
    candidates=[]
    locales=[
        ("en-GB","GB","GB:en"),
        ("en-US","US","US:en"),
        ("en-AU","AU","AU:en"),
    ]
    for q in QUERIES:
        for hl,gl,ceid in locales:
            try: candidates.extend(fetch_google(q,hl,gl,ceid))
            except Exception as ex: print("query failed",q,gl,ex)
            time.sleep(.08)

    # Exact URL/title de-dupe first
    uniq=[]
    seen=set()
    for x in candidates:
        key=norm_title(x["title"])
        if not key or key in seen: continue
        seen.add(key); uniq.append(x)

    # Story-level clustering: keep first/newest representative, retain alternate publishers.
    uniq.sort(key=lambda x:x.get("published",""),reverse=True)
    clustered=[]
    for x in uniq:
        match=None
        for y in clustered[:120]:
            if similar(x["title"],y["title"]):
                match=y; break
        if match:
            if x["source"] != match["source"] and not any(s["source"]==x["source"] for s in match["sources"]):
                match["sources"].append({"source":x["source"],"url":x["url"]})
            continue
        clustered.append(x)

    # Resolve a sensible number of freshest links to original URLs and discover article images.
    for x in clustered[:40]:
        original,img=resolve_and_image(x["url"])
        if original: x["url"]=original
        if img and "googleusercontent.com" not in img: x["image"]=img
        elif x.get("image","").find("googleusercontent.com")>=0:
            x["image"]=""
        x["id"]=hashlib.sha1((x["title"]+x["url"]).encode()).hexdigest()[:14]
        x["tag"]="LIVE"
        if x["country"]=="Global":
            c,co=classify(x["title"]+" "+x["summary"]+" "+x["url"])
            x["country"],x["continent"]=c,co

    now=datetime.now(timezone.utc).isoformat()
    payload={"updatedAt":now,"count":len(clustered[:60]),"items":clustered[:60]}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT,"w",encoding="utf-8") as f:
        json.dump(payload,f,ensure_ascii=False,indent=2)
    print("wrote",payload["count"],"stories")

if __name__=="__main__": main()
