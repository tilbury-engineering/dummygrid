import express from "express";
import cors from "cors";
import multer from "multer";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as cheerio from "cheerio";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";
import pg from "pg";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const app = express();
const PORT = Number(process.env.PORT || 10000);
const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://tilbury-engineering.github.io";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-sol";
const JWT_SECRET = process.env.JWT_SECRET || "";
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const pool = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized:false } }) : null;

app.use(cors({ origin:(origin,cb)=>!origin || origin.startsWith(SITE_ORIGIN) ? cb(null,true) : cb(new Error("Origin not allowed")), credentials:false }));
app.use(express.json({limit:"1mb"}));

const unsafe = /\b(porn|sexual|nude|nudity|cocaine|heroin|meth|suicide|self[- ]?harm|gambling|casino|weapon|gun|knife|bomb|explosive|murder)\b/i;
const karting = /\b(kart|karting|go[- ]?kart|chassis|rotax|iame|vortex|engine|tyre|tire|circuit|track|driver|championship|fia|skusa|uspks|wsk|cadet|mini|junior|senior|kz|okj|ok|dd2|manufacturer|dealer|team|race|racing|licence|license|club|helmet|racewear|setup|gearing|sprocket|axle|caster|camber|toe)\b/i;

const allowedDomains = [
 "fia.com","fiakarting.com","motorsportuk.org","karting.net.au","karting.net.au",
 "superkartsusa.com","uspks.com","rokcupusa.com","ekartingnews.com","kartcom.com",
 "tonykart.com","crgkart.com","birelart.com","kartrepublic.com","sodikart.com",
 "parolinracing.com","pragaglobal.com","ipkarting.com","maranellokart.com","energycorse.com",
 "zipkart.com","comer-topkart.it","haase.it","gillardkart.com","cs55racingkart.com","brmracing.it",
 "terryfullerton.co.uk","tecnokart.com","mskart.cz","benikkart.com","drracingkart.com",
 "tbkart.com","righettiridolfi.com","otkkart.com","rotax-kart.com","iamekarting.com"
];

function childSafeKartingQuestion(q){
  if (!q || q.trim().length < 2) return {ok:false,code:"empty",message:"Ask a karting question."};
  if (unsafe.test(q)) return {ok:false,code:"unsafe",message:"DummyGrid only answers child-safe karting questions."};
  if (!karting.test(q)) return {ok:false,code:"off_topic",message:"DummyGrid Knowledge Base only searches karting topics."};
  return {ok:true};
}

async function ensureDb(){
 if(!pool) return;
 await pool.query(`
 CREATE TABLE IF NOT EXISTS users(
   id bigserial PRIMARY KEY,
   email text UNIQUE NOT NULL,
   password_hash text NOT NULL,
   birth_year integer,
   guardian_email text,
   is_minor boolean NOT NULL DEFAULT false,
   created_at timestamptz NOT NULL DEFAULT now()
 );
 CREATE TABLE IF NOT EXISTS driver_profiles(
   user_id text PRIMARY KEY,
   display_name text NOT NULL DEFAULT '',
   race_number text,
   region text,
   nationality text,
   class_name text,
   team text,
   bio text,
   birth_year integer,
   is_minor boolean NOT NULL DEFAULT false,
   public_profile boolean NOT NULL DEFAULT false,
   updated_at timestamptz NOT NULL DEFAULT now()
 );
 CREATE TABLE IF NOT EXISTS driver_videos(
   id bigserial PRIMARY KEY,
   user_id text NOT NULL,
   object_key text NOT NULL,
   original_name text,
   content_type text,
   title text,
   status text NOT NULL DEFAULT 'uploaded',
   created_at timestamptz NOT NULL DEFAULT now()
 );
 CREATE TABLE IF NOT EXISTS video_analyses(
   id bigserial PRIMARY KEY,
   video_id bigint NOT NULL REFERENCES driver_videos(id) ON DELETE CASCADE,
   user_id text NOT NULL,
   result jsonb NOT NULL,
   created_at timestamptz NOT NULL DEFAULT now()
 );`);
}
await ensureDb().catch(e=>console.error("DB init failed",e));


function issueToken(user){
 if(!JWT_SECRET) throw new Error("JWT secret not configured");
 return jwt.sign({sub:String(user.id),email:user.email,is_minor:user.is_minor},JWT_SECRET,{expiresIn:"30d"});
}
function requireAuth(req,res,next){
 const h=String(req.header("authorization")||"");
 const token=h.startsWith("Bearer ")?h.slice(7):"";
 if(!token||!JWT_SECRET) return res.status(401).json({ok:false,message:"Sign in required."});
 try{ req.user=jwt.verify(token,JWT_SECRET); next(); }
 catch{ return res.status(401).json({ok:false,message:"Session expired. Please sign in again."}); }
}
app.post("/api/auth/register", async(req,res)=>{
 if(!pool) return res.status(503).json({ok:false,message:"Account database is not connected yet."});
 const email=String(req.body?.email||"").trim().toLowerCase();
 const password=String(req.body?.password||"");
 const birthYear=Number(req.body?.birthYear||0)||null;
 const guardianEmail=String(req.body?.guardianEmail||"").trim().toLowerCase()||null;
 const year=new Date().getFullYear();
 const isMinor=!!birthYear && year-birthYear<18;
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ok:false,message:"Enter a valid email address."});
 if(password.length<10) return res.status(400).json({ok:false,message:"Use a password of at least 10 characters."});
 if(isMinor && !guardianEmail) return res.status(400).json({ok:false,message:"A parent or guardian email is required for junior accounts."});
 try{
   const hash=await bcrypt.hash(password,12);
   const {rows}=await pool.query("INSERT INTO users(email,password_hash,birth_year,guardian_email,is_minor) VALUES($1,$2,$3,$4,$5) RETURNING id,email,is_minor",[email,hash,birthYear,guardianEmail,isMinor]);
   await pool.query("INSERT INTO driver_profiles(user_id,is_minor,public_profile) VALUES($1,$2,false) ON CONFLICT DO NOTHING",[String(rows[0].id),isMinor]);
   res.json({ok:true,token:issueToken(rows[0]),user:rows[0]});
 }catch(err){
   if(String(err?.code)==="23505") return res.status(409).json({ok:false,message:"An account already exists for that email."});
   console.error(err);res.status(500).json({ok:false,message:"Could not create account."});
 }
});
app.post("/api/auth/login", async(req,res)=>{
 if(!pool) return res.status(503).json({ok:false,message:"Account database is not connected yet."});
 const email=String(req.body?.email||"").trim().toLowerCase();
 const password=String(req.body?.password||"");
 const {rows}=await pool.query("SELECT id,email,password_hash,is_minor FROM users WHERE email=$1",[email]);
 const user=rows[0];
 if(!user || !(await bcrypt.compare(password,user.password_hash))) return res.status(401).json({ok:false,message:"Email or password is incorrect."});
 res.json({ok:true,token:issueToken(user),user:{id:user.id,email:user.email,is_minor:user.is_minor}});
});
app.get("/api/me",requireAuth,async(req,res)=>{
 if(!pool) return res.status(503).json({ok:false,message:"Account database is not connected yet."});
 const {rows}=await pool.query("SELECT * FROM driver_profiles WHERE user_id=$1",[String(req.user.sub)]);
 res.json({ok:true,user:req.user,profile:rows[0]||null});
});
app.put("/api/me/profile",requireAuth,async(req,res)=>{
 if(!pool) return res.status(503).json({ok:false,message:"Account database is not connected yet."});
 const p=req.body||{};
 const publicProfile=req.user.is_minor?false:!!p.public_profile;
 const {rows}=await pool.query(`INSERT INTO driver_profiles(user_id,display_name,race_number,region,nationality,class_name,team,bio,is_minor,public_profile,updated_at)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
 ON CONFLICT(user_id) DO UPDATE SET display_name=EXCLUDED.display_name,race_number=EXCLUDED.race_number,region=EXCLUDED.region,nationality=EXCLUDED.nationality,class_name=EXCLUDED.class_name,team=EXCLUDED.team,bio=EXCLUDED.bio,public_profile=EXCLUDED.public_profile,updated_at=now()
 RETURNING *`,[String(req.user.sub),String(p.display_name||""),String(p.race_number||""),String(p.region||""),String(p.nationality||""),String(p.class_name||""),String(p.team||""),String(p.bio||""),!!req.user.is_minor,publicProfile]);
 res.json({ok:true,profile:rows[0]});
});
app.get("/api/me/videos",requireAuth,async(req,res)=>{
 if(!pool) return res.status(503).json({ok:false,message:"Account database is not connected yet."});
 const {rows}=await pool.query("SELECT v.*,a.result AS analysis FROM driver_videos v LEFT JOIN LATERAL (SELECT result FROM video_analyses WHERE video_id=v.id ORDER BY created_at DESC LIMIT 1) a ON true WHERE v.user_id=$1 ORDER BY v.created_at DESC",[String(req.user.sub)]);
 res.json({ok:true,videos:rows});
});

const TSL_SERIES={
  bsrc:{
    name:"British Superkart Racing Club / Superkart Super Series",
    source:"https://www.tsl-timing.com/results/bmcrc/",
    section:/superkart|british superkart/i
  }
};
const tslEventCache=new Map();
async function discoverTslEvents(slug){
 const series=TSL_SERIES[slug];
 if(!series)return [];
 const cached=tslEventCache.get(slug);
 if(cached&&Date.now()-cached.at<6*60*60*1000)return cached.events;
 const html=await fetchHtml(series.source);
 const $=cheerio.load(html);
 const candidates=[]; const seen=new Set();
 $('a[href*="/event/"]').each((_,a)=>{
   const href=$(a).attr("href")||"";
   const m=href.match(/\/event\/(\d+)/);
   if(!m||seen.has(m[1]))return;
   seen.add(m[1]);
   const text=$(a).closest("li,article,div,tr").first().text().replace(/\s+/g," ").trim()||$(a).text().replace(/\s+/g," ").trim();
   candidates.push({id:m[1],title:text||"TSL event",url:new URL(href,"https://www.tsl-timing.com").href});
 });
 const checked=await Promise.all(candidates.map(async event=>{
   try{
     const eventHtml=await fetchHtml(event.url);
     const page=cheerio.load(eventHtml);
     let hasSeries=false;
     page("h3").each((_,h)=>{if(series.section.test(page(h).text()))hasSeries=true});
     if(!hasSeries)return null;
     const body=page("body").text().replace(/\s+/g," ").trim();
     const track=page("h1").nextAll().filter((_,el)=>/Track Length:/i.test(page(el).text())).first().prev().text().trim()||null;
     const date=(body.match(/(\d{1,2}(?:st|nd|rd|th)?\s+[A-Z][a-z]+\s*-\s*\d{1,2}(?:st|nd|rd|th)?\s+[A-Z][a-z]+\s+\d{4}|(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+\d{1,2}(?:st|nd|rd|th)?\s+[A-Z][a-z]+\s+\d{4})/)||[])[1]||null;
     return {...event,track,date};
   }catch{return null}
 }));
 const events=checked.filter(Boolean);
 tslEventCache.set(slug,{at:Date.now(),events});
 return events;
}
const ALPHA_SERIES={
  ukc:{name:"Ultimate Karting Championship"},
  bkc:{name:"The Kart Championship"},
  nkc:{name:"National Kart Cup"},
  accesskarting:{name:"Access Karting"},
  wmkc:{name:"Whilton Mill Kart Club"},
  wombwellkarting:{name:"Wombwell Karting"},
  tattershall:{name:"Tattershall Karting Centre"}
};
async function fetchHtml(url){
 const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 (compatible; DummyGrid/1.0)"}});
 if(!r.ok) throw new Error("Upstream timing source returned "+r.status);
 return await r.text();
}
function absAlpha(href){return href?.startsWith("http")?href:"https://systems.alphatiming.co.uk"+href}
app.get("/api/results/tsl/series",(req,res)=>{
 res.json({ok:true,series:Object.entries(TSL_SERIES).map(([slug,v])=>({slug,name:v.name,provider:"TSL Timing"}))});
});
app.get("/api/results/tsl/:slug/events",async(req,res)=>{
 const series=TSL_SERIES[req.params.slug];
 if(!series)return res.status(404).json({ok:false,message:"Unknown TSL championship."});
 try{
   const events=await discoverTslEvents(req.params.slug);
   res.set("Cache-Control","public, max-age=1800, s-maxage=21600");
   res.json({ok:true,series:{slug:req.params.slug,name:series.name},events:events.map(e=>({...e,provider:"TSL Timing"}))});
 }catch(err){console.error(err);res.status(502).json({ok:false,message:"Could not discover TSL Timing events."})}
});
app.get("/api/results/tsl/:slug/event/:eventId",async(req,res)=>{
 const series=TSL_SERIES[req.params.slug];
 if(!series)return res.status(404).json({ok:false,message:"Unknown TSL championship."});
 try{
   const event=(await discoverTslEvents(req.params.slug)).find(e=>e.id===req.params.eventId);
   if(!event)return res.status(404).json({ok:false,message:"Unknown TSL event."});
   const url="https://www.tsl-timing.com/event/"+event.id;
   const html=await fetchHtml(url); const $=cheerio.load(html);
   let section=null;
   $("h3").each((_,h)=>{const t=$(h).text().replace(/\s+/g," ").trim(); if(!section && /superkart|british superkart/i.test(t)) section=$(h)});
   const sessions=[];
   if(section){
     let node=section.next();
     while(node.length){
       if(node.is("h3")) break;
       node.find("a").addBack("a").each((_,a)=>{
         const label=$(a).text().replace(/\s+/g," ").trim();
         const href=$(a).attr("href")||"";
         if(!label||/pdf book/i.test(label))return;
         if(!/(practice|qualifying|grid|race|result|points)/i.test(label))return;
         sessions.push({
           id:String(sessions.length+1),
           name:label,
           type:/practice/i.test(label)?"Practice":/qualifying/i.test(label)?"Qualifying":/grid/i.test(label)?"Grid":/result/i.test(label)?"Result":"Session",
           url:href.startsWith("http")?href:new URL(href,"https://www.tsl-timing.com").href
         });
       });
       node=node.next();
     }
   }
   // Some TSL layouts nest the session links inside a wrapper after the h3.
   if(!sessions.length && section){
     const parent=section.parent();
     parent.find("a").each((_,a)=>{
       const label=$(a).text().replace(/\s+/g," ").trim();
       const href=$(a).attr("href")||"";
       if(!label||/pdf book/i.test(label)||!/(practice|qualifying|grid|race|result|points)/i.test(label))return;
       sessions.push({
         id:String(sessions.length+1),name:label,
         type:/practice/i.test(label)?"Practice":/qualifying/i.test(label)?"Qualifying":/grid/i.test(label)?"Grid":/result/i.test(label)?"Result":"Session",
         url:href.startsWith("http")?href:new URL(href,"https://www.tsl-timing.com").href
       });
     });
   }
   res.json({ok:true,event:{...event,url,provider:"TSL Timing"},sessions});
 }catch(err){console.error(err);res.status(502).json({ok:false,message:"Could not load TSL Timing event."})}
});
app.get("/api/results/tsl/:slug/event/:eventId/session/:sessionId",async(req,res)=>{
 const series=TSL_SERIES[req.params.slug];
 if(!series)return res.status(404).json({ok:false,message:"Unknown TSL championship."});
 try{
   const event=(await discoverTslEvents(req.params.slug)).find(e=>e.id===req.params.eventId);
   if(!event)return res.status(404).json({ok:false,message:"Unknown TSL event."});
   const eventUrl="https://www.tsl-timing.com/event/"+event.id;
   const html=await fetchHtml(eventUrl); const $=cheerio.load(html);
   let section=null;
   $("h3").each((_,h)=>{const t=$(h).text().replace(/\s+/g," ").trim(); if(!section && /superkart|british superkart/i.test(t)) section=$(h)});
   const links=[];
   const addLinks=root=>root.find("a").addBack("a").each((_,a)=>{
     const label=$(a).text().replace(/\s+/g," ").trim(); const href=$(a).attr("href")||"";
     if(!label||/pdf book/i.test(label)||!/(practice|qualifying|grid|race|result|points)/i.test(label))return;
     const url=href.startsWith("http")?href:new URL(href,"https://www.tsl-timing.com").href;
     if(!links.some(x=>x.url===url))links.push({name:label,url});
   });
   if(section){let node=section.next();while(node.length){if(node.is("h3"))break;addLinks(node);node=node.next()}if(!links.length)addLinks(section.parent())}
   const selected=links[Number(req.params.sessionId)-1];
   if(!selected)return res.status(404).json({ok:false,message:"Unknown TSL session."});
   const upstream=await fetch(selected.url,{headers:{"User-Agent":"Mozilla/5.0 (compatible; DummyGrid/1.0)"}});
   if(!upstream.ok)throw new Error("TSL session returned "+upstream.status);
   const contentType=upstream.headers.get("content-type")||"";
   let headers=[],rows=[],lines=[];
   if(/pdf/i.test(contentType)||/\.pdf(?:$|\?)/i.test(selected.url)){
     const parsed=await pdfParse(Buffer.from(await upstream.arrayBuffer()));
     lines=parsed.text.split(/\r?\n/).map(x=>x.replace(/\s+/g," ").trim()).filter(Boolean);
     const headerLine=lines.find(x=>/^POS NO CL PIC NAME ENTRY LAPS TIME GAP DIFF MPH BEST ON GRD/i.test(x));
     if(headerLine){
       headers=["Pos","No","Class","PIC","Driver / Entry","Laps","Time / Gap","Best"];
       for(const line of lines){
         if(/^NOT CLASSIFIED$/i.test(line)||/^FASTEST LAP$/i.test(line))break;
         const m=line.match(/^(\d+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(.+?)\s+(\d+)\s+(\d{1,2}:\d{2}\.\d{3})(?:\s+(.+?))?\s+(\d{1,2}:\d{2}\.\d{3})\s+(\d+)(?:\s+\d+\s+-?\d+)?$/);
         if(!m)continue;
         const tail=(m[8]||"").trim();
         rows.push([m[1],m[2],m[3],m[4],m[5],m[6],m[7]+(tail?" · "+tail:""),m[9]+" (lap "+m[10]+")"]);
       }
     }
   }else{
     const page=cheerio.load(await upstream.text());
     const table=page("table").filter((_,t)=>page(t).find("th,td").length>=3).first();
     headers=table.find("thead th").map((_,th)=>page(th).text().replace(/\s+/g," ").trim()).get();
     table.find("tbody tr").each((_,tr)=>{const cells=page(tr).find("td").map((_,td)=>page(td).text().replace(/\s+/g," ").trim()).get();if(cells.length)rows.push(cells)});
     if(!rows.length)lines=page("body").text().split(/\r?\n/).map(x=>x.replace(/\s+/g," ").trim()).filter(Boolean);
   }
   res.set("Cache-Control","public, max-age=3600, s-maxage=21600");
   res.json({ok:true,session:{id:req.params.sessionId,title:selected.name,url:selected.url,headers,rows,lines}});
 }catch(err){console.error(err);res.status(502).json({ok:false,message:"Could not load the TSL classification."})}
});
app.get("/api/results/alpha/series",(req,res)=>{
 res.json({ok:true,series:Object.entries(ALPHA_SERIES).map(([slug,v])=>({slug,name:v.name,provider:"Alpha Timing"}))});
});
app.get("/api/results/alpha/:slug/events",async(req,res)=>{
 const {slug}=req.params;
 if(!ALPHA_SERIES[slug]) return res.status(404).json({ok:false,message:"Unknown championship."});
 try{
   const html=await fetchHtml(`https://systems.alphatiming.co.uk/${slug}`);
   const $=cheerio.load(html);
   const events=[]; const seen=new Set();
   $('a[href*="/event/"]').each((_,a)=>{
     const href=$(a).attr("href")||"";
     const m=href.match(new RegExp("/"+slug+"/event/(\\d+)"));
     if(!m||seen.has(m[1]))return;
     const text=$(a).text().replace(/\s+/g," ").trim();
     if(!text)return;
     seen.add(m[1]);
     const parentText=$(a).closest("article,li,div").first().text().replace(/\s+/g," ").trim();
     events.push({id:m[1],title:text,summary:parentText,url:absAlpha(href),provider:"Alpha Timing"});
   });
   res.json({ok:true,series:{slug,name:ALPHA_SERIES[slug].name},events});
 }catch(err){console.error(err);res.status(502).json({ok:false,message:"Could not load Alpha Timing events."})}
});
app.get("/api/results/alpha/:slug/event/:eventId",async(req,res)=>{
 const {slug,eventId}=req.params;
 if(!ALPHA_SERIES[slug]) return res.status(404).json({ok:false,message:"Unknown championship."});
 try{
   const url=`https://systems.alphatiming.co.uk/${slug}/event/${eventId}/results`;
   const html=await fetchHtml(url); const $=cheerio.load(html);
   const title=$("h1").first().text().replace(/\s+/g," ").trim()||ALPHA_SERIES[slug].name;
   const pageText=$("body").text().replace(/\s+/g," ").trim();
   const dateMatch=pageText.match(/(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/);
   const sessions=[]; const seen=new Set();
   $('a[href*="/s/"][href$="/result"]').each((_,a)=>{
     const href=$(a).attr("href")||"";
     const m=href.match(new RegExp("/"+slug+"/e/(\\d+)/s/(\\d+)/result"));
     if(!m||seen.has(m[2]))return;
     seen.add(m[2]);
     const card=$(a).closest("article,li,div").first();
     const text=(card.text()||$(a).text()).replace(/\s+/g," ").trim();
     const raceMatch=text.match(/Race\s*(\d+)\s*:\s*([^·]+?)(?:\s+Finished|\s+Live|\s+Scheduled|·|$)/i);
     const winnerMatch=text.match(/(?:Practice|Qualifying|Heat|PreFinal|Final) Winner:\s*([^·]+?)(?:\s{2,}|$)/i);
     let type="Session";
     for(const t of ["Practice","Qualifying","Heat","PreFinal","Final"]) if(text.toLowerCase().includes(t.toLowerCase())){type=t;break;}
     const label=(raceMatch?.[2]||$(a).text()||text).replace(/\s+/g," ").trim();
     sessions.push({
       id:m[2],eventId:m[1],raceNumber:raceMatch?.[1]?Number(raceMatch[1]):null,
       name:label,type,winner:winnerMatch?.[1]?.trim()||null,text,url:absAlpha(href)
     });
   });
   res.json({ok:true,event:{id:eventId,title,dateStart:dateMatch?.[1]||null,dateEnd:dateMatch?.[2]||null,url},sessions});
 }catch(err){console.error(err);res.status(502).json({ok:false,message:"Could not load Alpha Timing event."})}
});
app.get("/api/results/alpha/:slug/e/:eventId/s/:sessionId",async(req,res)=>{
 const {slug,eventId,sessionId}=req.params;
 if(!ALPHA_SERIES[slug]) return res.status(404).json({ok:false,message:"Unknown championship."});
 try{
   const url=`https://systems.alphatiming.co.uk/${slug}/e/${eventId}/s/${sessionId}/result`;
   const html=await fetchHtml(url); const $=cheerio.load(html);
   const title=$("h1").first().text().replace(/\s+/g," ").trim();
   const body=$("body").text().replace(/\s+/g," ").trim();
   const meta={};
   const laps=body.match(/Laps\s+(\d+)/i); if(laps)meta.laps=Number(laps[1]);
   const start=body.match(/Start\s+(\d{1,2}:\d{2})/i); if(start)meta.start=start[1];
   const fastest=body.match(/Fastest Lap\s+(.+?)\s+Lap\s+(\d+)\s+([0-9:.]+)/i);
   if(fastest)meta.fastestLap={driver:fastest[1].trim(),lap:Number(fastest[2]),time:fastest[3]};
   let table=$("table").filter((_,t)=>$(t).find("th").length>=3).first();
   const headers=table.find("thead th").map((_,th)=>$(th).text().replace(/\s+/g," ").trim()).get();
   const rows=[];
   table.find("tbody tr").each((_,tr)=>{
     const cells=$(tr).find("td").map((_,td)=>$(td).text().replace(/\s+/g," ").trim()).get();
     if(cells.length)rows.push(cells);
   });
   res.json({ok:true,session:{id:sessionId,eventId,title,url,meta,headers,rows}});
 }catch(err){console.error(err);res.status(502).json({ok:false,message:"Could not load full session classification."})}
});
app.get("/api/what3words",async(req,res)=>{
 const lat=Number(req.query.lat), lng=Number(req.query.lng);
 if(!Number.isFinite(lat)||!Number.isFinite(lng)) return res.status(400).json({ok:false,message:"Valid lat/lng required."});
 const key=process.env.WHAT3WORDS_API_KEY;
 if(!key) return res.status(503).json({ok:false,message:"What3Words is not configured."});
 try{
   const url=new URL("https://api.what3words.com/v3/convert-to-3wa");
   url.searchParams.set("coordinates",lat+","+lng);
   url.searchParams.set("key",key);
   url.searchParams.set("language","en");
   const r=await fetch(url,{headers:{"Accept":"application/json"}});
   const data=await r.json().catch(()=>({}));
   if(!r.ok||!data.words) return res.status(r.status||502).json({ok:false,message:data?.error?.message||"What3Words lookup failed."});
   res.set("Cache-Control","public, max-age=2592000, s-maxage=2592000");
   res.json({ok:true,words:data.words,map:data.map||null,nearestPlace:data.nearestPlace||null,country:data.country||null});
 }catch(err){
   console.error(err);
   res.status(500).json({ok:false,message:"What3Words lookup failed."});
 }
});

app.get("/health",(req,res)=>res.json({ok:true,service:"dummygrid-api",ai:!!openai,database:!!pool,storage:!!process.env.S3_BUCKET}));

app.post("/api/search", async (req,res)=>{
 const question=String(req.body?.question||"").trim();
 const gate=childSafeKartingQuestion(question);
 if(!gate.ok) return res.status(400).json({ok:false,...gate});
 if(!openai) return res.status(503).json({ok:false,code:"ai_not_configured",message:"AI search is being configured."});
 try{
   const response=await openai.responses.create({
     model:OPENAI_MODEL,
     tools:[{type:"web_search",search_context_size:"medium",filters:{allowed_domains:allowedDomains},external_web_access:true}],
     tool_choice:"required",
     include:["web_search_call.action.sources"],
     instructions:[
       "You are DummyGrid Knowledge Base, a child-safe karting-only research assistant.",
       "Answer only about karting. Do not answer unrelated topics.",
       "Keep content appropriate for children and teenagers.",
       "For safety-critical driving advice, emphasize coaching, track rules, protective equipment and qualified supervision.",
       "Use live web search and prefer official governing bodies, manufacturers, championships and established karting publications.",
       "Do not invent results, rules, ages, prices or homologations. State uncertainty clearly.",
       "Give a useful concise answer, then a short Sources section."
     ].join("\n"),
     input:question
   });
   const sources=[];
   for(const item of response.output||[]){
     if(item.type==="web_search_call"){
       for(const src of item.action?.sources||[]) if(src?.url) sources.push({title:src.title||src.url,url:src.url});
     }
   }
   res.json({ok:true,answer:response.output_text,sources:[...new Map(sources.map(x=>[x.url,x])).values()].slice(0,12)});
 }catch(err){
   console.error(err);
   res.status(500).json({ok:false,code:"search_failed",message:"Search failed. Please try again."});
 }
});

function s3(){
 if(!process.env.S3_BUCKET||!process.env.S3_ENDPOINT||!process.env.S3_ACCESS_KEY_ID||!process.env.S3_SECRET_ACCESS_KEY) return null;
 return new S3Client({
   region:process.env.S3_REGION||"auto",
   endpoint:process.env.S3_ENDPOINT,
   credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY},
   forcePathStyle:process.env.S3_FORCE_PATH_STYLE==="true"
 });
}

app.post("/api/videos/presign", requireAuth, async (req,res)=>{
 const userId=String(req.user.sub);
 const client=s3(); if(!client) return res.status(503).json({ok:false,message:"Private video storage is not configured yet."});
 const name=String(req.body?.name||"video.mp4").replace(/[^a-zA-Z0-9._-]/g,"_");
 const type=String(req.body?.type||"video/mp4");
 if(!type.startsWith("video/")) return res.status(400).json({ok:false,message:"Video files only."});
 const key=`drivers/${userId}/${Date.now()}-${name}`;
 const url=await getSignedUrl(client,new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,ContentType:type}),{expiresIn:900});
 res.json({ok:true,key,url});
});

app.post("/api/videos/register", requireAuth, async(req,res)=>{
 const userId=String(req.user.sub);
 if(!pool) return res.status(503).json({ok:false,message:"Account database not ready."});
 const {key,name,type,title}=req.body||{};
 const q=await pool.query("INSERT INTO driver_videos(user_id,object_key,original_name,content_type,title) VALUES($1,$2,$3,$4,$5) RETURNING *",[userId,key,name,type,title||name]);
 res.json({ok:true,video:q.rows[0]});
});

async function streamToFile(body,path){
 const chunks=[]; for await(const chunk of body) chunks.push(chunk); await import("node:fs/promises").then(fs=>fs.writeFile(path,Buffer.concat(chunks)));
}
async function extractFrames(videoPath,outDir){
 return new Promise((resolve,reject)=>{
   const pattern=join(outDir,"frame-%03d.jpg");
   const p=spawn(ffmpegPath,["-hide_banner","-loglevel","error","-i",videoPath,"-vf","fps=1/5,scale=960:-2","-frames:v","24",pattern]);
   let err=""; p.stderr.on("data",d=>err+=d); p.on("close",code=>code===0?resolve():reject(new Error(err||"ffmpeg failed")));
 });
}

app.post("/api/videos/:id/analyze", requireAuth, async(req,res)=>{
 const userId=String(req.user.sub);
 if(!pool||!openai||!s3()) return res.status(503).json({ok:false,message:"Video AI is not fully configured yet."});
 const {rows}=await pool.query("SELECT * FROM driver_videos WHERE id=$1 AND user_id=$2",[req.params.id,userId]);
 if(!rows[0]) return res.status(404).json({ok:false,message:"Video not found."});
 const tmp=await mkdtemp(join(tmpdir(),"dummygrid-"));
 try{
   const path=join(tmp,"input-video");
   const obj=await s3().send(new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:rows[0].object_key}));
   await streamToFile(obj.Body,path);
   await extractFrames(path,tmp);
   const fs=await import("node:fs/promises");
   const names=(await fs.readdir(tmp)).filter(x=>x.endsWith(".jpg")).sort();
   const content=[{type:"input_text",text:
     "Analyze these sequential onboard karting frames as a coaching review. Only comment on visible evidence. Give: overall assessment, 3 strengths, 3 improvements, and time/order-referenced moments. Focus on racing line, steering smoothness, positioning, traffic awareness and consistency. Do not encourage unsafe driving or rule-breaking. If a conclusion requires speed, telemetry, braking pressure, throttle position or exact lap timing that is not visible, say so."}];
   for(const n of names){
     const b=(await readFile(join(tmp,n))).toString("base64");
     content.push({type:"input_image",image_url:"data:image/jpeg;base64,"+b,detail:"low"});
   }
   const response=await openai.responses.create({model:OPENAI_MODEL,input:[{role:"user",content}]});
   const result={summary:response.output_text,frames_analyzed:names.length,note:"Visual coaching only; telemetry is required for exact speed/braking/throttle analysis."};
   await pool.query("INSERT INTO video_analyses(video_id,user_id,result) VALUES($1,$2,$3)",[rows[0].id,userId,result]);
   await pool.query("UPDATE driver_videos SET status='analysed' WHERE id=$1",[rows[0].id]);
   res.json({ok:true,result});
 }catch(err){console.error(err);res.status(500).json({ok:false,message:"Video analysis failed."});}
 finally{await rm(tmp,{recursive:true,force:true}).catch(()=>{});}
});

app.listen(PORT,()=>console.log(`DummyGrid API listening on ${PORT}`));
