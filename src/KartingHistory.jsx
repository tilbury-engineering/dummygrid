import React from "react";

const stages=[
  ["1956","The first go-kart","In California, race-car fabricator Art Ingels assembled an early motorised kart using a small two-stroke engine. His design helped launch modern karting."],
  ["Late 1950s","Karting becomes a sport","Clubs, manufacturers and organised races followed the original machines, as karting developed from an experimental pastime into accessible motorsport."],
  ["1960s–1970s","International growth","Dedicated circuits, national federations, manufacturers and organised competitions helped karting expand across Europe and around the world."],
  ["1980s–1990s","A pathway to motorsport","Racing developed through specialised classes, new chassis and engines. Many future professional drivers learned racecraft in karting."],
  ["2000s–today","Modern world karting","Today the sport includes junior and senior classes, sprint and gearbox competition, rental racing, national championships and FIA-governed international events."]
];
export default function KartingHistory(){
  return <section className="karting-history">
    <div className="pagetitle"><div><span>KartGrid Legacy</span><h1>HISTORY OF KARTING</h1><p>Explore the people, machines and competitions behind the sport. This is an introductory timeline to the growing historical archive.</p></div></div>
    <div className="history-timeline">{stages.map(([year,title,body])=><article className="panel history-entry" key={year}><strong>{year}</strong><div><h2>{title}</h2><p>{body}</p></div></article>)}</div>
    <div className="sectionhead"><div><span>Explore the pioneers</span><h2>The people who shaped karting</h2><p>Read the historical profiles and achievements of the sport's influential figures.</p></div></div>
    <div className="member-hub-grid">
      <a className="panel member-hub-card" href="#/hall-of-fame/pioneer/Art%20Ingels"><h3>Art Ingels</h3><p>Pioneer of the original go-kart.</p><b>View profile →</b></a>
      <a className="panel member-hub-card" href="#/hall-of-fame/driver/Martin%20Hines"><h3>Martin Hines</h3><p>World champion and British karting pioneer.</p><b>View profile →</b></a>
      <a className="panel member-hub-card" href="#/hall-of-fame/pioneer/Angelo%20Parrilla"><h3>Angelo Parrilla</h3><p>Co-founder of the DAP karting marque.</p><b>View profile →</b></a>
    </div>
    <a className="button" href="#/hall-of-fame">Explore Hall of Fame</a>
  </section>;
}
