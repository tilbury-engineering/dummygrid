import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import "./styles.css";

const regions = ["UK","Europe","USA","Australia","Global"];
const demoNews = [
 {id:1,region:"UK",tag:"National",title:"British karting weekend hub",dek:"Results, paddock notes and championship updates from across the UK.",source:"KARTGRID Newsroom",time:"Today"},
 {id:2,region:"Global",tag:"FIA",title:"International gearbox karting focus",dek:"The latest stories from KZ and KZ2 competition around the world.",source:"KARTGRID Newsroom",time:"Today"},
 {id:3,region:"Europe",tag:"IAME",title:"European one-make series tracker",dek:"Round-by-round news from IAME championships across Europe.",source:"KARTGRID Newsroom",time:"2h"},
 {id:4,region:"USA",tag:"US Racing",title:"Stateside karting weekly",dek:"Series news, driver moves and event previews from the American scene.",source:"KARTGRID Newsroom",time:"3h"},
 {id:5,region:"Australia",tag:"National",title:"Australian paddock report",dek:"National and state-level karting news, results and community stories.",source:"KARTGRID Newsroom",time:"5h"},
 {id:6,region:"UK",tag:"Club",title:"Club karting: what to watch this weekend",dek:"A quick guide to notable meetings, classes and drivers around Britain.",source:"KARTGRID Newsroom",time:"6h"}
];

const seedListings = [
 {id:"l1",region:"UK",category:"Complete Karts",title:"OTK senior rolling chassis",price:2950,currency:"£",location:"Derbyshire",condition:"Used",compat:"X30 / Rotax Senior",seller:"Paddock Performance",desc:"Clean senior chassis with recent bearings and brake service."},
 {id:"l2",region:"UK",category:"Engines",title:"IAME X30 Senior engine package",price:1650,currency:"£",location:"Lincolnshire",condition:"Used",compat:"X30 Senior",seller:"Private Seller",desc:"Complete package ready for inspection."},
 {id:"l3",region:"Europe",category:"Complete Karts",title:"CRG KZ roller",price:3200,currency:"€",location:"Lombardy, Italy",condition:"Used",compat:"KZ / KZ2",seller:"MRT Karting",desc:"Gearbox chassis package, race-ready base."},
 {id:"l4",region:"USA",category:"Engines",title:"KA100 Senior engine",price:2400,currency:"$",location:"Florida",condition:"Used",compat:"KA100 Senior",seller:"East Coast Karting",desc:"Fresh top end and documented hours."},
 {id:"l5",region:"Australia",category:"Complete Karts",title:"Rotax Senior package",price:5900,currency:"A$",location:"Victoria",condition:"Used",compat:"Rotax Senior",seller:"Trackside AU",desc:"Complete arrive-and-race package."},
 {id:"l6",region:"UK",category:"Trailers",title:"Twin kart trailer with awning",price:4250,currency:"£",location:"Cheshire",condition:"Used",compat:"All classes",seller:"RaceDad81",desc:"Storage, tyre rack and compact side awning included."}
];

const seedDrivers = [
 {id:"d1",name:"Alex Carter",region:"UK",nationality:"British",className:"Senior X30",team:"Privateer",number:"27",starts:64,wins:8,podiums:21,verified:true,bio:"UK senior driver competing at club and national level."},
 {id:"d2",name:"Sophie Bennett",region:"UK",nationality:"British",className:"Rotax Junior",team:"Northline Motorsport",number:"14",starts:39,wins:6,podiums:14,verified:true,bio:"Junior driver building a national programme."},
 {id:"d3",name:"Callum Price",region:"UK",nationality:"British",className:"KZ2",team:"PRC Racing",number:"8",starts:83,wins:10,podiums:25,verified:false,bio:"Gearbox racer competing in the UK and Europe."},
 {id:"d4",name:"Luca Moretti",region:"Europe",nationality:"Italian",className:"KZ2",team:"MRT",number:"51",starts:81,wins:12,podiums:29,verified:true,bio:"European KZ2 competitor."},
 {id:"d5",name:"Mason Reed",region:"USA",nationality:"American",className:"KA100 Senior",team:"East Coast Karting",number:"22",starts:48,wins:7,podiums:16,verified:true,bio:"US KA100 Senior driver."},
 {id:"d6",name:"Harper Wilson",region:"Australia",nationality:"Australian",className:"KZ2",team:"Independent",number:"91",starts:58,wins:9,podiums:18,verified:false,bio:"Australian gearbox kart racer."}
];

const kartClasses = [
 ["FIA","Mini","Youth","60cc homologated","No","Global"],
 ["FIA","OK-N Junior","Junior","125cc direct drive","No","National / Global"],
 ["FIA","OK-Junior","Junior","125cc direct drive","No","International"],
 ["FIA","OK","Senior","125cc direct drive","No","International"],
 ["FIA","KZ2","Senior","125cc 6-speed","Yes","Global"],
 ["FIA","KZ","Senior","125cc 6-speed","Yes","World / Continental"],
 ["FIA","KZ2 Masters","Masters","125cc 6-speed","Yes","International"],
 ["Rotax","Micro MAX","Youth","125 Micro MAX","No","Global"],
 ["Rotax","Mini MAX","Youth","125 Mini MAX","No","Global"],
 ["Rotax","Junior MAX","Junior","125 MAX","No","Global"],
 ["Rotax","Senior MAX","Senior","125 MAX","No","Global"],
 ["Rotax","DD2","Senior","125 DD2","2-speed","Global"],
 ["Rotax","E10","Youth","Electric","No","Selected markets"],
 ["IAME","Bambino","Youth","Bambino","No","Selected markets"],
 ["IAME","Cadet / WaterSwift","Cadet","60cc","No","UK / Europe"],
 ["IAME","X30 Junior","Junior","125cc X30","No","Global"],
 ["IAME","X30 Senior","Senior","125cc X30","No","Global"],
 ["IAME","X30 Masters","Masters","125cc X30","No","Selected markets"],
 ["IAME","KA100 Junior","Junior","100cc 2-stroke","No","USA / selected"],
 ["IAME","KA100 Senior","Senior","100cc 2-stroke","No","USA / selected"],
 ["Vortex ROK","Mini ROK","Youth","60cc","No","Global"],
 ["Vortex ROK","Junior ROK","Junior","125cc","No","Global"],
 ["Vortex ROK","Senior ROK","Senior","125cc","No","Global"],
 ["Vortex ROK","Shifter ROK","Senior","125cc gearbox","Yes","Selected markets"],
 ["Tillotson","T4 Mini","Youth","4-stroke","No","Europe / Global"],
 ["Tillotson","T4 Junior","Junior","4-stroke","No","Europe / Global"],
 ["Tillotson","T4 Senior","Senior","4-stroke","No","Europe / Global"],
 ["Briggs","LO206 Cadet","Cadet","206cc 4-stroke","No","North America"],
 ["Briggs","LO206 Junior","Junior","206cc 4-stroke","No","North America"],
 ["Briggs","LO206 Senior","Senior","206cc 4-stroke","No","North America"],
 ["Rental","Junior Rental","Junior","4-stroke / electric","No","Global"],
 ["Rental","Senior Rental","Senior","4-stroke / electric","No","Global"]
].map((x,i)=>({id:"c"+i,family:x[0],name:x[1],age:x[2],engine:x[3],gearbox:x[4],regions:x[5],weight:"Series-specific",tyres:"Series-specific"}));

const seedPosts = [
 {id:"p1",author:"Jamie R.",region:"UK",category:"Setup Help",text:"Anyone running Senior X30 this weekend? Looking for a sensible baseline before Friday practice.",likes:18,comments:["Try one tooth shorter if the track stays cold."]},
 {id:"p2",author:"KZ Workshop",region:"Europe",category:"General",text:"Brake bedding guide is up. Biggest mistake we keep seeing is overheating the disc in the first couple of laps.",likes:42,comments:[]},
 {id:"p3",author:"TrackDad84",region:"UK",category:"Wanted",text:"Looking for a clean Cadet chassis for a winter rebuild project. Midlands collection preferred.",likes:9,comments:["I may have one available next week."]}
];

const load = (k,d)=>{try{return JSON.parse(localStorage.getItem(k)) ?? d}catch{return d}};
const save = (k,v)=>localStorage.setItem(k,JSON.stringify(v));
const detectRegion = ()=>{
 const lang=(navigator.language||"").toLowerCase(), tz=(Intl.DateTimeFormat().resolvedOptions().timeZone||"").toLowerCase();
 if(lang.includes("gb")||tz.includes("london")) return "UK";
 if(lang.includes("us")||tz.includes("america")) return "USA";
 if(lang.includes("au")||tz.includes("australia")) return "Australia";
 if(["de","fr","it","es","nl","be","pl","pt","sv","da","fi","no"].some(x=>lang.startsWith(x))) return "Europe";
 return "Global";
};

function Ad({format="Leaderboard",text="Your brand in the paddock"}) {
 return <div className="ad"><span>ADVERTISEMENT · {format}</span><strong>{text}</strong><small>Geo + class + category targeting available</small></div>
}
function Pill({children,tone=""}){return <span className={"pill "+tone}>{children}</span>}
function Top({region,setRegion}){
 return <><header><a className="logo" href="#/">KART<span>GRID</span></a><nav>
  <a href="#/news">News</a><a href="#/marketplace">Marketplace</a><a href="#/drivers">Drivers</a><a href="#/classes">Classes</a><a href="#/community">Community</a><a href="#/advertise">Advertise</a>
 </nav><div className="header-actions"><select value={region} onChange={e=>setRegion(e.target.value)}>{regions.map(r=><option key={r}>{r}</option>)}</select><a className="button outline" href="#/profile">My Profile</a></div></header>
 <div className="ticker"><b>LIVE GRID</b><span>UK club racing · International karting · Classifieds · Driver profiles · Technical classes · Community</span></div></>
}
function Hero({region}){
 return <section className="hero"><div><Pill tone="lime">{region} FEED</Pill><h1>THE WORLD<br/>OF KARTING.<br/><em>ONE GRID.</em></h1><p>News, drivers, classes, community and a proper karting marketplace — local to you, global when you want it.</p><div className="actions"><a className="button primary" href="#/news">Latest news</a><a className="button" href="#/marketplace">Browse classifieds</a></div></div><div className="trackart"><div className="ring"></div><div className="kart">27</div></div></section>
}
function SectionHead({eyebrow,title,copy,action}){return <div className="sectionhead"><div><span>{eyebrow}</span><h2>{title}</h2>{copy&&<p>{copy}</p>}</div>{action}</div>}
function useLiveNews(){
 const [state,setState]=useState({items:demoNews.map(n=>({...n,country:n.region==="UK"?"United Kingdom":n.region,continent:n.region==="UK"?"Europe":n.region,summary:n.dek,published:n.time,url:""})),updatedAt:null,live:false});
 useEffect(()=>{fetch((import.meta.env.BASE_URL||"/")+"news.json",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(d?.items?.length)setState({items:d.items,updatedAt:d.updatedAt,live:true})}).catch(()=>{})},[]);
 return state;
}
function newsFor(region,items){
 const map={UK:x=>x.country==="United Kingdom",Europe:x=>x.continent==="Europe",USA:x=>x.country==="United States",Australia:x=>x.country==="Australia",Global:()=>true};
 return items.filter(map[region]||map.Global);
}
function fmtDate(v){try{return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(v))}catch{return v||""}}
function NewsCard({n,big=false}){
 const title=n.title, dek=n.summary||n.dek||"", region=n.country&&n.country!=="Global"?n.country:(n.continent||n.region||"Global"), time=n.published?fmtDate(n.published):(n.time||""), live=!!n.url;
 const body=<><div className="media" style={n.image?{backgroundImage:`linear-gradient(180deg,transparent,rgba(0,0,0,.35)),url("${n.image}")`,backgroundSize:"cover",backgroundPosition:"center"}:{}}><span>{n.tag||"NEWS"}</span></div><div className="cardbody"><div className="meta">{region} · {time}</div><h3>{title}</h3><p>{dek}</p><div className="source-line">Source: <b>{n.source||"Original publisher"}</b>{n.sources?.length?<> · +{n.sources.length} matching source{n.sources.length>1?"s":""}</>:""}</div><b className="link">{live?"Read at source ↗":"Read story →"}</b></div></>;
 return live?<a className={"news-card "+(big?"big":"")} href={n.url} target="_blank" rel="noopener noreferrer">{body}</a>:<article className={"news-card "+(big?"big":"")} onClick={()=>location.hash="/news/"+n.id}>{body}</article>
}
function ListingCard({x,saved,toggleSave}){return <article className="listing-card"><div className="listing-img"><span>{x.category}</span><button className={"heart "+(saved?"active":"")} onClick={()=>toggleSave(x.id)}>♥</button></div><div className="cardbody"><div className="meta">{x.region} · {x.condition}</div><h3>{x.title}</h3><div className="price">{x.currency}{Number(x.price).toLocaleString()}</div><p>{x.location} · {x.compat}</p><a className="link" href={"#/marketplace/"+x.id}>View listing →</a></div></article>}
function DriverCard({d}){return <a className="driver-card" href={"#/drivers/"+d.id}><div className="avatar">{d.name.split(" ").map(x=>x[0]).join("")}</div><div><div className="meta">{d.region} · #{d.number} {d.verified&&"✓ Verified"}</div><h3>{d.name}</h3><p>{d.className} · {d.team}</p><div className="mini-stats"><b>{d.starts}<small>Starts</small></b><b>{d.wins}<small>Wins</small></b><b>{d.podiums}<small>Podiums</small></b></div></div></a>}
function Home({region,listings,drivers,posts,saved,toggleSave}){
 const liveNews=useLiveNews();
 const news=newsFor(region,liveNews.items).slice(0,3), localListings=listings.filter(x=>region==="Global"||x.region===region).slice(0,4), localDrivers=drivers.filter(x=>region==="Global"||x.region===region).slice(0,3);
 return <><Hero region={region}/><Ad format="Homepage takeover"/><section><SectionHead eyebrow="Latest from the paddock" title={region+" news first"} copy="Regional stories are prioritised automatically, with major global stories mixed in."/>{news.length?<div className="news-grid">{news.map((n,i)=><NewsCard key={n.id} n={n} big={i===0}/>)}</div>:<Empty text="No stories in this region yet."/>}</section>
 <section><SectionHead eyebrow="Marketplace" title="Fresh classifieds near you" copy="Karts, engines, parts, trailers, racewear and team equipment." action={<a className="button primary" href="#/marketplace/new">+ Post a listing</a>}/><div className="market-grid">{localListings.map(x=><ListingCard key={x.id} x={x} saved={saved.includes(x.id)} toggleSave={toggleSave}/>)}</div></section>
 <Ad format="Marketplace leaderboard" text="Dealer and manufacturer inventory"/>
 <section><SectionHead eyebrow="Drivers" title="Build your karting identity" copy="One profile for race history, results, sponsors and your karting CV." action={<a className="button" href="#/profile/edit">Create profile</a>}/><div className="driver-grid">{localDrivers.map(d=><DriverCard key={d.id} d={d}/>)}</div></section>
 <section><SectionHead eyebrow="Classes" title="Find your route through karting" copy="A worldwide directory of major class families and technical basics." action={<a className="button" href="#/classes">Explore classes</a>}/><ClassTable rows={kartClasses.slice(0,7)}/></section>
 <section><SectionHead eyebrow="Community" title="The digital paddock" copy="Setup help, wanted posts, race weekends and results." action={<a className="button primary" href="#/community/new">Create post</a>}/><div className="post-grid">{posts.filter(p=>region==="Global"||p.region===region).slice(0,3).map(p=><PostCard p={p} key={p.id}/>)}</div></section></>
}
function News({region}){
 const liveNews=useLiveNews();
 const [q,setQ]=useState(""); const [country,setCountry]=useState("All"); const [continent,setContinent]=useState("All"); const [source,setSource]=useState("All");
 const base=newsFor(region,liveNews.items);
 const countries=[...new Set(liveNews.items.map(n=>n.country).filter(x=>x&&x!=="Global"))].sort();
 const continents=[...new Set(liveNews.items.map(n=>n.continent).filter(x=>x&&x!=="Global"))].sort();
 const sources=[...new Set(liveNews.items.map(n=>n.source).filter(Boolean))].sort();
 const rows=base.filter(n=>(country==="All"||n.country===country)&&(continent==="All"||n.continent===continent)&&(source==="All"||n.source===source)&&((n.title+" "+(n.summary||n.dek||"")+" "+(n.source||"")).toLowerCase().includes(q.toLowerCase())));
 return <section><PageTitle kicker={liveNews.live?"Live aggregator":"Newsroom"} title="KARTING NEWS" text={liveNews.live?("Live karting coverage from across the web · updated "+fmtDate(liveNews.updatedAt)):"Loading live feed…"}/><Filters><input placeholder="Search live karting news…" value={q} onChange={e=>setQ(e.target.value)}/><select value={continent} onChange={e=>{setContinent(e.target.value);setCountry("All")}}><option>All</option>{continents.map(x=><option key={x}>{x}</option>)}</select><select value={country} onChange={e=>setCountry(e.target.value)}><option>All</option>{countries.filter(c=>continent==="All"||liveNews.items.some(n=>n.country===c&&n.continent===continent)).map(x=><option key={x}>{x}</option>)}</select><select value={source} onChange={e=>setSource(e.target.value)}><option>All</option>{sources.map(x=><option key={x}>{x}</option>)}</select></Filters>{rows.length?<div className="news-grid">{rows.map((n,i)=><NewsCard key={n.id||n.url||i} n={n} big={i===0}/>)}</div>:<Empty text="No live stories match those filters."/>}<Ad format="News leaderboard"/></section>
}
function NewsDetail({id}){const n=demoNews.find(x=>String(x.id)===id); if(!n)return <NotFound/>;return <section className="article"><Pill>{n.region}</Pill><h1>{n.title}</h1><p className="lead">{n.dek}</p><div className="article-meta">{n.source} · {n.time}</div><div className="article-hero"></div><p>This is a demo editorial page showing how a full KARTGRID story would read. The production version can ingest approved feeds, original reporting, championship releases and contributor content, while preserving regional relevance and source attribution.</p><p>Articles can support galleries, results tables, embedded video, related driver profiles, class links and contextual advertising.</p><Ad format="In-article MPU"/></section>}
function Marketplace({region,listings,setListings,saved,toggleSave}){
 const [q,setQ]=useState("");const [cat,setCat]=useState("All");const [cond,setCond]=useState("All");
 const rows=listings.filter(x=>(region==="Global"||x.region===region)&&(cat==="All"||x.category===cat)&&(cond==="All"||x.condition===cond)&&((x.title+" "+x.location+" "+x.compat).toLowerCase().includes(q.toLowerCase())));
 return <section><PageTitle kicker="Buy · sell · trade" title="MARKETPLACE" text="Karting-only classifieds with local-first discovery." action={<a className="button primary" href="#/marketplace/new">+ Post a listing</a>}/><Filters><input placeholder="Search karts, engines, parts…" value={q} onChange={e=>setQ(e.target.value)}/><select value={cat} onChange={e=>setCat(e.target.value)}><option>All</option>{["Complete Karts","Engines","Chassis","Parts","Wheels/Tyres","Racewear","Trailers","Tools","Transponders","Team Equipment","Services","Transport"].map(x=><option key={x}>{x}</option>)}</select><select value={cond} onChange={e=>setCond(e.target.value)}><option>All</option><option>New</option><option>Used</option></select></Filters>{rows.length?<div className="market-grid">{rows.map(x=><ListingCard key={x.id} x={x} saved={saved.includes(x.id)} toggleSave={toggleSave}/>)}</div>:<Empty text="No listings match those filters."/>}<Ad format="Marketplace dealer inventory"/></section>
}
function NewListing({region,listings,setListings}){
 const [form,setForm]=useState({title:"",price:"",category:"Complete Karts",condition:"Used",location:"",compat:"",desc:"",seller:"My Garage",region});
 const submit=e=>{e.preventDefault(); const currency=form.region==="UK"?"£":form.region==="Europe"?"€":form.region==="USA"?"$":form.region==="Australia"?"A$":"£"; const item={...form,id:"u"+Date.now(),price:Number(form.price),currency};const next=[item,...listings];setListings(next);save("kg_listings",next);location.hash="/marketplace/"+item.id};
 return <section><PageTitle kicker="Marketplace" title="POST A LISTING" text="Get your kart, engine or equipment in front of the right people."/><form className="form-card" onSubmit={submit}><label>Title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Price<input required type="number" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{["Complete Karts","Engines","Chassis","Parts","Wheels/Tyres","Racewear","Trailers","Tools","Transponders","Team Equipment","Services","Transport"].map(x=><option key={x}>{x}</option>)}</select></label><label>Condition<select value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})}><option>New</option><option>Used</option></select></label><label>Region<select value={form.region} onChange={e=>setForm({...form,region:e.target.value})}>{regions.filter(x=>x!=="Global").map(x=><option key={x}>{x}</option>)}</select></label><label>Location<input required value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label><label className="wide">Class compatibility<input value={form.compat} onChange={e=>setForm({...form,compat:e.target.value})}/></label><label className="wide">Description<textarea required value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})}/></label><button className="button primary wide">Publish listing</button></form></section>
}
function ListingDetail({id,listings,saved,toggleSave}){const x=listings.find(i=>i.id===id);if(!x)return <NotFound/>;return <section><div className="detail-grid"><div className="detail-image"><span>{x.category}</span></div><div className="detail-copy"><div className="meta">{x.region} · {x.condition} · {x.location}</div><h1>{x.title}</h1><div className="mega-price">{x.currency}{Number(x.price).toLocaleString()}</div><Pill tone="lime">{x.compat}</Pill><p>{x.desc}</p><div className="seller"><b>{x.seller}</b><small>Seller profile · Report listing</small></div><div className="actions"><button className="button primary" onClick={()=>alert("Message sent to seller (demo).")}>Contact seller</button><button className="button" onClick={()=>toggleSave(x.id)}>{saved.includes(x.id)?"♥ Saved":"♡ Save listing"}</button></div></div></div><Ad format="Listing MPU"/></section>}
function Drivers({region,drivers}){const[q,setQ]=useState("");const rows=drivers.filter(d=>(region==="Global"||d.region===region)&&((d.name+" "+d.className+" "+d.team).toLowerCase().includes(q.toLowerCase())));return <section><PageTitle kicker="Driver network" title="DRIVERS" text="Find racers, teams and talent across the karting world." action={<a className="button primary" href="#/profile/edit">+ Create my profile</a>}/><Filters><input placeholder="Search driver, class or team…" value={q} onChange={e=>setQ(e.target.value)}/></Filters><div className="driver-grid">{rows.map(d=><DriverCard key={d.id} d={d}/>)}</div><Ad format="Driver directory sponsor"/></section>}
function DriverDetail({id,drivers}){const d=drivers.find(x=>x.id===id);if(!d)return <NotFound/>;return <section><div className="profile-hero"><div className="profile-avatar">{d.name.split(" ").map(x=>x[0]).join("")}</div><div><div className="meta">{d.nationality} · {d.region} · #{d.number} {d.verified&&"· ✓ Verified"}</div><h1>{d.name}</h1><p>{d.className} · {d.team}</p><p>{d.bio}</p></div></div><div className="statbar"><b>{d.starts}<small>Starts</small></b><b>{d.wins}<small>Wins</small></b><b>{d.podiums}<small>Podiums</small></b><b>{d.className}<small>Current class</small></b></div><div className="two-col"><div className="panel"><h3>Race history</h3><p className="muted">Results, championships, race weekends and lap records will sit here.</p></div><div className="panel"><h3>Sponsors</h3><p className="muted">Sponsor logos, links and partnership status.</p></div></div></section>}
function Classes(){
 const[q,setQ]=useState("");const[family,setFamily]=useState("All");const[gear,setGear]=useState("All");
 const rows=kartClasses.filter(c=>(family==="All"||c.family===family)&&(gear==="All"||c.gearbox===gear)&&(Object.values(c).join(" ").toLowerCase().includes(q.toLowerCase())));
 return <section><PageTitle kicker="Knowledge base" title="KARTING CLASSES" text="A global directory designed to extend down to national, championship and club variants."/><Filters><input placeholder="Search class, engine or region…" value={q} onChange={e=>setQ(e.target.value)}/><select value={family} onChange={e=>setFamily(e.target.value)}><option>All</option>{[...new Set(kartClasses.map(c=>c.family))].map(x=><option key={x}>{x}</option>)}</select><select value={gear} onChange={e=>setGear(e.target.value)}><option>All</option><option>No</option><option>Yes</option><option>2-speed</option></select></Filters><ClassTable rows={rows}/><Ad format="Class sponsor" text="Engine, tyre and equipment partners"/></section>}
function ClassTable({rows}){return <div className="tablewrap"><table><thead><tr><th>Family</th><th>Class</th><th>Age</th><th>Engine</th><th>Gearbox</th><th>Regions</th></tr></thead><tbody>{rows.map(c=><tr key={c.id} onClick={()=>location.hash="/classes/"+c.id}><td><Pill>{c.family}</Pill></td><td><b>{c.name}</b></td><td>{c.age}</td><td>{c.engine}</td><td>{c.gearbox}</td><td>{c.regions}</td></tr>)}</tbody></table></div>}
function ClassDetail({id}){const c=kartClasses.find(x=>x.id===id);if(!c)return <NotFound/>;return <section><PageTitle kicker={c.family} title={c.name.toUpperCase()} text={"A "+c.age.toLowerCase()+" karting class raced across "+c.regions+"."}/><div className="statbar"><b>{c.age}<small>Age band</small></b><b>{c.engine}<small>Engine</small></b><b>{c.gearbox}<small>Gearbox</small></b><b>{c.regions}<small>Regions</small></b></div><div className="two-col"><div className="panel"><h3>Technical snapshot</h3><p>Minimum weight: {c.weight}</p><p>Tyres: {c.tyres}</p><p>Rules and homologation vary by championship and national authority. Production records can override the global class with country-specific technical details.</p></div><Ad format="Class MPU"/></div></section>}
function PostCard({p,onLike,onComment}){const[text,setText]=useState("");return <article className="post"><div className="posthead"><div className="tinyavatar">{p.author.slice(0,2).toUpperCase()}</div><div><b>{p.author}</b><div className="meta">{p.region} · {p.category}</div></div></div><p>{p.text}</p><div className="postactions"><button onClick={()=>onLike&&onLike(p.id)}>♥ {p.likes}</button><span>💬 {p.comments.length}</span><span>↗ Share</span></div>{onComment&&<><div className="comments">{p.comments.map((c,i)=><small key={i}>{c}</small>)}</div><form className="commentbox" onSubmit={e=>{e.preventDefault();if(text.trim()){onComment(p.id,text.trim());setText("")}}}><input value={text} onChange={e=>setText(e.target.value)} placeholder="Add a comment…"/><button>Send</button></form></>}</article>}
function Community({region,posts,setPosts}){
 const [cat,setCat]=useState("All");const rows=posts.filter(p=>(region==="Global"||p.region===region)&&(cat==="All"||p.category===cat));
 const like=id=>{const n=posts.map(p=>p.id===id?{...p,likes:p.likes+1}:p);setPosts(n);save("kg_posts",n)};
 const comment=(id,text)=>{const n=posts.map(p=>p.id===id?{...p,comments:[...p.comments,text]}:p);setPosts(n);save("kg_posts",n)};
 return <section><PageTitle kicker="User generated" title="THE PADDOCK" text="Questions, setup notes, race weekends, wanted posts and results." action={<a className="button primary" href="#/community/new">+ Create post</a>}/><Filters><select value={cat} onChange={e=>setCat(e.target.value)}><option>All</option>{["Setup Help","Race Weekend","Wanted","Results","Photos","General"].map(x=><option key={x}>{x}</option>)}</select></Filters><div className="community-layout"><div className="post-grid">{rows.map(p=><PostCard key={p.id} p={p} onLike={like} onComment={comment}/>)}</div><aside><Ad format="MPU"/><div className="panel"><h3>Trending</h3><p>#X30Setup</p><p>#KartForSale</p><p>#RaceWeekend</p></div></aside></div></section>}
function NewPost({region,posts,setPosts}){const[form,setForm]=useState({author:"My Profile",region:region==="Global"?"UK":region,category:"General",text:""});const submit=e=>{e.preventDefault();const n=[{...form,id:"up"+Date.now(),likes:0,comments:[]},...posts];setPosts(n);save("kg_posts",n);location.hash="/community"};return <section><PageTitle kicker="Community" title="CREATE A POST" text="Ask, share, buy, sell or help someone in the paddock."/><form className="form-card" onSubmit={submit}><label>Name<input value={form.author} onChange={e=>setForm({...form,author:e.target.value})}/></label><label>Region<select value={form.region} onChange={e=>setForm({...form,region:e.target.value})}>{regions.filter(x=>x!=="Global").map(x=><option key={x}>{x}</option>)}</select></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{["Setup Help","Race Weekend","Wanted","Results","Photos","General"].map(x=><option key={x}>{x}</option>)}</select></label><label className="wide">Post<textarea required value={form.text} onChange={e=>setForm({...form,text:e.target.value})}/></label><button className="button primary wide">Post to paddock</button></form></section>}
function Advertise(){return <section><PageTitle kicker="Commercial" title="ADVERTISE" text="Reach karting people by where they are, what they race and what they buy."/><div className="ad-products"><div className="panel"><h3>Leaderboard</h3><b>970 × 250</b><p>Homepage, news and marketplace placements.</p></div><div className="panel"><h3>MPU</h3><b>300 × 250</b><p>Contextual sidebar and article placements.</p></div><div className="panel"><h3>Native story</h3><b>Sponsored</b><p>Clearly labelled editorial-style commercial content.</p></div><div className="panel"><h3>Weekend takeover</h3><b>Event-led</b><p>High-impact campaigns around major race weekends.</p></div></div><div className="two-col"><div className="panel"><h3>Targeting</h3><p>Country / region · karting class · marketplace category · age group · championship interest · circuit region.</p></div><div className="panel"><h3>Want the media pack?</h3><button className="button primary" onClick={()=>alert("Enquiry captured (demo).")}>Request media pack</button></div></div></section>}
function Profile({profile,listings,posts,saved}){
 const mine=listings.filter(x=>x.seller==="My Garage"), myPosts=posts.filter(x=>x.author==="My Profile");
 return <section><PageTitle kicker="Account" title="MY PROFILE" text="Your karting identity, garage and community activity." action={<a className="button primary" href="#/profile/edit">Edit driver profile</a>}/>{profile?<div className="profile-hero compact"><div className="profile-avatar">{profile.name.split(" ").map(x=>x[0]).join("")}</div><div><h2>{profile.name}</h2><p>{profile.className} · {profile.team}</p><p>{profile.bio}</p></div></div>:<Empty text="You have not created a driver profile yet." action={<a className="button primary" href="#/profile/edit">Create profile</a>}/>}<div className="dashboard"><div className="panel"><h3>My listings</h3><b>{mine.length}</b></div><div className="panel"><h3>Saved listings</h3><b>{saved.length}</b></div><div className="panel"><h3>Community posts</h3><b>{myPosts.length}</b></div></div></section>}
function EditProfile({profile,setProfile,drivers,setDrivers,region}){
 const [f,setF]=useState(profile||{id:"me",name:"",region:region==="Global"?"UK":region,nationality:"British",className:"Senior X30",team:"Privateer",number:"",starts:0,wins:0,podiums:0,verified:false,bio:""});
 const submit=e=>{e.preventDefault();setProfile(f);save("kg_profile",f);const next=[f,...drivers.filter(d=>d.id!=="me")];setDrivers(next);save("kg_drivers",next);location.hash="/profile"};
 return <section><PageTitle kicker="Driver profile" title="BUILD YOUR KARTING CV" text="Create a public racing identity you can keep building over time."/><form className="form-card" onSubmit={submit}><label>Name<input required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></label><label>Race number<input required value={f.number} onChange={e=>setF({...f,number:e.target.value})}/></label><label>Region<select value={f.region} onChange={e=>setF({...f,region:e.target.value})}>{regions.filter(x=>x!=="Global").map(x=><option key={x}>{x}</option>)}</select></label><label>Nationality<input value={f.nationality} onChange={e=>setF({...f,nationality:e.target.value})}/></label><label>Current class<input value={f.className} onChange={e=>setF({...f,className:e.target.value})}/></label><label>Team<input value={f.team} onChange={e=>setF({...f,team:e.target.value})}/></label><label>Starts<input type="number" value={f.starts} onChange={e=>setF({...f,starts:Number(e.target.value)})}/></label><label>Wins<input type="number" value={f.wins} onChange={e=>setF({...f,wins:Number(e.target.value)})}/></label><label>Podiums<input type="number" value={f.podiums} onChange={e=>setF({...f,podiums:Number(e.target.value)})}/></label><label className="wide">Bio<textarea value={f.bio} onChange={e=>setF({...f,bio:e.target.value})}/></label><button className="button primary wide">Save driver profile</button></form></section>}
function PageTitle({kicker,title,text,action}){return <div className="pagetitle"><div><span>{kicker}</span><h1>{title}</h1><p>{text}</p></div>{action}</div>}
function Filters({children}){return <div className="filters">{children}</div>}
function Empty({text,action}){return <div className="empty"><h3>{text}</h3>{action}</div>}
function NotFound(){return <section><PageTitle kicker="404" title="NOT ON THE GRID" text="That page could not be found."/><a className="button primary" href="#/">Back home</a></section>}

function App(){
 const [region,setRegionState]=useState(()=>load("kg_region",detectRegion()));
 const [listings,setListings]=useState(()=>load("kg_listings",seedListings));
 const [drivers,setDrivers]=useState(()=>load("kg_drivers",seedDrivers));
 const [posts,setPosts]=useState(()=>load("kg_posts",seedPosts));
 const [saved,setSaved]=useState(()=>load("kg_saved",[]));
 const [profile,setProfile]=useState(()=>load("kg_profile",null));
 const [route,setRoute]=useState(()=>location.hash.slice(1)||"/");
 useEffect(()=>{const fn=()=>{setRoute(location.hash.slice(1)||"/");window.scrollTo(0,0)};addEventListener("hashchange",fn);return()=>removeEventListener("hashchange",fn)},[]);
 const setRegion=r=>{setRegionState(r);save("kg_region",r)};
 const toggleSave=id=>{const n=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];setSaved(n);save("kg_saved",n)};
 let page;
 const parts=route.split("/").filter(Boolean);
 if(route==="/") page=<Home {...{region,listings,drivers,posts,saved,toggleSave}}/>;
 else if(parts[0]==="news"&&parts[1]) page=<NewsDetail id={parts[1]}/>;
 else if(parts[0]==="news") page=<News region={region}/>;
 else if(parts[0]==="marketplace"&&parts[1]==="new") page=<NewListing {...{region,listings,setListings}}/>;
 else if(parts[0]==="marketplace"&&parts[1]) page=<ListingDetail id={parts[1]} {...{listings,saved,toggleSave}}/>;
 else if(parts[0]==="marketplace") page=<Marketplace {...{region,listings,setListings,saved,toggleSave}}/>;
 else if(parts[0]==="drivers"&&parts[1]) page=<DriverDetail id={parts[1]} drivers={drivers}/>;
 else if(parts[0]==="drivers") page=<Drivers region={region} drivers={drivers}/>;
 else if(parts[0]==="classes"&&parts[1]) page=<ClassDetail id={parts[1]}/>;
 else if(parts[0]==="classes") page=<Classes/>;
 else if(parts[0]==="community"&&parts[1]==="new") page=<NewPost {...{region,posts,setPosts}}/>;
 else if(parts[0]==="community") page=<Community {...{region,posts,setPosts}}/>;
 else if(parts[0]==="advertise") page=<Advertise/>;
 else if(parts[0]==="profile"&&parts[1]==="edit") page=<EditProfile {...{profile,setProfile,drivers,setDrivers,region}}/>;
 else if(parts[0]==="profile") page=<Profile {...{profile,listings,posts,saved}}/>;
 else page=<NotFound/>;
 return <><Top region={region} setRegion={setRegion}/><main>{page}</main><footer><a className="logo" href="#/">KART<span>GRID</span></a><p>The world of karting, local to you.</p><div><a href="#/news">News</a><a href="#/marketplace">Marketplace</a><a href="#/drivers">Drivers</a><a href="#/classes">Classes</a><a href="#/advertise">Advertise</a></div></footer></>
}
createRoot(document.getElementById("root")).render(<App/>);
