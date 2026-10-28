import React, {useState} from "react";

export default function KartGridNavigation({region,setRegion,regions}) {
  const [mobileOpen,setMobileOpen]=useState(false);
  const [dropdown,setDropdown]=useState("");
  const close=()=>{setDropdown("");setMobileOpen(false)};
  const toggle=name=>setDropdown(old=>old===name?"":name);
  const link=(href,label)=><a href={href} onClick={close}>{label}</a>;
  const menu=(name,label,entries,extra="")=><div className={"nav-dropdown "+extra}>
    <button className="nav-dropdown-toggle" type="button" aria-haspopup="true" aria-expanded={dropdown===name}
      onClick={()=>toggle(name)}>{label}<span className="nav-chevron" aria-hidden="true">⌄</span></button>
    {dropdown===name&&<div className="nav-dropdown-menu">{entries.map(([href,text])=><React.Fragment key={href}>{link(href,text)}</React.Fragment>)}</div>}
  </div>;
  return <>
    <header className="site-header"><div className="masthead">
      <nav className={"main-nav "+(mobileOpen?"open":"")} aria-label="Main navigation">
        <a href="#/" className="home-nav-icon" aria-label="Home" title="Home" onClick={close}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5z"/></svg></a>
        {link("#/news","News")}
        {link("#/results","Results")}
        {menu("directory","Directory",[["#/tracks","Tracks"],["#/manufacturers","Manufacturers"],["#/asns","National Authorities (ASNs)"],["#/drivers","Drivers"],["#/classes","Karting Classes"]])}
        {menu("market","Marketplace",[["#/marketplace","Buy & Sell"],["#/shop","Merchandise"]])}
        {link("#/community","Community")}
        {menu("legacy","Legacy",[["#/history-of-karting","History of Karting"],["#/hall-of-fame/pioneer/Art%20Ingels","Art Ingels"],["#/hall-of-fame/driver/Martin%20Hines","Martin Hines"],["#/hall-of-fame/pioneer/Angelo%20Parrilla","Angelo Parrilla"],["#/hall-of-fame","Hall of Fame"]])}
      </nav>
      <div className="header-actions">
        <select aria-label="Choose region" value={region} onChange={e=>setRegion(e.target.value)}>{regions.map(r=><option key={r}>{r}</option>)}</select>
        {menu("account","My KartGrid",[["#/account","Account & Sign In"],["#/profile","Driver Hub"],["#/team-hub","Team Hub"],["#/coach","AI Coach"]],"account-menu")}
        <button className="menu-toggle" type="button" aria-label="Toggle menu" aria-expanded={mobileOpen} onClick={()=>setMobileOpen(v=>!v)}><span></span><span></span><span></span></button>
      </div>
    </div></header>
    <div className="subnav"><div><b>LIVE</b><span>Karting news · Results · Circuits · Drivers · Teams</span><a href="#/knowledge-base">Knowledge Base</a><a href="#/advertise">Advertise</a></div></div>
  </>;
}
