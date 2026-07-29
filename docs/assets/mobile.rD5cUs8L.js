import"./component-CJXWo0aW.js";import{o as e,s as t,t as n}from"./main-DpZqbASS.js";import{Dt as r,Qt as i,Yt as a,bt as o,on as s}from"./lazy-4bkzMmJY.js";var c=new e;c.begin(),t();var l=new n,u={1:`assets/foot-s.png`,2:`assets/tennis-s.png`,3:`assets/basket-s.png`,4:`assets/golf-s.png`,5:`assets/volley-s.png`,6:`assets/multisport-s.png`},d={};function f(e){let t=u[e.get(`sport`)]??`assets/multisport-s.png`;return d[t]||(d[t]=new i({image:new a({src:t,scale:1.2})})),d[t]}l.isReady().then(()=>{c.end();let e=l.context.mapManager.getMap(),t=new r({source:new s({url:`data/sports.geojson`,format:new o({dataProjection:`EPSG:2056`,featureProjection:`EPSG:2056`})}),style:f,zIndex:100});e.addLayer(t);let n=document.getElementById(`w2p-popup`),i=document.getElementById(`w2p-popup-content`),a=document.getElementById(`w2p-popup-close`);if(n&&i){let r=()=>{n.style.display=`none`};a?.addEventListener(`click`,r),e.on(`singleclick`,a=>{let o=e.forEachFeatureAtPixel(a.pixel,e=>e,{layerFilter:e=>e===t});if(o){let t=o.getProperties();i.innerHTML=`
          <div class="w2p-sport-badge">
            <img src="${u[t.sport]??`assets/multisport-s.png`}" alt="${t.sport_txt}" width="24" height="24" />
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
        `;let r=e.getTargetElement().getBoundingClientRect();n.style.left=`${r.left+a.pixel[0]}px`,n.style.top=`${r.top+a.pixel[1]}px`,n.style.display=`block`}else r()})}});
//# sourceMappingURL=mobile.rD5cUs8L.js.map