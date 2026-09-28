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
 );
 CREATE TABLE IF NOT EXISTS teams(
   id bigserial PRIMARY KEY,
   owner_user_id text NOT NULL,
   name text NOT NULL,
   slug text UNIQUE NOT NULL,
   created_at timestamptz NOT NULL DEFAULT now()
 );
 CREATE TABLE IF NOT EXISTS team_members(
   id bigserial PRIMARY KEY,
   team_id bigint NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
   user_id text NOT NULL,
   role text NOT NULL DEFAULT 'staff',
   status text NOT NULL DEFAULT 'active',
   permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
   created_at timestamptz NOT NULL DEFAULT now(),
   UNIQUE(team_id,user_id)
 );
 CREATE TABLE IF NOT EXISTS team_driver_invites(
   id bigserial PRIMARY KEY,
   team_id bigint NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
   driver_user_id text,
   driver_email text NOT NULL,
   invited_by text NOT NULL,
   status text NOT NULL DEFAULT 'pending',
   share_permissions jsonb NOT NULL DEFAULT '{"telemetry":false,"video":false,"setups":false,"setup_history":false,"coach_analysis":false,"results":false}'::jsonb,
   created_at timestamptz NOT NULL DEFAULT now(),
   responded_at timestamptz
 );
 CREATE TABLE IF NOT EXISTS team_driver_roster(
   id bigserial PRIMARY KEY,
   team_id bigint NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
   driver_user_id text NOT NULL,
   status text NOT NULL DEFAULT 'confirmed',
   share_permissions jsonb NOT NULL DEFAULT '{"telemetry":false,"video":false,"setups":false,"setup_history":false,"coach_analysis":false,"results":false}'::jsonb,
   joined_at timestamptz NOT NULL DEFAULT now(),
   updated_at timestamptz NOT NULL DEFAULT now(),
   UNIQUE(team_id,driver_user_id)
 );
 CREATE TABLE IF NOT EXISTS coaching_setups(
   id bigserial PRIMARY KEY,
   user_id text NOT NULL,
   title text NOT NULL DEFAULT 'Session setup',
   setup jsonb NOT NULL DEFAULT '{}'::jsonb,
   source text NOT NULL DEFAULT 'manual',
   confirmed boolean NOT NULL DEFAULT false,
   source_image_key text,
   created_at timestamptz NOT NULL DEFAULT now(),
   updated_at timestamptz NOT NULL DEFAULT now()
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
app.post("/api/teams",requireAuth,async(req,res)=>{if(!pool)return res.status(503).json({ok:false,message:"Database not ready."});const name=String(req.body?.name||"").trim();if(name.length<2)return res.status(400).json({ok:false,message:"Enter a team name."});const slug=(name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-"+Date.now().toString(36));const {rows}=await pool.query("INSERT INTO teams(owner_user_id,name,slug) VALUES($1,$2,$3) RETURNING *",[String(req.user.sub),name,slug]);await pool.query("INSERT INTO team_members(team_id,user_id,role,status,permissions) VALUES($1,$2,'owner','active',$3)",[rows[0].id,String(req.user.sub),JSON.stringify({manage_roster:true,manage_team:true,view_shared_data:true})]);res.json({ok:true,team:rows[0]})});
app.get("/api/teams/mine",requireAuth,async(req,res)=>{if(!pool)return res.status(503).json({ok:false,message:"Database not ready."});const {rows}=await pool.query("SELECT t.*,m.role,m.permissions FROM teams t JOIN team_members m ON m.team_id=t.id WHERE m.user_id=$1 AND m.status='active' ORDER BY t.name",[String(req.user.sub)]);res.json({ok:true,teams:rows})});
app.post("/api/teams/:id/invites",requireAuth,async(req,res)=>{if(!pool)return res.status(503).json({ok:false,message:"Database not ready."});const uid=String(req.user.sub),email=String(req.body?.email||"").trim().toLowerCase();const allowed=await pool.query("SELECT 1 FROM team_members WHERE team_id=$1 AND user_id=$2 AND status='active' AND (role='owner' OR role='manager' OR COALESCE((permissions->>'manage_roster')::boolean,false)=true)",[req.params.id,uid]);if(!allowed.rows[0])return res.status(403).json({ok:false,message:"Roster permission required."});const user=await pool.query("SELECT id FROM users WHERE email=$1",[email]);const {rows}=await pool.query("INSERT INTO team_driver_invites(team_id,driver_user_id,driver_email,invited_by) VALUES($1,$2,$3,$4) RETURNING *",[req.params.id,user.rows[0]?String(user.rows[0].id):null,email,uid]);res.json({ok:true,invite:rows[0]})});
app.get("/api/team-invites/mine",requireAuth,async(req,res)=>{if(!pool)return res.status(503).json({ok:false,message:"Database not ready."});const {rows}=await pool.query("SELECT i.*,t.name AS team_name FROM team_driver_invites i JOIN teams t ON t.id=i.team_id WHERE (i.driver_user_id=$1 OR (i.driver_user_id IS NULL AND i.driver_email=$2)) AND i.status='pending' ORDER BY i.created_at DESC",[String(req.user.sub),String(req.user.email||"").toLowerCase()]);res.json({ok:true,invites:rows})});
app.post("/api/team-invites/:id/respond",requireAuth,async(req,res)=>{if(!pool)return res.status(503).json({ok:false,message:"Database not ready."});const uid=String(req.user.sub),accept=req.body?.accept===true,permissions=req.body?.permissions||{};const q=await pool.query("SELECT * FROM team_driver_invites WHERE id=$1 AND status='pending' AND (driver_user_id=$2 OR (driver_user_id IS NULL AND driver_email=$3))",[req.params.id,uid,String(req.user.email||"").toLowerCase()]);if(!q.rows[0])return res.status(404).json({ok:false,message:"Invite not found."});const i=q.rows[0];await pool.query("UPDATE team_driver_invites SET status=$1,driver_user_id=$2,share_permissions=$3,responded_at=now() WHERE id=$4",[accept?"accepted":"declined",uid,JSON.stringify(permissions),i.id]);if(accept)await pool.query("INSERT INTO team_driver_roster(team_id,driver_user_id,share_permissions) VALUES($1,$2,$3) ON CONFLICT(team_id,driver_user_id) DO UPDATE SET status='confirmed',share_permissions=EXCLUDED.share_permissions,updated_at=now()",[i.team_id,uid,JSON.stringify(permissions)]);res.json({ok:true,status:accept?"accepted":"declined"})});
app.get("/api/team-roster/mine",requireAuth,async(req,res)=>{if(!pool)return res.status(503).json({ok:false,message:"Database not ready."});const {rows}=await pool.query("SELECT r.*,t.name AS team_name FROM team_driver_roster r JOIN teams t ON t.id=r.team_id WHERE r.driver_user_id=$1 AND r.status='confirmed' ORDER BY t.name",[String(req.user.sub)]);res.json({ok:true,memberships:rows})});
app.put("/api/team-roster/:id/permissions",requireAuth,async(req,res)=>{if(!pool)return res.status(503).json({ok:false,message:"Database not ready."});const {rows}=await pool.query("UPDATE team_driver_roster SET share_permissions=$1,updated_at=now() WHERE id=$2 AND driver_user_id=$3 RETURNING *",[JSON.stringify(req.body?.permissions||{}),req.params.id,String(req.user.sub)]);if(!rows[0])return res.status(404).json({ok:false,message:"Membership not found."});res.json({ok:true,membership:rows[0]})});

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
       let classified=true;
       for(const line of lines){
         if(/^NOT CLASSIFIED$/i.test(line)){classified=false;continue}
         if(/^FASTEST LAP$/i.test(line)||/^FASTEST LAPS?$/i.test(line))break;
         const m=line.match(/^(\d+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(.+?)\s+(\d+)\s+(\d{1,2}:\d{2}\.\d{3})(?:\s+(.+?))?\s+(\d{1,2}:\d{2}\.\d{3})\s+(\d+)(?:\s+\d+\s+-?\d+)?$/);
         if(m){
           const tail=(m[8]||"").trim();
           rows.push([classified?m[1]:"NC",m[2],m[3],m[4],m[5],m[6],m[7]+(tail?" · "+tail:""),m[9]+" (lap "+m[10]+")"]);
           continue;
         }
         if(!classified){
           const nc=line.match(/^(\S+)\s+(\S+)\s+(\d+)\s+(.+?)\s+(\d+)(?:\s+(\d{1,2}:\d{2}\.\d{3}))?(?:\s+(.+?))?(?:\s+(\d{1,2}:\d{2}\.\d{3})\s+(\d+))?$/);
           if(nc){
             rows.push(["NC",nc[1],nc[2],nc[3],nc[4],nc[5],(nc[6]||"")+(nc[7]?" · "+nc[7].trim():""),nc[8]?(nc[8]+(nc[9]?" (lap "+nc[9]+")":"")):""]);
           }
         }
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

app.get("/api/coaching/setups",requireAuth,async(req,res)=>{if(!pool)return res.status(503).json({ok:false,message:"Account database not ready."});const {rows}=await pool.query("SELECT * FROM coaching_setups WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 50",[String(req.user.sub)]);res.json({ok:true,setups:rows})});
app.post("/api/coaching/setups",requireAuth,async(req,res)=>{if(!pool)return res.status(503).json({ok:false,message:"Account database not ready."});const p=req.body||{},setup=p.setup&&typeof p.setup==="object"?p.setup:{};const {rows}=await pool.query("INSERT INTO coaching_setups(user_id,title,setup,source,confirmed,source_image_key) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",[String(req.user.sub),String(p.title||"Session setup"),JSON.stringify(setup),String(p.source||"manual"),!!p.confirmed,p.source_image_key||null]);res.json({ok:true,setup:rows[0]})});
app.put("/api/coaching/setups/:id",requireAuth,async(req,res)=>{if(!pool)return res.status(503).json({ok:false,message:"Account database not ready."});const p=req.body||{};const {rows}=await pool.query("UPDATE coaching_setups SET title=$1,setup=$2,confirmed=$3,updated_at=now() WHERE id=$4 AND user_id=$5 RETURNING *",[String(p.title||"Session setup"),JSON.stringify(p.setup||{}),!!p.confirmed,req.params.id,String(req.user.sub)]);if(!rows[0])return res.status(404).json({ok:false,message:"Setup not found."});res.json({ok:true,setup:rows[0]})});
app.post("/api/coaching/setup-sheet/analyze",requireAuth,async(req,res)=>{if(!openai)return res.status(503).json({ok:false,message:"Setup-sheet AI is not configured."});const dataUrl=String(req.body?.image||"");if(!dataUrl.startsWith("data:image/")||!dataUrl.includes(";base64,")||dataUrl.length>12000000)return res.status(400).json({ok:false,message:"Upload a JPG, PNG or WebP setup-sheet image."});try{const response=await openai.responses.create({model:OPENAI_MODEL,instructions:"Extract kart setup sheets into structured JSON. Never guess unreadable values. Return an object whose setup fields each contain value, confidence (high/medium/low), and evidence. Recognize gearing/sprockets, four tyre pressures, tracks, caster, camber, toe, ride heights, axle, hubs, seat and seat compound/position/stays, engine, carb/jetting, exhaust length/configuration, tyres, fuel, ballast, total weight and notes. Include manufacturer_sheet if identifiable. Do not invent.",input:[{role:"user",content:[{type:"input_text",text:"Read this kart setup sheet. Extract only visible values and mark uncertain handwriting medium or low confidence."},{type:"input_image",image_url:dataUrl}]}],text:{format:{type:"json_object"}}});let extracted={};try{extracted=JSON.parse(response.output_text||"{}")}catch{throw new Error("Could not parse extracted setup")};res.json({ok:true,extracted,confirmed:false,note:"Review and confirm AI-extracted values before coaching comparisons."})}catch(err){console.error(err);res.status(500).json({ok:false,message:"Could not read setup sheet."})}});

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

function parseTelemetryCsv(raw){
 const lines=String(raw||"").trim().split(/\r?\n/).filter(Boolean);if(lines.length<3)throw new Error("Telemetry CSV needs a header and at least two data rows.");
 const split=line=>line.split(",").map(x=>x.trim().replace(/^"|"$/g,""));const headers=split(lines[0]).map(x=>x.toLowerCase().replace(/[^a-z0-9]+/g,"_"));
 const aliases={time:["time","timestamp","elapsed_time","session_time"],lap:["lap","lap_number","lapnumber"],speed:["speed","speed_kph","velocity","gps_speed"],throttle:["throttle","throttle_pos","throttle_position"],brake:["brake","brake_pressure","brake_pos"],distance:["distance","lap_distance","distance_m"],lat:["lat","latitude"],lon:["lon","lng","longitude"]};
 const index={};for(const [key,names] of Object.entries(aliases)){index[key]=headers.findIndex(h=>names.includes(h))}
 if(index.time<0||index.speed<0)throw new Error("Telemetry needs time and speed columns.");
 const rows=lines.slice(1).map((line,n)=>{const c=split(line),v=k=>index[k]>=0?Number(c[index[k]]):null;return {row:n+2,time:v("time"),lap:v("lap"),speed:v("speed"),throttle:v("throttle"),brake:v("brake"),distance:v("distance"),lat:v("lat"),lon:v("lon")}}).filter(x=>Number.isFinite(x.time)&&Number.isFinite(x.speed));
 if(rows.length<2)throw new Error("No usable telemetry rows found.");return {headers,rows,channels:Object.fromEntries(Object.entries(index).map(([k,v])=>[k,v>=0]))};
}
function gpsBearing(a,b){const r=Math.PI/180,y=Math.sin((b.lon-a.lon)*r)*Math.cos(b.lat*r),x=Math.cos(a.lat*r)*Math.sin(b.lat*r)-Math.sin(a.lat*r)*Math.cos(b.lat*r)*Math.cos((b.lon-a.lon)*r);return (Math.atan2(y,x)/r+360)%360}
function angleDiff(a,b){let d=((b-a+540)%360)-180;return d}
function gpsCircuit(points){const p=points.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon));if(p.length<12)return null;const step=Math.max(1,Math.floor(p.length/160)),sample=p.filter((_,i)=>i%step===0||i===p.length-1);const turns=[];for(let i=2;i<sample.length-2;i++){const b1=gpsBearing(sample[i-2],sample[i]),b2=gpsBearing(sample[i],sample[i+2]),change=angleDiff(b1,b2);if(Math.abs(change)>=12){const last=turns.at(-1);if(last&&i-last.index<4){if(Math.abs(change)>Math.abs(last.change))Object.assign(last,{index:i,change,point:sample[i]});}else turns.push({index:i,change,point:sample[i]});}}const corners=turns.map((t,i)=>({corner:i+1,lat:t.point.lat,lon:t.point.lon,direction:t.change>0?"right":"left",headingChange:Number(Math.abs(t.change).toFixed(1)),time:t.point.time,speed:t.point.speed}));return {path:sample.map(x=>({lat:x.lat,lon:x.lon,time:x.time,speed:x.speed})),corners};}
function analyseTelemetry(rows){
 const lapMap=new Map();for(const r of rows){const k=Number.isFinite(r.lap)?r.lap:1;if(!lapMap.has(k))lapMap.set(k,[]);lapMap.get(k).push(r)}
 const laps=[...lapMap.entries()].map(([lap,points])=>{points.sort((a,b)=>a.time-b.time);const duration=points.at(-1).time-points[0].time;const speeds=points.map(x=>x.speed);return {lap,points,duration,avgSpeed:speeds.reduce((a,b)=>a+b,0)/speeds.length,minSpeed:Math.min(...speeds),maxSpeed:Math.max(...speeds)}}).filter(x=>x.duration>0).sort((a,b)=>a.duration-b.duration);if(!laps.length)throw new Error("Could not derive a complete lap.");
 const best=laps[0],segmentCount=10,segmentRows=[];for(const lap of laps){const seg=[];for(let i=0;i<segmentCount;i++){const a=Math.floor(lap.points.length*i/segmentCount),b=Math.max(a+1,Math.floor(lap.points.length*(i+1)/segmentCount));const p=lap.points.slice(a,b);if(!p.length)continue;const speeds=p.map(x=>x.speed);seg.push({segment:i+1,time:p.at(-1).time-p[0].time,minSpeed:Math.min(...speeds),avgSpeed:speeds.reduce((x,y)=>x+y,0)/speeds.length,brake:p.filter(x=>Number.isFinite(x.brake)).reduce((x,y)=>x+y.brake,0)/Math.max(1,p.filter(x=>Number.isFinite(x.brake)).length),throttle:p.filter(x=>Number.isFinite(x.throttle)).reduce((x,y)=>x+y.throttle,0)/Math.max(1,p.filter(x=>Number.isFinite(x.throttle)).length)});}segmentRows.push({lap:lap.lap,seg});}
 const bestSegments=[];for(let i=0;i<segmentCount;i++){const candidates=segmentRows.map(x=>({lap:x.lap,...x.seg[i]})).filter(x=>x&&Number.isFinite(x.time));if(!candidates.length)continue;candidates.sort((x,y)=>x.time-y.time);bestSegments.push(candidates[0]);}
 const theoretical=bestSegments.reduce((x,y)=>x+y.time,0),potential=Math.max(0,best.duration-theoretical);const bestRow=segmentRows.find(x=>x.lap===best.lap)?.seg||[];const deltas=bestRow.map((seg,i)=>{const ref=bestSegments[i];return {segment:i+1,time:Number(seg.time.toFixed(3)),reference:Number((ref?.time||seg.time).toFixed(3)),delta:Number(Math.max(0,seg.time-(ref?.time||seg.time)).toFixed(3)),minSpeed:Number(seg.minSpeed.toFixed(1)),avgSpeed:Number(seg.avgSpeed.toFixed(1)),referenceLap:ref?.lap||best.lap,brake:Number.isFinite(seg.brake)?Number(seg.brake.toFixed(1)):null,throttle:Number.isFinite(seg.throttle)?Number(seg.throttle.toFixed(1)):null}}).sort((x,y)=>y.delta-x.delta);
 const consistency=laps.length>1?Math.max(...laps.map(x=>x.duration))-Math.min(...laps.map(x=>x.duration)):0;const priorities=deltas.slice(0,3).map((x,i)=>({...x,rank:i+1,reason:x.delta>0.001?`Segment is ${x.delta.toFixed(3)}s slower than this session's best segment reference.`:"Low-speed review area; no measurable segment delta on the best lap."}));
 return {bestLap:{lap:best.lap,time:Number(best.duration.toFixed(3)),avgSpeed:Number(best.avgSpeed.toFixed(1)),minSpeed:Number(best.minSpeed.toFixed(1)),maxSpeed:Number(best.maxSpeed.toFixed(1))},theoreticalBest:Number(theoretical.toFixed(3)),recoverableTime:Number(potential.toFixed(3)),laps:laps.map(x=>({lap:x.lap,time:Number(x.duration.toFixed(3)),delta:Number((x.duration-best.duration).toFixed(3)),avgSpeed:Number(x.avgSpeed.toFixed(1))})).sort((x,y)=>x.lap-y.lap),consistencySpread:Number(consistency.toFixed(3)),segmentDeltas:deltas,priorities,gps:(()=>{const g=gpsCircuit(best.points);if(!g)return null;g.path=g.path.map((p,i)=>{const segment=Math.min(segmentCount,Math.floor(i/Math.max(1,g.path.length)*segmentCount)+1),d=deltas.find(x=>x.segment===segment);return {...p,segment,delta:d?.delta||0}});g.corners=g.corners.map(c=>{const idx=g.path.reduce((bestIdx,p,i)=>Math.abs(p.time-c.time)<Math.abs(g.path[bestIdx].time-c.time)?i:bestIdx,0),p=g.path[idx],d=deltas.find(x=>x.segment===p.segment);return {...c,segment:p.segment,delta:d?.delta||0,referenceLap:d?.referenceLap||best.lap,brake:d?.brake??null,throttle:d?.throttle??null}});return g})()};
}

function coachingCards(analysis,channels){return (analysis.priorities||[]).map(p=>{const evidence=[`+${p.delta.toFixed(3)}s vs session reference`,`minimum speed ${p.minSpeed.toFixed(1)}`,`reference lap ${p.referenceLap}`];let finding="This section contains measurable recoverable time.";let action="Compare entry, apex and exit against the reference lap and aim for a repeatable line.";let confidence="medium";if(channels.brake&&p.brake!==null){evidence.push(`brake channel avg ${p.brake.toFixed(1)}`);finding="Time loss is measurable in a section where braking data is available.";action="Compare brake onset and release timing with the reference before changing the kart setup.";confidence="high"}if(channels.throttle&&p.throttle!==null){evidence.push(`throttle channel avg ${p.throttle.toFixed(1)}`);action="Compare brake release, minimum speed and throttle pickup with the reference lap; change one technique variable at a time.";confidence="high"}return {rank:p.rank,segment:p.segment,title:`Review segment ${p.segment}`,finding,evidence,action,confidence};})}

app.post("/api/coaching/telemetry/analyze",requireAuth,async(req,res)=>{
 try{const raw=String(req.body?.csv||"");if(raw.length>8_000_000)return res.status(413).json({ok:false,message:"Telemetry file is too large."});const parsed=parseTelemetryCsv(raw);const analysis=analyseTelemetry(parsed.rows);analysis.coaching=coachingCards(analysis,parsed.channels);res.json({ok:true,channels:parsed.channels,analysis,note:"Telemetry-derived metrics. Coaching interpretation should only use channels present in the uploaded data."});}
 catch(err){res.status(400).json({ok:false,message:err.message||"Telemetry analysis failed."})}
});

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
