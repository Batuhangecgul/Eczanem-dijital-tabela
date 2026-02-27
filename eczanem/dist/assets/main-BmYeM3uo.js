(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function a(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerPolicy&&(o.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?o.credentials="include":n.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(n){if(n.ep)return;n.ep=!0;const o=a(n);fetch(n.href,o)}})();const I={SLIDESHOW_START:0,SLIDESHOW_END:0,SLIDE_INTERVAL:6e3,PHARMACY_REFRESH:1800*1e3,MODE_CHECK_INTERVAL:60*1e3},$t="eczanem-slides",Mt=1,g="images";let $=null;function H(){return new Promise((t,e)=>{if($)return t($);const a=indexedDB.open($t,Mt);a.onupgradeneeded=s=>{const n=s.target.result;n.objectStoreNames.contains(g)||n.createObjectStore(g,{keyPath:"id",autoIncrement:!0})},a.onsuccess=s=>{$=s.target.result,t($)},a.onerror=s=>{e(new Error("IndexedDB error: "+s.target.error))}})}async function Bt(t){const e=await H();await ct();const a=[];for(const o of t){const i=await o.arrayBuffer();a.push({name:o.name,type:o.type,data:i,size:o.size,addedAt:Date.now()})}const s=e.transaction(g,"readwrite"),n=s.objectStore(g);return a.forEach(o=>n.add(o)),new Promise((o,i)=>{s.oncomplete=()=>o(a.length),s.onerror=c=>i(c.target.error)})}async function Tt(){const s=(await H()).transaction(g,"readonly").objectStore(g).getAll();return new Promise((n,o)=>{s.onsuccess=()=>{const i=s.result.map(c=>({name:c.name,url:URL.createObjectURL(new Blob([c.data],{type:c.type}))}));n(i)},s.onerror=i=>o(i.target.error)})}async function xt(){const s=(await H()).transaction(g,"readonly").objectStore(g).count();return new Promise((n,o)=>{s.onsuccess=()=>n(s.result),s.onerror=i=>o(i.target.error)})}async function ct(){const e=(await H()).transaction(g,"readwrite");return e.objectStore(g).clear(),new Promise((s,n)=>{e.oncomplete=()=>s(),e.onerror=o=>n(o.target.error)})}let h=0,T=null,y=[];async function At(){const t=document.getElementById("slideshow-track"),e=document.getElementById("slideshow-progress"),a=document.getElementById("slide-prev"),s=document.getElementById("slide-next");let n=[];try{n=await Tt(),console.log(`Slideshow: ${n.length} images from IndexedDB`)}catch(i){console.warn("Could not load slides:",i)}if(n.length===0){Ht(t);return}n.forEach((i,c)=>{const r=document.createElement("div");r.className=`slide${c===0?" active":""}`,r.innerHTML=`<img src="${i.url}" alt="${i.name}" />`,t.appendChild(r),y.push(r)}),n.length<=15&&n.forEach((i,c)=>{const r=document.createElement("div");r.className=`progress-dot${c===0?" active":""}`,r.addEventListener("click",()=>j(c)),e.appendChild(r)}),a.addEventListener("click",P),s.addEventListener("click",C);let o=0;t.addEventListener("touchstart",i=>{o=i.touches[0].clientX},{passive:!0}),t.addEventListener("touchend",i=>{const c=i.changedTouches[0].clientX,r=o-c;Math.abs(r)>50&&(r>0?C():P())},{passive:!0}),document.addEventListener("keydown",lt),dt()}function lt(t){var e;(e=document.getElementById("slideshow-container"))!=null&&e.classList.contains("active")&&(t.key==="ArrowLeft"&&P(),t.key==="ArrowRight"&&C())}function j(t){var e,a;t===h||y.length===0||(y[h].classList.remove("active"),(e=document.querySelectorAll(".progress-dot")[h])==null||e.classList.remove("active"),h=t,y[h].classList.add("active"),(a=document.querySelectorAll(".progress-dot")[h])==null||a.classList.add("active"),Ct())}function C(){j((h+1)%y.length)}function P(){j((h-1+y.length)%y.length)}function dt(){mt(),T=setInterval(C,I.SLIDE_INTERVAL)}function mt(){T&&(clearInterval(T),T=null)}function Ct(){dt()}function Ht(t){t.innerHTML=`
    <div class="slideshow-empty">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="m21 15-5-5L5 21"/>
      </svg>
      <h3>Görsel Yüklenmemiş</h3>
      <p>Sağ alttaki <strong>⚙</strong> butonuna tıklayıp vitrin görsellerinizi yükleyin.</p>
    </div>
  `}function Nt(){mt(),document.removeEventListener("keydown",lt),y=[],h=0}const Y="offlinePharmacyData",ut="offlineLocation";function zt(t){const e=t.split(`
`).map(n=>n.trim()).filter(Boolean),a=[],s=/^<([^>]+)><([^>]+)><(\d{2}\.\d{2}\.\d{4})>$/;for(const n of e){const o=n.match(s);if(!o)continue;const i=o[1].trim(),c=o[2].trim(),r=o[3].trim();let l=c,d="";const u=c.lastIndexOf(" . ");u!==-1&&(l=c.substring(0,u).trim(),d=c.substring(u+3).trim());const[f,S,N]=r.split(".").map(Number),v=`${N}-${String(S).padStart(2,"0")}-${String(f).padStart(2,"0")}`;a.push({name:i,address:l,phone:d,date:v})}return a}function Dt(t){const e=zt(t);if(e.length===0)throw new Error("Hiç eczane verisi bulunamadı. Format: <İSİM><ADRES . TEL><GÜN.AY.YIL>");Ot(e);const a=gt(),s=e.filter(n=>n.date===a);return{totalCount:e.length,todayCount:s.length}}function Ot(t){localStorage.setItem(Y,JSON.stringify(t))}function J(){try{const t=localStorage.getItem(Y);return t?JSON.parse(t):[]}catch{return[]}}function Pt(t){localStorage.setItem(ut,JSON.stringify(t))}function W(){try{const t=localStorage.getItem(ut);return t?JSON.parse(t):null}catch{return null}}function Z(){const t=J();if(t.length===0)return[];const e=gt();return t.filter(a=>a.date===e)}function pt(){return J()}function Rt(){return J().length>0}function Kt(){localStorage.removeItem(Y)}function gt(){const t=new Date,e=t.getHours(),a=t.getMinutes();if(e<8||e===8&&a<30){const i=new Date(t);i.setDate(i.getDate()-1);const c=i.getFullYear(),r=String(i.getMonth()+1).padStart(2,"0"),l=String(i.getDate()).padStart(2,"0");return`${c}-${r}-${l}`}const s=t.getFullYear(),n=String(t.getMonth()+1).padStart(2,"0"),o=String(t.getDate()).padStart(2,"0");return`${s}-${n}-${o}`}async function Ft(){const t=W();if(t&&(t.city||t.district))return{lat:t.lat||0,lng:t.lng||0,city:t.city||"",district:t.district||""};if(!navigator.geolocation)throw new Error("Geolocation desteklenmiyor");const e=await new Promise((i,c)=>{navigator.geolocation.getCurrentPosition(i,c,{enableHighAccuracy:!0,timeout:1e4,maximumAge:3e5})}),{latitude:a,longitude:s}=e.coords,{city:n,district:o}=await Gt(a,s);return{lat:a,lng:s,city:n,district:o}}async function Gt(t,e){try{const a=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${t}&lon=${e}&accept-language=tr&zoom=10`,{headers:{"User-Agent":"EczanemApp/1.0"}});if(!a.ok)throw new Error("Geocoding failed");const n=(await a.json()).address||{},o=n.province||n.state||n.city||"",i=n.county||n.town||n.suburb||n.city_district||"";return{city:o,district:i}}catch(a){return console.warn("Reverse geocoding failed:",a),{city:"",district:""}}}function qt(t,e,a,s){const o=M(a-t),i=M(s-e),c=Math.sin(o/2)*Math.sin(o/2)+Math.cos(M(t))*Math.cos(M(a))*Math.sin(i/2)*Math.sin(i/2);return 6371*(2*Math.atan2(Math.sqrt(c),Math.sqrt(1-c)))}function M(t){return t*(Math.PI/180)}function ht(t){return t<1?`${Math.round(t*1e3)} m`:`${t.toFixed(1)} km`}let k={date:null,data:null};async function Vt(t,e){var s;const a=new Date().toISOString().split("T")[0];if(Rt()){const n=Z();return console.log(`Using ${n.length} offline pharmacies`),n}if(k.date===a&&k.data)return console.log("Using cached pharmacy data"),k.data;try{const n=new URLSearchParams({city:t,district:e}),o=await fetch(`/api/pharmacies?${n}`);if(!o.ok)throw new Error(`HTTP ${o.status}`);const i=await o.json();if(i.status==="success"&&((s=i.pharmacies)==null?void 0:s.length)>0)return k={date:a,data:i.pharmacies},console.log(`Scraped ${i.pharmacies.length} pharmacies from eczaneler.gen.tr`),i.pharmacies;throw new Error("No pharmacies found")}catch(n){console.warn("Scraper failed:",n.message),console.warn("Using demo data");const o=_t(t,e);return k={date:a,data:o},o}}function _t(t,e){return[{name:"Hayat Eczanesi",address:"Cumhuriyet Mah. Gazi Osman Paşa Blv. No:42",phone:"0356 212 34 56",city:t||"Tokat",district:e||"Merkez",lat:40.3142,lng:36.5535},{name:"Sağlık Eczanesi",address:"Bahçelievler Mah. İstiklal Cad. No:18/A",phone:"0356 214 78 90",city:t||"Tokat",district:e||"Merkez",lat:40.3168,lng:36.5562},{name:"Güneş Eczanesi",address:"Yeni Mah. Turhal Cad. No:7",phone:"0356 213 45 67",city:t||"Tokat",district:e||"Merkez",lat:40.3195,lng:36.5508},{name:"Anadolu Eczanesi",address:"Kızılay Mah. 19 Mayıs Sok. No:31/B",phone:"0356 215 67 89",city:t||"Tokat",district:e||"Merkez",lat:40.312,lng:36.558},{name:"Merkez Eczanesi",address:"Sulusokak Mah. Sivas Cad. No:15",phone:"0356 216 78 90",city:t||"Tokat",district:e||"Merkez",lat:40.3185,lng:36.562}]}let m=null,x=null,E=null,A=null,X=!1;async function Ut(){document.getElementById("retry-btn").addEventListener("click",()=>R()),await R(),ee()}async function R(){const t=document.getElementById("pharmacy-loading"),e=document.getElementById("pharmacy-error"),a=document.getElementById("location-info");t.style.display="flex",e.style.display="none";try{a.textContent="Konum belirleniyor...";const s=await Ft();a.textContent=`📍 ${s.district}, ${s.city}`;const n=await Vt(s.city,s.district);console.log(`Got ${n.length} pharmacies for ${s.district}, ${s.city}`);const i=(await Wt(n,s)).map(c=>({...c,distance:qt(s.lat,s.lng,c.lat,c.lng)})).sort((c,r)=>c.distance-r.distance);t.style.display="none",X?vt(i,s):(Et(),Zt(s,i)),Xt(i);try{localStorage.setItem("currentPharmacies",JSON.stringify(i)),localStorage.setItem("currentLocation",JSON.stringify(s))}catch{}}catch(s){console.error("Load pharmacies error:",s),t.style.display="none",Qt(s.message||"Nöbetçi eczaneler yüklenirken bir hata oluştu.")}}const yt="geocodeCache";function jt(){try{return JSON.parse(localStorage.getItem(yt)||"{}")}catch{return{}}}function Yt(t){try{localStorage.setItem(yt,JSON.stringify(t))}catch{}}async function Jt(t,e,a,s,n,o){const i=jt(),c=`${t}|${e}`;if(i[c])return i[c];const r=e.match(/(\S+)\s+MAH\.?/i),l=r?r[1].trim():"",d=e.match(/([\wğüşıöçĞÜŞİÖÇ\s]+?)\s*(CAD|SOK|SOKAK|BULV|BULVAR)\.?/i),u=d?`${d[1].trim()} ${d[2]}`:"",f=e.match(/NO[:\s]*(\d+)/i),S=f?`No ${f[1]}`:"",N=n&&o?`&viewbox=${o-.1},${n+.1},${o+.1},${n-.1}&bounded=1`:"",v=[];u&&S&&v.push(`q=${encodeURIComponent(`${u} ${S} ${a}`)}`),u&&v.push(`q=${encodeURIComponent(`${u} ${a}`)}`),l&&v.push(`q=${encodeURIComponent(`${l} Mahallesi ${a}`)}`);for(const Q of v){try{const z=`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=tr&${Q}${N}`,tt=await fetch(z,{headers:{"Accept-Language":"tr"}});if(!tt.ok)continue;const D=await tt.json();if(D.length>0){const et=parseFloat(D[0].lat),nt=parseFloat(D[0].lon),at={lat:et,lng:nt};return i[c]=at,Yt(i),console.log(`Geocoded "${t}" → ${et.toFixed(6)}, ${nt.toFixed(6)} (query: ${decodeURIComponent(Q.substring(2))})`),at}}catch{continue}await new Promise(z=>setTimeout(z,1100))}return console.warn(`Could not geocode "${t}" (${e})`),null}async function Wt(t,e){const a=[];for(let s=0;s<t.length;s++){const n=t[s];if(n.lat&&n.lng){a.push(n);continue}const o=await Jt(n.name,n.address||"",e.city||"",e.district||"",e.lat,e.lng);if(o)a.push({...n,lat:o.lat,lng:o.lng});else{const i=2*Math.PI*s/t.length,c=.003;a.push({...n,lat:e.lat+c*Math.cos(i),lng:e.lng+c*Math.sin(i)})}}return a}let K=null,F=null;function Zt(t,e){if(K=e,F=t,!m){m=L.map("pharmacy-map",{zoomControl:!0,attributionControl:!1});let n=0,o=0;A=L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:30,attribution:""}).addTo(m),A.on("tileerror",()=>{n++,n>=4&&o===0&&(console.warn("Tile loading failed, switching to card view"),X=!0,vt(K||e,F||t))}),A.on("tileload",()=>{o++})}E&&m.removeLayer(E),E=L.layerGroup().addTo(m),L.marker([t.lat,t.lng],{icon:L.divIcon({className:"user-marker-wrapper",html:'<div class="user-marker"></div>',iconSize:[18,18],iconAnchor:[9,9]})}).addTo(E);const a=L.latLngBounds([[t.lat,t.lng]]);e.forEach((n,o)=>{const i=L.divIcon({className:"pharmacy-marker-wrapper",html:'<div class="pharmacy-marker"><span class="pharmacy-marker-inner">+</span></div>',iconSize:[40,40],iconAnchor:[20,40],popupAnchor:[0,-42]}),c=ht(n.distance),r=`
      <div class="pharmacy-popup">
        <div class="popup-name">${p(n.name)}</div>
        <div class="popup-detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>${p(n.address)}</span>
        </div>
        ${n.phone?`
        <div class="popup-detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.78.3 1.54.52 2.29a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.75.22 1.51.4 2.29.52A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>${p(n.phone)}</span>
        </div>`:""}
        <div class="popup-footer">
          <span class="popup-dist">${c}</span>
          <span class="popup-district-name">${p(n.district)}</span>
        </div>
      </div>
    `,l=L.marker([n.lat,n.lng],{icon:i}).addTo(E).bindPopup(r,{maxWidth:280,closeButton:!0});o===0&&setTimeout(()=>l.openPopup(),600),a.extend([n.lat,n.lng])}),e.length>0?m.fitBounds(a,{padding:[50,50],maxZoom:14}):m.setView([t.lat,t.lng],13);const s=()=>{m.invalidateSize(),e.length>0&&m.fitBounds(a,{padding:[50,50],maxZoom:14})};setTimeout(s,100),setTimeout(s,500),setTimeout(s,1e3)}function Xt(t){const e=document.getElementById("ticker-track");if(!e)return;if(t.length===0){e.innerHTML='<div class="ticker-item"><span class="ticker-name" style="color:#94a3b8">Nöbetçi eczane bulunamadı</span></div>';return}const a=t.map(n=>{const o=ht(n.distance),i=n.address&&n.address.length>60?n.address.substring(0,57)+"...":n.address||"";return`
      <div class="ticker-item">
        <div class="ticker-cross">+</div>
        <div class="ticker-info">
          <span class="ticker-name">${p(n.name)}</span>
          ${i?`<span class="ticker-address">${p(i)}</span>`:""}
          <span class="ticker-meta">
            <span class="ticker-distance">${o}</span>
            <span class="ticker-phone">${p(n.phone)}</span>
          </span>
        </div>
      </div>
    `}).join("");e.innerHTML=a+a;const s=Math.max(15,t.length*8);e.style.animationDuration=`${s}s`,te()}function Qt(t){const e=document.getElementById("pharmacy-error"),a=document.getElementById("error-message");a.textContent=t,e.style.display="flex"}let G=!1;function te(){if(G)return;const t=document.getElementById("ticker-qr-code");if(!t)return;const e=`${window.location.origin}/nobetci.html`,a=`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(e)}&bgcolor=0a0e17&color=e2e8f0&format=svg`;t.innerHTML=`<img src="${a}" alt="QR" width="90" height="90" style="border-radius:6px;display:block;" />`,G=!0}function ee(){ft(),x=setInterval(R,I.PHARMACY_REFRESH)}function ft(){x&&(clearInterval(x),x=null)}function p(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}function vt(t,e){const a=document.getElementById("pharmacy-map");a.style.display="none";let s=document.getElementById("pharmacy-cards");if(s||(s=document.createElement("div"),s.id="pharmacy-cards",s.className="pharmacy-cards",a.parentElement.insertBefore(s,a)),s.style.display="flex",t.length===0){s.innerHTML=`
      <div class="pharmacy-card-empty">
        <p>Bugün için nöbetçi eczane bulunamadı</p>
      </div>`;return}const n=e.district&&e.city?`${e.district}, ${e.city}`:"";s.innerHTML=`
    ${n?`<div class="cards-location-badge">📍 ${p(n)}</div>`:""}
    <div class="cards-title">Bugün Nöbetçi Eczane${t.length>1?"ler":""}</div>
    <div class="cards-grid">
      ${t.map(o=>`
        <div class="pharmacy-card">
          <div class="card-icon">
            <svg viewBox="0 0 40 40">
              <rect x="12" y="17" width="16" height="6" rx="1" fill="currentColor"/>
              <rect x="17" y="12" width="6" height="16" rx="1" fill="currentColor"/>
            </svg>
          </div>
          <div class="card-content">
            <div class="card-name">${p(o.name)}</div>
            <div class="card-address">${p(o.address)}</div>
            ${o.phone?`<div class="card-phone">${p(o.phone)}</div>`:""}
          </div>
        </div>
      `).join("")}
    </div>
  `}function Et(){const t=document.getElementById("pharmacy-cards");t&&(t.style.display="none");const e=document.getElementById("pharmacy-map");e.style.display=""}function ne(){ft(),m&&(m.remove(),m=null),E=null,A=null,X=!1,K=null,F=null,G=!1,Et()}let B=!1;function ae(){se(),oe(),ce()}function se(){const t=document.createElement("button");t.id="admin-btn",t.innerHTML="⚙",t.title="Vitrin Ayarları",t.addEventListener("click",_),document.body.appendChild(t)}function oe(){const t=document.createElement("div");t.id="admin-panel",t.innerHTML=`
    <div class="admin-dialog">
      <div class="admin-header">
        <h2>⚙️ Ayarlar</h2>
        <button class="admin-close" id="admin-close">&times;</button>
      </div>

      <div class="admin-body">
        <div class="admin-section">
          <h3 class="admin-section-title">🏷️ Eczane Adı</h3>
          <div class="admin-name-row">
            <input type="text" id="pharmacy-name-input" class="admin-input" placeholder="Eczane adını yazın..." maxlength="40" />
            <button class="admin-action-btn primary" id="save-name-btn">Kaydet</button>
          </div>
        </div>

        <div class="admin-section">
          <h3 class="admin-section-title">📸 Vitrin Görselleri</h3>
          <p class="admin-desc">Vitrin modunda gösterilecek fotoğrafları seçin. Fotoğraflar tarayıcıda saklanır — sunucuya yüklenmez.</p>

        <div class="admin-upload-area" id="upload-area">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p><strong>Fotoğrafları seçin</strong> veya sürükleyip bırakın</p>
          <p class="upload-hint">JPG, PNG, WebP, GIF desteklenir</p>
          <input type="file" id="file-input" multiple accept="image/*" />
        </div>

        <div class="admin-status" id="admin-status"></div>

        <div class="admin-actions">
          <button class="admin-action-btn danger" id="clear-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Tümünü Sil
          </button>
        </div>
        </div>

        <div class="admin-section">
          <h3 class="admin-section-title">🏥 Nöbetçi Eczaneler (Offline)</h3>
          <p class="admin-desc">Nöbetçi eczane listesini bir .txt dosyası olarak yükleyin. Her satır: <code>&lt;İSİM&gt;&lt;ADRES . TEL&gt;&lt;GÜN.AY.YIL&gt;</code></p>

          <div class="admin-upload-area" id="pharmacy-upload-area">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <polyline points="9 15 12 12 15 15"/>
            </svg>
            <p><strong>TXT dosyası seçin</strong> veya sürükleyip bırakın</p>
            <p class="upload-hint">.txt formatında nöbetçi listesi</p>
            <input type="file" id="pharmacy-file-input" accept=".txt,text/plain" />
          </div>

          <div class="admin-example-toggle">
            <button class="admin-link-btn" id="show-example-btn">📋 Örnek formatı göster</button>
          </div>
          <pre class="admin-code-block" id="example-json" style="display:none">&lt;MEHMETOĞLU ECZ.&gt;&lt;KAYALIK MAH. SAGLIK CAD. NO:44 /B . 0356 461 37 38&gt;&lt;01.02.2026&gt;
&lt;SAĞLAM ECZ.&gt;&lt;KAYALIK MAH. SAĞLIK CAD. NO:18 . 0356 461 28 28&gt;&lt;02.02.2026&gt;
&lt;SELVİ ECZ.&gt;&lt;KAYALIK MAH. SAGLIK CAD. NO:24 . 0356 461 47 58&gt;&lt;03.02.2026&gt;</pre>

          <div id="pharmacy-file-status" class="admin-status"></div>
          <div id="pharmacy-list" class="pharmacy-list"></div>

          <div class="admin-actions">
            <button class="admin-action-btn danger" id="clear-pharmacies-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Eczane Listesini Sil
            </button>
          </div>
        </div>

        <div class="admin-section">
          <h3 class="admin-section-title">📍 Lokasyon Ayarları</h3>
          <p class="admin-desc">Harita ve konum bilgisi için şehir, ilçe ve koordinatları girin.</p>
          <div class="pharmacy-form">
            <div class="form-row form-row-half">
              <input type="text" id="loc-city" class="admin-input" placeholder="Şehir (ör: Tokat)" />
              <input type="text" id="loc-district" class="admin-input" placeholder="İlçe (ör: Niksar)" />
            </div>
            <div class="form-row form-row-half">
              <input type="number" id="loc-lat" class="admin-input" placeholder="Enlem (lat)" step="any" />
              <input type="number" id="loc-lng" class="admin-input" placeholder="Boylam (lng)" step="any" />
            </div>
            <button class="admin-action-btn primary" id="save-location-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Lokasyonu Kaydet
            </button>
          </div>
          <div id="location-status" class="admin-status"></div>
        </div>
      </div>
    </div>
  `,document.body.appendChild(t),document.getElementById("admin-close").addEventListener("click",_),t.addEventListener("click",r=>{r.target===t&&_()});const e=document.getElementById("file-input"),a=document.getElementById("upload-area");a.addEventListener("click",()=>e.click()),e.addEventListener("change",ie),a.addEventListener("dragover",r=>{r.preventDefault(),a.classList.add("dragover")}),a.addEventListener("dragleave",()=>{a.classList.remove("dragover")}),a.addEventListener("drop",r=>{r.preventDefault(),a.classList.remove("dragover");const l=Array.from(r.dataTransfer.files).filter(d=>d.type.startsWith("image/"));l.length>0&&Lt(l)}),document.getElementById("clear-btn").addEventListener("click",async()=>{confirm("Tüm vitrin görselleri silinecek. Emin misiniz?")&&(await ct(),q(),w())});const s=document.getElementById("pharmacy-name-input"),n=localStorage.getItem("pharmacyName")||"";s.value=n,document.getElementById("save-name-btn").addEventListener("click",()=>{const r=s.value.trim();r&&(localStorage.setItem("pharmacyName",r),wt(r),w())});const o=document.getElementById("pharmacy-file-input"),i=document.getElementById("pharmacy-upload-area");i.addEventListener("click",()=>o.click()),o.addEventListener("change",r=>{const l=r.target.files[0];l&&st(l)}),i.addEventListener("dragover",r=>{r.preventDefault(),i.classList.add("dragover")}),i.addEventListener("dragleave",()=>{i.classList.remove("dragover")}),i.addEventListener("drop",r=>{r.preventDefault(),i.classList.remove("dragover");const l=r.dataTransfer.files[0];l&&(l.name.endsWith(".txt")||l.type==="text/plain")&&st(l)}),document.getElementById("show-example-btn").addEventListener("click",()=>{const r=document.getElementById("example-json");r.style.display=r.style.display==="none"?"block":"none"}),document.getElementById("clear-pharmacies-btn").addEventListener("click",()=>{confirm("Eczane listesi silinecek. Emin misiniz?")&&(Kt(),U(),ot(),w())});const c=W();c&&(document.getElementById("loc-city").value=c.city||"",document.getElementById("loc-district").value=c.district||"",document.getElementById("loc-lat").value=c.lat||"",document.getElementById("loc-lng").value=c.lng||""),document.getElementById("save-location-btn").addEventListener("click",()=>{const r=document.getElementById("loc-city").value.trim(),l=document.getElementById("loc-district").value.trim(),d=parseFloat(document.getElementById("loc-lat").value)||0,u=parseFloat(document.getElementById("loc-lng").value)||0;if(!r||!l){alert("Şehir ve ilçe zorunludur.");return}Pt({city:r,district:l,lat:d,lng:u}),w();const f=document.getElementById("location-status");f.innerHTML=`<div class="status-success">✅ Lokasyon kaydedildi: ${l}, ${r}</div>`,setTimeout(()=>{f.innerHTML=`<div class="status-info">📍 ${l}, ${r}${d?` (${d}, ${u})`:""}</div>`},3e3)}),re(),q(),U(),ot()}function ie(t){const e=Array.from(t.target.files).filter(a=>a.type.startsWith("image/"));e.length>0&&Lt(e)}async function Lt(t){const e=document.getElementById("admin-status");e.innerHTML=`<div class="status-saving">Kaydediliyor... (${t.length} görsel)</div>`;try{const a=await Bt(t);e.innerHTML=`<div class="status-success">✅ ${a} görsel kaydedildi!</div>`,q(),w()}catch(a){e.innerHTML=`<div class="status-error">❌ Hata: ${a.message}</div>`}}async function q(){const t=document.getElementById("admin-status");try{const e=await xt();e>0?t.innerHTML=`<div class="status-info">📷 ${e} görsel kayıtlı</div>`:t.innerHTML='<div class="status-info" style="color:#94a3b8">Henüz görsel yüklenmemiş</div>'}catch{t.innerHTML=""}}let V=!1;function _(){const t=document.getElementById("admin-panel");B=!B,t.classList.toggle("open",B),!B&&V&&(V=!1,window.location.reload())}function w(){V=!0}function st(t){const e=document.getElementById("pharmacy-file-status");e.innerHTML='<div class="status-saving">Dosya okunuyor...</div>';const a=new FileReader;a.onload=s=>{try{const n=Dt(s.target.result);e.innerHTML=`<div class="status-success">✅ ${n.totalCount} kayıt yüklendi! Bugün ${n.todayCount} nöbetçi eczane var.</div>`,U(),w()}catch(n){e.innerHTML=`<div class="status-error">❌ Hata: ${n.message}</div>`}},a.onerror=()=>{e.innerHTML='<div class="status-error">❌ Dosya okunamadı</div>'},a.readAsText(t)}function ot(){const t=document.getElementById("pharmacy-file-status");if(!t)return;const e=pt(),a=Z();e.length>0&&!t.querySelector(".status-success")&&!t.querySelector(".status-error")&&(t.innerHTML=`<div class="status-info">🏥 ${e.length} toplam kayıt, bugün ${a.length} nöbetçi</div>`)}function re(){const t=document.getElementById("location-status");if(!t)return;const e=W();e&&e.city&&(t.innerHTML=`<div class="status-info">📍 ${e.district||""}, ${e.city}${e.lat?` (${e.lat}, ${e.lng})`:""}</div>`)}function U(){const t=document.getElementById("pharmacy-list"),e=Z(),a=pt();if(a.length===0){t.innerHTML='<div class="pharmacy-list-empty">Henüz nöbetçi listesi yüklenmemiş</div>';return}if(e.length===0){t.innerHTML=`<div class="pharmacy-list-empty">Toplam ${a.length} kayıt var ama bugün için nöbetçi eczane bulunamadı</div>`;return}const s=`<div class="pharmacy-list-header">📅 Bugünkü nöbetçi (${e.length})</div>`,n=e.map(o=>`
        <div class="pharmacy-list-item">
            <div class="pharmacy-list-info">
                <span class="pharmacy-list-name">${O(o.name)}</span>
                <span class="pharmacy-list-detail">${O(o.address||"")}${o.phone?" • "+O(o.phone):""}</span>
            </div>
        </div>
    `).join("");t.innerHTML=s+n}function O(t){const e=document.createElement("div");return e.textContent=t||"",e.innerHTML}function ce(){const t=localStorage.getItem("pharmacyName");t&&wt(t)}function wt(t){const e=document.getElementById("pharmacy-name");e&&(e.textContent=t.toUpperCase())}let b=null,kt=!1;function le(){rt(),setInterval(rt,1e3),ae(),de();const t=it();It(t),setInterval(()=>{if(kt)return;const e=it();e!==b&&bt(e)},I.MODE_CHECK_INTERVAL)}function it(){const e=new Date().getHours();return e>=I.SLIDESHOW_START&&e<I.SLIDESHOW_END?"slideshow":"pharmacy"}function It(t){b=t;const e=document.getElementById("slideshow-container"),a=document.getElementById("pharmacy-container"),s=document.getElementById("mode-badge"),n=s.querySelector(".mode-text");t==="slideshow"?(document.body.classList.add("slideshow-mode"),document.body.classList.remove("pharmacy-mode"),e.classList.add("active"),a.classList.remove("active"),s.classList.remove("pharmacy-mode"),n.textContent="Vitrin Modu",At()):(document.body.classList.add("pharmacy-mode"),document.body.classList.remove("slideshow-mode"),a.classList.add("active"),e.classList.remove("active"),s.classList.add("pharmacy-mode"),n.textContent="Nöbetçi Eczane",Ut()),St()}function bt(t){const e=document.getElementById("transition-overlay");e.classList.add("active"),setTimeout(()=>{b==="slideshow"?Nt():ne(),t==="slideshow"&&(document.getElementById("slideshow-track").innerHTML="",document.getElementById("slideshow-progress").innerHTML=""),It(t),setTimeout(()=>{e.classList.remove("active")},300)},500)}function de(){const t=document.getElementById("mode-toggle");t&&(St(),t.addEventListener("click",()=>{kt=!0,bt(b==="slideshow"?"pharmacy":"slideshow")}))}function St(){const t=document.getElementById("mode-toggle");t&&(b==="pharmacy"?t.classList.add("pharmacy-active"):t.classList.remove("pharmacy-active"))}function rt(){const t=document.getElementById("clock"),e=new Date,a=String(e.getHours()).padStart(2,"0"),s=String(e.getMinutes()).padStart(2,"0");t.textContent=`${a}:${s}`}document.addEventListener("DOMContentLoaded",le);
