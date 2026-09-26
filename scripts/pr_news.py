#!/usr/bin/env python3
import json, re, hashlib, html, urllib.request, urllib.parse
from pathlib import Path
from datetime import datetime, timezone
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
NEWS=ROOT/"public"/"news.json"
UA={"User-Agent":"Mozilla/5.0 KartGrid Newsbot/1.0 (+https://tilbury-engineering.github.io/dummygrid/)"}
TERMS=("kart","karting","go-kart","gokart","rotax","iame","cik-fia","fia karting","kz","ok-junior","superkart")

SOURCES=[
 {"name":"PR Newswire","url":"https://www.prnewswire.com/search/news/?keyword=karting","allow":"prnewswire.com"},
 {"name":"GlobeNewswire","url":"https://www.globenewswire.com/search/karting","allow":"globenewswire.com"},
 {"name":"Business Wire","url":"https://www.businesswire.com/portal/site/home/search/?searchType=all&searchTerm=karting","allow":"businesswire.com"},
 {"name":"PublicNow","url":"https://www.publicnow.com/search?k=karting","allow":"publicnow.com"},
 {"name":"Canadian Karting News - Press Releases","url":"https://www.canadiankartingnews.com/category/news/releases/","allow":"canadiankartingnews.com"},
]

def fetch(url):
    req=urllib.request.Request(url,headers=UA)
    with urllib.request.urlopen(req,timeout=20) as r:
        return r.read().decode("utf-8","ignore"), r.geturl()

def clean(s):
    return re.sub(r"\s+"," ",html.unescape(re.sub(r"<[^>]+>"," ",s or ""))).strip()

def meta(doc,key):
    pats=[
      rf'<meta[^>]+(?:property|name)=["\']{re.escape(key)}["\'][^>]+content=["\']([^"\']+)["\']',
      rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']{re.escape(key)}["\']',
    ]
    for p in pats:
        m=re.search(p,doc,re.I)
        if m:return html.unescape(m.group(1)).strip()
    return ""

def jsonld_body(doc):
    bodies=[]
    for raw in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',doc,re.I|re.S):
        try:
            data=json.loads(html.unescape(raw))
            stack=data if isinstance(data,list) else [data]
            while stack:
                x=stack.pop()
                if isinstance(x,dict):
                    if x.get("articleBody"): bodies.append(str(x["articleBody"]))
                    stack.extend(v for v in x.values() if isinstance(v,(dict,list)))
                elif isinstance(x,list): stack.extend(x)
        except Exception: pass
    return max(bodies,key=len) if bodies else ""

def links_from(doc,base,allow):
    out=[]
    for href,txt in re.findall(r'<a[^>]+href=["\']([^"\'#]+)["\'][^>]*>(.*?)</a>',doc,re.I|re.S):
        u=urllib.parse.urljoin(base,html.unescape(href))
        if allow not in urllib.parse.urlparse(u).netloc: continue
        t=clean(txt).lower()
        if any(k in t or k in u.lower() for k in TERMS):
            out.append(u)
    return list(dict.fromkeys(out))[:20]

def item_from(url,source):
    try: doc,final=fetch(url)
    except Exception:return None
    title=meta(doc,"og:title") or meta(doc,"twitter:title")
    desc=meta(doc,"og:description") or meta(doc,"description") or meta(doc,"twitter:description")
    body=jsonld_body(doc)
    text=(title+" "+desc+" "+body[:3000]).lower()
    if not any(k in text for k in TERMS): return None
    image=meta(doc,"og:image") or meta(doc,"twitter:image")
    published=meta(doc,"article:published_time") or meta(doc,"date") or datetime.now(timezone.utc).isoformat()
    if not title:
        m=re.search(r"<title>(.*?)</title>",doc,re.I|re.S); title=clean(m.group(1)) if m else final
    summary=clean(desc)[:1200] or clean(body)[:1200]
    body=clean(body)[:12000]
    hid=hashlib.sha1(final.encode()).hexdigest()[:14]
    return {"title":clean(title),"summary":summary,"body":body,"url":final,"source":source,
      "published":published,"country":"Global","continent":"Global","image":image,"sources":[],
      "id":"pr-"+hid,"tag":"PRESS RELEASE"}

def main():
    try:data=json.loads(NEWS.read_text())
    except Exception:data={"items":[]}
    existing={x.get("url"):x for x in data.get("items",[]) if x.get("url")}
    added=0
    for src in SOURCES:
        try:doc,base=fetch(src["url"])
        except Exception:continue
        for url in links_from(doc,base,src["allow"]):
            if url in existing:continue
            item=item_from(url,src["name"])
            if item:
                existing[url]=item; added+=1
    items=list(existing.values())
    items.sort(key=lambda x:x.get("published",""),reverse=True)
    payload={"updatedAt":datetime.now(timezone.utc).isoformat(),"count":len(items),"items":items[:300]}
    NEWS.write_text(json.dumps(payload,ensure_ascii=False,indent=2))
    print(f"KartGrid PR scan complete: {added} new releases; {len(payload['items'])} total items")

if __name__=="__main__": main()
