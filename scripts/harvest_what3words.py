#!/usr/bin/env python3
import json,re,time
from pathlib import Path
from urllib.parse import urljoin,urlparse
import requests
from bs4 import BeautifulSoup

PUBLIC=Path("public/tracks.json")
UA={"User-Agent":"Mozilla/5.0 (compatible; DummyGrid-W3W-PublisherBot/1.0; +https://github.com/tilbury-engineering/dummygrid)"}
session=requests.Session();session.headers.update(UA)

W3W_PATTERNS=[
 re.compile(r'///([a-z][a-z-]*\.[a-z][a-z-]*\.[a-z][a-z-]*)',re.I),
 re.compile(r'what3words\.com/(?:[^"\'\s<>]*/)?([a-z][a-z-]*\.[a-z][a-z-]*\.[a-z][a-z-]*)',re.I),
 re.compile(r'what\s*3\s*words?\s*[:\-]?\s*([a-z][a-z-]*\.[a-z][a-z-]*\.[a-z][a-z-]*)',re.I),
]

CONTACT_WORDS=("contact","find-us","find_us","location","directions","visit","about")

def load():
 return json.loads(PUBLIC.read_text(encoding="utf-8"))

def save(data):
 text=json.dumps(data,ensure_ascii=False,separators=(",",":"))+"\n"
 PUBLIC.write_text(text,encoding="utf-8")


def fetch(url):
 for attempt in range(3):
  try:
   r=session.get(url,timeout=20,allow_redirects=True)
   if r.status_code in (403,404):return None
   if r.status_code==429:
    time.sleep(2*(attempt+1));continue
   r.raise_for_status()
   ctype=(r.headers.get("content-type") or "").lower()
   if "text/html" not in ctype and "text/plain" not in ctype:return None
   time.sleep(.35)
   return r.text
  except Exception:
   if attempt==2:return None
   time.sleep(1.5*(attempt+1))
 return None

def extract_words(text):
 if not text:return None
 for pat in W3W_PATTERNS:
  m=pat.search(text)
  if m:
   words=m.group(1).strip("/").lower()
   if len(words.split("."))==3:return words
 return None

def candidate_pages(base,html):
 out=[base]
 try:
  soup=BeautifulSoup(html,"html.parser")
  root=urlparse(base).netloc
  for a in soup.find_all("a",href=True):
   href=a.get("href") or ""
   label=" ".join(a.stripped_strings).lower()
   href_l=href.lower()
   if any(w in label or w in href_l for w in CONTACT_WORDS):
    u=urljoin(base,href)
    if urlparse(u).netloc==root and u not in out:
     out.append(u)
   if len(out)>=8:break
 except Exception:pass
 return out

def find_published_w3w(track):
 sources=[]
 for u in [track.get("website"),track.get("locationSourceUrl"),track.get("directorySource")]:
  if u and u.startswith("http") and u not in sources:sources.append(u)
 for src in sources:
  html=fetch(src)
  if not html:continue
  words=extract_words(html)
  if words:return words,src
  for page in candidate_pages(src,html)[1:]:
   h=fetch(page)
   words=extract_words(h or "")
   if words:return words,page
 return None,None

def main():
 data=load();found=0;checked=0
 batch_limit=200
 for t in data.get("tracks",[]):
  if t.get("what3words"):continue
  if checked>=batch_limit:break
  checked+=1
  words,src=find_published_w3w(t)
  if words:
   t["what3words"]=words
   t["what3wordsSource"]="Published by venue/source"
   t["what3wordsSourceUrl"]=src
   found+=1
   print(t["name"],"-> ///"+words,src,flush=True)
  else:
   print(t["name"],"NO PUBLISHED W3W",flush=True)
 save(data)
 print("checked",checked,"found",found,"total_with_w3w",sum(1 for t in data.get("tracks",[]) if t.get("what3words")),flush=True)

if __name__=="__main__":
 main()
