import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import "./styles.css";
import tracksSeed from "./data/tracks-seed.json";

const KARTGRID_API = "https://dummygrid-api.onrender.com";

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
 {id:"birel-art",name:"Birel ART",group:"Korus Group",country:"Italy",founded:"1959",site:"https://www.birelart.com/",aliases:["Birel","Birel ART"],history:"Birel traces its roots to Umberto Sala's first karts in the late 1950s. Birel ART was formed through the later partnership with ART Grand Prix.",products:["KZ S19 chassis","OK S19 chassis","Mini S19 chassis","Baby S19 chassis","ROTAX DD2 S19 chassis","Freeline accessories and chassis components","Birel ART sportswear: race suit, winter jacket, soft-shell jacket, sweatshirt, polo, T-shirt, padded vest, rain jacket, trousers, shorts, hat, apron"],newsTerms:["birel art","birelart","birel"]},
 {id:"kart-republic",name:"Kart Republic",group:"Kart Republic",country:"Italy",founded:"2017",site:"https://www.kartrepublic.com/",logo:"https://www.kartrepublic.com/favicon.ico",aliases:["Kart Republic","KR"],history:"Kart Republic was launched by Dino Chiesa as a modern racing-kart marque focused on international competition.",products:["KR1 OK direct-drive chassis","KR1 KZ gearbox chassis","KR2 OK direct-drive chassis","KR2 KZ gearbox chassis","KR2 DD2 chassis","KR Mini chassis","FA Fernando Alonso chassis range","KR/FA frames, bodywork, axles, wheels, brakes, steering, pedals and hubs"],newsTerms:["kart republic","kr chassis"]},
 {id:"sodikart",name:"Sodikart",group:"Sodikart",country:"France",founded:"1981",site:"https://www.sodikart.com/",logo:"https://tkart.it/uploads/2024/12/logo-card-tavola-disegno-1-10.jpg",aliases:["Sodi","Sodikart"],history:"Sodikart is a French manufacturer with more than four decades in karting, producing both racing and rental karts from its French factory. Its business also includes karting equipment, accessories, specialist tools, retail and race-event activity.",products:["Furia 950 (2026)","Sigma RS3 (2026)","Sigma DD2 (2026)","Sigma KZ (2026)","NOVA","Rental: SR6, LRX2, LR6, RT10, RSX2, Sport, KidRacer, SR4, SR5, 2Drive, X2Drive","BOX’S suits, gloves, shoes, helmets and equipment","TEKNEEX stubs, hubs, axles, sprocket carriers, brake systems, seats","MEKAONE gauges, trolleys, clutch tools and tyre equipment"],newsTerms:["sodikart","sodi kart","sodi racing"]},
 {id:"parolin",name:"Parolin Racing Kart",group:"Parolin",country:"Italy",founded:"1986",site:"https://www.parolinracing.com/",logo:"https://kartkings.eu/cdn/shop/collections/parolin-karting_29eb4ed0-6217-461e-b024-6ab3d5ddf9fb.webp?v=1763321893&width=600",aliases:["Parolin"],history:"Parolin is an Italian kart manufacturer active across Mini, junior, senior and international racing categories.",products:["Le Mans chassis","Invader chassis","Opportunity chassis","Mini / Baby racing karts","OK / OKJ racing chassis","KZ racing chassis","Rental karts","Kart components and spare parts","Sportswear and accessories"],newsTerms:["parolin racing","parolin kart"]},
 {id:"praga",name:"Praga Karts",group:"IPK",country:"Czech Republic",founded:"2010",site:"https://www.pragaglobal.com/karts/",aliases:["Praga Kart","Praga Karts","IPK"],history:"Praga Karts is part of the IPK family and produces competition chassis across sprint and gearbox classes.",products:["Dragon Evo","Tacho Evo","Mini","KZ chassis"],newsTerms:["praga kart","ipk karting"]},
 {id:"formula-k",name:"Formula K",group:"IPK",country:"Italy / Czech Republic",founded:"2000s",site:"https://www.ipkarting.com/",aliases:["Formula K"],history:"Formula K is one of the racing chassis marques within the IPK portfolio.",products:["Racing chassis","Mini","KZ chassis"],newsTerms:["formula k kart"]},
 {id:"maranello",name:"Maranello Kart",group:"Maranello Kart",country:"Italy",founded:"1990s",site:"https://www.maranellokart.com/",logo:"https://tkart.it/uploads/2025/01/log-tavola-disegno-1-9.jpg",aliases:["Maranello Kart"],history:"Maranello Kart is an Italian racing-kart manufacturer with a long presence in gearbox and international competition.",products:["RS chassis","KZ chassis","Mini chassis"],newsTerms:["maranello kart"]},
 {id:"energy",name:"Energy Corse",group:"Energy Corse",country:"Italy",founded:"1997",site:"https://www.energycorse.com/",logo:"https://seeklogo.com/images/E/energy-corse-logo-8B7D6B1B6B-seeklogo.com.png",aliases:["Energy Corse","Energy Kart"],history:"Energy Corse is an Italian karting constructor and racing team active in international competition.",products:["Storm chassis","Mini","OK / OKJ chassis","KZ chassis"],newsTerms:["energy corse","energy kart"]},
 {id:"intrepid",name:"Intrepid Driver Program",group:"Intrepid",country:"Italy",founded:"2000s",site:"https://www.intrepidkart.com/",aliases:["Intrepid"],history:"Intrepid has competed internationally as a chassis and racing brand across multiple karting categories.",products:["Racing chassis","Mini","KZ chassis"],newsTerms:["intrepid kart"]},
 {id:"gold-kart",name:"Gold Kart",group:"Righetti Ridolfi",country:"Italy",founded:"1990s",site:"https://www.goldkart.com/",aliases:["Gold Kart"],history:"Gold Kart is an Italian chassis brand associated with Righetti Ridolfi and competition kart production.",products:["Racing chassis","Rental chassis","Mini chassis"],newsTerms:["gold kart"]},
 {id:"compkart",name:"CompKart",group:"J3 Competition",country:"United States",founded:"2014",site:"https://www.compkart.com/",aliases:["CompKart"],history:"CompKart is a US-led competition chassis brand developed by J3 Competition.",products:["Covert 3.0","Ranger","Cadet / Mini","Shifter chassis"],newsTerms:["compkart","comp kart"]},
 {id:"margay",name:"Margay Racing",group:"Margay",country:"United States",founded:"1964",site:"https://www.margay.com/",logo:"https://images.squarespace-cdn.com/content/v1/59cbeaae03596ebdb2d8e29f/1510244785403-P4RFFF606BSDYUY9GLR9/spike-kohlbecker_Margay-Racing-logo_color.png",aliases:["Margay"],history:"Margay is a long-established American kart manufacturer and racing organisation founded in the 1960s.",products:["Ignite chassis","Brava","Rental / arrive-and-drive products"],newsTerms:["margay kart","margay racing"]},
 {id:"rpg",name:"RPG / Rolison Performance Group",group:"RPG",country:"United States",founded:"2000s",site:"https://rolisonperformancegroup.com/",aliases:["RPG","Rolison Performance Group"],history:"Rolison Performance Group is a major US karting team and chassis programme with a strong national presence.",products:["Race team programmes","Driver development","Chassis support"],newsTerms:["rolison performance group","rpg karting"]},
 {id:"arrow",name:"Arrow Karts",group:"DPE Kart Technology",country:"Australia",founded:"1980s",site:"https://www.arrowkarts.com/",logo:"https://fivelightsgraphics.com/cdn/shop/collections/Arrow_Logo_2x_ede9e731-7b4c-4615-a806-58191d8c5715_535x.png?v=1728545296",aliases:["Arrow Kart","Arrow Karts"],history:"Arrow is an Australian kart chassis brand produced by DPE Kart Technology.",products:["X6 range","Cadet / junior chassis","Senior chassis","KZ / gearbox chassis"],newsTerms:["arrow kart","arrow karts"]},
 {id:"aero",name:"Aero Racing Karts",group:"DPE Kart Technology",country:"Australia",founded:"2020s",site:"https://www.dpekart.com/",aliases:["Aero Kart"],history:"Aero is part of the Australian DPE karting ecosystem and serves competition karting markets.",products:["Competition chassis","Cadet / junior","Senior"],newsTerms:["aero racing kart","aero kart"]},
 {id:"zip-kart",name:"Zip Kart",group:"Zip Kart International",country:"United Kingdom",founded:"1960s",site:"https://zipkart.com/",logo:"https://zipkart.com/favicon.ico",aliases:["Zip Kart","ZIP"],history:"Zip Kart is one of Britain's long-established karting marques, with roots stretching back to the 1960s and a long record in British karting, engineering and driver development.",products:[{name:"Complete Karts",type:"Current Zip chassis and kart packages"},{name:"Body Work",type:"Bodywork and plastics"},{name:"Engines and Components",type:"Engines, engine parts and ancillaries"},{name:"Mirage Rotax Engines",type:"Micro MAX, Mini MAX, Junior MAX and Senior MAX engine services"},{name:"Kart Service Italy",type:"Tools, sprockets and workshop equipment"}],dealers:[{country:"United Kingdom",name:"Zip Kart International",location:"Towcester, Northamptonshire"}],dealerUrl:"https://zipkart.com/",catalogueUrl:"https://zipkart.com/collections/all",newsTerms:["zip kart","zipkart"]},
 {id:"top-kart",name:"Top Kart",group:"Top Kart / Comer",country:"Italy",founded:"1980s",site:"https://www.comer-topkart.it/",aliases:["Top Kart","Top-Kart"],history:"Top Kart grew from the Comer karting business in the 1980s and went on to become an internationally successful chassis marque with world, European and intercontinental titles.",products:["Blue Eagle","Bambino","Racing chassis","Comer-linked karting products"],newsTerms:["top kart","top-kart"]},
 {id:"haase",name:"Haase",group:"Haase Kart",country:"Italy",founded:"1991",site:"https://www.haase.it/",aliases:["Haase","Haase Kart"],history:"After a long top-level driving career, 1984 Formula K World Champion Jørn Haase began manufacturing racing chassis in 1991. Haase won the Manufacturers World Championship in 1993 and again in 1994.",products:["Karif","Zenit","Edox","Bomber Mini","Rental HRM / HRI"],newsTerms:["haase kart","haase racing"]},
 {id:"gillard",name:"Gillard Kart",group:"OTK Kart Group",country:"United Kingdom / Italy",founded:"1980",site:"https://www.gillardkart.com/",logo:"https://www.gillardkart.com/favicon.ico",aliases:["Gillard","Gillard Kart"],history:"Founded in Britain by Tim Gillard in 1980, Gillard became one of the UK's most successful chassis marques. OTK Kart Group acquired the brand in 2020 and continues its product development and production.",products:[{name:"TG17 MY 2025",type:"Current racing chassis"},{name:"TDX",type:"Direct-drive chassis"},{name:"Rookie EVM / EVS",type:"Mini / cadet chassis"},{name:"OTK Kart Parts",type:"Components & spares"},{name:"OTK Kart Wear",type:"Racewear & apparel"}],dealers:[{country:"Denmark",name:"STAR",location:"Stenløse"},{country:"Finland",name:"MPT-Racing",location:"Kotka"},{country:"France",name:"TKF",location:"Guérande"},{country:"Netherlands",name:"Kombikart Racing Parts BV",location:"Schijndel"},{country:"Spain",name:"Racing Center Cat, SL",location:"Granollers"}],dealerUrl:"https://gillardkart.com/rivenditori_mondo_eng.php?cont=Europa",catalogueUrl:"https://gillardkart.com/",newsTerms:["gillard kart","gillard"]},
 {id:"cs55",name:"CS55 Racing Kart",group:"OTK Kart Group / Carlos Sainz",country:"Spain / Italy",founded:"2024",site:"https://www.cs55racingkart.com/",logo:"https://www.cs55racingkart.com/favicon.ico",aliases:["CS55","Carlos Sainz Kart","CS55 Racing Kart"],history:"CS55 Racing Kart was launched in 2024 through a collaboration between Carlos Sainz and OTK Kart Group, creating a personalised range of racing karts, frames and accessories produced to OTK standards.",products:[{name:"CS55 MY 2025",type:"Current complete kart / chassis range"},{name:"Bare Frames",type:"Competition frames"},{name:"OTK Kart Parts",type:"Components & spares"},{name:"OTK Kart Wear",type:"Racewear & apparel"},{name:"CS55 Accessories",type:"Branded karting accessories"}],dealers:[{country:"Belgium",name:"Genker Kart Shop NV",location:"Genk"},{country:"Czech Republic",name:"Hagemann A.S.",location:"Slezská Ostrava"},{country:"Denmark",name:"STAR",location:"Stenløse"},{country:"Finland",name:"Kart Shop Finland",location:"Vantaa"},{country:"France",name:"Malevaut Sport",location:"Pleumartin"},{country:"Germany",name:"Dischner Kartsport",location:"Osburg"}],dealerUrl:"https://cs55racingkart.com/rivenditori_mondo_en.php?cont=Europa",catalogueUrl:"https://cs55racingkart.com/",newsTerms:["cs55 racing kart","cs55 kart","carlos sainz kart"]},
 {id:"brm",name:"BRM Racing",group:"BRM Racing Factory",country:"Italy",founded:"1990s",site:"https://brmracing.it/",aliases:["BRM","BRM Racing"],history:"BRM Racing is an Italian kart manufacturer founded in the 1990s, producing kart chassis, accessories and spare parts alongside an official racing team.",products:["KZ chassis","Mini Kart","Racing chassis","Complete chassis range","Braking systems","Spare parts","Custom clothing / team clothing"],newsTerms:["brm racing kart","brm kart"]},
 {id:"fullerton",name:"Fullerton Kart",group:"Terry Fullerton",country:"United Kingdom",founded:"2010s",site:"https://terryfullerton.co.uk/",aliases:["Fullerton","Fullerton Kart"],history:"Fullerton Kart is the chassis marque associated with British karting legend Terry Fullerton. The range has included UK competition chassis produced with Birel ART manufacturing support and homologated under the Fullerton name.",products:["TF3","TF Xenon","TF Bambino","Junior / Senior competition chassis"],newsTerms:["fullerton kart","terry fullerton kart"]}
,
 {id:"project-one",name:"Project One Racing",group:"Project One",country:"United Kingdom",founded:"1990s",site:"https://www.projectoneracing.co.uk/",aliases:["Project One"],history:"Project One Racing is a British kart chassis and racing operation with a strong presence in UK cadet and junior competition.",products:["Cadet chassis","Junior chassis","Race support"],newsTerms:["project one kart","project one racing"]},
 {id:"wright",name:"Wright Kart",group:"Simon Wright Racing Developments",country:"United Kingdom",founded:"2000s",site:"https://www.wrightkarts.co.uk/",aliases:["Wright Kart"],history:"Wright is a British kart chassis marque associated with Simon Wright Racing Developments and UK competition. Motorsport UK registration records include Wright chassis such as the Minotaur, Phoenix and Hydra.",products:["Minotaur Bambino chassis","Phoenix Cadet chassis","Hydra Cadet / Inter chassis","Junior / Senior chassis","Chassis and spare parts"],newsTerms:["wright kart"]},
 {id:"synergy",name:"Synergy",group:"Fusion Motorsport / KKC Kart Components",country:"United Kingdom",founded:"2020s",site:"https://synergykart.co.uk/",aliases:["Synergy Kart"],history:"Synergy Racing Kart grew from a collaboration between Fusion Motorsport and KKC Kart Components, initially developed around the UK 900mm Cadet requirement and subsequently expanded into a wider karting range.",products:["Bambino Kart","Cadet & 950 Cadet Karts","Junior & Senior Karts","KZ Gearbox Karts","Spare parts and race support"],newsTerms:["synergy kart"]},
 {id:"tecno",name:"Tecno Kart",group:"Tecno",country:"Italy",founded:"1980s",site:"https://www.tecnokart.com/",aliases:["Tecno","Tecno Kart"],history:"Tecno is an Italian kart constructor with decades of involvement in international chassis development and racing.",products:["Mini chassis","Direct-drive chassis","KZ chassis"],newsTerms:["tecno kart"]},
 {id:"ms-kart",name:"MS Kart",group:"MS Kart",country:"Czech Republic",founded:"1990s",site:"https://www.mskart.cz/",aliases:["MS Kart"],history:"MS Kart is a Czech kart manufacturer producing racing and rental chassis for international markets.",products:["Racing chassis","Rental chassis","KZ chassis"],newsTerms:["ms kart"]},
 {id:"benik",name:"Benik Kart",group:"Benik",country:"United States",founded:"2010s",site:"https://www.benik-kart.com/",aliases:["Benik"],history:"Benik is a US karting manufacturer and retailer with a broad range of racing chassis, components, engines and karting equipment.",products:["Cadet chassis","Mini chassis","Junior chassis","New karts","Axles / drivetrain","Bodywork / bumpers","Brake systems","Chassis parts","Data systems","Tyres","Engines","Engine accessories","Hubs / wheels","Radiator parts","Benik race suit","Benik jacket","Benik pullover"],aliases:["Benik"],history:"Benik is a US-focused chassis brand with strong presence in cadet, mini and junior karting.",products:["Cadet chassis","Mini chassis","Junior chassis"],newsTerms:["benik kart","benik"]},
 {id:"dr",name:"DR Racing Kart",group:"DR Racing",country:"Italy",founded:"2000s",site:"https://www.drracingkart.com/",aliases:["DR Racing Kart","DR Kart"],history:"DR Racing Kart is the Italian chassis brand associated with Danilo Rossi and international competition.",products:["Mini","OK / OKJ","KZ chassis"],newsTerms:["dr racing kart","dr kart"]},
 {id:"tb-kart",name:"TB Kart",group:"TB Kart",country:"Italy",founded:"2000s",site:"https://www.tbkart.com/",aliases:["TB Kart"],history:"TB Kart is an Italian kart manufacturer active in both racing and rental markets.",products:["Bambino chassis","Cadet chassis","Junior chassis","Senior chassis","KZ gearbox chassis","Bodywork & sticker kits","Brakes","Engine / radiator / carb / air filter components","Exhausts","Floor plates","Fuel tanks","Pedals and accessories","Seats","Sprockets & chains","Steering components","Teamwear","Tools & equipment","Torsion bars","Wheels, rims, hubs & tyres"],newsTerms:["tb kart"]},
 {id:"croc-promotion",name:"Croc Promotion",group:"Croc Promotion / EL.ZET",country:"Italy",founded:"2010s",site:"https://croc-kart.com/en/",aliases:["Croc Promotion","Croc Kart"],history:"Croc Promotion is an Italian kart chassis brand whose current range is handcrafted and developed around CIK-FIA competition categories. EL.ZET took over the CROC Promotion company at the end of 2019.",products:["MC-04 Mini chassis","MC01 OK / X30 / Rotax chassis","MC01 KZ chassis","Kid Kart / Baby Kart","Mini / Cadet","OK / X30 / Rotax","KZ / Shifter / DD2","4-cycle chassis"],newsTerms:["croc promotion kart","croc kart"]},
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
 const [legacyOpen,setLegacyOpen]=useState(false);
 const [directoryOpen,setDirectoryOpen]=useState(false);
 return <><header className="site-header">
   <div className="masthead">
     <nav className={"main-nav "+(menuOpen?"open":"")}>
       <a href="#/" onClick={()=>setMenuOpen(false)}>Home</a>
       <a href="#/news" onClick={()=>setMenuOpen(false)}>News</a>
       <a href="#/marketplace" onClick={()=>setMenuOpen(false)}>Marketplace</a>
       <a href="#/drivers" onClick={()=>setMenuOpen(false)}>Drivers</a>
       <a href="#/classes" onClick={()=>setMenuOpen(false)}>Classes</a>
       <div className="nav-dropdown">
        <button className="nav-dropdown-toggle" type="button" aria-haspopup="true" aria-expanded={directoryOpen} onClick={()=>setDirectoryOpen(v=>!v)}>Directory <span>⌄</span></button>
        {directoryOpen&&<div className="nav-dropdown-menu" role="menu">
         <a href="#/manufacturers" onClick={()=>{setMenuOpen(false);setDirectoryOpen(false)}}>Manufacturers</a>
         <a href="#/asns" onClick={()=>{setMenuOpen(false);setDirectoryOpen(false)}}>ASNs</a>
         <a href="#/tracks" onClick={()=>{setMenuOpen(false);setDirectoryOpen(false)}}>Tracks</a>
        </div>}
       </div><a href="#/results" onClick={()=>setMenuOpen(false)}>Results</a>
       <a href="#/community" onClick={()=>setMenuOpen(false)}>Community</a><a href="#/knowledge-base" onClick={()=>setMenuOpen(false)}>Knowledge Base</a>
       <div className="nav-dropdown">
        <button className="nav-dropdown-toggle" type="button" aria-haspopup="true" aria-expanded={legacyOpen} onClick={()=>setLegacyOpen(v=>!v)}>Legacy <span>⌄</span></button>
        {legacyOpen&&<div className="nav-dropdown-menu" role="menu">
         <a href="#/history-of-karting" onClick={()=>{setMenuOpen(false);setLegacyOpen(false)}}>History of Karting</a>
         <a href="#/hall-of-fame/pioneer/Art%20Ingels" onClick={()=>{setMenuOpen(false);setLegacyOpen(false)}}>Art Ingels</a>
         <a href="#/hall-of-fame/driver/Martin%20Hines" onClick={()=>{setMenuOpen(false);setLegacyOpen(false)}}>Martin Hines</a>
         <a href="#/hall-of-fame/pioneer/Angelo%20Parrilla" onClick={()=>{setMenuOpen(false);setLegacyOpen(false)}}>Angelo Parrilla</a>
         <a href="#/hall-of-fame" onClick={()=>{setMenuOpen(false);setLegacyOpen(false)}}>Hall of Fame</a>
        </div>}
       </div>
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
 return <section className="hero"><div><Pill tone="lime">{region} FEED</Pill><h1>THE WORLD<br/>OF KARTING.<br/><em>ONE GRID.</em></h1><p>KartGrid brings karting into one place: live results, circuits, drivers, news, manufacturers, classifieds, community and AI-powered driver development.</p><div className="actions"><a className="button primary" href="#/results">Explore results</a><a className="button" href="#/profile">Open Driver Hub</a></div></div><div className="trackart"><div className="ring"></div><div className="kart">27</div></div></section>
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
 const title=n.title, dek=n.summary||n.dek||"", region=n.country&&n.country!=="Global"?n.country:(n.continent||n.region||"Global"), time=n.published?fmtDate(n.published):(n.time||"");
 const [imageFailed,setImageFailed]=useState(false);
 const body=<><div className={"media "+(imageFailed||!n.image?"no-image":"")}>
   {n.image&&!imageFailed?<img src={n.image} alt="" loading="lazy" onError={()=>setImageFailed(true)}/>:<div className="media-fallback"><b>KARTING</b><span>{n.source||"KartGrid News"}</span></div>}
   <span>{n.tag||"NEWS"}</span>
  </div><div className="cardbody"><div className="meta">{region} · {time}</div><h3>{title}</h3><p>{dek.slice(0,260)}{dek.length>260?"…":""}</p><div className="source-line">Source: <b>{n.source||"Original publisher"}</b>{n.sources?.length?<> · +{n.sources.length} matching source{n.sources.length>1?"s":""}</>:""}</div><b className="link">Read story →</b></div></>;
 return <a className={"news-card "+(big?"big":"")} href={"#/news/"+n.id}>{body}</a>
}
function ListingCard({x,saved,toggleSave}){return <article className="listing-card"><div className="listing-img"><span>{x.category}</span><button className={"heart "+(saved?"active":"")} onClick={()=>toggleSave(x.id)}>♥</button></div><div className="cardbody"><div className="meta">{x.region} · {x.condition}</div><h3>{x.title}</h3><div className="price">{x.currency}{Number(x.price).toLocaleString()}</div><p>{x.location} · {x.compat}</p><a className="link" href={"#/marketplace/"+x.id}>View listing →</a></div></article>}
function DriverCard({d}){return <a className="driver-card" href={"#/drivers/"+d.id}><div className="avatar">{d.name.split(" ").map(x=>x[0]).join("")}</div><div><div className="meta">{d.region} · #{d.number} {d.verified&&"✓ Verified"}</div><h3>{d.name}</h3><p>{d.className} · {d.team}</p><div className="mini-stats"><b>{d.starts}<small>Starts</small></b><b>{d.wins}<small>Wins</small></b><b>{d.podiums}<small>Podiums</small></b></div></div></a>}
function Home({region,listings,drivers,posts,saved,toggleSave}){
 const liveNews=useLiveNews();
 const news=newsFor(region,liveNews.items).slice(0,6), localListings=listings.filter(x=>region==="Global"||x.region===region).slice(0,4), localDrivers=drivers.filter(x=>region==="Global"||x.region===region).slice(0,3);
 return <><Hero region={region}/>
 <section><SectionHead eyebrow="One platform for karting" title="Everything you need, connected" copy="KartGrid is building a global karting network around real circuits, race results, drivers, classes, manufacturers and the people who make the sport happen."/>



 <div className="ad-products"><a className="panel" href="#/results"><h3>Results & classifications</h3><p>Search championships, events, sessions, drivers and full timing-style classifications from supported timing sources.</p><b className="link">Search results →</b></a><a className="panel" href="#/tracks"><h3>Global track directory</h3><p>Discover kart circuits by country, region and championship, with track profiles, addresses, imagery and linked results.</p><b className="link">Find a circuit →</b></a><a className="panel" href="#/profile"><h3>AI driver coaching</h3><p>Use the Driver Hub to build your racing profile and analyse onboard footage. KartGrid is developing data-driven coaching that connects video, results and performance trends.</p><b className="link">Open Driver Hub →</b></a><a className="panel" href="#/knowledge-base"><h3>Karting knowledge</h3><p>Ask karting-specific questions, understand classes and licences, and follow practical guides for getting started and progressing in the sport.</p><b className="link">Explore knowledge →</b></a></div></section>
 <Ad format="Homepage takeover"/>
 <section><SectionHead eyebrow="Latest from the paddock" title={region+" news first"} copy="Karting stories are organised around your selected region while major international coverage remains easy to discover."/>{news.length?<div className="news-grid">{news.map((n,i)=><NewsCard key={n.id} n={n} big={i===0}/>)}</div>:<Empty text="No stories in this region yet."/>}</section>
 <section><SectionHead eyebrow="Drivers & development" title="Build your racing identity. Improve your driving." copy="Create a KartGrid profile for your racing history and use the Driver Hub as the foundation for AI video analysis, verified results and data-driven performance coaching." action={<a className="button primary" href="#/profile">Open Driver Hub</a>}/><div className="driver-grid">{localDrivers.map(d=><DriverCard key={d.id} d={d}/>)}</div></section>
 <section><SectionHead eyebrow="Marketplace" title="Karting classifieds without the noise" copy="Browse karts, engines, chassis, parts, trailers, racewear, tools and team equipment in a marketplace built specifically for karting." action={<a className="button primary" href="#/marketplace/new">+ Post a listing</a>}/><div className="market-grid">{localListings.map(x=><ListingCard key={x.id} x={x} saved={saved.includes(x.id)} toggleSave={toggleSave}/>)}</div></section>
 <Ad format="Marketplace leaderboard" text="Dealer and manufacturer inventory"/>
 <section><SectionHead eyebrow="Classes" title="Understand the karting ladder" copy="Compare major karting class families, engine formats, age groups and regional pathways before choosing where to race." action={<a className="button" href="#/classes">Explore classes</a>}/><ClassTable rows={kartClasses.slice(0,7)}/></section>
 <section><SectionHead eyebrow="Community" title="The digital paddock" copy="A place for racers, parents, teams and enthusiasts to share setup knowledge, race weekends, wanted posts, results and experience." action={<a className="button primary" href="#/community/new">Create post</a>}/><div className="post-grid">{posts.filter(p=>region==="Global"||p.region===region).slice(0,3).map(p=><PostCard p={p} key={p.id}/>)}</div></section></>
}
function News(){
 const liveNews=useLiveNews();
 const [q,setQ]=useState(""); const [country,setCountry]=useState("All"); const [continent,setContinent]=useState("All"); const [source,setSource]=useState("All"); const [limit,setLimit]=useState(24);
 const base=liveNews.items;
 const countries=[...new Set(base.map(n=>n.country).filter(x=>x&&x!=="Global"))].sort();
 const continents=[...new Set(base.map(n=>n.continent).filter(x=>x&&x!=="Global"))].sort();
 const sources=[...new Set(base.map(n=>n.source).filter(Boolean))].sort();
 const rows=base.filter(n=>(country==="All"||n.country===country)&&(continent==="All"||n.continent===continent)&&(source==="All"||n.source===source)&&((n.title+" "+(n.summary||n.dek||"")+" "+(n.source||"")).toLowerCase().includes(q.toLowerCase())));
 useEffect(()=>setLimit(24),[q,country,continent,source]);
 const visible=rows.slice(0,limit);
 return <section><PageTitle kicker={liveNews.live?"Live global aggregator":"Newsroom"} title="ALL KARTING NEWS" text={liveNews.live?("Live karting coverage from specialist media, governing bodies and selected wider publications · updated "+fmtDate(liveNews.updatedAt)):"Loading live feed…"}/>
 <div className="news-intro"><b>Specialist karting coverage</b><span>Vroomkart · eKartingNews · Kartcom · Kart Mag · TKART · KartSportNews · Karting Australia · Motorsport UK · FIA Karting and more</span></div>
 <Filters><input placeholder="Search karting news, driver, championship or circuit…" value={q} onChange={e=>setQ(e.target.value)}/><select value={continent} onChange={e=>{setContinent(e.target.value);setCountry("All")}}><option>All continents</option>{continents.map(x=><option key={x}>{x}</option>)}</select><select value={country} onChange={e=>setCountry(e.target.value)}><option>All countries</option>{countries.filter(c=>continent==="All"||base.some(n=>n.country===c&&n.continent===continent)).map(x=><option key={x}>{x}</option>)}</select><select value={source} onChange={e=>setSource(e.target.value)}><option>All publications</option>{sources.map(x=><option key={x}>{x}</option>)}</select></Filters>
 <div className="news-count"><b>{rows.length}</b> stories available {source!=="All"&&<>from <b>{source}</b></>}</div>
 {visible.length?<><div className="news-grid">{visible.map((n,i)=><NewsCard key={n.id||n.url||i} n={n} big={i===0}/>)}</div>{visible.length<rows.length&&<div className="load-more"><button className="button primary" onClick={()=>setLimit(x=>x+24)}>Load 24 more</button><small>Showing {visible.length} of {rows.length}</small></div>}</>:<Empty text="No live stories match those filters."/>}
 <Ad format="News leaderboard"/></section>
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
function NewsDetail({id}){const live=useLiveNews();const n=live.items.find(x=>String(x.id)===id)||demoNews.find(x=>String(x.id)===id);const [imageFailed,setImageFailed]=useState(false);if(!n)return <NotFound/>;const region=n.country&&n.country!=="Global"?n.country:(n.continent||n.region||"Global");const summary=n.summary||n.dek||"";return <section className="article"><Pill>{region}</Pill><h1>{n.title}</h1><p className="lead">{summary.slice(0,900)}</p><div className="article-meta">Source: <b>{n.source||"Original publisher"}</b> · {n.published?fmtDate(n.published):(n.time||"")}</div>{n.image&&!imageFailed?<img className="article-hero-image" src={n.image} alt="" onError={()=>setImageFailed(true)}/>:<div className="article-hero-fallback"><b>KARTING NEWS</b><span>{n.source||"Original publisher"}</span></div>}<div className="panel article-summary"><div className="article-source-label">SOURCE REPORT</div><h3>{n.source||"Original publisher"}</h3><p>{summary}</p><p className="muted">KartGrid provides an on-site summary and source attribution. Copyright in the original reporting remains with its publisher.</p>{n.url&&<a className="button primary" href={n.url} target="_blank" rel="noopener noreferrer">Read the full report at {n.source||"source"} ↗</a>}</div>{n.sources?.length>0&&<div className="panel"><h3>Additional coverage</h3>{n.sources.map((x,i)=><p key={i}><a className="link" href={x.url} target="_blank" rel="noopener noreferrer">{x.source} ↗</a></p>)}</div>}<Ad format="In-article MPU"/></section>}
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
function Drivers({region,drivers}){const[q,setQ]=useState("");const rows=drivers.filter(d=>(region==="Global"||d.region===region)&&((d.name+" "+d.className+" "+d.team).toLowerCase().includes(q.toLowerCase())));return <section><PageTitle kicker="Driver network" title="DRIVERS" text="Discover racers by region, class and team. KartGrid driver profiles are being built around verified race history, performance data and long-term driver development." action={<a className="button primary" href="#/profile">+ Create my profile</a>}/><Filters><input placeholder="Search driver, class or team…" value={q} onChange={e=>setQ(e.target.value)}/></Filters><div className="driver-grid">{rows.map(d=><DriverCard key={d.id} d={d}/>)}</div><Ad format="Driver directory sponsor"/></section>}
function DriverDetail({id,drivers}){const d=drivers.find(x=>x.id===id);if(!d)return <NotFound/>;return <section><div className="profile-hero"><div className="profile-avatar">{d.name.split(" ").map(x=>x[0]).join("")}</div><div><div className="meta">{d.nationality} · {d.region} · #{d.number} {d.verified&&"· ✓ Verified"}</div><h1>{d.name}</h1><p>{d.className} · {d.team}</p><p>{d.bio}</p></div></div><div className="statbar"><b>{d.starts}<small>Starts</small></b><b>{d.wins}<small>Wins</small></b><b>{d.podiums}<small>Podiums</small></b><b>{d.className}<small>Current class</small></b></div><div className="two-col"><div className="panel"><h3>Racing record</h3><p>KartGrid profiles are designed to connect a driver's verified results, championships, race weekends and performance history into one searchable record.</p><p className="muted">As timing records are matched to driver identities, this profile can become a season-by-season racing CV rather than a manually maintained list.</p></div><div className="panel"><h3>Driver development</h3><p>Performance data and onboard footage can be used to build a clearer picture of consistency, progression and areas for improvement.</p><p className="muted">Private AI coaching tools are available through the Driver Hub, with data-driven coaching being expanded as more verified performance data becomes available.</p></div></div></section>}
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
   <PageTitle kicker="KartGrid Knowledge Base" title="EVERYTHING KARTING" text={"Ask a karting question or browse practical guides tailored to "+region+"."}/>
   <div className="knowledge-search">
    <form className="ai-search-box" onSubmit={ask}>
      <input aria-label="Ask KartGrid AI" placeholder="Ask anything about karting…" value={q} onChange={e=>setQ(e.target.value)}/>
      <button className="button primary" type="submit" disabled={loading}>{loading?"Searching the karting web…":"Ask KartGrid AI"}</button>
    </form>
    <div className="ai-safety-note"><b>Karting only · child-safe</b><span>Live web search is restricted to approved karting sources.</span></div>
   </div>
   {error&&<div className="ai-blocked"><h3>AI Search unavailable</h3><p>{error}</p></div>}
   {result?.ok&&<div className="ai-results">
      <div className="ai-answer"><span>KartGrid AI</span><div className="ai-answer-text">{result.answer}</div></div>
      {result.sources?.length>0&&<div className="ai-source-list"><h3>Sources</h3>{result.sources.map((src,i)=><a href={src.url} target="_blank" rel="noopener noreferrer" key={src.url||i}><span>{i+1}</span><div><b>{src.title||"Source"}</b><small>{src.url}</small></div></a>)}</div>}
   </div>}
   <SectionHead eyebrow={region+" guide"} title="Getting started in karting" copy="Practical first steps tailored to your selected region."/>
   <div className="knowledge-guide-grid">{regionGuides.map((g,i)=><article className="knowledge-guide" key={g.title}><span>{String(i+1).padStart(2,"0")}</span><h3>{g.title}</h3><p>{g.text}</p><a href={g.title.includes("class")||g.title.includes("age")?"#/classes":"#/knowledge-base"}>Read guide →</a></article>)}</div>
 </section>
}
function useApi(path){
 const [state,setState]=useState({data:null,loading:true,error:""});
 useEffect(()=>{let alive=true;setState({data:null,loading:true,error:""});fetch(KARTGRID_API+path).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||"Request failed");return d}).then(data=>{if(alive)setState({data,loading:false,error:""})}).catch(e=>{if(alive)setState({data:null,loading:false,error:e.message})});return()=>{alive=false}},[path]);
 return state;
}
const alphaSeries=[
 {slug:"ukc",name:"Ultimate Karting Championship"},
 {slug:"bkc",name:"The Kart Championship"},
 {slug:"nkc",name:"National Kart Cup"},
 {slug:"accesskarting",name:"Access Karting"},
 {slug:"wmkc",name:"Whilton Mill Kart Club"},
 {slug:"wombwellkarting",name:"Wombwell Karting"},
 {slug:"tattershall",name:"Tattershall Karting Centre"}
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
 {loading?<Empty text="Loading sessions…"/>:error?<div className="ai-blocked"><h3>Event unavailable</h3><p>{error}</p></div>:sessions.length?<div className="session-list">{sessions.map((x,i)=><a className="session-row" href={"#/results/tsl/"+slug+"/event/"+eventId+"/session/"+x.id} key={x.url||i}><div className="session-no">{x.type.slice(0,1)}</div><div><div className="meta">{x.type}</div><h3>{x.name}</h3></div><b>Full result →</b></a>)}</div>:<Empty text="No Superkart session links were found on the TSL event page."/>}
 </section>
}
function TSLResultsSession({slug,eventId,sessionId}){
 const {data,loading,error}=useApi("/api/results/tsl/"+slug+"/event/"+eventId+"/session/"+sessionId);
 const sess=data?.session;
 return <section><PageTitle kicker="Full classification" title={(sess?.title||"TSL SESSION RESULT").toUpperCase()} text="Official TSL Timing classification, displayed inside KartGrid." action={<a className="button" href={"#/results/tsl/"+slug+"/event/"+eventId}>Back to event</a>}/>
 {loading?<Empty text="Loading full classification…"/>:error?<div className="ai-blocked"><h3>Classification unavailable</h3><p>{error}</p></div>:sess?<>{sess.rows?.length?<div className="classification-wrap"><table>{sess.headers?.length>0&&<thead><tr>{sess.headers.map((h,i)=><th key={i}>{h||"#"}</th>)}</tr></thead>}<tbody>{sess.rows.map((row,i)=><tr key={i}>{row.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></div>:sess.lines?.length?<div className="panel tsl-text-result">{sess.lines.map((line,i)=><p key={i}>{line}</p>)}</div>:<Empty text="TSL published the session, but no classification text could be extracted."/>}{sess.url&&<a className="button" href={sess.url} target="_blank" rel="noopener noreferrer">View original on TSL Timing ↗</a>}</>:<Empty text="This TSL classification is not available."/>}
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
 const [q,setQ]=useState(""); const [continent,setContinent]=useState("All"); const [country,setCountry]=useState("All"); const [trackRegion,setTrackRegion]=useState("All"); const [series,setSeries]=useState("All"); const [venueType,setVenueType]=useState("All"); const [limit,setLimit]=useState(60);
 const tracks=data.tracks||[];
 const continents=[...new Set(tracks.map(t=>t.continent).filter(Boolean))].sort();
 const countries=[...new Set(tracks.map(t=>t.country).filter(Boolean))].sort();
 const regionsList=[...new Set(tracks.filter(t=>(continent==="All"||t.continent===continent)&&(country==="All"||t.country===country)).map(t=>t.region).filter(Boolean))].sort();
 const seriesList=[...new Set(tracks.flatMap(t=>t.series||[]))].sort();
 const rows=tracks.filter(t=>{
   const hay=(t.name+" "+t.city+" "+t.region+" "+t.country+" "+(t.series||[]).join(" ")).toLowerCase();
   return (continent==="All"||t.continent===continent)&&(country==="All"||t.country===country)&&(trackRegion==="All"||t.region===trackRegion)&&(series==="All"||(t.series||[]).includes(series))&&(venueType==="All"||t.venueType===venueType)&&hay.includes(q.toLowerCase());
 });
 const visible=rows.slice(0,limit);
 const resultCounts=useMemo(()=>{const records=resultsData.records||[];const counts=new Map();for(const t of tracks){let count=0;for(const r of records){if(trackMatchesResult(t,r))count++}counts.set(t.id,count)}return counts},[tracks,resultsData]);
 useEffect(()=>{setLimit(60)},[q,continent,country,trackRegion,series,venueType]);
 const countryCount=new Set(tracks.map(t=>t.country).filter(Boolean)).size;
 const continentCount=new Set(tracks.map(t=>t.continent).filter(Boolean)).size;
 return <section><PageTitle kicker="Global circuit directory" title="KARTING TRACKS" text={loading?"Loading circuits…":tracks.length+" venues across "+countryCount+" countries and "+continentCount+" continents. Search by country, region, championship or track name."}/>
 <Filters><input placeholder="Search track, city or country…" value={q} onChange={e=>setQ(e.target.value)}/><select value={continent} onChange={e=>{setContinent(e.target.value);setCountry("All");setTrackRegion("All")}}><option>All</option>{continents.map(x=><option key={x}>{x}</option>)}</select><select value={country} onChange={e=>{setCountry(e.target.value);setTrackRegion("All")}}><option>All</option>{countries.filter(c=>continent==="All"||tracks.some(t=>t.country===c&&t.continent===continent)).map(x=><option key={x}>{x}</option>)}</select><select value={trackRegion} onChange={e=>setTrackRegion(e.target.value)}><option>All regions</option>{regionsList.map(x=><option key={x} value={x}>{x}</option>)}</select><select value={series} onChange={e=>setSeries(e.target.value)}><option>All</option>{seriesList.map(x=><option key={x}>{x}</option>)}</select><select value={venueType} onChange={e=>setVenueType(e.target.value)}><option>All</option><option>Outdoor</option><option>Indoor</option></select></Filters>
 {rows.length?<><div className="track-directory-summary"><b>{rows.length}</b><span>matching venues</span><b>{countryCount}</b><span>countries indexed</span><b>{tracks.filter(t=>t.fiaHomologation||t.motorsportUkLicensed).length}</b><span>federation verified</span></div><div className="track-grid">{visible.map(t=>{const count=resultCounts.get(t.id)||0;return <a className="track-card" href={"#/tracks/"+t.id} key={t.id}><div className="track-pin">⌖</div><div className="meta">{t.continent} · {t.country}{t.venueType?" · "+t.venueType:""}</div><h3>{t.name}</h3><p>{[t.city,t.region].filter(Boolean).join(", ")}</p><div className="product-tags">{(t.series||[]).map(x=><span key={x}>{x}</span>)}</div><div className="track-actions"><b className="link">View circuit →</b><small>{count} linked result{count===1?"":"s"}</small></div></a>})}</div>{visible.length<rows.length&&<div className="load-more"><button className="button primary" onClick={()=>setLimit(x=>x+60)}>Load 60 more</button><small>Showing {visible.length} of {rows.length}</small></div>}</>:<Empty text="No circuits match those filters."/>}
 </section>
}
function AsnsPage(){
 const {data,loading}=useRemoteJson("asns.json",{asns:[],updatedAt:null});
 const [q,setQ]=useState(""); const [continent,setContinent]=useState("All");
 const rows=(data.asns||[]).filter(a=>(continent==="All"||a.continent===continent)&&((a.name+" "+a.country+" "+(a.abbreviation||"")).toLowerCase().includes(q.toLowerCase())));
 const continents=[...new Set((data.asns||[]).map(a=>a.continent).filter(Boolean))].sort();
 return <section><PageTitle kicker="National sporting authorities" title="GLOBAL ASN DIRECTORY" text={loading?"Loading authorities…":(data.asns||[]).length+" motorsport authorities indexed. Each country page connects its governing body to karting, circuits, championships and community contributions."}/><a className="fia-directory-card" href="#/fia"><div className="fia-brand"><img className="fia-official-logo" src="https://commons.wikimedia.org/wiki/Special:Redirect/file/FIA_logo_(transparent).png" alt="FIA official logo"/><div><div className="meta">WORLD MOTOR SPORT GOVERNING BODY</div><h2>Fédération Internationale de l’Automobile</h2><p>The global federation for motor sport and the parent organisation of the national sporting authorities listed below.</p></div></div><span className="link">Explore FIA →</span></a><Filters><input placeholder="Search authority or country…" value={q} onChange={e=>setQ(e.target.value)}/><select value={continent} onChange={e=>setContinent(e.target.value)}><option>All</option>{continents.map(x=><option key={x}>{x}</option>)}</select></Filters><div className="asn-grid">{rows.map(a=><a className="asn-card" href={"#/asns/"+a.id} key={a.id}><div className="asn-card-head"><span className="asn-flag"><img src={a.flagUrl} alt={a.country+" national flag"} loading="lazy"/></span>{a.logoUrl?<img className="asn-logo" src={a.logoUrl} alt={a.name+" logo"} loading="lazy" onError={e=>{e.currentTarget.style.display="none"}}/>:<span className="asn-logo-fallback">ASN</span>}</div><div className="meta">{a.continent} · {a.country}</div><h3>{a.name}</h3><p>{a.abbreviation||"FIA sporting authority"}</p><div className="track-actions"><b className="link">View authority →</b><small>{a.type||"Sport"}</small></div></a>)}</div></section>
}
function AsnDetail({id}){
 const {data,loading}=useRemoteJson("asns.json",{asns:[]}); const {data:tracksData}=useRemoteJson("tracks.json",tracksSeed);
 const a=(data.asns||[]).find(x=>x.id===id); if(loading)return <section><PageTitle kicker="ASN" title="LOADING AUTHORITY" text="Loading national sporting authority…"/></section>; if(!a)return <NotFound/>;
 const tracks=(tracksData.tracks||[]).filter(t=>t.country===a.country);
 return <section><PageTitle kicker={a.country} title={a.name.toUpperCase()} text="National motorsport authority profile and karting directory." action={<a className="button" href="#/asns">All ASNs</a>}/><div className="track-detail-grid"><div className="panel asn-profile"><div className="asn-detail-brand"><span className="asn-flag large"><img src={a.flagUrl} alt={a.country+" national flag"} loading="lazy"/></span>{a.logoUrl?<img className="asn-logo large" src={a.logoUrl} alt={a.name+" logo"}/>:<span className="asn-logo-fallback large">ASN</span>}</div><h3>Authority profile</h3><dl className="facts"><div><dt>Country</dt><dd>{a.country}</dd></div><div><dt>Continent</dt><dd>{a.continent}</dd></div><div><dt>FIA membership</dt><dd>{a.type||"Sport"}</dd></div><div><dt>Address</dt><dd>{a.address||"—"}</dd></div></dl><div className="asn-contact"><h4>Contact information</h4>{a.contact?.phone&&<div><span>Phone</span><a href={"tel:"+a.contact.phone}>{a.contact.phone}</a></div>}{a.contact?.email&&<div><span>Email</span><a href={"mailto:"+a.contact.email}>{a.contact.email}</a></div>}{a.contact?.website&&<div><span>Website</span><a href={a.contact.website} target="_blank" rel="noopener noreferrer">Official website ↗</a></div>}{!a.contact?.phone&&!a.contact?.email&&!a.contact?.website&&<p className="muted">Public contact details not yet verified.</p>}</div>{a.sourceUrl&&<a className="button primary" href={a.sourceUrl} target="_blank" rel="noopener noreferrer">FIA source ↗</a>}</div><div className="panel ugc-callout"><span>COMMUNITY POWERED</span><h3>Help complete this ASN</h3><p>Add karting championships, licence guidance, clubs, officials, documents, photos or corrections. Contributions will be attributed and reviewed.</p><a className="button primary" href={"#/contribute/asn/"+a.id}>Contribute information</a></div></div><SectionHead eyebrow="Karting network" title={"Tracks in "+a.country} copy={tracks.length+" circuits currently connected to this national directory."}/><div className="track-grid">{tracks.slice(0,24).map(t=><a className="track-card" href={"#/tracks/"+t.id} key={t.id}><div className="meta">{t.region||t.country}</div><h3>{t.name}</h3><p>{t.city}</p></a>)}</div></section>
}
function FIAProfile(){
 return <section>
  <PageTitle kicker="World governing body" title="FIA" text="The Fédération Internationale de l’Automobile is the global governing body for motor sport and the federation representing mobility organisations worldwide." action={<a className="button" href="#/asns">ASN directory</a>}/>
  <div className="fia-profile-hero"><div><div className="meta">FÉDÉRATION INTERNATIONALE DE L’AUTOMOBILE</div><h2>FIA & Karting</h2><p>The FIA governs international motor sport through its sporting commissions and works with National Sporting Authorities around the world. Karting sits within this structure through the FIA Karting Commission, formerly known as the CIK-FIA.</p></div><img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/FIA_logo_(transparent).png" alt="FIA official logo"/></div>
  <div className="two-col">
   <div className="panel"><h3>FIA Karting</h3><p>FIA Karting covers international karting competition, sporting and technical regulations, homologation, safety, calendars and the development of karting through the global karting programme.</p><p>The current FIA Global Karting Plan includes Arrive and Drive continental and world-level initiatives, alongside development programmes intended to broaden access to competitive karting.</p><a className="button primary" href="#/fia/cik">Explore CIK-FIA Karting →</a></div>
   <div className="panel"><h3>What the FIA connects</h3><div className="link-list"><a href="#/asns">National Sporting Authorities</a><a href="#/results">International results & rankings</a><a href="#/tracks">Karting circuits</a><a href="#/news">Karting news</a><a href="#/classes">Karting classes</a></div></div>
  </div>
  <SectionHead eyebrow="Leadership" title="Key people" copy="The people most relevant to understanding the FIA and its international karting structure."/>
  <div className="people-grid">
   <article className="panel people-card"><img className="person-photo" src="https://www.fia.com/sites/default/files/styles/content_details/public/news/main_image/251212-fia-taschkent-grl.02420-cr3.jpg?itok=i67M5Mn7" alt="Mohammed Ben Sulayem" loading="lazy"/><div className="meta">FIA PRESIDENT · UNITED ARAB EMIRATES</div><h3>Mohammed Ben Sulayem</h3><p>Mohammed Ben Sulayem has served as FIA President since 2021 and was re-elected for a second four-year term in December 2025. Before becoming President, he was a senior FIA sport office-holder and a 14-time FIA Middle East Rally Champion, with 61 international event wins between 1983 and 2002.</p><a className="link" href="https://www.fia.com/presidency" target="_blank" rel="noopener noreferrer">FIA profile ↗</a></article>
   <article className="panel people-card"><img className="person-photo" src="https://commons.wikimedia.org/wiki/Special:Redirect/file/MalcolmWilson.jpg" alt="Malcolm Wilson OBE" loading="lazy"/><div className="meta">DEPUTY PRESIDENT FOR SPORT · UNITED KINGDOM</div><h3>Malcolm Wilson OBE</h3><p>Malcolm Wilson is the FIA Deputy President for Sport. The role sits within the FIA’s sporting leadership structure and connects the federation’s senior governance with its international sporting disciplines.</p><a className="link" href="https://www.fia.com/" target="_blank" rel="noopener noreferrer">FIA website ↗</a></article>
   <article className="panel people-card"><img className="person-photo" src="https://www.fia.com/sites/default/files/styles/content_details/public/dsc_0588.jpg?itok=sNA-gXMJ" alt="FIA sport leadership" loading="lazy"/><div className="meta">SECRETARY GENERAL FOR SPORT</div><h3>Valerio Iachizzi</h3><p>Valerio Iachizzi leads the FIA General Secretariat for Sport and works with the federation’s Member Clubs and sporting departments. He has been a prominent FIA voice on the Global Karting Plan, ASN development and expanding access to motor sport.</p><a className="link" href="https://www.fia.com/news/fia-global-karting-plan-action" target="_blank" rel="noopener noreferrer">FIA karting development ↗</a></article>
   <article className="panel people-card"><img className="person-photo" src="https://www.fia.com/sites/default/files/styles/content_details/public/news/main_image/fia_0.jpg?itok=rol43Si3" alt="Alberto Villarreal and FIA colleague" loading="lazy"/><div className="meta">FIA GENERAL MANAGER · SPAIN</div><h3>Alberto Villarreal</h3><p>Alberto Villarreal is the FIA General Manager. He joined the FIA in 2024 after 28 years in the automotive sector, including two decades in senior leadership at Goodyear. He oversees the federation’s operational and financial performance.</p><a className="link" href="https://www.fia.com/news/fia-strengthens-leadership-new-appointments" target="_blank" rel="noopener noreferrer">Appointment & biography ↗</a></article>
   <article className="panel people-card"><img className="person-photo" src="https://www.fia.com/sites/default/files/styles/content_details/public/news/main_image/ksp_000_2932.jpg?itok=iHKDymp7" alt="Akbar Ebrahim at FIA Karting event" loading="lazy"/><div className="meta">INTERNATIONAL KARTING COMMISSION PRESIDENT · INDIA</div><h3>Akbar Ebrahim</h3><p>Akbar Ebrahim is President of the FIA International Karting Commission (CIK-FIA) and a member by right of the World Motor Sport Council. He is a central figure in the FIA Global Karting Plan, including the development of national rankings, Arrive and Drive competitions and Karting Excellence Centres.</p><a className="link" href="https://www.fia.com/news/fia-global-karting-plan-action" target="_blank" rel="noopener noreferrer">Global Karting Plan ↗</a></article>
  </div>
  <SectionHead eyebrow="Useful links" title="FIA resources" copy="KartGrid keeps you on KartGrid. These links open the relevant official FIA resource."/>
  <div className="resource-grid"><a className="resource-card" href="https://www.fia.com/" target="_blank" rel="noopener noreferrer"><b>FIA official website ↗</b><span>Official federation website</span></a><a className="resource-card" href="https://www.fia.com/events/karting" target="_blank" rel="noopener noreferrer"><b>FIA Karting ↗</b><span>Official FIA Karting information</span></a><a className="resource-card" href="https://www.fia.com/members" target="_blank" rel="noopener noreferrer"><b>FIA Members / ASNs ↗</b><span>National member directory</span></a><a className="resource-card" href="https://www.fiakarting.com/" target="_blank" rel="noopener noreferrer"><b>FIA Karting portal ↗</b><span>Dedicated karting platform</span></a></div>
 </section>
}
function CIKProfile(){
 return <section>
  <PageTitle kicker="FIA sporting commission" title="CIK-FIA" text="International Karting Commission. The FIA commission responsible for developing, coordinating and regulating international karting." action={<a className="button" href="#/fia">FIA profile</a>}/>
  <div className="fia-profile-hero"><div><div className="meta">INTERNATIONAL KARTING COMMISSION</div><h2>CIK-FIA</h2><p>The CIK-FIA is not a separate federation from the FIA. It is the FIA’s International Karting Commission and sits within the FIA sporting structure. FIA describes the commission as having been created in 1962.</p></div><div className="cik-mark">CIK<br/><span>FIA KARTING</span></div></div>
  <div className="two-col">
   <div className="panel"><h3>What CIK-FIA does</h3><ul className="feature-list"><li>Develops and harmonises international karting sporting and technical regulations.</li><li>Coordinates the international karting calendar.</li><li>Sets requirements for karting equipment, homologation and venues.</li><li>Works with National Sporting Authorities on karting development.</li><li>Supports the international karting championship, cup and trophy structure.</li></ul></div>
   <div className="panel"><h3>International karting</h3><p>CIK-FIA regulations underpin the FIA’s international karting categories and competitions. FIA Karting also operates development initiatives including the Karting Academy and Global Karting Plan.</p><a className="button primary" href="https://www.fiakarting.com/" target="_blank" rel="noopener noreferrer">Official FIA Karting portal ↗</a></div>
  </div>
  <SectionHead eyebrow="Leadership" title="Karting leadership" copy="The current FIA roles most directly connected with international karting."/>
  <div className="people-grid"><article className="panel people-card"><div className="meta">CIK-FIA PRESIDENT · INDIA</div><h3>Akbar Ebrahim</h3><p>President of the FIA International Karting Commission. He has been closely associated with the FIA Global Karting Plan and its initiatives to widen access to international karting.</p><a className="link" href="https://www.fia.com/news/fia-global-karting-plan-action" target="_blank" rel="noopener noreferrer">FIA karting profile ↗</a></article><article className="panel people-card"><div className="meta">FIA GENERAL MANAGER · SPAIN</div><h3>Alberto Villarreal</h3><p>FIA General Manager, responsible for the organisation’s overall operational and financial performance. He is not the Karting General Manager; FIA Karting sits within the wider FIA sporting structure.</p><a className="link" href="https://www.fia.com/news/fia-strengthens-leadership-new-appointments" target="_blank" rel="noopener noreferrer">FIA biography ↗</a></article></div>
  <SectionHead eyebrow="Official resources" title="CIK-FIA links" copy="Use KartGrid for the directory and overview; these links take you to official source material."/>
  <div className="resource-grid"><a className="resource-card" href="https://www.fiakarting.com/" target="_blank" rel="noopener noreferrer"><b>FIA Karting ↗</b><span>Official dedicated karting portal</span></a><a className="resource-card" href="https://www.fia.com/events/karting" target="_blank" rel="noopener noreferrer"><b>FIA Karting on FIA.com ↗</b><span>Official FIA karting information</span></a><a className="resource-card" href="https://www.fia.com/members" target="_blank" rel="noopener noreferrer"><b>FIA ASNs ↗</b><span>National Sporting Authorities</span></a></div>
 </section>
}
const hallOfFame=[
 {year:1965,name:"Mario Andretti",country:"USA",path:"Karting → IndyCar → Formula 1 → Le Mans",note:"A multiple-time Indy car champion and Formula 1 race winner whose early career included karting."},
 {year:1972,name:"Emerson Fittipaldi",country:"Brazil",path:"Karting → Formula 1 → IndyCar → Le Mans",note:"Two-time Formula 1 World Champion who later became an IndyCar champion."},
 {year:1978,name:"Alain Prost",country:"France",path:"Karting → Formula 1",note:"Four-time Formula 1 World Champion."},
 {year:1980,name:"Ayrton Senna",country:"Brazil",path:"Karting → Formula 1",note:"Three-time Formula 1 World Champion and one of karting’s most famous alumni."},
 {year:1980,name:"Gilles Villeneuve",country:"Canada",path:"Karting → Formula 1 → Le Mans",note:"Formula 1 Grand Prix winner who began his racing career in karting."},
 {year:1982,name:"Nelson Piquet",country:"Brazil",path:"Karting → Formula 1",note:"Three-time Formula 1 World Champion."},
 {year:1984,name:"Michael Schumacher",country:"Germany",path:"Karting → Formula 1 → Le Mans",note:"Seven-time Formula 1 World Champion and 24 Hours of Le Mans competitor."},
 {year:1984,name:"Mika Häkkinen",country:"Finland",path:"Karting → Formula 1",note:"Two-time Formula 1 World Champion."},
 {year:1985,name:"Jean Alesi",country:"France",path:"Karting → Formula 1 → Touring Cars",note:"Formula 1 Grand Prix winner who later raced in DTM and endurance competition."},
 {year:1987,name:"Gerhard Berger",country:"Austria",path:"Karting → Formula 1 → Touring Cars",note:"Ten-time Formula 1 Grand Prix winner and later a DTM competitor."},
 {year:1988,name:"Jarno Trulli",country:"Italy",path:"Karting → Formula 1 → Le Mans",note:"Formula 1 Grand Prix winner and 1991 CIK-FIA Karting World Champion."},
 {year:1989,name:"Fabrizio Giovanardi",country:"Italy",path:"Karting → Touring Cars",note:"Multiple touring-car champion and 1995 CIK-FIA KZ World Champion."},
 {year:1990,name:"Andy Priaulx",country:"United Kingdom",path:"Karting → Touring Cars → Le Mans",note:"Three-time World Touring Car champion and multiple Le Mans competitor."},
 {year:1991,name:"Yvan Muller",country:"France",path:"Karting → Touring Cars → Le Mans",note:"Four-time World Touring Car champion and long-time international touring-car benchmark."},
 {year:1992,name:"Tom Kristensen",country:"Denmark",path:"Karting → Formula 3 → Le Mans",note:"Nine-time 24 Hours of Le Mans winner."},
 {year:1993,name:"Allan McNish",country:"United Kingdom",path:"Karting → Formula 3 → Formula 1 testing → Le Mans",note:"Three-time Le Mans winner and World Endurance champion."},
 {year:1993,name:"Dario Franchitti",country:"United Kingdom",path:"Karting → IndyCar → Le Mans",note:"Four-time IndyCar Series champion and three-time Indianapolis 500 winner."},
 {year:1994,name:"Jacques Villeneuve",country:"Canada",path:"Karting → IndyCar → Formula 1 → Le Mans",note:"Indy 500 winner, CART champion and Formula 1 World Champion."},
 {year:1994,name:"Juan Pablo Montoya",country:"Colombia",path:"Karting → IndyCar → Formula 1 → Le Mans",note:"Two-time Indianapolis 500 winner and Formula 1 Grand Prix winner."},
 {year:1995,name:"Rubens Barrichello",country:"Brazil",path:"Karting → Formula 1 → IndyCar → Le Mans",note:"Long-serving Formula 1 driver and Grand Prix winner."},
 {year:1996,name:"Jenson Button",country:"United Kingdom",path:"Karting → Formula 1 → Le Mans",note:"2009 Formula 1 World Champion who later raced at Le Mans."},
 {year:1997,name:"Giancarlo Fisichella",country:"Italy",path:"Karting → Formula 1 → Le Mans",note:"Three-time Formula 1 Grand Prix winner and three-time Le Mans winner."},
 {year:1998,name:"Gabriele Tarquini",country:"Italy",path:"Karting → Formula 1 → Touring Cars",note:"Formula 1 driver and World Touring Car champion."},
 {year:1998,name:"Rob Huff",country:"United Kingdom",path:"Karting → Touring Cars",note:"World Touring Car champion and multiple international touring-car race winner."},
 {year:1999,name:"Jason Plato",country:"United Kingdom",path:"Karting → Touring Cars",note:"One of Britain’s most successful touring-car drivers."},
 {year:2000,name:"Scott Dixon",country:"New Zealand",path:"Karting → IndyCar → Le Mans",note:"Multiple IndyCar champion and Indianapolis 500 winner."},
 {year:2000,name:"Tony Kanaan",country:"Brazil",path:"Karting → IndyCar → Le Mans",note:"IndyCar champion and Indianapolis 500 winner."},
 {year:2000,name:"Dan Wheldon",country:"United Kingdom",path:"Karting → IndyCar → Le Mans",note:"Two-time Indianapolis 500 winner and IndyCar champion."},
 {year:2001,name:"Kimi Räikkönen",country:"Finland",path:"Karting → Formula 1 → Le Mans",note:"2007 Formula 1 World Champion and later endurance racer."},
 {year:2001,name:"Fernando Alonso",country:"Spain",path:"Karting → Formula 1 → IndyCar → Le Mans",note:"Two-time Formula 1 World Champion, two-time Le Mans winner and Indianapolis 500 competitor."},
 {year:2001,name:"Felipe Massa",country:"Brazil",path:"Karting → Formula 1 → Le Mans",note:"Formula 1 Grand Prix winner who later raced at Le Mans."},
 {year:2002,name:"Mark Webber",country:"Australia",path:"Karting → Formula 1 → Le Mans",note:"Formula 1 Grand Prix winner and two-time World Endurance champion."},
 {year:2003,name:"Max Chilton",country:"United Kingdom",path:"Karting → Formula 1 → IndyCar → Le Mans",note:"Formula 1 driver and later IndyCar and endurance racer."},
 {year:2004,name:"Sébastien Bourdais",country:"France",path:"Karting → IndyCar → Formula 1 → Le Mans",note:"Four-time Champ Car champion, Formula 1 driver and Le Mans podium finisher."},
 {year:2004,name:"Anthony Davidson",country:"United Kingdom",path:"Karting → Formula 1 → Le Mans",note:"Formula 1 driver and World Endurance champion."},
 {year:2005,name:"Robert Kubica",country:"Poland",path:"Karting → Formula 1 → Le Mans",note:"Formula 1 Grand Prix winner who later competed in endurance racing."},
 {year:2005,name:"Kamui Kobayashi",country:"Japan",path:"Karting → Formula 1 → Le Mans",note:"Formula 1 driver, Super Formula competitor and 2021 Le Mans winner."},
 {year:2006,name:"Nico Rosberg",country:"Germany",path:"Karting → Formula 1",note:"2016 Formula 1 World Champion."},
 {year:2007,name:"Lewis Hamilton",country:"United Kingdom",path:"Karting → Formula 1",note:"Seven-time Formula 1 World Champion and the first McLaren junior to progress from karting to F1."},
 {year:2008,name:"Sebastian Vettel",country:"Germany",path:"Karting → Formula 1",note:"Four-time Formula 1 World Champion."},
 {year:2009,name:"Sébastien Buemi",country:"Switzerland",path:"Karting → Formula 1 → Le Mans",note:"Formula 1 driver and multiple Le Mans winner."},
 {year:2010,name:"Brendon Hartley",country:"New Zealand",path:"Karting → Formula 1 → Le Mans",note:"Formula 1 driver and multiple Le Mans / World Endurance champion."},
 {year:2011,name:"Will Power",country:"Australia",path:"Karting → IndyCar",note:"IndyCar champion and Indianapolis 500 winner."},
 {year:2014,name:"Valtteri Bottas",country:"Finland",path:"Karting → Formula 1",note:"Formula 1 Grand Prix winner who progressed through European single-seaters after karting."},
 {year:2015,name:"Stoffel Vandoorne",country:"Belgium",path:"Karting → Formula 1 → Le Mans",note:"Formula 1 driver and World Endurance competitor."},
 {year:2016,name:"Esteban Ocon",country:"France",path:"Karting → Formula 1 → Le Mans",note:"Formula 1 Grand Prix winner and international endurance competitor."},
 {year:2017,name:"Charles Leclerc",country:"Monaco",path:"Karting → Formula 1 → Le Mans",note:"Formula 1 Grand Prix winner whose international career began in karting."},
 {year:2017,name:"Pierre Gasly",country:"France",path:"Karting → Formula 1 → Le Mans",note:"Formula 1 Grand Prix winner and karting graduate."},
 {year:2018,name:"Lando Norris",country:"United Kingdom",path:"Karting → Formula 1 → Le Mans",note:"FIA Karting champion and Formula 1 World Champion."},
 {year:2019,name:"George Russell",country:"United Kingdom",path:"Karting → Formula 1",note:"Formula 1 Grand Prix winner and Mercedes driver."},
 {year:2020,name:"Alex Palou",country:"Spain",path:"Karting → IndyCar → Le Mans",note:"Multiple IndyCar champion and international endurance competitor."},
 {year:2021,name:"Max Verstappen",country:"Netherlands",path:"Karting → Formula 1 → Le Mans",note:"Four-time Formula 1 World Champion and former CIK-FIA KZ World Champion."},
 {year:2022,name:"Oscar Piastri",country:"Australia",path:"Karting → Formula 1",note:"Formula 1 race winner and one of the leading modern graduates from karting."},
 {year:2023,name:"Colton Herta",country:"USA",path:"Karting → IndyCar → Le Mans",note:"IndyCar race winner who progressed through karting and junior single-seaters."},
 {year:2024,name:"Kyle Larson",country:"USA",path:"Karting → NASCAR → IndyCar → Le Mans",note:"A cross-discipline champion who has competed at the Indianapolis 500 and in endurance racing."}
];

const additionalHall=[{name:"Martin Hines",country:"United Kingdom",year:1983,path:"Karting → Superkart / Formula E",note:"Three-time Karting World Champion in the Superkart / Formula E era, with further European and British titles."},
{name:"Alain Prost",country:"France",year:1973,path:"Karting → Formula 1",note:"Won the French Junior Karting Championship before progressing into single-seaters and becoming a four-time Formula 1 World Champion."},
{name:"Ayrton Senna",country:"Brazil",year:1978,path:"Karting → Formula 1",note:"Won Brazilian and South American karting championships before progressing to Formula Ford and Formula 1."},
{name:"Michael Schumacher",country:"Germany",year:1980,path:"Karting → Formula 1 → Le Mans",note:"Won the German Junior Karting Championship in 1980 and later became a seven-time Formula 1 World Champion."},
{name:"Jarno Trulli",country:"Italy",year:1989,path:"Karting → Formula 1 → Le Mans",note:"Won the Italian and European karting championships before reaching Formula 1."},
{name:"Fernando Alonso",country:"Spain",year:1996,path:"Karting → Formula 1 → IndyCar → Le Mans",note:"Won the Spanish and World Karting Championships in 1996, launching a career that reached Formula 1, IndyCar and Le Mans."},
{name:"Jenson Button",country:"United Kingdom",year:1991,path:"Karting → Formula 1 → Le Mans",note:"Won the British Cadet Kart Championship before progressing through European single-seaters to the 2009 Formula 1 World Championship."},
{name:"Lewis Hamilton",country:"United Kingdom",year:2000,path:"Karting → Formula 1",note:"Won the Super One British Formula A Championship and Formula A European Championship in 2000 before reaching Formula 1."},
{name:"Sebastian Vettel",country:"Germany",year:2001,path:"Karting → Formula 1",note:"Won the ICA Junior European Championship in 2001 before progressing through single-seaters to become a four-time Formula 1 World Champion."},
{name:"Kimi Räikkönen",country:"Finland",year:1995,path:"Karting → Formula 1 → Le Mans",note:"Won Finnish karting championships before progressing rapidly through Formula Renault and Formula 1."},
{name:"Max Verstappen",country:"Netherlands",year:2013,path:"Karting → Formula 1 → Le Mans",note:"Won the CIK-FIA KZ World Championship in 2013 before progressing directly through junior single-seaters to Formula 1."},
{name:"Lando Norris",country:"United Kingdom",year:2014,path:"Karting → Formula 1 → Le Mans",note:"Won the CIK-FIA World Karting Championship in 2014 before progressing through the junior formula ladder to Formula 1."},
{name:"Charles Leclerc",country:"Monaco",year:2011,path:"Karting → Formula 1 → Le Mans",note:"Won the WSK Euro Series in 2011 and built a successful international karting career before reaching Formula 1."},
{name:"George Russell",country:"United Kingdom",year:2011,path:"Karting → Formula 1",note:"Won the CIK-FIA European KF3 Championship in 2011 before progressing through single-seaters to Formula 1."},
{name:"Oscar Piastri",country:"Australia",year:2016,path:"Karting → Formula 1",note:"Won the Australian Karting Championship in 2016 before progressing through European junior single-seaters to Formula 1."},
{name:"Valtteri Bottas",country:"Finland",year:2006,path:"Karting → Formula 1",note:"Won multiple Finnish karting titles before progressing through Formula Renault and GP3 to Formula 1."},
{name:"Nico Rosberg",country:"Germany",year:1996,path:"Karting → Formula 1",note:"Won the French National Karting Championship before progressing through Formula BMW and becoming the 2016 Formula 1 World Champion."},
{name:"Daniel Ricciardo",country:"Australia",year:2005,path:"Karting → Formula 1",note:"Won Australian karting titles before moving to Europe and progressing to Formula 1."},
{name:"Mark Webber",country:"Australia",year:1990,path:"Karting → Formula 1 → Le Mans",note:"Won Australian karting championships before progressing through European single-seaters to Formula 1 and endurance racing."},
{name:"Nico Hülkenberg",country:"Germany",year:2002,path:"Karting → Formula 1 → Le Mans",note:"Won the German Junior Kart Championship before progressing to Formula 1 and winning the 24 Hours of Le Mans."},
{name:"Robert Kubica",country:"Poland",year:1998,path:"Karting → Formula 1 → Le Mans",note:"Won multiple Polish karting championships before progressing through Italian karting and junior single-seaters."},
{name:"Felipe Massa",country:"Brazil",year:1999,path:"Karting → Formula 1 → Le Mans",note:"Won Brazilian karting championships before moving into European single-seaters and Formula 1."},
{name:"Rubens Barrichello",country:"Brazil",year:1986,path:"Karting → Formula 1 → IndyCar → Le Mans",note:"Won Brazilian karting championships before progressing through European junior formulae to Formula 1."},
{name:"Juan Pablo Montoya",country:"Colombia",year:1989,path:"Karting → IndyCar → Formula 1 → Le Mans",note:"Won Colombian and international karting titles before becoming an IndyCar, Formula 1 and endurance winner."},
{name:"Dario Franchitti",country:"United Kingdom",year:1984,path:"Karting → IndyCar → Le Mans",note:"Won Scottish karting championships before becoming a four-time IndyCar champion and Indianapolis 500 winner."},
{name:"Scott Dixon",country:"New Zealand",year:1994,path:"Karting → IndyCar → Le Mans",note:"Won New Zealand karting championships before moving to North America and becoming a multiple IndyCar champion."},
{name:"Will Power",country:"Australia",year:1997,path:"Karting → IndyCar",note:"Won Australian karting championships before moving to Europe and North America and becoming an IndyCar champion."},
{name:"Gary Paffett",country:"United Kingdom",year:1995,path:"Karting → Formula 3 → DTM → Formula 1 testing → Formula E",note:"Won the British Junior TKM Championship in 1995, repeated the title in 1996, then progressed through single-seaters to become a two-time DTM champion and later a Formula E driver."},
{name:"Roberto Ravaglia",country:"Italy",year:1979,path:"Karting → Touring Cars → Le Mans",note:"Won Italian karting championships before becoming a three-time Le Mans winner and DTM champion."},
{name:"Klaus Ludwig",country:"Germany",year:1970,path:"Karting → Touring Cars → Le Mans",note:"Won German karting championships before becoming a three-time Le Mans winner and three-time DTM champion."},
{name:"Bernd Schneider",country:"Germany",year:1980,path:"Karting → Formula 1 → Touring Cars → Le Mans",note:"Won German karting titles before progressing to Formula 1 and becoming a five-time DTM champion."},
{name:"Mattias Ekström",country:"Sweden",year:1990,path:"Karting → Touring Cars → Le Mans",note:"Won Swedish karting championships before becoming a three-time DTM champion and international endurance winner."},
{name:"René Rast",country:"Germany",year:2000,path:"Karting → Touring Cars → Le Mans",note:"Won German and international karting titles before becoming a three-time DTM champion and multiple endurance winner."},
{name:"Paul di Resta",country:"United Kingdom",year:1999,path:"Karting → Formula 1 → Touring Cars → Le Mans",note:"Won the British Super One Kart Championship before becoming a DTM champion and Formula 1 driver."},
{name:"Andy Priaulx",country:"United Kingdom",year:1987,path:"Karting → Touring Cars → Le Mans",note:"Won British karting titles before becoming a three-time World Touring Car champion and Le Mans class winner."},
{name:"Yvan Muller",country:"France",year:1981,path:"Karting → Touring Cars → Le Mans",note:"Won French karting championships before becoming a four-time World Touring Car champion."},
{name:"Gabriele Tarquini",country:"Italy",year:1984,path:"Karting → Formula 1 → Touring Cars → Le Mans",note:"Won the CIK-FIA Formula C World Championship in 1984 before progressing to Formula 1 and becoming a World Touring Car champion."},
{name:"Fabrizio Giovanardi",country:"Italy",year:1986,path:"Karting → Touring Cars → Le Mans",note:"Won the CIK-FIA Formula C World Championship in 1986 before becoming a multiple touring-car champion."},
{name:"Alessandro Piccini",country:"Italy",year:1987,path:"Karting → Touring Cars → Le Mans",note:"Won the CIK-FIA Formula C World Championship and became one of the defining gearbox karting drivers of his era."},
{name:"Davide Forè",country:"Italy",year:1998,path:"Karting → Touring Cars",note:"Won the CIK-FIA Formula Super A World Championship in 1998 and built one of the most decorated senior karting careers of his generation."},
{name:"Danilo Rossi",country:"Italy",year:1992,path:"Karting → Touring Cars",note:"Won the CIK-FIA Formula K World Championship in 1992 and became a multiple world karting champion."},
{name:"Jonathan Thonon",country:"Belgium",year:2007,path:"Karting → Touring Cars",note:"Won the CIK-FIA KZ1 World Cup in 2007 and became a multiple international gearbox karting champion."},
{name:"Paolo De Conto",country:"Italy",year:2016,path:"Karting → Touring Cars",note:"Won the CIK-FIA KZ World Championship in 2016 and again in 2017."},
{name:"Jorrit Pex",country:"Netherlands",year:2015,path:"Karting → Touring Cars",note:"Won the CIK-FIA KZ World Championship in 2015 after a highly successful international karting career."},
{name:"Marco Ardigò",country:"Italy",year:2007,path:"Karting → Touring Cars",note:"Won the CIK-FIA KF1 World Championship in 2007 and became one of the most successful senior karting drivers of the modern era."}
];
const portraitOverrides={"Art Ingels":"https://sfcriga.com/images/others/sfcriga_art-ingels-the-inventor-of-the-go-kart_photo07.jpg","Martin Hines":"https://tkart.it/uploads/2025/04/martin-hines-c-tavola-disegno-1-3.jpg","Duffy Livingston":"https://images.squarespace-cdn.com/content/v1/579a8bfd1b631ba3f19fc155/1503408047496-ZS6UM1TIHGV5G6G9OKYR/Snip20170822_27.png","Lou Borelli":"https://www.formula1-dictionary.net/Images/kart_built_by_art_ingles.jpg","Angelo Parrilla":"https://www.kartsportnews.com/wp-content/uploads/2023/04/IMG_3856_2500wide.jpg"}
function useDriverPortrait(name){
 const [portrait,setPortrait]=useState(portraitOverrides[name]||"");
 useEffect(()=>{if(portraitOverrides[name])return; let cancelled=false; const slug=name.trim().replace(/ /g,"_"); fetch("https://en.wikipedia.org/api/rest_v1/page/summary/"+encodeURIComponent(slug)).then(r=>r.ok?r.json():null).then(d=>{if(!cancelled)portraitSetter(d)}).catch(()=>{}); function portraitSetter(d){const src=d?.originalimage?.source||d?.thumbnail?.source;if(src)setPortrait(src)} return()=>{cancelled=true}},[name]);
 return portrait;
}
function DriverPortrait({name}){
 const src=useDriverPortrait(name);
 return src?<img className="hof-driver-photo" src={src} alt={name} loading="lazy"/>:<div className="hof-driver-photo hof-driver-placeholder" aria-label={name+" photograph unavailable"}><span>{name.split(" ").map(x=>x[0]).join("").slice(0,2)}</span></div>;
}
function KartingWorldChampions(){
 return <section>
  <PageTitle kicker="Hall of Fame archive" title="KARTING WORLD CHAMPIONS" text="A dedicated historical record of FIA and CIK-FIA World Champions and internationally recognised karting championship winners across the evolution of karting classes." action={<a className="button" href="#/hall-of-fame">Hall of Fame</a>}/>
  <div className="hof-intro"><div><b>THE WORLD CHAMPIONS ARCHIVE</b><p>Browse championship winners by class and year, from the earliest 100cc World Championship era through Formula K, Formula A, Formula Super A, KF, OK, KZ, junior and other recognised international championships.</p></div></div>
  <WorldChampions/>
 </section>
}
const pioneerProfiles={
"Art Ingels":{title:"The Founding Father",nationality:"United States",period:"1918–1981 · Karting pioneer from 1956",career:"Art Ingels was the Kurtis Kraft race-car builder who created what is widely recognised as the first go-kart in 1956. Working in California, he adapted his engineering experience into a small tubular-frame kart powered by a West Bend two-stroke engine. The machine was tested in the Rose Bowl parking area and became the starting point for organised karting.",achievements:"Built the first go-kart in 1956 · Foundational figure in organised karting · Helped establish the basic kart format that spread internationally",legacy:"Ingels is remembered as the founding father of karting. His 1956 machine provided the practical template from which the sport's chassis, engines, circuits and organised competition developed.",source:"Public historical accounts including Wikipedia and the Go Kart Hall of Fame identify Ingels as the father of karting and date his first kart to 1956."},
"Lou Borelli":{title:"Karting Pioneer",nationality:"United States",period:"1956–1960s",career:"Lou Borelli was one of the earliest builders and organisers in American karting. Working alongside Art Ingels and other early pioneers, he helped turn the first experimental karts into practical racing machines and an organised sport.",achievements:"Co-created early production karts · Co-founded Go-Kart Manufacturing Company · Early organiser and promoter of kart racing",legacy:"Borelli's engineering and organisational contribution helped establish the commercial and competitive foundations of karting in California during the sport's formative years.",source:"Historical karting accounts and the Go Kart Hall of Fame recognise Borelli as an important early pioneer associated with Art Ingels and the first generation of American karting."},

"Duffy Livingston":{title:"Pioneer of Karting",nationality:"United States",period:"1956–1960s",career:"Duffy Livingston was one of the central pioneers of early American karting. After seeing Art Ingels' first kart at Pomona in 1956, Livingston built his own machines and began developing the idea into a practical racing and manufacturing business.",achievements:"Co-founder of Go-Kart Manufacturing Company · Co-founder of the early Go-Kart Club of America · Built and promoted early competition · Built the first purpose-built kart raceway at Irwindale",legacy:"Livingston helped turn the first experimental karts into a recognised sport. With Roy Desbrow and Bill Rowles he manufactured karts commercially, helped establish organised racing and was instrumental in the creation of the first purpose-built kart track.",source:"World Karting Association Hall of Fame inductee (1983). Vroomkart describes Livingston as a key figure in the birth of karting and documents his later designs including the Flexible Flyer, Glove and Mole."},
"Roy Desbrow":{title:"Founding Pioneer",nationality:"United States",period:"1956–1960s",career:"Roy Desbrow was one of the earliest people to turn the new kart concept into a practical machine and commercial enterprise. He was Duffy Livingston's business partner at GP Mufflers and became a founding figure in Go-Kart Manufacturing.",achievements:"Co-founder of Go-Kart Manufacturing Company · Built one of the earliest karts after seeing Ingels' machine · Partnered with Livingston in early kart manufacturing and organised racing",legacy:"Desbrow's fabrication skills and partnership with Livingston helped move karting from a handful of homemade machines into commercial production and organised competition. Their early work at Rose Bowl and later development of Go-Kart Raceway were foundational to the sport.",source:"Early karting histories record Desbrow as one of the first builders and co-founders of Go-Kart Manufacturing with Duffy Livingston and Bill Rowles."}
,"Angelo Parrilla":{title:"Karting Pioneer",nationality:"Italy",period:"1970s–2023",career:"Angelo Parrilla, together with his brother Achille, founded DAP in 1970. DAP first produced kart engines and from 1974 also developed its own chassis, becoming one of the defining Italian karting manufacturers of the 1970s and 1980s.",achievements:"Co-founder of DAP · DAP engine and chassis development · Helped establish DAP as an international karting force · Identified and supported Ayrton Senna's move into European international karting",legacy:"Parrilla combined engineering, commercial judgement and sporting vision. He recognised Ayrton Senna's talent and helped bring him to Europe, while DAP machinery became associated with major international karting successes.",source:"FIA Karting, TKART and Vroomkart historical accounts document DAP's founding by Angelo and Achille Parrilla and Angelo's role in bringing Senna into European international karting."}};
const specialProfiles={
"Martin Hines":{title:"Mr Karting",birth:"22 April 1948",death:"28 August 2011",nationality:"United Kingdom",karting:"Three-time Karting World Champion (1983, 1991, 1992); five-time European champion; six-time British champion.",legacy:"Founder and driving force behind Zip Kart with his father Mark Hines. He pioneered 250cc Formula E/Superkart and played a major role in developing British karting and taking karting internationally.",proteges:"David Coulthard, Lewis Hamilton, Anthony Davidson, Jason Plato, Gary Paffett and Jamie Green were among the drivers associated with Hines as protégés.",career:"Hines began racing in karting as a teenager and became one of the sport's most influential figures as both a driver and manufacturer. Through Zip Kart he helped develop the 250cc Formula E category and won its inaugural World Championship in 1983. He returned to win the World Championship again in 1991 and 1992.",titles:"World Champion: 1983, 1991, 1992 · European Champion: 1969, 1977, 1986, 1993, 2002 · British Champion: 1976, 1978, 1984, 1985, 1986, 1987",source:"Autosport and Motor Sport Magazine describe Hines as 'Mr Karting' and document his three World titles, Zip Kart legacy and influence on generations of drivers."},
"Art Ingels":{title:"Father of Karting",birth:"14 May 1918",death:"16 December 1981",nationality:"United States",karting:"Pioneer rather than championship driver; Hall of Fame recognition is based on his foundational contribution to karting.",legacy:"Built the first go-kart in 1956 while working at Kurtis Kraft, using a tubular frame, scrap material and a surplus West Bend two-stroke engine.",career:"John Arthur Ingels was a race-car builder at Kurtis Kraft in California. In 1956 he assembled what is widely recognised as the first go-kart in his two-car garage. The kart was tested in the Rose Bowl parking lot and helped spark the organised sport that became modern karting.",titles:"Foundational pioneer · Co-creator of the first kart",source:"Wikipedia identifies Ingels as the father of karting and dates the first kart to 1956; the Go Kart Hall of Fame also recognises Art Ingels and Lou Borelli as pioneers who created the first go-kart."}
};
function getCountryFlag(country){const codes={"United Kingdom":"gb","USA":"us","United States":"us","Brazil":"br","France":"fr","Germany":"de","Italy":"it","Spain":"es","Finland":"fi","Netherlands":"nl","Monaco":"mc","Australia":"au","Canada":"ca","Colombia":"co","New Zealand":"nz","Belgium":"be","Switzerland":"ch","Sweden":"se","Austria":"at","Japan":"jp","Poland":"pl","Denmark":"dk","Venezuela":"ve","Mexico":"mx"};return codes[country]||""}
function PioneerProfile({name}){ const key=decodeURIComponent(name); const p=pioneerProfiles[key]; const portrait=useDriverPortrait(key); if(!p)return <section><PageTitle kicker="Hall of Fame" title="PROFILE NOT FOUND" text="This pioneer profile could not be found." action={<a className="button" href="#/hall-of-fame">Back to Hall of Fame</a>}/></section>; return <section><PageTitle kicker="KartGrid Hall of Fame · Pioneers" title={p.title} text={key==="Duffy Livingston"?"The story of Duffy Livingston and his role in turning the go-kart into a sport.":"The story of Roy Desbrow and his role in the earliest development and manufacture of karting."} action={<a className="button" href="#/hall-of-fame">← Hall of Fame</a>}/><div className="driver-profile-hero">{portrait?<img src={portrait} alt={key} className="driver-profile-photo"/>:<div className="driver-profile-photo hof-driver-placeholder"><span>{key.split(" ").map(x=>x[0]).join("").slice(0,2)}</span></div>}<div className="driver-profile-summary"><div className="meta">PIONEER</div><h2>{key}</h2><div className="driver-profile-country-row"><p className="driver-profile-country">{p.nationality} · {p.period}</p><span className="driver-profile-flag">{getCountryFlag(p.nationality)&&<img src={"https://flagcdn.com/w160/"+getCountryFlag(p.nationality)+".png"} alt={p.nationality+" flag"}/>}</span></div><div className="driver-badges"><span>Founding Pioneer</span><span>Early Karting</span></div></div></div><div className="profile-three-col"><div className="panel"><div className="meta">BIOGRAPHY</div><h3>{p.title}</h3><p>{p.career}</p></div><div className="panel"><div className="meta">ACHIEVEMENTS</div><h3>Founding contribution</h3><p>{p.achievements}</p></div><div className="panel"><div className="meta">LEGACY</div><h3>Impact on karting</h3><p>{p.legacy}</p></div></div><div className="panel driver-career"><div className="meta">HISTORICAL SOURCES</div><h3>Archive notes</h3><p>{p.source}</p></div></section> }
function SpecialHallProfile({name}){ const key=decodeURIComponent(name); const special=specialProfiles[key]; const portrait=useDriverPortrait(key); if(!special)return <section><PageTitle kicker="Hall of Fame" title="PROFILE NOT FOUND" text="This profile could not be found." action={<a className="button" href="#/hall-of-fame">Back to Hall of Fame</a>}/></section>; return <section><PageTitle kicker="KartGrid Hall of Fame" title={special.title} text={key==="Martin Hines"?"The life, career and legacy of the man known throughout karting as Mr Karting.":"The life and legacy of Art Ingels, widely recognised as the founding father of karting."} action={<a className="button" href="#/hall-of-fame">← Hall of Fame</a>}/><div className="driver-profile-hero">{portrait?<img src={portrait} alt={key} className="driver-profile-photo"/>:<div className="driver-profile-photo hof-driver-placeholder"><span>{key.split(" ").map(x=>x[0]).join("").slice(0,2)}</span></div>}<div className="driver-profile-summary"><div className="meta">{key==="Martin Hines"?"MR KARTING":"THE FOUNDING FATHER"}</div><h2>{key}</h2><p className="driver-profile-country">{special.nationality}{special.birth?" · "+special.birth:""}{special.death?" – "+special.death:""}</p><div className="driver-badges"><span>Hall of Fame</span><span>{key==="Martin Hines"?"Superkart":"Karting Pioneer"}</span></div></div></div><div className="profile-three-col special-profile-grid"><div className="panel"><div className="meta">BIOGRAPHY</div><h3>{special.title}</h3><p>{special.career}</p></div><div className="panel"><div className="meta">ACHIEVEMENTS</div><h3>Record</h3><p>{special.titles}</p><p>{special.karting}</p></div><div className="panel"><div className="meta">LEGACY</div><h3>Contribution to karting</h3><p>{special.legacy}</p><p>{special.proteges||"His influence extended far beyond competition and helped shape the sport for future generations."}</p></div></div><div className="panel driver-career"><div className="meta">KARTGRID ARCHIVE</div><h3>Historical profile</h3><p>{special.source}</p></div></section> }

function HallOfFameProfile({name}){
 const driver=[...hallOfFame,...additionalHall].find(d=>d.name===decodeURIComponent(name));
 const [wiki,setWiki]=useState(null); const [bio,setBio]=useState(""); const [editOpen,setEditOpen]=useState(false);
 useEffect(()=>{if(!driver?.name)return;let cancelled=false; const slug=driver.name.replace(/ /g,"_"); Promise.all([
 fetch("https://en.wikipedia.org/api/rest_v1/page/summary/"+encodeURIComponent(slug)).then(r=>r.ok?r.json():null).catch(()=>null),
 fetch("https://en.wikipedia.org/w/api.php?action=query&prop=extracts|info&explaintext=1&exsectionformat=plain&inprop=url&redirects=1&titles="+encodeURIComponent(driver.name)+"&format=json&origin=*").then(r=>r.ok?r.json():null).catch(()=>null)
 ]).then(([summary,full])=>{if(cancelled)return;setWiki(summary);const pages=full?.query?.pages||{};const page=Object.values(pages)[0];if(page?.extract)setBio(page.extract)});return()=>{cancelled=true}},[driver?.name]);
 const portrait=wiki?.originalimage?.source||wiki?.thumbnail?.source||"";
 if(!driver)return <section><PageTitle kicker="Hall of Fame" title="DRIVER NOT FOUND" text="This Hall of Fame profile could not be found." action={<a className="button" href="#/hall-of-fame">Back to Hall of Fame</a>}/></section>;
 const special=specialProfiles[driver.name]; const disciplines=["Formula 1","IndyCar","Le Mans","Touring Cars","DTM","Formula E","WEC","Superkart"].filter(x=>driver.path.includes(x));
 const pathway=driver.path.split("→").map(x=>x.trim());
 const initials=driver.name.split(" ").map(x=>x[0]).join("").slice(0,2);
 return <section>
  <PageTitle kicker="KartGrid Hall of Fame" title={driver.name} text="A comprehensive, standardised profile covering the driver's karting foundation, championship achievements, professional career and legacy." action={<a className="button" href="#/hall-of-fame">← Hall of Fame</a>}/>
  <div className="driver-profile-hero">
   {portrait?<img src={portrait} alt={driver.name} className="driver-profile-photo"/>:<div className="driver-profile-photo hof-driver-placeholder"><span>{initials}</span></div>}
   <div className="driver-profile-summary"><div className="meta">HALL OF FAME ENTRY · {driver.year}</div><div className="driver-profile-title-row"><div><h2>{driver.name}</h2><div className="driver-profile-country-row"><p className="driver-profile-country">{special?.nationality||driver.country}</p><span className="driver-profile-flag">{getCountryFlag(special?.nationality||driver.country)&&<img src={"https://flagcdn.com/w160/"+getCountryFlag(special?.nationality||driver.country)+".png"} alt={(special?.nationality||driver.country)+" flag"} />}</span></div></div></div>{wiki?.description&&<p className="driver-wiki-role">{wiki.description}</p>}<div className="driver-badges">{disciplines.map(x=><span key={x}>{x}</span>)}</div></div>
  </div>
  <div className="profile-kpi-grid"><div className="panel"><div className="meta">QUALIFYING KARTING YEAR</div><strong className="profile-kpi">{driver.year}</strong><p>{driver.note}</p></div><div className="panel"><div className="meta">CAREER PATHWAY</div><strong className="profile-kpi-small">{pathway.join(" → ")}</strong><p className="muted">The major disciplines represented in this profile are shown above.</p></div><div className="panel"><div className="meta">PROFILE STATUS</div><strong className="profile-kpi-small">Open to claim</strong><p className="muted">Drivers, teams and authorised representatives can contribute verified corrections and additions.</p></div></div>
  <div className="profile-three-col">
   <div className="panel"><div className="meta">KARTING FOUNDATION</div><h3>Qualifying achievement</h3><p>{driver.note}</p><p className="muted">The Hall of Fame entry year is based on the national or international karting championship achievement used to qualify the driver.</p></div>
   <div className="panel"><div className="meta">CHAMPIONSHIP DISCIPLINES</div><h3>International success</h3>{disciplines.length?<ul className="profile-list">{disciplines.map(x=><li key={x}>{x}</li>)}</ul>:<p className="muted">Additional championship categories are being verified.</p>}</div>
   <div className="panel"><div className="meta">CAREER TIMELINE</div><h3>From karting onward</h3><div className="career-timeline">{pathway.map((step,i)=><div className="career-step" key={step}><span>{i+1}</span><b>{step}</b></div>)}</div></div>
  </div>
  {special&&<div className="profile-three-col special-profile-grid"><div className="panel"><div className="meta">CAREER & CONTRIBUTION</div><h3>{special.title}</h3><p>{special.career}</p></div><div className="panel"><div className="meta">MAJOR TITLES / ACHIEVEMENTS</div><h3>Record</h3><p>{special.titles}</p><p>{special.karting}</p></div><div className="panel"><div className="meta">LEGACY</div><h3>Impact on karting</h3><p>{special.legacy}</p><p>{special.proteges||""}</p></div></div>}
  <div className="panel driver-biography"><div className="meta">BIOGRAPHY & CAREER RECORD</div><h3>Detailed career history</h3>{bio?<div className="driver-bio-text">{bio.split(/\n+/).filter(x=>x.trim()).slice(0,80).map((p,i)=><p key={i}>{p}</p>)}</div>:<p className="muted">Loading the available public biography...</p>}</div>
  <div className="profile-three-col">
   <div className="panel"><div className="meta">CHAMPIONSHIP RECORD</div><h3>Titles and milestones</h3><p>{driver.note}</p><p className="muted">Verified championship seasons, titles, race wins and team records will be added to this structured section as the archive is expanded.</p></div>
   <div className="panel"><div className="meta">SOURCES</div><h3>Public references</h3><p>Profile information is assembled from the KartGrid archive and public reference material. Wikipedia is used as an editable biographical source where available.</p>{wiki?.content_urls?.desktop?.page&&<a className="link" href={wiki.content_urls.desktop.page} target="_blank" rel="noopener noreferrer">Open Wikipedia biography ↗</a>}</div>
   <div className="panel"><div className="meta">CLAIM THIS PROFILE</div><h3>Know the driver?</h3><p>Claiming a profile will allow the authorised driver, representative, team or family to request corrections, add verified achievements and improve the historical record.</p><button className="button" onClick={()=>setEditOpen(!editOpen)}>{editOpen?"Close request":"Claim / suggest an edit"}</button>{editOpen&&<div className="claim-form"><input placeholder="Name"/><input placeholder="Email or contact method"/><textarea placeholder="What would you like corrected or added?"></textarea><button className="button">Submit for review</button></div>}</div>
  </div>
  <div className="panel driver-career"><div className="meta">KARTGRID ARCHIVE NOTE</div><h3>Built to be corrected and expanded</h3><p>This is a living historical profile. KartGrid will retain the standard structure while allowing verified people and knowledgeable contributors to add missing championship results, teams, manufacturers, statistics, photographs and career milestones.</p></div>
 </section>
}

const qualificationLabels={
"Alain Prost":"Formula 1 World Champion","Ayrton Senna":"Formula 1 World Champion","Nelson Piquet":"Formula 1 World Champion","Michael Schumacher":"Formula 1 World Champion","Mika Häkkinen":"Formula 1 World Champion","Jenson Button":"Formula 1 World Champion","Kimi Räikkönen":"Formula 1 World Champion","Fernando Alonso":"Formula 1 World Champion","Nico Rosberg":"Formula 1 World Champion","Lewis Hamilton":"Formula 1 World Champion","Sebastian Vettel":"Formula 1 World Champion","Max Verstappen":"Formula 1 World Champion","Jacques Villeneuve":"Formula 1 World Champion",
"Mario Andretti":"IndyCar Champion","Emerson Fittipaldi":"Formula 1 World Champion","Dario Franchitti":"IndyCar Series Champion","Scott Dixon":"IndyCar Series Champion","Tony Kanaan":"IndyCar Champion","Dan Wheldon":"IndyCar Champion","Will Power":"IndyCar Series Champion","Juan Pablo Montoya":"CART Champion","Sébastien Bourdais":"Champ Car Champion","Alex Palou":"IndyCar Series Champion",
"Andy Priaulx":"FIA World Touring Car Champion","Yvan Muller":"FIA World Touring Car Champion","Gabriele Tarquini":"FIA World Touring Car Champion","Rob Huff":"FIA World Touring Car Champion","Fabrizio Giovanardi":"CIK-FIA KZ World Champion",
"Gary Paffett":"DTM Champion · 2×","Roberto Ravaglia":"DTM Champion","Mark Webber":"WEC World Champion · 2×","Allan McNish":"WEC World Champion","Anthony Davidson":"WEC World Champion","Brendon Hartley":"WEC World Champion","Nico Hülkenberg":"24 Hours of Le Mans Winner","Tom Kristensen":"24 Hours of Le Mans Winner · 9×","Kamui Kobayashi":"24 Hours of Le Mans Winner","Giancarlo Fisichella":"24 Hours of Le Mans Winner · 3×",
"Jarno Trulli":"CIK-FIA Karting World Champion","Marco Ardigò":"CIK-FIA KF1 World Champion","Davide Forè":"Karting World Champion","Danilo Rossi":"Karting World Champion","Jonathan Thonon":"Karting World Champion","Paolo De Conto":"Karting World Champion","Jorrit Pex":"Karting World Champion","Lando Norris":"CIK-FIA Karting Champion","Max Verstappen":"Formula 1 World Champion",
"Charles Leclerc":"CIK-FIA Karting Champion","Sébastien Buemi":"WEC World Champion","Stoffel Vandoorne":"Formula E World Champion"
};
function qualificationLabel(driver){
 if(qualificationLabels[driver.name]) return qualificationLabels[driver.name];
 const note=(driver.note||"").toLowerCase();
 if(note.includes("world touring car champion")) return "FIA World Touring Car Champion";
 if(note.includes("world endurance champion")) return "WEC World Champion";
 if(note.includes("formula 1 world champion")) return "Formula 1 World Champion";
 if(note.includes("champ car champion")) return "Champ Car Champion";
 if(note.includes("indycar champion")) return "IndyCar Champion";
 if(note.includes("champion")) return "International Championship Winner";
 if(note.includes("24 hours of le mans winner")) return "24 Hours of Le Mans Winner";
 return "International Championship Winner";
}
const HallOfFameFeatured=()=> <div className="hof-featured"><a className="hof-feature-card" href="#/hall-of-fame/driver/Art%20Ingels"><div className="pioneer-banner">PIONEER</div><DriverPortrait name="Art Ingels"/><div className="hof-feature-copy"><div className="meta">FOUNDERS & PIONEERS</div><h2>Art Ingels</h2><strong>THE FOUNDING FATHER</strong><p>Widely recognised as the father of karting and builder of the first go-kart in 1956.</p><span>View profile →</span></div></a><a className="hof-feature-card" href="#/hall-of-fame/driver/Martin%20Hines"><div className="pioneer-banner">PIONEER</div><DriverPortrait name="Martin Hines"/><div className="hof-feature-copy"><div className="meta">HALL OF FAME · SUPERKART</div><h2>Martin Hines</h2><strong>MR KARTING</strong><p>Three-time World Champion, Zip Kart pioneer and one of the most influential figures in the development of modern karting.</p><span>View profile →</span></div></a></div>;
function HallOfFame(){
 const [series,setSeries]=useState("All");
 const filters=["All","Formula 1","IndyCar","Le Mans","Touring Cars","DTM","Formula E","WEC","Superkart"];
 const rows=[...hallOfFame,...additionalHall].filter((d,i,a)=>a.findIndex(x=>x.name===d.name)===i).filter(d=>series==="All"||d.path.includes(series));
 const pioneers=[["Duffy Livingston","Co-founder of Go-Kart Manufacturing and a central figure in the birth of organised kart racing."],["Roy Desbrow","Early kart builder and co-founder of Go-Kart Manufacturing alongside Duffy Livingston."],["Lou Borelli","Early builder and organiser who helped establish commercial and competitive karting."],["Angelo Parrilla","Co-founder of DAP and one of the key figures in the development of modern international karting."]];
 return <section><PageTitle kicker="Karting's pathway to the world stage" title="HALL OF FAME" text="A chronological record of drivers who came through karting and went on to win a World Championship or another internationally recognised championship."/>
 <div className="hof-featured">
  <a className="hof-feature-card" href="#/hall-of-fame/driver/Art%20Ingels"><div className="pioneer-banner">PIONEER</div><DriverPortrait name="Art Ingels"/><div className="hof-feature-copy"><div className="meta">FOUNDERS & PIONEERS</div><h2>Art Ingels</h2><strong>THE FOUNDING FATHER</strong><p>Widely recognised as the father of karting and builder of the first go-kart in 1956.</p><span>View profile →</span></div></a>
  <a className="hof-feature-card" href="#/hall-of-fame/driver/Martin%20Hines"><div className="pioneer-banner">PIONEER</div><DriverPortrait name="Martin Hines"/><div className="hof-feature-copy"><div className="meta">HALL OF FAME · SUPERKART</div><h2>Martin Hines</h2><strong>MR KARTING</strong><p>Three-time World Champion, Zip Kart pioneer and one of the most influential figures in the development of modern karting.</p><span>View profile →</span></div></a>
 </div>
 <div className="hof-pioneer-row">{pioneers.map(([name,desc])=><a className="hof-feature-card" key={name} href={"#/hall-of-fame/pioneer/"+encodeURIComponent(name)}><div className="pioneer-banner">PIONEER</div><DriverPortrait name={name}/><div className="hof-feature-copy"><div className="meta">FOUNDING PIONEER</div><h2>{name}</h2><strong>EARLY KARTING</strong><p>{desc}</p><span>View profile →</span></div></a>)}</div>
 <div className="hof-intro"><div><b>FROM THE GRID TO THE WORLD</b><p>Karting has been the starting point for generations of elite drivers. KartGrid traces the drivers who converted that foundation into recognised championship success at international level.</p></div><div className="hof-stat"><strong>{rows.length}</strong><span>featured drivers</span></div></div>
 <Filters>{filters.map(x=><button key={x} className={"filter-button "+(series===x?"active":"")} onClick={()=>setSeries(x)}>{x}</button>)}</Filters>
 <div className="hof-grid">{rows.sort((a,b)=>a.year-b.year||a.name.localeCompare(b.name)).map(d=><a className="hof-card" key={d.name} href={"#/hall-of-fame/driver/"+encodeURIComponent(d.name)}><div className="hof-card-qualification">{qualificationLabel(d)}</div><DriverPortrait name={d.name}/><div className="hof-year"><span>QUALIFIED</span><strong>{d.year}</strong></div><div className="hof-card-meta"><div className="hof-country">{d.country}</div></div><h3>{d.name}</h3><div className="hof-path">{d.path}</div><p>{d.note}</p><div className="hof-footer"><span>Karting → {d.path.split("→").slice(-1)[0].trim()}</span><b>View profile →</b></div></a>)}</div>
 </section>
}

const worldChampions=[
[1964,"100cc","Guido Sala"],[1965,"100cc","Guido Sala"],[1966,"100cc","Susanna Raganelli"],[1967,"100cc","Edgardo Rossi"],[1968,"100cc","Thomas Nilsson"],[1969,"100cc","François Goldstein"],[1970,"100cc","François Goldstein"],[1971,"100cc","François Goldstein"],[1972,"100cc","François Goldstein"],[1973,"100cc","Terry Fullerton"],[1974,"100cc","Riccardo Patrese"],[1975,"100cc","François Goldstein"],[1976,"100cc","Felice Rovelli"],[1977,"100cc","Felice Rovelli"],[1978,"100cc","Lake Speed"],[1979,"100cc","Peter Koene"],[1980,"100cc","Peter de Bruijn"],[1981,"Formula K","Mike Wilson"],[1982,"Formula K","Mike Wilson"],[1983,"Formula K","Mike Wilson"],[1984,"Formula K","Jörn Haase"],[1985,"Formula K","Mike Wilson"],[1986,"Formula K","Augusto Ribas"],[1987,"Formula K","Giampiero Simoni"],[1988,"Formula K","Mike Wilson"],[1989,"Formula K","Mike Wilson"],[1990,"Formula A","Jan Magnussen"],[1991,"Formula K","Jarno Trulli"],[1992,"Formula K","Danilo Rossi"],[1993,"Formula Super A","Nicola Gianniberti"],[1994,"Formula Super A","Alessandro Manetti"],[1995,"Formula Super A","Massimiliano Orsini"],[1996,"Formula Super A","Johnny Mislijevic"],[1997,"Formula Super A","Danilo Rossi"],[1998,"Formula Super A","Davide Forè"],[1999,"Formula Super A","Danilo Rossi"],[2000,"Formula Super A","Davide Forè"],[2001,"Formula Super A","Vitantonio Liuzzi"],[2002,"Formula Super A","Giedo van der Garde"],[2003,"Formula A","Wade Cunningham"],[2004,"Formula A","Davide Forè"],[2005,"Formula A","Oliver Oakes"],[2006,"Formula A","Davide Forè"],[2007,"KF1","Marco Ardigò"],[2008,"KF1","Marco Ardigò"],[2009,"KF1","Arnaud Kozlinski"],[2010,"KF2","Nyck de Vries"],[2011,"KF1","Nyck de Vries"],[2012,"KF1","Flavio Camponeschi"],[2013,"KF","Tom Joyner"],[2014,"KF","Lando Norris"],[2015,"KF","Karol Basz"],[2016,"OK","Pedro Hiltbrand"],[2017,"OK","Danny Keirle"],[2018,"OK","Lorenzo Travisanutto"],[2019,"OK","Lorenzo Travisanutto"],[2020,"OK","Callum Bradshaw"],[2021,"OK","Tuukka Taponen"],[2022,"OK","Matheus Morgatto"],[2023,"OK","Kirill Kutskov"],[2024,"OK","Ethan Jeff-Hall"],[2025,"OK","Thibaut Ramaekers"],
[1988,"FS100","Emmanuel Collard"],[1989,"FS100","Gert Munkholm"],[1990,"FA","Danilo Rossi"],[1991,"FA","Alessandro Manetti"],[1992,"FA","Nicola Gianniberti"],[1993,"FA","David Terrien"],[1994,"FA","Marco Barindelli"],[1995,"FA","Gastão Fráguas"],[1996,"FA","Jean-Christophe Ravier"],[1997,"FA","James Courtney"],[1998,"FA","Ruben Carrapatoso"],[1999,"FA","Franck Perera"],[2000,"FA","Colin Brown"],
[2010,"U18","Jake Dennis"],[2011,"U18","Matthew Graham"],[2012,"U18","Henry Easthope"],[2013,"KF-Junior","Alessio Lorandi"],[2014,"KF-Junior","Enaam Ahmed"],[2015,"KF-Junior","Logan Sargeant"],[2016,"OK-Junior","Victor Martins"],[2017,"OK-Junior","Dexter Patterson"],[2018,"OK-Junior","Victor Bernier"],[2019,"OK-Junior","Thomas ten Brinke"],[2020,"OK-Junior","Freddie Slater"],[2021,"OK-Junior","Kean Nakamura-Berta"],[2022,"OK-Junior","Enzo Tarnvanichkul"],[2023,"OK-Junior","Dries Van Langendonck"],[2024,"OK-Junior","Kenzo Craigie"],[2025,"OK-Junior","Noah Baglin"],
[1983,"Formula C","Gianni Mazzola"],[1984,"Formula C","Gabriele Tarquini"],[1985,"Formula C","Piermario Cantoni"],[1986,"Formula C","Fabrizio Giovanardi"],[1987,"Formula C","Alessandro Piccini"],[1988,"Formula C","Peter Rydell"],[1989,"Formula C","Gianluca Giorgi"],[1990,"Formula C","Alessandro Piccini"],[1991,"Formula C","Alessandro Piccini"],[1992,"Formula C","Danilo Rossi"],[1993,"Formula C","Alessandro Piccini"],[1994,"Formula C","Jarno Trulli"],[1995,"Formula C","Gianluca Beggio"],[1996,"Formula C","Gianluca Beggio"],[1997,"Formula C","Gianluca Beggio"],[1998,"Formula C","Gianluca Beggio"],[1999,"Formula C","Francesco Laudato"],[2000,"Formula C","Gianluca Beggio"],[2013,"KZ","Max Verstappen"],[2014,"KZ","Marco Ardigò"],[2015,"KZ","Jorrit Pex"],[2016,"KZ","Paolo De Conto"],[2017,"KZ","Paolo De Conto"],[2018,"KZ","Patrik Hájek"],[2019,"KZ","Marijn Kremers"],[2020,"KZ","Jérémy Iglesias"],[2021,"KZ","Noah Milell"],[2022,"KZ","Viktor Gustavsson"],[2023,"KZ","Paolo Ippolito"],[2024,"KZ","Giuseppe Palomba"],[2025,"KZ","Senna van Walstijn"],
[1983,"Superkart","Martin Hines"],[1984,"Superkart","Lennart Bohlin"],[1985,"Superkart","Poul Petersen"],[1986,"Superkart","Wade Nelson"],[1987,"Superkart","Éric Gassin"],[1988,"Superkart","Poul Petersen"],[1989,"Superkart","Tim Parrott"],[1990,"Superkart","Tim Parrott"],[1991,"Superkart","Martin Hines"],[1992,"Superkart","Martin Hines"],[1993,"Superkart","Perry Grondstra"],[1994,"Superkart","Perry Grondstra"],[1995,"Superkart","Trevor Roberts"],
[1968,"Junior World Cup","Amedeo Pacitto"],[1969,"Junior World Cup","D. Carlsson"],[1970,"Junior World Cup","Alan Lane"],[1992,"Five Continents Cup","Bruno Balocco"],[1993,"Five Continents Cup","Ennio Gandolfi"],[1994,"Five Continents Cup","Giorgio Pantano"],[1995,"Five Continents Cup","James Courtney"],[1996,"Five Continents Cup","Fernando Alonso"],[2007,"KF1 World Cup","Marco Ardigò"],[2008,"KF1 World Cup","Davide Forè"],[2009,"KF1 World Cup","Yannick de Brabander"],[2010,"KF1 World Cup","Oliver Rowland"],[2007,"KF2 World Cup","Michael Ryall"],[2008,"KF2 World Cup","Oliver Rowland"],[2009,"KF2 World Cup","David da Luz"],[2011,"KF2 World Cup","Loris Spinelli"],[2012,"KF2 World Cup","Felice Tiene"],[2009,"KF3 World Cup","Giuliano Maria Niceta"],[2010,"KF3 World Cup","Alexander Albon"],[2011,"KF3 World Cup","Charles Leclerc"],[2012,"KF3 World Cup","Luca Corberi"],[2003,"S-ICC World Cup","Robert Dirks"],[2004,"S-ICC World Cup","Ennio Gandolfi"],[2005,"S-ICC World Cup","Francesco Laudato"],[2006,"S-ICC World Cup","Davide Forè"],[2007,"KZ1 World Cup","Jonathan Thonon"],[2008,"KZ1 World Cup","Jonathan Thonon"],[2009,"KZ1 World Cup","Jonathan Thonon"],[2010,"KZ1 World Cup","Bas Lammers"],[2011,"KZ1 World Cup","Jonathan Thonon"],[2012,"KZ1 World Cup","Bas Lammers"],[2022,"KZ2 World Cup","Arthur Carbonnel"],[2023,"KZ2 World Cup","Niels Tröger"],[2024,"KZ2 World Cup","Cristian Bertuca"],[2024,"OK-N World Cup","Kyuho Lee"],[2025,"OK-N World Cup","Manuel Scognamiglio"],[2025,"OKN-J World Cup","Gioele Girardello"],
[1968,"Junior World Cup","Amedeo Pacitto"],[1969,"Junior World Cup","D. Carlsson"],[1970,"Junior World Cup","Alan Lane"],[1971,"Junior World Cup","Marc Wouters"],[1972,"Junior World Cup","Derek Bliss"],[1973,"Junior World Cup","Alain Prost"],[1974,"Junior World Cup","Felice Rovelli"],[1975,"Junior World Cup","Adrian Wepfer"],[1976,"Junior World Cup","Andrea de Cesaris"],[1977,"Junior World Cup","Paolo Bandinelli"],[1978,"Junior World Cup","Stefano Modena"],[1979,"Junior World Cup","Thomas Glauser"],[1980,"Junior World Cup","Bernd Schneider"],[1981,"Junior World Cup","Michel Vacirca"],[1982,"Junior World Cup","Romeo Deila"],[1983,"Junior World Cup","Frank van Eglem"],[1984,"Junior World Cup","Andrea Gilardi"],[1985,"Junior World Cup","Andrea Gilardi"],[1986,"Junior World Cup","Fabrizio de Simone"],[1987,"Junior World Cup","Jan Magnussen"],[1988,"Junior World Cup","Gianluca Malandrucco"],[1989,"Junior World Cup","Jan Magnussen"],[1990,"Junior World Cup","Jérémie Dufour"],[1991,"Junior World Cup","Sébastien Philippe"],
[1992,"Five Continents Cup","Bruno Balocco"],[1993,"Five Continents Cup","Ennio Gandolfi"],[1994,"Five Continents Cup","Giorgio Pantano"],[1995,"Five Continents Cup","James Courtney"],[1996,"Five Continents Cup","Fernando Alonso"],
[2009,"KF3 World Cup","Giuliano Maria Niceta"],[2010,"KF3 World Cup","Alexander Albon"],[2011,"KF3 World Cup","Charles Leclerc"],[2012,"KF3 World Cup","Luca Corberi"],
[2013,"KZ2 International Super Cup","Dorian Boccolacci"],[2014,"KZ2 International Super Cup","Ryan Van Der Burgt"],[2015,"KZ2 International Super Cup","Thomas Laurent"],[2016,"KZ2 International Super Cup","Pedro Hiltbrand"],[2017,"KZ2 International Super Cup","Alex Irlando"],[2018,"KZ2 International Super Cup","Matteo Viganò"],[2019,"KZ2 International Super Cup","Émilien Denner"],[2020,"KZ2 International Super Cup","Simone Cunati"],[2021,"KZ2 International Super Cup","Lorenzo Travisanutto"]
].map(([year,cat,name])=>({year,cat,name,country:""}));
function WorldChampions(){
 const [cat,setCat]=useState("All");
 const cats=["All",...new Set(worldChampions.map(x=>x.cat))];
 const rows=worldChampions.filter(x=>cat==="All"||x.cat===cat);
 return <div className="world-champions"><div className="champ-filters">{cats.map(x=><button key={x} className={"filter-button "+(cat===x?"active":"")} onClick={()=>setCat(x)}>{x}</button>)}</div><div className="champ-list">{rows.sort((a,b)=>b.year-a.year).map((x,i)=><div className="champ-row" key={x.year+"-"+x.cat}><strong>{x.year}</strong><span>{x.cat}</span><b>{x.name}</b><small>{x.country}</small></div>)}</div></div>
}
function ContributePage({kind,id}){
 return <section><PageTitle kicker="Community contribution" title="HELP BUILD KARTGRID" text="The strongest karting database comes from combining verified public data with knowledge from the people who race, work and spend weekends at these venues."/><div className="panel ugc-callout"><span>COMMUNITY POWERED</span><h3>Help improve this profile</h3><p>Useful contributions include track photos, facility information, layout details, classes, championships, official results links, historical notes and factual corrections.</p><p className="muted">Contribution tools are being connected to KartGrid accounts and moderation so additions can be reviewed before becoming part of the public record.</p><a className="button" href={kind==="track"?"#/tracks/"+id:"#/asns/"+id}>Back to profile</a></div></section>
}
function TrackDetail({id}){
 const {data:tracksData,loading}=useRemoteJson("tracks.json",tracksSeed);
 const {data:resultsData}=useRemoteJson("results.json",{records:[]});
 const t=(tracksData.tracks||[]).find(x=>x.id===id);
 if(loading)return <section><PageTitle kicker="Circuit" title="LOADING TRACK" text="Loading circuit data…"/></section>;
 if(!t)return <NotFound/>;
 const linked=(resultsData.records||[]).filter(r=>trackMatchesResult(t,r)).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
 return <section><PageTitle kicker={t.country} title={t.name.toUpperCase()} text={[t.city,t.region,t.country].filter(Boolean).join(", ")} action={<a className="button" href="#/tracks">All tracks</a>}/>
 <div className="track-gallery">{(t.images||[]).length?(t.images||[]).slice(0,5).map((img,i)=><figure className={i===0?"hero-photo":""} key={img.url||i}><img src={img.url} alt={img.alt||t.name} loading="lazy"/><figcaption>{img.credit||"Track image"}{img.license?" · "+img.license:""}</figcaption></figure>):<div className="track-photo-placeholder"><b>Photos wanted</b><span>Help document {t.name}</span></div>}</div><div className="track-detail-grid"><div className="panel"><h3>Track profile</h3><dl className="facts"><div><dt>Country</dt><dd>{t.country}</dd></div><div><dt>Region</dt><dd>{t.region||"—"}</dd></div><div><dt>City</dt><dd>{t.city||"—"}</dd></div><div><dt>Address</dt><dd>{t.address||"Address verification pending"}</dd></div><div><dt>What3Words</dt><dd>{t.what3words?<a href={"https://what3words.com/"+t.what3words} target="_blank" rel="noopener noreferrer">///{t.what3words}</a>:<span className="muted">Not published yet</span>}</dd></div><div><dt>Continent</dt><dd>{t.continent||"—"}</dd></div>{t.motorsportUkLicensed&&<div><dt>Motorsport UK</dt><dd>Licensed kart venue</dd></div>}<div><dt>Type</dt><dd>{t.venueType||"—"}</dd></div><div><dt>Karts</dt><dd>{t.kartType||"—"}</dd></div><div><dt>Track length</dt><dd>{t.trackLengthM?t.trackLengthM+" m":"—"}</dd></div>{t.fiaHomologation&&<><div><dt>FIA licence</dt><dd>{t.fiaHomologation.licence}{t.fiaHomologation.grade?" · Grade "+t.fiaHomologation.grade:""}</dd></div><div><dt>FIA valid until</dt><dd>{t.fiaHomologation.validUntil}</dd></div></>}<div><dt>Championships</dt><dd>{(t.series||[]).join(", ")||"—"}</dd></div></dl>{t.website&&<a className="button primary" href={t.website} target="_blank" rel="noopener noreferrer">Official track website ↗</a>}</div><div className="panel"><h3>KartGrid archive</h3><p>{linked.length?"We currently link "+linked.length+" result record"+(linked.length===1?"":"s")+" to this circuit.":"No indexed results for this circuit yet."}</p><p className="muted">{t.source}</p></div><div className="panel ugc-callout"><span>COMMUNITY POWERED</span><h3>Know this track?</h3><p>Add photos, facilities, layouts, classes, race series, local tips, corrections or historical information.</p><a className="button primary" href={"#/contribute/track/"+t.id}>Add to this track</a></div></div>
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
   const r=await fetch(KARTGRID_API+path,{...opts,headers});
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
     const r=await fetch(KARTGRID_API+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
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

 if(!token)return <section className="driver-account"><PageTitle kicker="Driver Hub" title="YOUR DRIVER ACCOUNT" text="Sign in to manage your racing profile, private video library and AI coaching."/><div className="auth-shell"><div className="auth-copy"><span>KartGrid Driver Hub</span><h2>Your karting career, in one place.</h2><p>Build your driver profile, keep race footage private and use AI coaching to review onboard video.</p><div className="junior-note"><b>Junior-safe by default</b><p>Under-18 profiles are private by default and require a parent or guardian email during registration.</p></div></div><form className="auth-card" onSubmit={submitAuth}><div className="auth-tabs"><button type="button" className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Sign in</button><button type="button" className={mode==="register"?"active":""} onClick={()=>setMode("register")}>Create account</button></div><label>Email<input type="email" required value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})}/></label><label>Password<input type="password" required minLength="10" value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})}/></label>{mode==="register"&&<><label>Birth year<input type="number" min="1900" max={new Date().getFullYear()} value={auth.birthYear} onChange={e=>setAuth({...auth,birthYear:e.target.value})}/></label><label>Parent / guardian email <small>required for under-18s</small><input type="email" value={auth.guardianEmail} onChange={e=>setAuth({...auth,guardianEmail:e.target.value})}/></label></>}<button className="button primary" disabled={busy}>{busy?"Please wait…":mode==="login"?"Sign in":"Create driver account"}</button>{error&&<p className="form-error">{error}</p>}</form></div></section>;

 return <section className="driver-account"><PageTitle kicker="Driver Hub" title="MY DRIVER PROFILE" text="Manage your public racing identity and private AI coaching workspace." action={<button className="button" onClick={logout}>Sign out</button>}/>{error&&<div className="account-alert error">{error}</div>}{message&&<div className="account-alert">{message}</div>}<div className="driver-hub-grid"><form className="profile-editor panel" onSubmit={saveProfile}><h3>Driver profile</h3><label>Display name<input value={profile?.display_name||""} onChange={e=>setProfile({...profile,display_name:e.target.value})}/></label><div className="two-inputs"><label>Race number<input value={profile?.race_number||""} onChange={e=>setProfile({...profile,race_number:e.target.value})}/></label><label>Region<input value={profile?.region||region} onChange={e=>setProfile({...profile,region:e.target.value})}/></label></div><div className="two-inputs"><label>Current class<input value={profile?.class_name||""} onChange={e=>setProfile({...profile,class_name:e.target.value})}/></label><label>Team<input value={profile?.team||""} onChange={e=>setProfile({...profile,team:e.target.value})}/></label></div><label>Nationality<input value={profile?.nationality||""} onChange={e=>setProfile({...profile,nationality:e.target.value})}/></label><label>Driver bio<textarea value={profile?.bio||""} onChange={e=>setProfile({...profile,bio:e.target.value})}/></label>{!profile?.is_minor&&<label className="privacy-toggle"><input type="checkbox" checked={!!profile?.public_profile} onChange={e=>setProfile({...profile,public_profile:e.target.checked})}/> Make my driver profile public</label>}{profile?.is_minor&&<div className="junior-note"><b>Junior account</b><p>Your profile is private by default.</p></div>}<button className="button primary" disabled={busy}>Save profile</button></form><div className="video-coach panel"><div className="video-head"><div><span>AI coaching</span><h3>Onboard Video Lab</h3></div><label className="button primary upload-button">{uploading?"Uploading…":"Upload video"}<input type="file" accept="video/*" onChange={uploadVideo} disabled={uploading}/></label></div><p className="muted">Upload onboard footage privately. KartGrid samples frames from the video and returns coaching on visible line choice, steering smoothness, positioning, traffic awareness and consistency.</p>{videos.length?<div className="video-list">{videos.map(v=><article className="video-item" key={v.id}><div><b>{v.title||v.original_name}</b><small>{new Date(v.created_at).toLocaleString()} · {v.status}</small></div><button className="button" onClick={()=>analyse(v.id)} disabled={busy}>{v.analysis?"Re-analyse":"Analyse with AI"}</button>{v.analysis&&<div className="coaching-result"><b>AI coaching</b><p>{v.analysis.summary||JSON.stringify(v.analysis)}</p></div>}</article>)}</div>:<div className="empty compact"><h3>No onboard videos yet.</h3><p>Your private video library will appear here.</p></div>}</div></div></section>
}
function About(){
 return <section><PageTitle kicker="About KartGrid" title="THE DIGITAL HOME OF KARTING" text="KartGrid is building one global platform for the information, results, tools and communities that make up the sport of karting."/>
 <div className="two-col"><div className="panel"><h3>Why KartGrid exists</h3><p>Karting information is fragmented. Results live on timing sites, circuit information is scattered across club pages, drivers build profiles on social media, news comes from multiple publications and technical knowledge is often buried in forums and paddock conversations.</p><p>KartGrid brings those pieces together so a newcomer, driver, parent, team, circuit, manufacturer or fan can start in one place and move naturally through the sport.</p></div><div className="panel"><h3>What connects the platform</h3><p>Circuits connect to results. Results connect to drivers. Drivers connect to classes, teams and championships. Manufacturers connect to products and dealers. News and knowledge provide context around all of it.</p><p>That connected data model is what allows KartGrid to become more useful than a collection of separate directories.</p></div></div>
 <SectionHead eyebrow="Driver technology" title="From race data to better driving" copy="KartGrid is developing AI-assisted, data-driven coaching around the information drivers already create when they race."/>
 <div className="two-col"><div className="panel"><h3>AI video analysis</h3><p>Drivers can upload onboard footage privately and use AI-assisted analysis to review visible line choice, steering smoothness, positioning, traffic awareness and consistency.</p></div><div className="panel"><h3>Data-driven coaching</h3><p>The longer-term coaching layer combines race results, session history, performance trends and available driving data to help drivers understand where they are improving and where more work may be needed.</p></div></div>
 <SectionHead eyebrow="The network" title="Built for the whole paddock" copy="KartGrid is designed to serve every level of the sport, from a first rental session to international competition."/>
 <div className="ad-products"><div className="panel"><h3>Drivers & parents</h3><p>Profiles, race history, results, development tracking and private coaching tools.</p></div><div className="panel"><h3>Circuits & championships</h3><p>Discoverability, event history, official information and connections into results.</p></div><div className="panel"><h3>Brands & businesses</h3><p>Manufacturer profiles, dealer discovery, marketplace visibility and targeted advertising.</p></div><div className="panel"><h3>Fans & newcomers</h3><p>News, classes, track discovery, practical guides and a clearer route into karting.</p></div></div>
 </section>
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
 else if(parts[0]==="hall-of-fame"&&parts[1]==="karting-world-champions") page=<KartingWorldChampions/>;
 else if(parts[0]==="hall-of-fame"&&parts[1]==="pioneer"&&parts[2]) page=<PioneerProfile name={parts.slice(2).join("/")}/>;
 else if(parts[0]==="hall-of-fame"&&parts[1]==="driver"&&parts[2]) page=<HallOfFameProfile name={parts.slice(2).join("/")}/>;
 else if(parts[0]==="hall-of-fame") page=<HallOfFame/>;
 else if(parts[0]==="fia"&&parts[1]==="cik") page=<CIKProfile/>;
 else if(parts[0]==="fia") page=<FIAProfile/>;
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
 else if(parts[0]==="results"&&parts[1]==="tsl"&&parts[2]&&parts[3]==="event"&&parts[4]&&parts[5]==="session"&&parts[6]) page=<TSLResultsSession slug={parts[2]} eventId={parts[4]} sessionId={parts[6]}/>;
 else if(parts[0]==="results"&&parts[1]==="tsl"&&parts[2]&&parts[3]==="event"&&parts[4]) page=<TSLResultsEvent slug={parts[2]} eventId={parts[4]}/>;
 else if(parts[0]==="results"&&parts[1]==="tsl"&&parts[2]) page=<TSLResultsSeries slug={parts[2]}/>;
 else if(parts[0]==="results") page=<ResultsPage/>;
 else if(parts[0]==="asns"&&parts[1]) page=<AsnDetail id={parts[1]}/>;
 else if(parts[0]==="asns") page=<AsnsPage/>;
 else if(parts[0]==="contribute"&&parts[1]&&parts[2]) page=<ContributePage kind={parts[1]} id={parts[2]}/>;
 else if(parts[0]==="tracks"&&parts[1]) page=<TrackDetail id={parts[1]}/>;
 else if(parts[0]==="tracks") page=<TracksPage/>;
 else if(parts[0]==="community"&&parts[1]==="new") page=<NewPost {...{region,posts,setPosts}}/>;
 else if(parts[0]==="community") page=<Community {...{region,posts,setPosts}}/>;
 else if(parts[0]==="knowledge-base") page=<KnowledgeBase region={region}/>;
 else if(parts[0]==="advertise") page=<Advertise/>;
 else if(parts[0]==="about") page=<About/>;
 else if(parts[0]==="profile") page=<DriverAccount region={region}/>;
 else page=<NotFound/>;
 return <><Top region={region} setRegion={setRegion}/><main>{page}</main><footer className="site-footer"><div className="footer-grid"><div className="footer-column"><h3>KartGrid</h3><a href="#/">Home</a><a href="#/about">About Us</a></div><div className="footer-column"><h3>Main Menu</h3><a href="#/">Home</a><a href="#/news">News</a><a href="#/marketplace">Marketplace</a><a href="#/drivers">Drivers</a><a href="#/classes">Classes</a><a href="#/manufacturers">Manufacturers</a><a href="#/asns">ASNs</a><a href="#/results">Results</a><a href="#/hall-of-fame">Hall of Fame</a><a href="#/hall-of-fame/karting-world-champions">Karting World Champions</a><a href="#/tracks">Tracks</a><a href="#/community">Community</a><a href="#/knowledge-base">Knowledge Base</a></div><div className="footer-column"><h3>Knowledge Base</h3><a href="#/knowledge-base">Karting Knowledge Base</a><a href="#/classes">Karting Classes</a><a href="#/tracks">Track Directory</a><a href="#/asns">National Authorities</a><a href="#/results">Results Archive</a><a href="#/hall-of-fame">Hall of Fame</a></div><div className="footer-column"><h3>Connect with us</h3><a href="#/community">Community</a><a href="#/profile">Driver Hub</a><a href="#/advertise">Advertise</a><a href="#/about">About KartGrid</a></div></div><div className="footer-bottom"><p>The world of karting, local to you.</p></div></footer></>
}
createRoot(document.getElementById("root")).render(<App/>);