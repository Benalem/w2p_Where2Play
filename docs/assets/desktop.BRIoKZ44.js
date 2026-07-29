import{An as e,Mn as t}from"./component-CJXWo0aW.js";import{a as n,c as r,n as i,o as a,s as o}from"./main-DpZqbASS.js";import{Dt as s,Qt as c,Yt as l,bt as u,on as d}from"./lazy-4bkzMmJY.js";import"./main-iRc_H0H_.js";var f=class extends e{templateUrl=null;styleUrls=null;template=()=>t`<style>
.my-first-component{border:1px solid #000;padding:.4rem 1rem}h1{margin:0;font-size:1rem}span{display:block}
</style>
<style>${this.customStyle}</style>
<div class="my-first-component"><h1>My First Component</h1><span>East: ${this.east}</span> <span>North: ${this.north}</span></div>
${this.htmlUnsafe(this.feedbackTemplateHtml??``)}`;east=``;north=``;constructor(){super(`my-first-component`)}registerEvents(){this.context.stateManager.subscribe(`mouseCoordinates`,(e,t)=>this.onChangeCoordinates(t))}onChangeCoordinates(e){this.east=e[0].toLocaleString(),this.north=e[1].toLocaleString(),super.render()}connectedCallback(){super.render(),super.girafeTranslate(),this.registerEvents()}},p=class extends n{templateUrl=null;styleUrls=null;template=()=>t`
<style>${this.customStyle}</style>
<div id="panel"><div><h1>MY EXTENDED TEMPLATE</h1><img class="logo" alt="geogirafe-logo" src="images/logo/horizontal_black.svg"><p><span i18n="Version">Version</span> : ${this.version}<br><span i18n="Build">Build</span> : ${this.build}<br><span i18n="Date">Date</span> : ${this.date}<p><span i18n="Source">Source</span> : <a href="https://gitlab.com/geogirafe/gg-viewer" i18n="GitLab" rel="noopener" target="_blank">GitLab</a></div></div>
${this.htmlUnsafe(this.feedbackTemplateHtml??``)}`;async loadVersionInfos(){this.version=`My-Extended-Version 1.0`,this.build=`My-Extended-Build 2.5`,this.date=new Date().toISOString(),this.render()}};if(navigator.userAgent.includes(`iPhone`)||navigator.userAgent.includes(`Android`)){let e=document.querySelector(`meta[name=redirect-url]`)?.getAttribute(`content`);e&&r(e)}var m=new a;m.begin(),o();var h=new i,g={1:`assets/foot-s.png`,2:`assets/tennis-s.png`,3:`assets/basket-s.png`,4:`assets/golf-s.png`,5:`assets/volley-s.png`,6:`assets/multisport-s.png`},_={};function v(e){let t=g[e.get(`sport`)]??`assets/multisport-s.png`;return _[t]||(_[t]=new c({image:new l({src:t,scale:1})})),_[t]}h.isReady().then(()=>{customElements.define(`my-first-component`,f),customElements.define(`my-extended-component`,p),m.end();try{h.context.onBoardingManager.start()}catch{}let e=h.context.mapManager.getMap(),t=new s({source:new d({url:`data/sports.geojson`,format:new u({dataProjection:`EPSG:2056`,featureProjection:`EPSG:2056`})}),style:v,zIndex:100});e.addLayer(t);let n=document.getElementById(`w2p-popup`),r=document.getElementById(`w2p-popup-content`),i=document.getElementById(`w2p-popup-close`);if(n&&r){let a=()=>{n.style.display=`none`};i?.addEventListener(`click`,a),e.on(`singleclick`,i=>{let o=e.forEachFeatureAtPixel(i.pixel,e=>e,{layerFilter:e=>e===t});if(o){let t=o.getProperties();r.innerHTML=`
          <div class="w2p-sport-badge">
            <img src="${g[t.sport]??`assets/multisport-s.png`}" alt="${t.sport_txt}" width="24" height="24" />
            <span>${t.sport_txt??`Terrain`}</span>
          </div>
          <table class="w2p-table">
            <tr><th>Revêtement</th><td>${t.revetement_txt||`—`}</td></tr>
            <tr><th>État</th><td>${t.etat_txt||`—`}</td></tr>
            <tr><th>Accès</th><td>${t.est_publique_txt||`—`}</td></tr>
            ${t.remarque?`<tr><th>Remarque</th><td>${t.remarque}</td></tr>`:``}
            ${t.date_modification?`<tr><th>Mis à jour</th><td>${t.date_modification}</td></tr>`:``}
          </table>
          ${t.g_url?`<a class="w2p-gmaps" href="${t.g_url}" target="_blank" rel="noopener">📍 Google Maps</a>`:``}
        `;let a=e.getTargetElement().getBoundingClientRect();n.style.left=`${a.left+i.pixel[0]}px`,n.style.top=`${a.top+i.pixel[1]}px`,n.style.display=`block`}else a()}),e.on(`pointermove`,n=>{let r=e.hasFeatureAtPixel(n.pixel,{layerFilter:e=>e===t});e.getTargetElement().style.cursor=r?`pointer`:``})}});
//# sourceMappingURL=desktop.BRIoKZ44.js.map