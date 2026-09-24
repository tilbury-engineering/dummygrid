import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import "./styles.css";
import tracksSeed from "./data/tracks.json";

const DUMMYGRID_LOGO = (import.meta.env.BASE_URL || "/") + "dummygrid-logo.svg";
const DUMMYGRID_API = "https://dummygrid-api.onrender.com";

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


const manufacturers = [
 {id:"tony-kart",name:"Tony Kart",group:"OTK Kart Group",country:"Italy",founded:"1958",site:"https://www.tonykart.com/",logo:"https://www.tonykart.com/favicon.ico",aliases:["Tony Kart","OTK"],history:"Founded in 1958, Tony Kart became one of karting's best-known Italian chassis marques and today sits within OTK Kart Group.",products:[{name:"Racer 401 T",type:"Direct-drive / senior chassis"},{name:"Racer 401 T KZ",type:"Shifter / KZ chassis"},{name:"Rookie",type:"Mini chassis"},{name:"OTK Kart Parts",type:"Components & spares"},{name:"OTK Kart Wear",type:"Racewear & apparel"}],dealers:[{country:"USA",name:"OTK Kart USA Corp.",location:"Orlando, Florida"},{country:"Australia",name:"OTK Kart Australia Pty Ltd",location:"Seven Hills, NSW"},{country:"Australia",name:"International Karting Distributors",location:"Emu Plains, NSW"},{country:"United Kingdom / Europe",name:"Official Tony Kart dealer network",location:"See official directory"}],dealerUrl:"https://www.tonykart.com/rivenditori_mondo_en.php?cont=Europa",catalogueUrl:"https://www.tonykart.com/",newsTerms:["tony kart","otk"]},
 {id:"kosmic",name:"Kosmic Kart",group:"OTK Kart Group",country:"Italy",founded:"1996",site:"https://www.kosmickart.com/",aliases:["Kosmic"],history:"Kosmic is an OTK Kart Group brand focused on international racing chassis and competition programmes.",products:["Mercury RR","Mini","KZ / gearbox chassis"],newsTerms:["kosmic kart","kosmic"]},
 {id:"exprit",name:"Exprit",group:"OTK Kart Group",country:"Italy",founded:"2005",site:"https://www.expritkart.com/",aliases:["Exprit"],history:"Exprit is part of OTK Kart Group and competes across major international karting categories.",products:["Noesis RR","Mini","KZ / gearbox chassis"],newsTerms:["exprit"]},
 {id:"ln-racing-kart",name:"LN Racing Kart",group:"OTK Kart Group",country:"Italy",founded:"2021",site:"https://www.lnracingkart.com/",aliases:["LN Racing Kart","LN Kart"],history:"LN Racing Kart is the OTK-linked chassis brand created around Fernando Alonso's LN identity.",products:["Four","Mini","KZ / gearbox chassis"],newsTerms:["ln racing kart","ln kart"]},
 {id:"crg",name:"CRG",group:"CRG",country:"Italy",founded:"1986",site:"https://kartcrg.com/",aliases:["CRG"],history:"CRG was founded in 1986 from the experience of Kalì-Kart and has developed racing, rental and engine-related karting products.",products:["Road Rebel","KT chassis range","Mini","Rental karts"],newsTerms:["crg kart","crg"]},
 {id:"birel-art",name:"Birel ART",group:"Korus Group",country:"Italy",founded:"1959",site:"https://www.birelart.com/",aliases:["Birel","Birel ART"],history:"Birel traces its roots to Umberto Sala's first karts in the late 1950s. Birel ART was formed through the later partnership with ART Grand Prix.",products:["Racing chassis","Mini chassis","KZ chassis","Rental / Easykart programmes"],newsTerms:["birel art","birelart","birel"]},
 {id:"kart-republic",name:"Kart Republic",group:"Kart Republic",country:"Italy",founded:"2017",site:"https://www.kartrepublic.com/",aliases:["Kart Republic","KR"],history:"Kart Republic was launched by Dino Chiesa as a modern racing-kart marque focused on international competition.",products:["KR chassis range","Mini","OK / direct-drive chassis","KZ chassis"],newsTerms:["kart republic","kr chassis"]},
 {id:"sodikart",name:"Sodikart",group:"Sodikart",country:"France",founded:"1981",site:"https://www.sodikart.com/",aliases:["Sodi","Sodikart"],history:"Sodikart is a French manufacturer producing both racing and rental karts, with a large international track and dealer footprint.",products:["Sigma RS3","Sigma KZ","Sigma DD2","Furia 950","SR / RT / RSX rental ranges"],newsTerms:["sodikart","sodi kart","sodi racing"]},
 {id:"parolin",name:"Parolin Racing Kart",group:"Parolin",country:"Italy",founded:"1986",site:"https://www.parolinracing.com/",aliases:["Parolin"],history:"Parolin is an Italian kart manufacturer active across Mini, junior, senior and international racing categories.",products:["Mini chassis","OK / OKJ chassis","KZ chassis","Rental products"],newsTerms:["parolin racing","parolin kart"]},
 {id:"praga",name:"Praga Karts",group:"IPK",country:"Czech Republic",founded:"2010",site:"https://www.pragaglobal.com/karts/",aliases:["Praga Kart","Praga Karts","IPK"],history:"Praga Karts is part of the IPK family and produces competition chassis across sprint and gearbox classes.",products:["Dragon Evo","Tacho Evo","Mini","KZ chassis"],newsTerms:["praga kart","ipk karting"]},
 {id:"formula-k",name:"Formula K",group:"IPK",country:"Italy / Czech Republic",founded:"2000s",site:"https://www.ipkarting.com/",aliases:["Formula K"],history:"Formula K is one of the racing chassis marques within the IPK portfolio.",products:["Racing chassis","Mini","KZ chassis"],newsTerms:["formula k kart"]},
 {id:"maranello",name:"Maranello Kart",group:"Maranello Kart",country:"Italy",founded:"1990s",site:"https://www.maranellokart.com/",aliases:["Maranello Kart"],history:"Maranello Kart is an Italian racing-kart manufacturer with a long presence in gearbox and international competition.",products:["RS chassis","KZ chassis","Mini chassis"],newsTerms:["maranello kart"]},
 {id:"energy",name:"Energy Corse",group:"Energy Corse",country:"Italy",founded:"1997",site:"https://www.energycorse.com/",aliases:["Energy Corse","Energy Kart"],history:"Energy Corse is an Italian karting constructor and racing team active in international competition.",products:["Storm chassis","Mini","OK / OKJ chassis","KZ chassis"],newsTerms:["energy corse","energy kart"]},
 {id:"intrepid",name:"Intrepid Driver Program",group:"Intrepid",country:"Italy",founded:"2000s",site:"https://www.intrepidkart.com/",aliases:["Intrepid"],history:"Intrepid has competed internationally as a chassis and racing brand across multiple karting categories.",products:["Racing chassis","Mini","KZ chassis"],newsTerms:["intrepid kart"]},
 {id:"gold-kart",name:"Gold Kart",group:"Righetti Ridolfi",country:"Italy",founded:"1990s",site:"https://www.goldkart.com/",aliases:["Gold Kart"],history:"Gold Kart is an Italian chassis brand associated with Righetti Ridolfi and competition kart production.",products:["Racing chassis","Rental chassis","Mini chassis"],newsTerms:["gold kart"]},
 {id:"compkart",name:"CompKart",group:"J3 Competition",country:"United States",founded:"2014",site:"https://www.compkart.com/",aliases:["CompKart"],history:"CompKart is a US-led competition chassis brand developed by J3 Competition.",products:["Covert 3.0","Ranger","Cadet / Mini","Shifter chassis"],newsTerms:["compkart","comp kart"]},
 {id:"margay",name:"Margay Racing",group:"Margay",country:"United States",founded:"1964",site:"https://www.margay.com/",aliases:["Margay"],history:"Margay is a long-established American kart manufacturer and racing organisation founded in the 1960s.",products:["Ignite chassis","Brava","Rental / arrive-and-drive products"],newsTerms:["margay kart","margay racing"]},
 {id:"rpg",name:"RPG / Rolison Performance Group",group:"RPG",country:"United States",founded:"2000s",site:"https://rolisonperformancegroup.com/",aliases:["RPG","Rolison Performance Group"],history:"Rolison Performance Group is a major US karting team and chassis programme with a strong national presence.",products:["Race team programmes","Driver development","Chassis support"],newsTerms:["rolison performance group","rpg karting"]},
 {id:"arrow",name:"Arrow Karts",group:"DPE Kart Technology",country:"Australia",founded:"1980s",site:"https://www.arrowkarts.com/",aliases:["Arrow Kart","Arrow Karts"],history:"Arrow is an Australian kart chassis brand produced by DPE Kart Technology.",products:["X6 range","Cadet / junior chassis","Senior chassis","KZ / gearbox chassis"],newsTerms:["arrow kart","arrow karts"]},
 {id:"aero",name:"Aero Racing Karts",group:"DPE Kart Technology",country:"Australia",founded:"2020s",site:"https://www.dpekart.com/",aliases:["Aero Kart"],history:"Aero is part of the Australian DPE karting ecosystem and serves competition karting markets.",products:["Competition chassis","Cadet / junior","Senior"],newsTerms:["aero racing kart","aero kart"]},
 {id:"zip-kart",name:"Zip Kart",group:"Zip Kart International",country:"United Kingdom",founded:"1960s",site:"https://zipkart.com/",logo:"https://zipkart.com/favicon.ico",aliases:["Zip Kart","ZIP"],history:"Zip Kart is one of Britain's long-established karting marques, with roots stretching back to the 1960s and a long record in British karting, engineering and driver development.",products:[{name:"Complete Karts",type:"Current Zip chassis and kart packages"},{name:"Body Work",type:"Bodywork and plastics"},{name:"Engines and Components",type:"Engines, engine parts and ancillaries"},{name:"Mirage Rotax Engines",type:"Micro MAX, Mini MAX, Junior MAX and Senior MAX engine services"},{name:"Kart Service Italy",type:"Tools, sprockets and workshop equipment"}],dealers:[{country:"United Kingdom",name:"Zip Kart International",location:"Towcester, Northamptonshire"}],dealerUrl:"https://zipkart.com/",catalogueUrl:"https://zipkart.com/collections/all",newsTerms:["zip kart","zipkart"]},
 {id:"top-kart",name:"Top Kart",group:"Top Kart / Comer",country:"Italy",founded:"1980s",site:"https://www.comer-topkart.it/",aliases:["Top Kart","Top-Kart"],history:"Top Kart grew from the Comer karting business in the 1980s and went on to become an internationally successful chassis marque with world, European and intercontinental titles.",products:["Blue Eagle","Bambino","Racing chassis","Comer-linked karting products"],newsTerms:["top kart","top-kart"]},
 {id:"haase",name:"Haase",group:"Haase Kart",country:"Italy",founded:"1991",site:"https://www.haase.it/",aliases:["Haase","Haase Kart"],history:"After a long top-level driving career, 1984 Formula K World Champion Jørn Haase began manufacturing racing chassis in 1991. Haase won the Manufacturers World Championship in 1993 and again in 1994.",products:["Karif","Zenit","Edox","Bomber Mini","Rental HRM / HRI"],newsTerms:["haase kart","haase racing"]},
 {id:"gillard",name:"Gillard Kart",group:"OTK Kart Group",country:"United Kingdom / Italy",founded:"1980",site:"https://www.gillardkart.com/",logo:"https://www.gillardkart.com/favicon.ico",aliases:["Gillard","Gillard Kart"],history:"Founded in Britain by Tim Gillard in 1980, Gillard became one of the UK's most successful chassis marques. OTK Kart Group acquired the brand in 2020 and continues its product development and production.",products:[{name:"TG17 MY 2025",type:"Current racing chassis"},{name:"TDX",type:"Direct-drive chassis"},{name:"Rookie EVM / EVS",type:"Mini / cadet chassis"},{name:"OTK Kart Parts",type:"Components & spares"},{name:"OTK Kart Wear",type:"Racewear & apparel"}],dealers:[{country:"Denmark",name:"STAR",location:"Stenløse"},{country:"Finland",name:"MPT-Racing",location:"Kotka"},{country:"France",name:"TKF",location:"Guérande"},{country:"Netherlands",name:"Kombikart Racing Parts BV",location:"Schijndel"},{country:"Spain",name:"Racing Center Cat, SL",location:"Granollers"}],dealerUrl:"https://gillardkart.com/rivenditori_mondo_eng.php?cont=Europa",catalogueUrl:"https://gillardkart.com/",newsTerms:["gillard kart","gillard"]},
 {id:"cs55",name:"CS55 Racing Kart",group:"OTK Kart Group / Carlos Sainz",country:"Spain / Italy",founded:"2024",site:"https://www.cs55racingkart.com/",logo:"https://www.cs55racingkart.com/favicon.ico",aliases:["CS55","Carlos Sainz Kart","CS55 Racing Kart"],history:"CS55 Racing Kart was launched in 2024 through a collaboration between Carlos Sainz and OTK Kart Group, creating a personalised range of racing karts, frames and accessories produced to OTK standards.",products:[{name:"CS55 MY 2025",type:"Current complete kart / chassis range"},{name:"Bare Frames",type:"Competition frames"},{name:"OTK Kart Parts",type:"Components & spares"},{name:"OTK Kart Wear",type:"Racewear & apparel"},{name:"CS55 Accessories",type:"Branded karting accessories"}],dealers:[{country:"Belgium",name:"Genker Kart Shop NV",location:"Genk"},{country:"Czech Republic",name:"Hagemann A.S.",location:"Slezská Ostrava"},{country:"Denmark",name:"STAR",location:"Stenløse"},{country:"Finland",name:"Kart Shop Finland",location:"Vantaa"},{country:"France",name:"Malevaut Sport",location:"Pleumartin"},{country:"Germany",name:"Dischner Kartsport",location:"Osburg"}],dealerUrl:"https://cs55racingkart.com/rivenditori_mondo_en.php?cont=Europa",catalogueUrl:"https://cs55racingkart.com/",newsTerms:["cs55 racing kart","cs55 kart","carlos sainz kart"]},
 {id:"brm",name:"BRM Racing",group:"BRM Racing Factory",country:"Italy",founded:"1990s",site:"https://brmracing.it/",aliases:["BRM","BRM Racing"],history:"BRM Racing is an Italian kart manufacturer founded in the 1990s, producing kart chassis, accessories and spare parts alongside an official racing team.",products:["KZ chassis","Mini Kart","Racing chassis","Braking systems"],newsTerms:["brm racing kart","brm kart"]},
 {id:"fullerton",name:"Fullerton Kart",group:"Terry Fullerton",country:"United Kingdom",founded:"2010s",site:"https://terryfullerton.co.uk/",aliases:["Fullerton","Fullerton Kart"],history:"Fullerton Kart is the chassis marque associated with British karting legend Terry Fullerton. The range has included UK competition chassis produced with Birel ART manufacturing support and homologated under the Fullerton name.",products:["TF3","TF Xenon","TF Bambino","Junior / Senior competition chassis"],newsTerms:["fullerton kart","terry fullerton kart"]}
,
 {id:"project-one",name:"Project One Racing",group:"Project One",country:"United Kingdom",founded:"1990s",site:"https://www.projectoneracing.co.uk/",aliases:["Project One"],history:"Project One Racing is a British kart chassis and racing operation with a strong presence in UK cadet and junior competition.",products:["Cadet chassis","Junior chassis","Race support"],newsTerms:["project one kart","project one racing"]},
 {id:"wright",name:"Wright Kart",group:"Wright",country:"United Kingdom",founded:"2000s",site:"",aliases:["Wright Kart"],history:"Wright is a British kart chassis marque used across UK competition categories.",products:["Cadet chassis","Junior / Senior chassis"],newsTerms:["wright kart"]},
 {id:"synergy",name:"Synergy",group:"Synergy Kart",country:"United Kingdom",founded:"2000s",site:"",aliases:["Synergy Kart"],history:"Synergy is a British competition kart chassis marque seen across national and club-level racing.",products:["Cadet chassis","Junior / Senior chassis"],newsTerms:["synergy kart"]},
 {id:"tecno",name:"Tecno Kart",group:"Tecno",country:"Italy",founded:"1980s",site:"https://www.tecnokart.com/",aliases:["Tecno","Tecno Kart"],history:"Tecno is an Italian kart constructor with decades of involvement in international chassis development and racing.",products:["Mini chassis","Direct-drive chassis","KZ chassis"],newsTerms:["tecno kart"]},
 {id:"ms-kart",name:"MS Kart",group:"MS Kart",country:"Czech Republic",founded:"1990s",site:"https://www.mskart.cz/",aliases:["MS Kart"],history:"MS Kart is a Czech kart manufacturer producing racing and rental chassis for international markets.",products:["Racing chassis","Rental chassis","KZ chassis"],newsTerms:["ms kart"]},
 {id:"benik",name:"Benik Kart",group:"Benik",country:"United States",founded:"2010s",site:"https://benikkart.com/",aliases:["Benik"],history:"Benik is a US-focused chassis brand with strong presence in cadet, mini and junior karting.",products:["Cadet chassis","Mini chassis","Junior chassis"],newsTerms:["benik kart","benik"]},
 {id:"dr",name:"DR Racing Kart",group:"DR Racing",country:"Italy",founded:"2000s",site:"https://www.drracingkart.com/",aliases:["DR Racing Kart","DR Kart"],history:"DR Racing Kart is the Italian chassis brand associated with Danilo Rossi and international competition.",products:["Mini","OK / OKJ","KZ chassis"],newsTerms:["dr racing kart","dr kart"]},
 {id:"tb-kart",name:"TB Kart",group:"TB Kart",country:"Italy",founded:"2000s",site:"https://www.tbkart.com/",aliases:["TB Kart"],history:"TB Kart is an Italian kart manufacturer active in both racing and rental markets.",products:["Racing chassis","Mini","Rental karts"],newsTerms:["tb kart"]},
 {id:"croc-promotion",name:"Croc Promotion",group:"Croc Promotion",country:"Italy",founded:"2010s",site:"",aliases:["Croc Promotion","Croc Kart"],history:"Croc Promotion is an Italian racing kart chassis marque used in international competition.",products:["Racing chassis","KZ chassis"],newsTerms:["croc promotion kart","croc kart"]},
 {id:"alonso-kart",name:"Alonso Kart",group:"Fernando Alonso / OTK heritage",country:"Spain / Italy",founded:"2010s",site:"",aliases:["Alonso Kart"],history:"Alonso Kart is the chassis marque associated with Fernando Alonso and has been used internationally across multiple categories.",products:["Mini","Direct-drive chassis","KZ chassis"],newsTerms:["alonso kart"]},
 {id:"eks",name:"EKS Kart",group:"EKS",country:"Italy",founded:"2010s",site:"",aliases:["EKS Kart"],history:"EKS is a competition kart chassis brand active in international racing.",products:["Racing chassis","Mini","KZ chassis"],newsTerms:["eks kart"]},
 {id:"righetti-ridolfi",name:"Righetti Ridolfi",group:"Righetti Ridolfi",country:"Italy",founded:"1969",site:"https://www.righettiridolfi.com/",aliases:["Righetti Ridolfi"],history:"Righetti Ridolfi is a long-established Italian karting manufacturer and component supplier, producing chassis, parts and accessories.",products:["Kart chassis","Components","Braking systems","Accessories"],newsTerms:["righetti ridolfi kart"]}];

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
 const [menuOpen,setMenuOpen]=useState(false);
 return <><header className="site-header">
   <div className="masthead">
     <a className="logo" href="#/" aria-label="DummyGrid home">
       <img src={DUMMYGRID_LOGO} alt="DummyGrid" onError={e=>{e.currentTarget.style.display="none";e.currentTarget.nextElementSibling.style.display="inline-flex"}}/>
       <span className="logo-fallback">Dummy<span>Grid</span></span>
     </a>
     <nav className={"main-nav "+(menuOpen?"open":"")}>
       <a href="#/" onClick={()=>setMenuOpen(false)}>Home</a>
       <a href="#/news" onClick={()=>setMenuOpen(false)}>News</a>
       <a href="#/marketplace" onClick={()=>setMenuOpen(false)}>Marketplace</a>
       <a href="#/drivers" onClick={()=>setMenuOpen(false)}>Drivers</a>
       <a href="#/classes" onClick={()=>setMenuOpen(false)}>Classes</a>
       <a href="#/manufacturers" onClick={()=>setMenuOpen(false)}>Manufacturers</a><a href="#/results" onClick={()=>setMenuOpen(false)}>Results</a><a href="#/tracks" onClick={()=>setMenuOpen(false)}>Tracks</a>
       <a href="#/community" onClick={()=>setMenuOpen(false)}>Community</a><a href="#/knowledge-base" onClick={()=>setMenuOpen(false)}>Knowledge Base</a>
     </nav>
     <div className="header-actions">
       <select aria-label="Choose region" value={region} onChange={e=>setRegion(e.target.value)}>{regions.map(r=><option key={r}>{r}</option>)}</select>
       <a className="account-link" href="#/profile">Profile</a>
       <button className="menu-toggle" aria-label="Toggle menu" aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)}><span></span><span></span><span></span></button>
     </div>
   </div>
 </header>
 <div className="subnav"><div><b>LIVE</b><span>Karting news · Encyclopedia · Marketplace · Drivers · Teams · Circuits</span><a href="#/advertise">Advertise</a></div></div></>
}
function Hero({region}){
 return <section className="hero"><div><Pill tone="lime">{region} FEED</Pill><h1>THE WORLD<br/>OF KARTING.<br/><em>ONE GRID.</em></h1><p>News, drivers, classes, community and a proper karting marketplace — local to you, global when you want it.</p><div className="actions"><a className="button primary" href="#/news">Latest news</a><a className="button" href="#/marketplace">Browse classifieds</a></div></div><div className="trackart"><div className="ring"></div><div className="kart">27</div></div></section>
}
function useRemoteJson(path,fallback){
 const [state,setState]=useState({data:fallback,loading:true});
 useEffect(()=>{let live=true;fetch((import.meta.env.BASE_URL||"/")+path).then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(live)setState({data,loading:false})}).catch(()=>{if(live)setState({data:fallback,loading:false})});return()=>{live=false}},[path]);
 return state;
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
function News(){
 const liveNews=useLiveNews();
 const [q,setQ]=useState(""); const [country,setCountry]=useState("All"); const [continent,setContinent]=useState("All"); const [source,setSource]=useState("All");
 const base=liveNews.items;
 const countries=[...new Set(liveNews.items.map(n=>n.country).filter(x=>x&&x!=="Global"))].sort();
 const continents=[...new Set(liveNews.items.map(n=>n.continent).filter(x=>x&&x!=="Global"))].sort();
 const sources=[...new Set(liveNews.items.map(n=>n.source).filter(Boolean))].sort();
 const rows=base.filter(n=>(country==="All"||n.country===country)&&(continent==="All"||n.continent===continent)&&(source==="All"||n.source===source)&&((n.title+" "+(n.summary||n.dek||"")+" "+(n.source||"")).toLowerCase().includes(q.toLowerCase())));
 return <section><PageTitle kicker={liveNews.live?"Live aggregator":"Newsroom"} title="ALL KARTING NEWS" text={liveNews.live?("Live karting coverage from across the web · updated "+fmtDate(liveNews.updatedAt)):"Loading live feed…"}/><Filters><input placeholder="Search live karting news…" value={q} onChange={e=>setQ(e.target.value)}/><select value={continent} onChange={e=>{setContinent(e.target.value);setCountry("All")}}><option>All</option>{continents.map(x=><option key={x}>{x}</option>)}</select><select value={country} onChange={e=>setCountry(e.target.value)}><option>All</option>{countries.filter(c=>continent==="All"||liveNews.items.some(n=>n.country===c&&n.continent===continent)).map(x=><option key={x}>{x}</option>)}</select><select value={source} onChange={e=>setSource(e.target.value)}><option>All</option>{sources.map(x=><option key={x}>{x}</option>)}</select></Filters>{rows.length?<div className="news-grid">{rows.map((n,i)=><NewsCard key={n.id||n.url||i} n={n} big={i===0}/>)}</div>:<Empty text="No live stories match those filters."/>}<Ad format="News leaderboard"/></section>
}
function manufacturerLogo(m){
 if(m.logo) return m.logo;
 if(m.site){
   try{
     const u=new URL(m.site);
     return "https://www.google.com/s2/favicons?domain="+encodeURIComponent(u.hostname)+"&sz=256";
   }catch{}
 }
 return "";
}
function ManufacturerLogo({m,className=""}){
 const [failed,setFailed]=useState(false);
 const src=manufacturerLogo(m);
 return <div className={"brand-logo-panel "+className}>{src&&!failed?<img src={src} alt={m.name+" logo"} onError={()=>setFailed(true)}/>:<span>{m.name}</span>}</div>
}
function Manufacturers(){
 const [q,setQ]=useState("");
 const rows=manufacturers.filter(m=>{
   const products=(m.products||[]).map(p=>typeof p==="string"?p:p.name).join(" ");
   return (m.name+" "+m.group+" "+m.country+" "+products).toLowerCase().includes(q.toLowerCase());
 });
 return <section><PageTitle kicker="Brands & builders" title="KART MANUFACTURERS" text="Explore kart manufacturers, their history, products, dealer networks and latest coverage."/><Filters><input placeholder="Search manufacturer, country or product…" value={q} onChange={e=>setQ(e.target.value)}/></Filters><div className="manufacturer-grid">{rows.map(m=><a className="manufacturer-card" href={"#/manufacturers/"+m.id} key={m.id}><ManufacturerLogo m={m} className="directory-logo"/><div className="meta">{m.country} · {m.group}</div><h3>{m.name}</h3><p>{m.history}</p><div className="product-tags">{(m.products||[]).slice(0,3).map(p=><span key={typeof p==="string"?p:p.name}>{typeof p==="string"?p:p.name}</span>)}</div><b className="link">View manufacturer →</b></a>)}</div></section>
}
function ManufacturerDetail({id}){
 const m=manufacturers.find(x=>x.id===id); const live=useLiveNews(); if(!m)return <NotFound/>;
 const terms=(m.newsTerms||[m.name.toLowerCase()]).map(x=>x.toLowerCase());
 const related=live.items.filter(n=>terms.some(t=>(n.title+" "+(n.summary||"")+" "+(n.source||"")).toLowerCase().includes(t))).slice(0,12);
 const products=(m.products||[]).map(p=>typeof p==="string"?{name:p,type:"Product / chassis family"}:p);
 const dealers=m.dealers||[];
 return <section className="encyclopedia"><div className="manufacturer-hero"><div><div className="brand-lockup"><ManufacturerLogo m={m} className="detail-logo"/><div><div className="meta">{m.country} · {m.group} · Founded {m.founded}</div><h1>{m.name}</h1></div></div><p>{m.history}</p><div className="actions"><a className="button primary" href={m.site} target="_blank" rel="noopener noreferrer">Official website ↗</a>{m.catalogueUrl&&<a className="button" href={m.catalogueUrl} target="_blank" rel="noopener noreferrer">Official catalogue ↗</a>}{m.dealerUrl&&<a className="button" href={m.dealerUrl} target="_blank" rel="noopener noreferrer">Official dealer network ↗</a>}<a className="button" href="#/manufacturers">All manufacturers</a></div></div><ManufacturerLogo m={m} className="hero-logo"/></div>
 <div className="encyclopedia-grid">
  <div className="panel"><h3>Brand profile</h3><dl className="facts"><div><dt>Manufacturer</dt><dd>{m.name}</dd></div><div><dt>Group / owner</dt><dd>{m.group}</dd></div><div><dt>Country</dt><dd>{m.country}</dd></div><div><dt>Founded</dt><dd>{m.founded}</dd></div><div><dt>Known aliases</dt><dd>{(m.aliases||[]).join(", ")||"—"}</dd></div></dl></div>
  <div className="panel"><h3>History</h3><p>{m.history}</p><p className="muted">KARTGRID is building this into a sourced manufacturer archive covering historic models, homologations, factory teams and ownership changes.</p></div>
 </div>
 <SectionHead eyebrow="Official catalogue" title="Products" copy="Current and representative products taken from or linked back to the manufacturer's own catalogue."/>
 <div className="product-catalogue">{products.map(p=><div className="product-card" key={p.name}><ManufacturerLogo m={m} className="product-logo"/><div><h3>{p.name}</h3><p>{p.type||"Karting product"}</p>{p.className&&<Pill>{p.className}</Pill>}</div></div>)}</div>
 <SectionHead eyebrow="Official network" title="Dealers & distributors" copy="Dealer information is sourced from the manufacturer's official network where available."/>
 {dealers.length?<div className="dealer-table"><div className="dealer-head"><span>Country</span><span>Dealer / distributor</span><span>Location</span></div>{dealers.map((d,i)=><div className="dealer-row" key={d.country+d.name+i}><b>{d.country}</b><span>{d.name}</span><span>{d.location||"—"}</span></div>)}</div>:<div className="empty">Dealer network not yet indexed. {m.dealerUrl&&<a className="link" href={m.dealerUrl} target="_blank" rel="noopener noreferrer">Open official dealer directory ↗</a>}</div>}
 <SectionHead eyebrow="Latest coverage" title={m.name+" news"} copy="Live stories from the KARTGRID news index that mention this manufacturer."/>
 {related.length?<div className="news-grid">{related.map((n,i)=><NewsCard key={n.id||i} n={n} big={i===0}/>)}</div>:<Empty text={"No current "+m.name+" stories in the live feed yet."}/>}
 <Ad format="Manufacturer sponsor"/>
 </section>
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
function KnowledgeBase({region}){
 const [q,setQ]=useState("");
 const [loading,setLoading]=useState(false);
 const [result,setResult]=useState(null);
 const [error,setError]=useState("");
 const guides={
   UK:[
    {title:"How to get started in karting",text:"Start with arrive-and-drive or owner-driver practice, then look at Motorsport UK-affiliated clubs and championships when you are ready to race."},
    {title:"Licences & race entry",text:"Competitive karting in the UK commonly runs through Motorsport UK regulations, with licence requirements depending on age and championship."},
    {title:"Finding a local circuit",text:"Use the circuit and club directory to find outdoor kart tracks, owner-driver practice days and local championships near you."},
    {title:"Buying your first kart",text:"Choose the class first, then buy a chassis and engine package that is legal for the UK championship or club you plan to enter."},
    {title:"What equipment do I need?",text:"Helmet, race suit, gloves, boots and class-specific safety equipment come first. Check the exact regulations before buying."},
    {title:"Which class suits my age?",text:"Use the class directory to compare Bambino, Cadet/Mini, Junior, Senior and gearbox categories by age and engine type."}
   ],
   USA:[
    {title:"How to get started in karting",text:"Begin with a local club, rental league or owner-driver practice day, then choose a national ruleset such as SKUSA, USPKS or ROK depending on your area."},
    {title:"Licences & memberships",text:"Requirements vary by organizer. Many US series use memberships, event registration and class-specific technical rules rather than one national licence."},
    {title:"Finding a local track",text:"Search nearby outdoor kart circuits and regional clubs first; the strongest pathway usually starts with regular local racing."},
    {title:"Buying your first kart",text:"Pick the class and local series before buying. Chassis, engine and tyre rules differ between club and national programs."},
    {title:"What equipment do I need?",text:"A certified helmet, suit, gloves, boots and required safety gear should match the rules of the organizer you intend to race with."},
    {title:"Which class suits my age?",text:"Common pathways include Micro/Mini, Junior, Senior and shifter categories, but exact ages vary by series."}
   ],
   Australia:[
    {title:"How to get started in karting",text:"Start with a local Karting Australia-affiliated club or rental karting, then move into owner-driver competition once you know which class suits you."},
    {title:"Licences & memberships",text:"Club membership and Karting Australia licensing are central to most sanctioned competition. Requirements vary by age and class."},
    {title:"Finding a local club",text:"Karting is strongly club-based in Australia, so your nearest affiliated club is usually the best first contact."},
    {title:"Buying your first kart",text:"Choose a Karting Australia class first, then buy a compliant chassis, engine and tyre package for that class."},
    {title:"What equipment do I need?",text:"Helmet, suit, gloves, boots and any mandatory protective equipment must comply with the current class and event rules."},
    {title:"Which class suits my age?",text:"Cadet, Junior and Senior pathways vary by engine and state-level competition. Start with the national class structure."}
   ],
   Europe:[
    {title:"How to get started in karting",text:"Begin with a local circuit or national ASN-affiliated club, then progress into national or FIA-linked competition as experience grows."},
    {title:"Licences & governing bodies",text:"Karting licences and rules are normally administered by each country's national motorsport authority, with FIA standards at international level."},
    {title:"Finding a local circuit",text:"Use national federation and circuit directories to find owner-driver practice, academies and club racing near you."},
    {title:"Buying your first kart",text:"Choose the national class and engine package first; homologation and tyre rules differ between countries and championships."},
    {title:"What equipment do I need?",text:"Check your national ASN regulations for helmet, suit and safety standards before buying racewear."},
    {title:"Which class suits my age?",text:"Mini, OK-N/OK-Junior, OK, KZ and Rotax/IAME categories are common, but age bands vary by country and organizer."}
   ],
   Global:[
    {title:"How to get started in karting",text:"Start at a local circuit, learn through rental or practice sessions, then choose a class and club before buying equipment."},
    {title:"Licences & governing bodies",text:"Karting rules are usually set by national motorsport authorities or championship organizers, with FIA regulations covering international categories."},
    {title:"Finding a local circuit",text:"Look for established outdoor kart tracks, owner-driver clubs and recognised championships in your country."},
    {title:"Buying your first kart",text:"Always choose your class and championship before buying a kart so the chassis, engine, tyres and weight rules all match."},
    {title:"What equipment do I need?",text:"A certified helmet, kart suit, gloves, boots and required protective equipment are the core essentials."},
    {title:"Which class suits my age?",text:"Age pathways usually progress through Mini/Cadet, Junior, Senior and gearbox categories, depending on the local ruleset."}
   ]
 };

 const regionGuides=guides[region]||guides.Global;
 const ask=async e=>{
   e.preventDefault();
   const question=q.trim();
   if(!question)return;
   setLoading(true);setError("");setResult(null);
   try{
     const r=await fetch("https://dummygrid-api.onrender.com/api/search",{
       method:"POST",
       headers:{"Content-Type":"application/json"},
       body:JSON.stringify({question,region})
     });
     const data=await r.json().catch(()=>({}));
     if(!r.ok) throw new Error(data.message||"Search is unavailable right now.");
     setResult(data);
   }catch(err){
     setError(err.message||"Search is unavailable right now.");
   }finally{setLoading(false)}
 };
 return <section className="knowledge-page">
   <PageTitle kicker="DummyGrid Knowledge Base" title="EVERYTHING KARTING" text={"Ask a karting question or browse practical guides tailored to "+region+"."}/>
   <div className="knowledge-search">
    <form className="ai-search-box" onSubmit={ask}>
      <input aria-label="Ask DummyGrid AI" placeholder="Ask anything about karting…" value={q} onChange={e=>setQ(e.target.value)}/>
      <button className="button primary" type="submit" disabled={loading}>{loading?"Searching the karting web…":"Ask DummyGrid AI"}</button>
    </form>
    <div className="ai-safety-note"><b>Karting only · child-safe</b><span>Live web search is restricted to approved karting sources.</span></div>
   </div>
   {error&&<div className="ai-blocked"><h3>AI Search unavailable</h3><p>{error}</p></div>}
   {result?.ok&&<div className="ai-results">
      <div className="ai-answer"><span>DummyGrid AI</span><div className="ai-answer-text">{result.answer}</div></div>
      {result.sources?.length>0&&<div className="ai-source-list"><h3>Sources</h3>{result.sources.map((src,i)=><a href={src.url} target="_blank" rel="noopener noreferrer" key={src.url||i}><span>{i+1}</span><div><b>{src.title||"Source"}</b><small>{src.url}</small></div></a>)}</div>}
   </div>}
   <SectionHead eyebrow={region+" guide"} title="Getting started in karting" copy="Practical first steps tailored to your selected region."/>
   <div className="knowledge-guide-grid">{regionGuides.map((g,i)=><article className="knowledge-guide" key={g.title}><span>{String(i+1).padStart(2,"0")}</span><h3>{g.title}</h3><p>{g.text}</p><a href={g.title.includes("class")||g.title.includes("age")?"#/classes":"#/knowledge-base"}>Read guide →</a></article>)}</div>
 </section>
}
function useApi(path){
 const [state,setState]=useState({data:null,loading:true,error:""});
 useEffect(()=>{let alive=true;setState({data:null,loading:true,error:""});fetch(DUMMYGRID_API+path).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||"Request failed");return d}).then(data=>{if(alive)setState({data,loading:false,error:""})}).catch(e=>{if(alive)setState({data:null,loading:false,error:e.message})});return()=>{alive=false}},[path]);
 return state;
}
const alphaSeries=[
 {slug:"ukc",name:"Ultimate Karting Championship"},
 {slug:"bkc",name:"The Kart Championship"},
 {slug:"nkc",name:"National Kart Cup"},
 {slug:"accesskarting",name:"Access Karting"},
 {slug:"wmkc",name:"Whilton Mill Kart Club"}
];
const tslSeries=[
 {slug:"bsrc",name:"British Superkart Racing Club / Superkart Super Series"}
];
function ResultsPage(){
 const {data,loading}=useTimingData();
 const [q,setQ]=useState("");
 const providers=[
   ...alphaSeries.map(x=>({...x,provider:"Alpha Timing",href:"#/results/alpha/"+x.slug,copy:"Events, practice, qualifying, heats, pre-finals and finals."})),
   ...tslSeries.map(x=>({...x,provider:"TSL Timing",href:"#/results/tsl/"+x.slug,copy:"Superkart meetings with practice, qualifying, grids and race results."}))
 ].filter(x=>(x.name+" "+x.provider).toLowerCase().includes(q.toLowerCase()));
 const matches=useMemo(()=>{
   const term=q.trim().toLowerCase();
   if(term.length<2)return [];
   const out=[];
   for(const [slug,series] of Object.entries(data?.providers?.alpha||{})){
     for(const ev of Object.values(series?.events||{})){
       for(const sess of ev.sessions||[]){
         const sd=ev.sessionData?.[sess.id];
         const sessionHay=(series.name+" "+ev.title+" "+sess.name+" "+sess.type+" "+(sess.winner||"")).toLowerCase();
         if(sessionHay.includes(term)){
           out.push({slug,eventId:ev.id,sessionId:sess.id,series:series.name,event:ev.title,session:sess.name,row:null});
         }
         for(const row of sd?.rows||[]){
           const rowText=row.join(" · ");
           if(rowText.toLowerCase().includes(term)){
             out.push({slug,eventId:ev.id,sessionId:sess.id,series:series.name,event:ev.title,session:sess.name,row:rowText});
           }
           if(out.length>=80) return out;
         }
       }
     }
   }
   return out;
 },[data,q]);
 const searching=q.trim().length>=2;
 return <section><PageTitle kicker="Live timing archive" title="KARTING RESULTS" text="Search drivers, classes, events and full classifications, or browse by championship."/>
 <Filters><input placeholder="Search driver, class, event or championship…" value={q} onChange={e=>setQ(e.target.value)}/></Filters>
 {searching&&<div className="global-result-search"><div className="meta">{loading?"Loading timing archive…":matches.length+" matching result"+(matches.length===1?"":"s")}</div>{matches.length?<div className="session-list">{matches.map((m,i)=><a className="session-row search-hit" href={"#/results/alpha/"+m.slug+"/event/"+m.eventId+"/session/"+m.sessionId} key={m.slug+m.eventId+m.sessionId+i}><div className="session-no">↗</div><div><div className="meta">{m.series} · {m.event}</div><h3>{m.session}</h3>{m.row&&<p>{m.row}</p>}</div><b>Open result →</b></a>)}</div>:!loading&&<Empty text="No indexed classifications match that search yet."/>}</div>}
 {!searching&&<div className="results-series-grid">{providers.map(x=><a className="results-series-card" key={x.provider+x.slug} href={x.href}><span>{x.provider}</span><h3>{x.name}</h3><p>{x.copy}</p><b>Browse results →</b></a>)}</div>}
 </section>
}
function useTimingData(){
 return useRemoteJson("timing-results.json",{updatedAt:null,providers:{alpha:{}}});
}
function ResultsSeries({slug}){
 const {data,loading}=useTimingData();
 const [q,setQ]=useState("");
 const series=data?.providers?.alpha?.[slug];
 const events=Object.values(series?.events||{}).filter(e=>(e.title+" "+(e.dateStart||"")+" "+(e.dateEnd||"")).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>String(b.dateStart||"").localeCompare(String(a.dateStart||"")));
 const name=series?.name||alphaSeries.find(x=>x.slug===slug)?.name||slug;
 return <section><PageTitle kicker="Alpha Timing archive" title={name.toUpperCase()} text="Choose an event to see every indexed session and full classification." action={<a className="button" href="#/results">All championships</a>}/>
 <Filters><input placeholder="Search event or circuit…" value={q} onChange={e=>setQ(e.target.value)}/></Filters>
 {loading?<Empty text="Loading events…"/>:events.length?<div className="timing-event-list">{events.map(e=><a className="timing-event" href={"#/results/alpha/"+slug+"/event/"+e.id} key={e.id}><div><span>Alpha Timing</span><h3>{e.title}</h3><p>{[e.dateStart,e.dateEnd].filter(Boolean).join(" – ")} · {(e.sessions||[]).length} sessions</p></div><b>View sessions →</b></a>)}</div>:<Empty text="No event data has been indexed yet. The timing database is refreshing."/>}
 </section>
}
function ResultsEvent({slug,eventId}){
 const {data,loading}=useTimingData();
 const [type,setType]=useState("All"); const [q,setQ]=useState("");
 const ev=data?.providers?.alpha?.[slug]?.events?.[eventId];
 const sessions=(ev?.sessions||[]).filter(x=>(type==="All"||x.type===type)&&((x.name+" "+x.text+" "+(x.winner||"")).toLowerCase().includes(q.toLowerCase())));
 return <section><PageTitle kicker="Event results" title={(ev?.title||"Loading event").toUpperCase()} text={ev?.dateStart?(ev.dateStart+" – "+(ev.dateEnd||ev.dateStart)):"Practice, qualifying, heats and finals"} action={<a className="button" href={"#/results/alpha/"+slug}>Back to events</a>}/>
 <Filters><input placeholder="Search driver, class or session…" value={q} onChange={e=>setQ(e.target.value)}/><select value={type} onChange={e=>setType(e.target.value)}><option>All</option><option>Practice</option><option>Qualifying</option><option>Heat</option><option>PreFinal</option><option>Final</option><option>Session</option></select></Filters>
 {loading?<Empty text="Loading sessions…"/>:sessions.length?<div className="session-list">{sessions.map(x=><a className="session-row" href={"#/results/alpha/"+slug+"/event/"+eventId+"/session/"+x.id} key={x.id}><div className="session-no">{x.raceNumber?"R"+x.raceNumber:x.type.slice(0,1)}</div><div><div className="meta">{x.type}{x.winner?" · Winner: "+x.winner:""}</div><h3>{x.name}</h3></div><b>Full result →</b></a>)}</div>:<Empty text="No sessions have been indexed for this event yet."/>}
 </section>
}
function ResultsSession({slug,eventId,sessionId}){
 const {data,loading}=useTimingData();
 const ev=data?.providers?.alpha?.[slug]?.events?.[eventId];
 const sess=ev?.sessionData?.[sessionId];
 return <section><PageTitle kicker="Full classification" title={(sess?.title||"SESSION RESULT").toUpperCase()} text={sess?.meta?.laps?String(sess.meta.laps)+" laps":"Official classified result"} action={<a className="button" href={"#/results/alpha/"+slug+"/event/"+eventId}>Back to event</a>}/>
 {loading?<Empty text="Loading full classification…"/>:sess?<><div className="timing-summary">{sess.meta?.start&&<b>{sess.meta.start}<small>Start</small></b>}{sess.meta?.laps&&<b>{sess.meta.laps}<small>Laps</small></b>}</div>{(sess.headers||[]).length&& (sess.rows||[]).length?<div className="classification-wrap"><table><thead><tr>{sess.headers.map((h,i)=><th key={i}>{h||"#"}</th>)}</tr></thead><tbody>{sess.rows.map((row,i)=><tr key={i}>{row.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></div>:<Empty text="The session is indexed but its classification table was not available."/>}{sess.url&&<a className="button" href={sess.url} target="_blank" rel="noopener noreferrer">View original on Alpha Timing ↗</a>}</>:<Empty text="This classification has not been indexed yet."/>}
 </section>
}
function TSLResultsSeries({slug}){
 const {data,loading,error}=useApi("/api/results/tsl/"+slug+"/events");
 const [q,setQ]=useState("");
 const events=(data?.events||[]).filter(e=>(e.title+" "+(e.track||"")+" "+(e.date||"")).toLowerCase().includes(q.toLowerCase()));
 const name=data?.series?.name||tslSeries.find(x=>x.slug===slug)?.name||slug;
 return <section><PageTitle kicker="TSL Timing" title={name.toUpperCase()} text="Choose a meeting to view the Superkart sessions and official results." action={<a className="button" href="#/results">All championships</a>}/>
 <Filters><input placeholder="Search event or circuit…" value={q} onChange={e=>setQ(e.target.value)}/></Filters>
 {loading?<Empty text="Loading TSL events…"/>:error?<div className="ai-blocked"><h3>Results unavailable</h3><p>{error}</p></div>:events.length?<div className="timing-event-list">{events.map(e=><a className="timing-event" href={"#/results/tsl/"+slug+"/event/"+e.id} key={e.id}><div><span>TSL Timing</span><h3>{e.title}</h3><p>{e.date} · {e.track}</p></div><b>View sessions →</b></a>)}</div>:<Empty text="No events found."/>}
 </section>
}
function TSLResultsEvent({slug,eventId}){
 const {data,loading,error}=useApi("/api/results/tsl/"+slug+"/event/"+eventId);
 const ev=data?.event;
 const sessions=data?.sessions||[];
 return <section><PageTitle kicker="TSL Timing" title={(ev?.title||"Loading event").toUpperCase()} text={ev?ev.date+" · "+ev.track:"Practice, qualifying, grids and race results"} action={<a className="button" href={"#/results/tsl/"+slug}>Back to events</a>}/>
 {loading?<Empty text="Loading sessions…"/>:error?<div className="ai-blocked"><h3>Event unavailable</h3><p>{error}</p></div>:sessions.length?<div className="session-list">{sessions.map((x,i)=><a className="session-row" href={x.url} target="_blank" rel="noopener noreferrer" key={x.url||i}><div className="session-no">{x.type.slice(0,1)}</div><div><div className="meta">{x.type}</div><h3>{x.name}</h3></div><b>Open official result ↗</b></a>)}</div>:<Empty text="No Superkart session links were found on the TSL event page."/>}
 </section>
}
function trackMatchesResult(track,result){
 const needles=[track.name,track.city,...(track.aliases||[])].filter(Boolean).map(x=>x.toLowerCase());
 const hay=((result.event||"")+" "+(result.round||"")+" "+(result.championship||"")).toLowerCase();
 return needles.some(n=>n.length>2&&hay.includes(n));
}
function TracksPage(){
 const {data,loading}=useRemoteJson("tracks.json",tracksSeed);
 const {data:resultsData}=useRemoteJson("results.json",{records:[],updatedAt:null});
 const [q,setQ]=useState(""); const [continent,setContinent]=useState("All"); const [country,setCountry]=useState("All"); const [series,setSeries]=useState("All"); const [venueType,setVenueType]=useState("All");
 const tracks=data.tracks||[];
 const continents=[...new Set(tracks.map(t=>t.continent).filter(Boolean))].sort();
 const countries=[...new Set(tracks.map(t=>t.country).filter(Boolean))].sort();
 const seriesList=[...new Set(tracks.flatMap(t=>t.series||[]))].sort();
 const rows=tracks.filter(t=>{
   const hay=(t.name+" "+t.city+" "+t.region+" "+t.country+" "+(t.series||[]).join(" ")).toLowerCase();
   return (continent==="All"||t.continent===continent)&&(country==="All"||t.country===country)&&(series==="All"||(t.series||[]).includes(series))&&(venueType==="All"||t.venueType===venueType)&&hay.includes(q.toLowerCase());
 });
 return <section><PageTitle kicker="Global circuit directory" title="KARTING TRACKS" text={loading?"Loading circuits…":"Search karting circuits by country, region, championship and track name."}/>
 <Filters><input placeholder="Search track, city or country…" value={q} onChange={e=>setQ(e.target.value)}/><select value={continent} onChange={e=>{setContinent(e.target.value);setCountry("All")}}><option>All</option>{continents.map(x=><option key={x}>{x}</option>)}</select><select value={country} onChange={e=>setCountry(e.target.value)}><option>All</option>{countries.filter(c=>continent==="All"||tracks.some(t=>t.country===c&&t.continent===continent)).map(x=><option key={x}>{x}</option>)}</select><select value={series} onChange={e=>setSeries(e.target.value)}><option>All</option>{seriesList.map(x=><option key={x}>{x}</option>)}</select><select value={venueType} onChange={e=>setVenueType(e.target.value)}><option>All</option><option>Outdoor</option><option>Indoor</option></select></Filters>
 {rows.length?<div className="track-grid">{rows.map(t=>{const count=(resultsData.records||[]).filter(r=>trackMatchesResult(t,r)).length;return <a className="track-card" href={"#/tracks/"+t.id} key={t.id}><div className="track-pin">⌖</div><div className="meta">{t.continent} · {t.country}{t.venueType?" · "+t.venueType:""}</div><h3>{t.name}</h3><p>{[t.city,t.region].filter(Boolean).join(", ")}</p><div className="product-tags">{(t.series||[]).map(x=><span key={x}>{x}</span>)}</div><div className="track-actions"><b className="link">View circuit →</b><small>{count} linked result{count===1?"":"s"}</small></div></a>})}</div>:<Empty text="No circuits match those filters."/>}
 </section>
}
function TrackDetail({id}){
 const {data:tracksData,loading}=useRemoteJson("tracks.json",tracksSeed);
 const {data:resultsData}=useRemoteJson("results.json",{records:[]});
 const t=(tracksData.tracks||[]).find(x=>x.id===id);
 if(loading)return <section><PageTitle kicker="Circuit" title="LOADING TRACK" text="Loading circuit data…"/></section>;
 if(!t)return <NotFound/>;
 const linked=(resultsData.records||[]).filter(r=>trackMatchesResult(t,r)).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
 return <section><PageTitle kicker={t.country} title={t.name.toUpperCase()} text={[t.city,t.region,t.country].filter(Boolean).join(", ")} action={<a className="button" href="#/tracks">All tracks</a>}/>
 <div className="track-detail-grid"><div className="panel"><h3>Track profile</h3><dl className="facts"><div><dt>Country</dt><dd>{t.country}</dd></div><div><dt>Region</dt><dd>{t.region||"—"}</dd></div><div><dt>City</dt><dd>{t.city||"—"}</dd></div><div><dt>Address</dt><dd>{t.address||"Address verification pending"}</dd></div><div><dt>What3Words</dt><dd>{t.what3words?<a href={"https://what3words.com/"+t.what3words} target="_blank" rel="noopener noreferrer">///{t.what3words}</a>:<span className="muted">Not published yet</span>}</dd></div><div><dt>Continent</dt><dd>{t.continent||"—"}</dd></div><div><dt>Type</dt><dd>{t.venueType||"—"}</dd></div><div><dt>Karts</dt><dd>{t.kartType||"—"}</dd></div><div><dt>Track length</dt><dd>{t.trackLengthM?t.trackLengthM+" m":"—"}</dd></div><div><dt>Championships</dt><dd>{(t.series||[]).join(", ")||"—"}</dd></div></dl>{t.website&&<a className="button primary" href={t.website} target="_blank" rel="noopener noreferrer">Official track website ↗</a>}</div><div className="panel"><h3>DummyGrid archive</h3><p>{linked.length?"We currently link "+linked.length+" result record"+(linked.length===1?"":"s")+" to this circuit.":"No indexed results for this circuit yet."}</p><p className="muted">{t.source}</p></div></div>
 <SectionHead eyebrow="Results archive" title={"Results at "+t.name} copy="Event results and championship records matched to this circuit."/>
 {linked.length?<div className="results-list">{linked.map(r=><article className="result-row" key={r.id}><div className="result-place">{r.position?("#"+r.position):"—"}</div><div className="result-main"><div className="meta">{r.year} · {r.type==="event"?"Event result":"Standings"}</div><h3>{r.driver}</h3><p>{r.championship} · {r.className}</p><small>{r.round} · {r.event}{r.points!=null?" · "+r.points+" pts":""}</small></div><a className="button" href={r.sourceUrl} target="_blank" rel="noopener noreferrer">Official source ↗</a></article>)}</div>:<Empty text="No indexed results at this circuit yet."/>}
 </section>
}
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
function DriverAccount({region}){
 const [token,setToken]=useState(()=>localStorage.getItem("dg_token")||"");
 const [mode,setMode]=useState("login");
 const [auth,setAuth]=useState({email:"",password:"",birthYear:"",guardianEmail:""});
 const [profile,setProfile]=useState(null);
 const [videos,setVideos]=useState([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [uploading,setUploading]=useState(false);

 const call=async(path,opts={})=>{
   const headers={...(opts.headers||{}),"Content-Type":"application/json"};
   if(token) headers.Authorization="Bearer "+token;
   const r=await fetch(DUMMYGRID_API+path,{...opts,headers});
   const data=await r.json().catch(()=>({}));
   if(!r.ok) throw new Error(data.message||"Request failed");
   return data;
 };
 const loadAccount=async()=>{
   if(!token)return;
   try{
     const me=await call("/api/me");
     setProfile(me.profile||{display_name:"",race_number:"",region,nationality:"",class_name:"",team:"",bio:"",public_profile:false,is_minor:!!me.user?.is_minor});
     const v=await call("/api/me/videos");setVideos(v.videos||[]);
   }catch(e){setError(e.message);if(/expired|sign in/i.test(e.message)){localStorage.removeItem("dg_token");setToken("")}}
 };
 useEffect(()=>{loadAccount()},[token]);

 const submitAuth=async e=>{
   e.preventDefault();setBusy(true);setError("");setMessage("");
   try{
     const path=mode==="login"?"/api/auth/login":"/api/auth/register";
     const body=mode==="login"?{email:auth.email,password:auth.password}:{email:auth.email,password:auth.password,birthYear:Number(auth.birthYear)||null,guardianEmail:auth.guardianEmail||null};
     const r=await fetch(DUMMYGRID_API+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
     const data=await r.json().catch(()=>({}));
     if(!r.ok)throw new Error(data.message||"Could not sign in");
     localStorage.setItem("dg_token",data.token);setToken(data.token);setMessage(mode==="login"?"Signed in.":"Account created.");
   }catch(e){setError(e.message)}finally{setBusy(false)}
 };
 const logout=()=>{localStorage.removeItem("dg_token");setToken("");setProfile(null);setVideos([])};
 const saveProfile=async e=>{
   e.preventDefault();setBusy(true);setError("");setMessage("");
   try{const d=await call("/api/me/profile",{method:"PUT",body:JSON.stringify(profile)});setProfile(d.profile);setMessage("Profile saved.");}
   catch(e){setError(e.message)}finally{setBusy(false)}
 };
 const uploadVideo=async e=>{
   const file=e.target.files?.[0];if(!file)return;
   setUploading(true);setError("");setMessage("");
   try{
     const presign=await call("/api/videos/presign",{method:"POST",body:JSON.stringify({name:file.name,type:file.type||"video/mp4"})});
     const put=await fetch(presign.url,{method:"PUT",headers:{"Content-Type":file.type||"video/mp4"},body:file});
     if(!put.ok)throw new Error("Video upload failed.");
     await call("/api/videos/register",{method:"POST",body:JSON.stringify({key:presign.key,name:file.name,type:file.type||"video/mp4",title:file.name})});
     setMessage("Video uploaded privately.");await loadAccount();
   }catch(e){setError(e.message)}finally{setUploading(false);e.target.value=""}
 };
 const analyse=async id=>{
   setBusy(true);setError("");setMessage("AI is reviewing the onboard footage…");
   try{await call("/api/videos/"+id+"/analyze",{method:"POST",body:"{}"});setMessage("AI coaching complete.");await loadAccount();}
   catch(e){setError(e.message);setMessage("")}finally{setBusy(false)}
 };

 if(!token)return <section className="driver-account"><PageTitle kicker="Driver Hub" title="YOUR DRIVER ACCOUNT" text="Sign in to manage your racing profile, private video library and AI coaching."/><div className="auth-shell"><div className="auth-copy"><span>DummyGrid Driver Hub</span><h2>Your karting career, in one place.</h2><p>Build your driver profile, keep race footage private and use AI coaching to review onboard video.</p><div className="junior-note"><b>Junior-safe by default</b><p>Under-18 profiles are private by default and require a parent or guardian email during registration.</p></div></div><form className="auth-card" onSubmit={submitAuth}><div className="auth-tabs"><button type="button" className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Sign in</button><button type="button" className={mode==="register"?"active":""} onClick={()=>setMode("register")}>Create account</button></div><label>Email<input type="email" required value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})}/></label><label>Password<input type="password" required minLength="10" value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})}/></label>{mode==="register"&&<><label>Birth year<input type="number" min="1900" max={new Date().getFullYear()} value={auth.birthYear} onChange={e=>setAuth({...auth,birthYear:e.target.value})}/></label><label>Parent / guardian email <small>required for under-18s</small><input type="email" value={auth.guardianEmail} onChange={e=>setAuth({...auth,guardianEmail:e.target.value})}/></label></>}<button className="button primary" disabled={busy}>{busy?"Please wait…":mode==="login"?"Sign in":"Create driver account"}</button>{error&&<p className="form-error">{error}</p>}</form></div></section>;

 return <section className="driver-account"><PageTitle kicker="Driver Hub" title="MY DRIVER PROFILE" text="Manage your public racing identity and private AI coaching workspace." action={<button className="button" onClick={logout}>Sign out</button>}/>{error&&<div className="account-alert error">{error}</div>}{message&&<div className="account-alert">{message}</div>}<div className="driver-hub-grid"><form className="profile-editor panel" onSubmit={saveProfile}><h3>Driver profile</h3><label>Display name<input value={profile?.display_name||""} onChange={e=>setProfile({...profile,display_name:e.target.value})}/></label><div className="two-inputs"><label>Race number<input value={profile?.race_number||""} onChange={e=>setProfile({...profile,race_number:e.target.value})}/></label><label>Region<input value={profile?.region||region} onChange={e=>setProfile({...profile,region:e.target.value})}/></label></div><div className="two-inputs"><label>Current class<input value={profile?.class_name||""} onChange={e=>setProfile({...profile,class_name:e.target.value})}/></label><label>Team<input value={profile?.team||""} onChange={e=>setProfile({...profile,team:e.target.value})}/></label></div><label>Nationality<input value={profile?.nationality||""} onChange={e=>setProfile({...profile,nationality:e.target.value})}/></label><label>Driver bio<textarea value={profile?.bio||""} onChange={e=>setProfile({...profile,bio:e.target.value})}/></label>{!profile?.is_minor&&<label className="privacy-toggle"><input type="checkbox" checked={!!profile?.public_profile} onChange={e=>setProfile({...profile,public_profile:e.target.checked})}/> Make my driver profile public</label>}{profile?.is_minor&&<div className="junior-note"><b>Junior account</b><p>Your profile is private by default.</p></div>}<button className="button primary" disabled={busy}>Save profile</button></form><div className="video-coach panel"><div className="video-head"><div><span>AI coaching</span><h3>Onboard Video Lab</h3></div><label className="button primary upload-button">{uploading?"Uploading…":"Upload video"}<input type="file" accept="video/*" onChange={uploadVideo} disabled={uploading}/></label></div><p className="muted">Upload onboard footage privately. DummyGrid samples frames from the video and returns coaching on visible line choice, steering smoothness, positioning, traffic awareness and consistency.</p>{videos.length?<div className="video-list">{videos.map(v=><article className="video-item" key={v.id}><div><b>{v.title||v.original_name}</b><small>{new Date(v.created_at).toLocaleString()} · {v.status}</small></div><button className="button" onClick={()=>analyse(v.id)} disabled={busy}>{v.analysis?"Re-analyse":"Analyse with AI"}</button>{v.analysis&&<div className="coaching-result"><b>AI coaching</b><p>{v.analysis.summary||JSON.stringify(v.analysis)}</p></div>}</article>)}</div>:<div className="empty compact"><h3>No onboard videos yet.</h3><p>Your private video library will appear here.</p></div>}</div></div></section>
}
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
 else if(parts[0]==="news") page=<News/>;
 else if(parts[0]==="marketplace"&&parts[1]==="new") page=<NewListing {...{region,listings,setListings}}/>;
 else if(parts[0]==="marketplace"&&parts[1]) page=<ListingDetail id={parts[1]} {...{listings,saved,toggleSave}}/>;
 else if(parts[0]==="marketplace") page=<Marketplace {...{region,listings,setListings,saved,toggleSave}}/>;
 else if(parts[0]==="drivers"&&parts[1]) page=<DriverDetail id={parts[1]} drivers={drivers}/>;
 else if(parts[0]==="drivers") page=<Drivers region={region} drivers={drivers}/>;
 else if(parts[0]==="classes"&&parts[1]) page=<ClassDetail id={parts[1]}/>;
 else if(parts[0]==="classes") page=<Classes/>;
 else if(parts[0]==="manufacturers"&&parts[1]) page=<ManufacturerDetail id={parts[1]}/>;
 else if(parts[0]==="manufacturers") page=<Manufacturers/>;
 else if(parts[0]==="results"&&parts[1]==="alpha"&&parts[2]&&parts[3]==="event"&&parts[4]&&parts[5]==="session"&&parts[6]) page=<ResultsSession slug={parts[2]} eventId={parts[4]} sessionId={parts[6]}/>;
 else if(parts[0]==="results"&&parts[1]==="alpha"&&parts[2]&&parts[3]==="event"&&parts[4]) page=<ResultsEvent slug={parts[2]} eventId={parts[4]}/>;
 else if(parts[0]==="results"&&parts[1]==="alpha"&&parts[2]) page=<ResultsSeries slug={parts[2]}/>;
 else if(parts[0]==="results"&&parts[1]==="tsl"&&parts[2]&&parts[3]==="event"&&parts[4]) page=<TSLResultsEvent slug={parts[2]} eventId={parts[4]}/>;
 else if(parts[0]==="results"&&parts[1]==="tsl"&&parts[2]) page=<TSLResultsSeries slug={parts[2]}/>;
 else if(parts[0]==="results") page=<ResultsPage/>;
 else if(parts[0]==="tracks"&&parts[1]) page=<TrackDetail id={parts[1]}/>;
 else if(parts[0]==="tracks") page=<TracksPage/>;
 else if(parts[0]==="community"&&parts[1]==="new") page=<NewPost {...{region,posts,setPosts}}/>;
 else if(parts[0]==="community") page=<Community {...{region,posts,setPosts}}/>;
 else if(parts[0]==="knowledge-base") page=<KnowledgeBase region={region}/>;
 else if(parts[0]==="advertise") page=<Advertise/>;
 else if(parts[0]==="profile") page=<DriverAccount region={region}/>;
 else page=<NotFound/>;
 return <><Top region={region} setRegion={setRegion}/><main>{page}</main><footer><a className="logo footer-logo" href="#/" aria-label="DummyGrid home"><img src={DUMMYGRID_LOGO} alt="DummyGrid"/></a><p>The world of karting, local to you.</p><div><a href="#/news">News</a><a href="#/marketplace">Marketplace</a><a href="#/drivers">Drivers</a><a href="#/classes">Classes</a><a href="#/manufacturers">Manufacturers</a><a href="#/results">Results</a><a href="#/tracks">Tracks</a><a href="#/advertise">Advertise</a></div></footer></>
}
createRoot(document.getElementById("root")).render(<App/>);
