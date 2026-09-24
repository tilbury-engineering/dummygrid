#!/usr/bin/env python3
import json,re
from pathlib import Path
SOURCE="https://www.fiakarting.com/sites/default/files/2026-05/Homologations_circuits_Liste_WEB_1.pdf"
ROWS=[["Speedworld",1120,"1179","13.05.2029","2B"],["Karting des Fagnes",1366,"1135","19.03.2027",""],["Karting Genk",1360,"1177","12.02.2029","1A"],["Bahrain International Kart Circuit",1415,"1156","26.11.2027",""],["Beijing WIN International Karting Circuit",1166,"1176","05.05.2029","1A"],["Guangzhou Conghua International Circuit",1156,"1146","15.07.2027",""],["National Karting Circuit",834,"1126","28.09.2026",""],["SIC Kart Land",1234,"1127","28.09.2026",""],["Tianjin Racing Galaxy Karting Circuit",1101,"1147","15.07.2027",""],["Zhuzhou International Karting Circuit",1047,"1123","23.08.2026",""],["Funarena Cheb",1202,"1180","05.05.2029","1A"],["Steelkart Racing Trinec",1223,"1178","09.04.2029","1A"],["Rodby Karting Ring",1245,"1173","19.11.2028","1A"],["Aspar Circuit",1457,"1153","24.10.2027",""],["Circuito Fernando Alonso",1390,"1141","24.05.2027",""],["Circuito Internacional de Zuera",1699,"1174","30.01.2029","1A"],["Kartcenter Campillos",1580,"1129","27.02.2027",""],["Kartodromo Internacional Lucas Guerrero",1428,"1091","03.03.2027",""],["Motorland Aragon",1671,"1122","13.06.2026",""],["Circuit Anthoine Hubert",1198,"1163","21.02.2028","1A"],["Karting Circuit Paul Ricard",964,"1137","08.04.2027",""],["Le Mans Karting International",1384,"1128","18.03.2027",""],["Larkhall Circuit",1125,"1133","18.03.2027",""],["PF International Kart Circuit",1382,"1149","29.08.2027",""],["Erftlandring Kerpen",1107,"1155","24.10.2027",""],["Motorsportarena Mülsen",1315,"1139","15.04.2027",""],["Pro Kart Raceland",1190,"1125","28.08.2026",""],["Zimmerman Karting Ampfing",1063,"1169","16.07.2028","2A"],["Circuit 27",1398,"1181","27.05.2029","1A"],["Birizdokart",1070,"1171","21.08.2028","2C"],["Madras International Karting Arena",1172,"1167","07.04.2028","1C"],["Circuito del Sele",1345,"1154","24.10.2027",""],["Circuito Internazionale 7 Laghi",1256,"1168","16.07.2028","1A"],["Circuito Internazionale Napoli",1670,"1144","25.06.2027",""],["Circuito Internazionale Triscina",1250,"1138","09.04.2027",""],["Cremona International Karting",1210,"1166","18.03.2028","1A"],["Franciacorta Karting Track",1301,"1142","16.06.2027",""],["Kartodromo Val Vibrata",1286,"1170","29.07.2028","1A"],["Kartrodromo Pista Azzurra",1045,"1143","16.06.2027",""],["Leopard Circuit Viterbo",1294,"1165","06.03.2028","1A"],["Pista Salentina",1164,"1380","19.02.2028","1A"],["South Garda Karting",1200,"1162","18.02.2028","1A"],["World Circuit La Conca",1250,"1131","18.03.2027",""],["BF International Moto-Arena",1504,"1134","19.03.2027",""],["Circuit of Macao - Coloane",1203,"1161","25.11.2027",""],["LYL International Karting Circuit",1514,"1172","02.10.2028","1C"],["Tor Poznan",1124,"1124","23.08.2026",""],["Slovak Karting Center",1172,"1139","30.04.2027",""],["Asum Ring",1221,"1148","30.07.2027",""],["LihPao International Karting Circuit",1353,"1132","18.03.2027",""],["Al Ain Raceway",1381,"1159","31.10.2027",""],["Al Forsan International Sport Resort",1228,"1160","21.11.2027",""],["Dubai Kartodrome",1204,"1152","25.09.2027",""]]
ALIASES={"PF International Kart Circuit":["Paul Fletcher International","PFI"],"Steelkart Racing Trinec":["Steel Ring"],"Cremona International Karting":["Cremona Circuit"],"Kartrodromo Pista Azzurra":["Pista Azzurra"],"Leopard Circuit Viterbo":["Leopard Circuit Viterbo","Viterbo"]}
def norm(s): return re.sub(r"[^a-z0-9]+"," ",(s or "").lower()).strip()
def match(track,name):
 vals=[track.get("name","")]+track.get("aliases",[])
 targets=[name]+ALIASES.get(name,[])
 return any(norm(v)==norm(x) or (len(norm(x))>8 and (norm(x) in norm(v) or norm(v) in norm(x))) for v in vals for x in targets if v and x)
data=json.loads(Path("public/tracks.json").read_text(encoding="utf-8")); tracks=data.get("tracks",[])
matched=0; missing=[]
for name,length,licence,valid,grade in ROWS:
 hit=next((t for t in tracks if match(t,name)),None)
 if not hit: missing.append(name); continue
 hit["trackLengthM"]=length
 hit["fiaHomologation"]={"licence":licence,"validUntil":valid,"grade":grade,"source":SOURCE}
 matched+=1
data["fiaHomologationImport"]={"source":SOURCE,"listed":len(ROWS),"matched":matched,"unmatched":missing}
Path("public/tracks.json").write_text(json.dumps(data,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
print("FIA homologated circuits",len(ROWS),"matched",matched,"unmatched",len(missing))
if missing: print("unmatched:",", ".join(missing))
