(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function a(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=a(n);fetch(n.href,i)}})();const k={SLIDESHOW_START:0,SLIDESHOW_END:0,SLIDE_INTERVAL:6e3,PHARMACY_REFRESH:1800*1e3,MODE_CHECK_INTERVAL:60*1e3},Bt="eczanem-slides",xt=1,h="images";let $=null;function N(){return new Promise((t,e)=>{if($)return t($);const a=indexedDB.open(Bt,xt);a.onupgradeneeded=s=>{const n=s.target.result;n.objectStoreNames.contains(h)||n.createObjectStore(h,{keyPath:"id",autoIncrement:!0})},a.onsuccess=s=>{$=s.target.result,t($)},a.onerror=s=>{e(new Error("IndexedDB error: "+s.target.error))}})}async function Mt(t){const e=await N();await dt();const a=[];for(const i of t){const o=await i.arrayBuffer();a.push({name:i.name,type:i.type,data:o,size:i.size,addedAt:Date.now()})}const s=e.transaction(h,"readwrite"),n=s.objectStore(h);return a.forEach(i=>n.add(i)),new Promise((i,o)=>{s.oncomplete=()=>i(a.length),s.onerror=r=>o(r.target.error)})}async function Tt(){const s=(await N()).transaction(h,"readonly").objectStore(h).getAll();return new Promise((n,i)=>{s.onsuccess=()=>{const o=s.result.map(r=>({name:r.name,url:URL.createObjectURL(new Blob([r.data],{type:r.type}))}));n(o)},s.onerror=o=>i(o.target.error)})}async function At(){const s=(await N()).transaction(h,"readonly").objectStore(h).count();return new Promise((n,i)=>{s.onsuccess=()=>n(s.result),s.onerror=o=>i(o.target.error)})}async function dt(){const e=(await N()).transaction(h,"readwrite");return e.objectStore(h).clear(),new Promise((s,n)=>{e.oncomplete=()=>s(),e.onerror=i=>n(i.target.error)})}let f=0,T=null,E=[];async function Ct(){const t=document.getElementById("slideshow-track"),e=document.getElementById("slideshow-progress"),a=document.getElementById("slide-prev"),s=document.getElementById("slide-next");let n=[];try{n=await Tt(),console.log(`Slideshow: ${n.length} images from IndexedDB`)}catch(o){console.warn("Could not load slides:",o)}if(n.length===0){Nt(t);return}n.forEach((o,r)=>{const l=document.createElement("div");l.className=`slide${r===0?" active":""}`,l.innerHTML=`<img src="${o.url}" alt="${o.name}" />`,t.appendChild(l),E.push(l)}),n.length<=15&&n.forEach((o,r)=>{const l=document.createElement("div");l.className=`progress-dot${r===0?" active":""}`,l.addEventListener("click",()=>U(r)),e.appendChild(l)}),a.addEventListener("click",P),s.addEventListener("click",H);let i=0;t.addEventListener("touchstart",o=>{i=o.touches[0].clientX},{passive:!0}),t.addEventListener("touchend",o=>{const r=o.changedTouches[0].clientX,l=i-r;Math.abs(l)>50&&(l>0?H():P())},{passive:!0}),document.addEventListener("keydown",mt),ut()}function mt(t){var e;(e=document.getElementById("slideshow-container"))!=null&&e.classList.contains("active")&&(t.key==="ArrowLeft"&&P(),t.key==="ArrowRight"&&H())}function U(t){var e,a;t===f||E.length===0||(E[f].classList.remove("active"),(e=document.querySelectorAll(".progress-dot")[f])==null||e.classList.remove("active"),f=t,E[f].classList.add("active"),(a=document.querySelectorAll(".progress-dot")[f])==null||a.classList.add("active"),Ht())}function H(){U((f+1)%E.length)}function P(){U((f-1+E.length)%E.length)}function ut(){pt(),T=setInterval(H,k.SLIDE_INTERVAL)}function pt(){T&&(clearInterval(T),T=null)}function Ht(){ut()}function Nt(t){t.innerHTML=`
    <div class="slideshow-empty">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="m21 15-5-5L5 21"/>
      </svg>
      <h3>Görsel Yüklenmemiş</h3>
      <p>Sağ alttaki <strong>⚙</strong> butonuna tıklayıp vitrin görsellerinizi yükleyin.</p>
    </div>
  `}function Ot(){pt(),document.removeEventListener("keydown",mt),E=[],f=0}const Y="offlinePharmacyData",J="offlineLocation";function zt(t){const e=t.split(`
`).map(n=>n.trim()).filter(Boolean),a=[],s=/^<([^>]+)><([^>]+)><(\d{2}\.\d{2}\.\d{4})>$/;for(const n of e){const i=n.match(s);if(!i)continue;const o=i[1].trim(),r=i[2].trim(),l=i[3].trim();let u=r,c="";const d=r.lastIndexOf(" . ");d!==-1&&(u=r.substring(0,d).trim(),c=r.substring(d+3).trim());const[p,y,v]=l.split(".").map(Number),I=`${v}-${String(y).padStart(2,"0")}-${String(p).padStart(2,"0")}`;a.push({name:o,address:u,phone:c,date:I})}return a}function Dt(t){const e=zt(t);if(e.length===0)throw new Error("Hiç eczane verisi bulunamadı. Format: <İSİM><ADRES . TEL><GÜN.AY.YIL>");Pt(e);const a=yt(),s=e.filter(n=>n.date===a);return{totalCount:e.length,todayCount:s.length}}function Pt(t){localStorage.setItem(Y,JSON.stringify(t))}function W(){try{const t=localStorage.getItem(Y);return t?JSON.parse(t):[]}catch{return[]}}function Rt(t){localStorage.setItem(J,JSON.stringify(t))}function Z(){try{const t=localStorage.getItem(J);return t?JSON.parse(t):null}catch{return null}}function X(){const t=W();if(t.length===0)return[];const e=yt();return t.filter(a=>a.date===e)}function gt(){return W()}function Ft(){return W().length>0}function Kt(){localStorage.removeItem(Y)}function Vt(){localStorage.removeItem(J)}function yt(){const t=new Date,e=t.getHours(),a=t.getMinutes();if(e<8||e===8&&a<30){const o=new Date(t);o.setDate(o.getDate()-1);const r=o.getFullYear(),l=String(o.getMonth()+1).padStart(2,"0"),u=String(o.getDate()).padStart(2,"0");return`${r}-${l}-${u}`}const s=t.getFullYear(),n=String(t.getMonth()+1).padStart(2,"0"),i=String(t.getDate()).padStart(2,"0");return`${s}-${n}-${i}`}async function qt(){const t=Z();if(t&&(t.city||t.district))return{lat:t.lat||0,lng:t.lng||0,city:t.city||"",district:t.district||""};if(!navigator.geolocation)throw new Error("Geolocation desteklenmiyor");const e=await new Promise((o,r)=>{navigator.geolocation.getCurrentPosition(o,r,{enableHighAccuracy:!0,timeout:1e4,maximumAge:3e5})}),{latitude:a,longitude:s}=e.coords,{city:n,district:i}=await Gt(a,s);return{lat:a,lng:s,city:n,district:i}}async function Gt(t,e){try{const a=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${t}&lon=${e}&accept-language=tr&zoom=10`,{headers:{"User-Agent":"EczanemApp/1.0"}});if(!a.ok)throw new Error("Geocoding failed");const n=(await a.json()).address||{},i=n.province||n.state||n.city||"",o=n.county||n.town||n.suburb||n.city_district||"";return{city:i,district:o}}catch(a){return console.warn("Reverse geocoding failed:",a),{city:"",district:""}}}function _t(t,e,a,s){const i=B(a-t),o=B(s-e),r=Math.sin(i/2)*Math.sin(i/2)+Math.cos(B(t))*Math.cos(B(a))*Math.sin(o/2)*Math.sin(o/2);return 6371*(2*Math.atan2(Math.sqrt(r),Math.sqrt(1-r)))}function B(t){return t*(Math.PI/180)}function ht(t){return t<1?`${Math.round(t*1e3)} m`:`${t.toFixed(1)} km`}let x={date:null,data:null};async function jt(t,e){var s;const a=new Date().toISOString().split("T")[0];if(Ft()){const n=X();return console.log(`Using ${n.length} offline pharmacies`),n}if(x.date===a&&x.data)return console.log("Using cached pharmacy data"),x.data;try{const n=new URLSearchParams({city:t,district:e}),i=await fetch(`/api/pharmacies?${n}`);if(!i.ok)throw new Error(`HTTP ${i.status}`);const o=await i.json();if(o.status==="success"&&((s=o.pharmacies)==null?void 0:s.length)>0)return x={date:a,data:o.pharmacies},console.log(`Scraped ${o.pharmacies.length} pharmacies from eczaneler.gen.tr`),o.pharmacies;throw new Error("No pharmacies found")}catch(n){throw console.warn("Scraper failed:",n.message),n}}let g=null,A=null,b=null,C=null,Q=!1;async function Ut(){document.getElementById("retry-btn").addEventListener("click",()=>R()),await R(),ae()}async function R(){const t=document.getElementById("pharmacy-loading"),e=document.getElementById("pharmacy-error"),a=document.getElementById("location-info");t.style.display="flex",e.style.display="none";try{a.textContent="Konum belirleniyor...";const s=await qt();a.textContent=`${s.district}, ${s.city}`;const n=await jt(s.city,s.district);console.log(`Got ${n.length} pharmacies for ${s.district}, ${s.city}`);const o=(await Zt(n,s)).map(r=>({...r,distance:_t(s.lat,s.lng,r.lat,r.lng)})).sort((r,l)=>r.distance-l.distance);t.style.display="none",Q?Et(o,s):(wt(),Xt(s,o),Qt()),te(o);try{localStorage.setItem("currentPharmacies",JSON.stringify(o)),localStorage.setItem("currentLocation",JSON.stringify(s))}catch{}}catch(s){console.error("Load pharmacies error:",s),t.style.display="none",ee(s.message||"Nöbetçi eczaneler yüklenirken bir hata oluştu.")}}const ft="geocodeCache";function Yt(){try{return JSON.parse(localStorage.getItem(ft)||"{}")}catch{return{}}}function Jt(t){try{localStorage.setItem(ft,JSON.stringify(t))}catch{}}async function Wt(t,e,a,s,n,i){const o=Yt(),r=`${t}|${e}`;if(o[r])return o[r];const l=e.match(/(\S+)\s+MAH\.?/i),u=l?l[1].trim():"",c=e.match(/([\wğüşıöçĞÜŞİÖÇ\s]+?)\s*(CAD|SOK|SOKAK|BULV|BULVAR)\.?/i),d=c?`${c[1].trim()} ${c[2]}`:"",p=e.match(/NO[:\s]*(\d+)/i),y=p?`No ${p[1]}`:"",v=n&&i?`&viewbox=${i-.1},${n+.1},${i+.1},${n-.1}&bounded=1`:"",I=[];d&&y&&I.push(`q=${encodeURIComponent(`${d} ${y} ${a}`)}`),d&&I.push(`q=${encodeURIComponent(`${d} ${a}`)}`),u&&I.push(`q=${encodeURIComponent(`${u} Mahallesi ${a}`)}`);for(const tt of I){try{const O=`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=tr&${tt}${v}`,et=await fetch(O,{headers:{"Accept-Language":"tr"}});if(!et.ok)continue;const z=await et.json();if(z.length>0){const nt=parseFloat(z[0].lat),at=parseFloat(z[0].lon),st={lat:nt,lng:at};return o[r]=st,Jt(o),console.log(`Geocoded "${t}" → ${nt.toFixed(6)}, ${at.toFixed(6)} (query: ${decodeURIComponent(tt.substring(2))})`),st}}catch{continue}await new Promise(O=>setTimeout(O,1100))}return console.warn(`Could not geocode "${t}" (${e})`),null}async function Zt(t,e){const a=[];for(let s=0;s<t.length;s++){const n=t[s];if(n.lat&&n.lng){a.push(n);continue}const i=await Wt(n.name,n.address||"",e.city||"",e.district||"",e.lat,e.lng);if(i)a.push({...n,lat:i.lat,lng:i.lng});else{const o=2*Math.PI*s/t.length,r=.003;a.push({...n,lat:e.lat+r*Math.cos(o),lng:e.lng+r*Math.sin(o)})}}return a}let F=null,K=null;function Xt(t,e){if(F=e,K=t,!g){g=L.map("pharmacy-map",{zoomControl:!0,attributionControl:!1});let n=0,i=0;C=L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(g),C.on("tileerror",()=>{n++,n>=4&&i===0&&(console.warn("Tile loading failed, switching to card view"),Q=!0,Et(F||e,K||t))}),C.on("tileload",()=>{i++})}b&&g.removeLayer(b),b=L.layerGroup().addTo(g),L.marker([t.lat,t.lng],{icon:L.divIcon({className:"user-marker-wrapper",html:'<div class="user-marker" style="background:#00B4D8; box-shadow: 0 0 12px rgba(0, 180, 216, 0.6);"></div>',iconSize:[20,20],iconAnchor:[10,10]})}).addTo(b);const a=L.latLngBounds([[t.lat,t.lng]]);e.forEach((n,i)=>{const o=L.divIcon({className:"pharmacy-marker-wrapper",html:`
        <div class="pharmacy-marker-revised" style="
          width: 44px; 
          height: 44px; 
          background: #D32F2F; 
          border: 3px solid #FFF; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 4px 12px rgba(211, 47, 47, 0.4);
          animation: markerDrop 0.4s ease-out;
        ">
          <span style="color: #FFF; font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 24px;">E</span>
        </div>`,iconSize:[44,44],iconAnchor:[22,22],popupAnchor:[0,-22]}),r=ht(n.distance),l=`
      <div class="pharmacy-popup">
        <div class="popup-name">${m(n.name)}</div>
        <div class="popup-detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>${m(n.address)}</span>
        </div>
        ${n.phone?`
        <div class="popup-detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.78.3 1.54.52 2.29a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.75.22 1.51.4 2.29.52A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>${m(n.phone)}</span>
        </div>`:""}
        <div class="popup-footer">
          <span class="popup-dist">${r}</span>
          <span class="popup-district-name">${m(n.district)}</span>
        </div>
      </div>
    `,u=L.marker([n.lat,n.lng],{icon:o}).addTo(b).bindPopup(l,{maxWidth:280,closeButton:!0});i===0&&setTimeout(()=>u.openPopup(),600),a.extend([n.lat,n.lng])}),e.length>0?g.fitBounds(a,{padding:[50,50],maxZoom:14}):g.setView([t.lat,t.lng],13);const s=()=>{g.invalidateSize(),e.length>0&&g.fitBounds(a,{padding:[50,50],maxZoom:14})};setTimeout(s,100),setTimeout(s,500),setTimeout(s,1e3)}function Qt(){const t=document.getElementById("pharmacy-list-container");if(!t)return;const e=localStorage.getItem("pharmacyName")||"Eczanem",a=localStorage.getItem("pharmacyPhone")||"Telefon bilgisi girilmedi",s=localStorage.getItem("pharmacyAddress")||"Adres bilgisi girilmedi";t.innerHTML=`
    <div class="own-pharmacy-card">
      <div class="own-pharmacy-icon" aria-hidden="true"></div>
      <div class="own-pharmacy-title">Şu An Kapalıyız</div>
      <div class="own-pharmacy-name">${m(e)}</div>
      <div class="own-pharmacy-detail">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>${m(s)}</span>
      </div>
      <div class="own-pharmacy-detail">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.78.3 1.54.52 2.29a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.75.22 1.51.4 2.29.52A2 2 0 0 1 22 16.92z"></path>
        </svg>
        <span>${m(a)}</span>
      </div>
      <div class="own-pharmacy-message">
        En yakın nöbetçi eczaneleri haritadan veya aşağıdaki listeden görebilirsiniz.
      </div>
    </div>
  `}function te(t){const e=document.getElementById("ticker-track");if(!e)return;if(t.length===0){e.innerHTML='<div class="ticker-item"><span class="ticker-name" style="color:#94a3b8">Nöbetçi eczane bulunamadı</span></div>';return}const a=t.map(n=>{const i=ht(n.distance),o=n.address&&n.address.length>60?n.address.substring(0,57)+"...":n.address||"";return`
      <div class="ticker-item">
        <div class="ticker-cross">+</div>
        <div class="ticker-info">
          <span class="ticker-name">${m(n.name)}</span>
          ${o?`<span class="ticker-address">${m(o)}</span>`:""}
          <span class="ticker-meta">
            <span class="ticker-distance">${i}</span>
            <span class="ticker-phone">${m(n.phone)}</span>
          </span>
        </div>
      </div>
    `}).join("");e.innerHTML=a+a;const s=Math.max(15,t.length*8);e.style.animationDuration=`${s}s`,ne()}function ee(t){const e=document.getElementById("pharmacy-error"),a=document.getElementById("error-message");a.textContent=t,e.style.display="flex"}let V=!1;function ne(){if(V)return;const t=document.getElementById("ticker-qr-code");if(!t)return;const e=`${window.location.origin}/nobetci.html`,a=`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(e)}&bgcolor=0a0e17&color=e2e8f0&format=svg`;t.innerHTML=`<img src="${a}" alt="QR" width="90" height="90" style="border-radius:6px;display:block;" />`,V=!0}function ae(){vt(),A=setInterval(R,k.PHARMACY_REFRESH)}function vt(){A&&(clearInterval(A),A=null)}function m(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}function Et(t,e){const a=document.querySelector(".pharmacy-split-view");a&&(a.style.display="none");let s=document.getElementById("pharmacy-cards");if(s||(s=document.createElement("div"),s.id="pharmacy-cards",s.className="pharmacy-cards",a&&a.parentElement.insertBefore(s,a)),s.style.display="flex",t.length===0){s.innerHTML=`
      <div class="pharmacy-card-empty">
        <p>Bugün için nöbetçi eczane bulunamadı</p>
      </div>`;return}const n=e.district&&e.city?`${e.district}, ${e.city}`:"";s.innerHTML=`
    ${n?`<div class="cards-location-badge">${m(n)}</div>`:""}
    <div class="cards-title">Bugün Nöbetçi Eczane${t.length>1?"ler":""}</div>
    <div class="cards-grid">
      ${t.map(i=>`
        <div class="pharmacy-card">
          <div class="card-icon">
            <svg viewBox="0 0 40 40">
              <rect x="12" y="17" width="16" height="6" rx="1" fill="currentColor"/>
              <rect x="17" y="12" width="6" height="16" rx="1" fill="currentColor"/>
            </svg>
          </div>
          <div class="card-content">
            <div class="card-name">${m(i.name)}</div>
            <div class="card-address">${m(i.address)}</div>
            ${i.phone?`<div class="card-phone">${m(i.phone)}</div>`:""}
          </div>
        </div>
      `).join("")}
    </div>
  `}function wt(){const t=document.getElementById("pharmacy-cards");t&&(t.style.display="none");const e=document.querySelector(".pharmacy-split-view");e&&(e.style.display="grid")}function se(){vt(),g&&(g.remove(),g=null),b=null,C=null,Q=!1,F=null,K=null,V=!1,wt()}let M=!1;function ie(){oe(),re(),le()}function oe(){const t=document.createElement("button");t.id="admin-btn",t.innerHTML="⚙",t.title="Vitrin Ayarları",t.addEventListener("click",_),document.body.appendChild(t)}function re(){const t=document.createElement("div");t.id="admin-panel",t.innerHTML=`
    <div class="admin-dialog">
      <div class="admin-header">
        <h2>⚙️ Ayarlar</h2>
        <button class="admin-close" id="admin-close">&times;</button>
      </div>

      <div class="admin-body">
        <div class="admin-section">
          <h3 class="admin-section-title">🏪 Eczane Bilgileri</h3>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <input type="text" id="pharmacy-name-input" class="admin-input" placeholder="Eczane adını yazın..." maxlength="40" />
            <input type="text" id="pharmacy-phone-input" class="admin-input" placeholder="Telefon numarasını yazın..." maxlength="20" />
            <input type="text" id="pharmacy-address-input" class="admin-input" placeholder="Eczane adresini yazın..." maxlength="150" />
            <button class="admin-action-btn primary" id="save-name-btn" style="margin-top:4px;">Bilgileri Kaydet</button>
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
                        <div class="location-actions">
                            <button class="admin-action-btn primary" id="save-location-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Lokasyonu Kaydet
            </button>
                            <button class="admin-action-btn danger" id="clear-location-btn" title="Kayıtlı lokasyonu sil">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                                Lokasyonu Sil
                            </button>
                        </div>
          </div>
          <div id="location-status" class="admin-status"></div>
        </div>
      </div>
    </div>
  `,document.body.appendChild(t),document.getElementById("admin-close").addEventListener("click",_),t.addEventListener("click",c=>{c.target===t&&_()});const e=document.getElementById("file-input"),a=document.getElementById("upload-area");a.addEventListener("click",()=>e.click()),e.addEventListener("change",ce),a.addEventListener("dragover",c=>{c.preventDefault(),a.classList.add("dragover")}),a.addEventListener("dragleave",()=>{a.classList.remove("dragover")}),a.addEventListener("drop",c=>{c.preventDefault(),a.classList.remove("dragover");const d=Array.from(c.dataTransfer.files).filter(p=>p.type.startsWith("image/"));d.length>0&&Lt(d)}),document.getElementById("clear-btn").addEventListener("click",async()=>{confirm("Tüm vitrin görselleri silinecek. Emin misiniz?")&&(await dt(),q(),w())});const s=document.getElementById("pharmacy-name-input"),n=document.getElementById("pharmacy-phone-input"),i=document.getElementById("pharmacy-address-input");s.value=localStorage.getItem("pharmacyName")||"",n.value=localStorage.getItem("pharmacyPhone")||"",i.value=localStorage.getItem("pharmacyAddress")||"",document.getElementById("save-name-btn").addEventListener("click",()=>{const c=s.value.trim(),d=n.value.trim(),p=i.value.trim();c&&localStorage.setItem("pharmacyName",c),localStorage.setItem("pharmacyPhone",d),localStorage.setItem("pharmacyAddress",p),It(c),w();const y=document.getElementById("save-name-btn"),v=y.innerHTML;y.innerHTML="✅ Kaydedildi",setTimeout(()=>y.innerHTML=v,2e3)});const o=document.getElementById("pharmacy-file-input"),r=document.getElementById("pharmacy-upload-area");r.addEventListener("click",()=>o.click()),o.addEventListener("change",c=>{const d=c.target.files[0];d&&it(d)}),r.addEventListener("dragover",c=>{c.preventDefault(),r.classList.add("dragover")}),r.addEventListener("dragleave",()=>{r.classList.remove("dragover")}),r.addEventListener("drop",c=>{c.preventDefault(),r.classList.remove("dragover");const d=c.dataTransfer.files[0];d&&(d.name.endsWith(".txt")||d.type==="text/plain")&&it(d)}),document.getElementById("show-example-btn").addEventListener("click",()=>{const c=document.getElementById("example-json");c.style.display=c.style.display==="none"?"block":"none"}),document.getElementById("clear-pharmacies-btn").addEventListener("click",()=>{confirm("Eczane listesi silinecek. Emin misiniz?")&&(Kt(),j(),ot(),w())});const l=Z();l&&(document.getElementById("loc-city").value=l.city||"",document.getElementById("loc-district").value=l.district||"",document.getElementById("loc-lat").value=l.lat||"",document.getElementById("loc-lng").value=l.lng||""),document.getElementById("save-location-btn").addEventListener("click",()=>{const c=document.getElementById("loc-city").value.trim(),d=document.getElementById("loc-district").value.trim(),p=parseFloat(document.getElementById("loc-lat").value)||0,y=parseFloat(document.getElementById("loc-lng").value)||0;if(!c||!d){alert("Şehir ve ilçe zorunludur.");return}Rt({city:c,district:d,lat:p,lng:y}),w();const v=document.getElementById("location-status");v.innerHTML=`<div class="status-success">✅ Lokasyon kaydedildi: ${d}, ${c}</div>`,setTimeout(()=>{v.innerHTML=`<div class="status-info">📍 ${d}, ${c}${p?` (${p}, ${y})`:""}</div>`},3e3)});const u=document.getElementById("clear-location-btn");u&&u.addEventListener("click",()=>{if(!confirm("Kayıtlı lokasyon silinecek. Emin misiniz?"))return;Vt(),document.getElementById("loc-city").value="",document.getElementById("loc-district").value="",document.getElementById("loc-lat").value="",document.getElementById("loc-lng").value="";const c=document.getElementById("location-status");c&&(c.innerHTML='<div class="status-info" style="color:#94a3b8">Lokasyon kaldırıldı</div>'),rt(),w()}),rt(),q(),j(),ot()}function ce(t){const e=Array.from(t.target.files).filter(a=>a.type.startsWith("image/"));e.length>0&&Lt(e)}async function Lt(t){const e=document.getElementById("admin-status");e.innerHTML=`<div class="status-saving">Kaydediliyor... (${t.length} görsel)</div>`;try{const a=await Mt(t);e.innerHTML=`<div class="status-success">✅ ${a} görsel kaydedildi!</div>`,q(),w()}catch(a){e.innerHTML=`<div class="status-error">❌ Hata: ${a.message}</div>`}}async function q(){const t=document.getElementById("admin-status");try{const e=await At();e>0?t.innerHTML=`<div class="status-info">📷 ${e} görsel kayıtlı</div>`:t.innerHTML='<div class="status-info" style="color:#94a3b8">Henüz görsel yüklenmemiş</div>'}catch{t.innerHTML=""}}let G=!1;function _(){const t=document.getElementById("admin-panel");M=!M,t.classList.toggle("open",M),!M&&G&&(G=!1,window.location.reload())}function w(){G=!0}function it(t){const e=document.getElementById("pharmacy-file-status");e.innerHTML='<div class="status-saving">Dosya okunuyor...</div>';const a=new FileReader;a.onload=s=>{try{const n=Dt(s.target.result);e.innerHTML=`<div class="status-success">✅ ${n.totalCount} kayıt yüklendi! Bugün ${n.todayCount} nöbetçi eczane var.</div>`,j(),w()}catch(n){e.innerHTML=`<div class="status-error">❌ Hata: ${n.message}</div>`}},a.onerror=()=>{e.innerHTML='<div class="status-error">❌ Dosya okunamadı</div>'},a.readAsText(t)}function ot(){const t=document.getElementById("pharmacy-file-status");if(!t)return;const e=gt(),a=X();e.length>0&&!t.querySelector(".status-success")&&!t.querySelector(".status-error")&&(t.innerHTML=`<div class="status-info">🏥 ${e.length} toplam kayıt, bugün ${a.length} nöbetçi</div>`)}function rt(){const t=document.getElementById("location-status");if(!t)return;const e=Z();e&&e.city?t.innerHTML=`<div class="status-info">📍 ${e.district||""}, ${e.city}${e.lat?` (${e.lat}, ${e.lng})`:""}</div>`:t.innerHTML='<div class="status-info" style="color:#94a3b8">Henüz lokasyon ayarlı değil</div>'}function j(){const t=document.getElementById("pharmacy-list"),e=X(),a=gt();if(a.length===0){t.innerHTML='<div class="pharmacy-list-empty">Henüz nöbetçi listesi yüklenmemiş</div>';return}if(e.length===0){t.innerHTML=`<div class="pharmacy-list-empty">Toplam ${a.length} kayıt var ama bugün için nöbetçi eczane bulunamadı</div>`;return}const s=`<div class="pharmacy-list-header">📅 Bugünkü nöbetçi (${e.length})</div>`,n=e.map(i=>`
        <div class="pharmacy-list-item">
            <div class="pharmacy-list-info">
                <span class="pharmacy-list-name">${D(i.name)}</span>
                <span class="pharmacy-list-detail">${D(i.address||"")}${i.phone?" • "+D(i.phone):""}</span>
            </div>
        </div>
    `).join("");t.innerHTML=s+n}function D(t){const e=document.createElement("div");return e.textContent=t||"",e.innerHTML}function le(){const t=localStorage.getItem("pharmacyName");t&&It(t)}function It(t){const e=document.getElementById("pharmacy-name");e&&(e.textContent=t.toUpperCase())}let S=null,bt=!1;function de(){lt(),setInterval(lt,1e3),ie(),me();const t=ct();kt(t),setInterval(()=>{if(bt)return;const e=ct();e!==S&&St(e)},k.MODE_CHECK_INTERVAL)}function ct(){const e=new Date().getHours();return e>=k.SLIDESHOW_START&&e<k.SLIDESHOW_END?"slideshow":"pharmacy"}function kt(t){S=t;const e=document.getElementById("slideshow-container"),a=document.getElementById("pharmacy-container"),s=document.getElementById("mode-badge"),n=s.querySelector(".mode-text");t==="slideshow"?(document.body.classList.add("slideshow-mode"),document.body.classList.remove("pharmacy-mode"),e.classList.add("active"),a.classList.remove("active"),s.classList.remove("pharmacy-mode"),n.textContent="Vitrin Modu",Ct()):(document.body.classList.add("pharmacy-mode"),document.body.classList.remove("slideshow-mode"),a.classList.add("active"),e.classList.remove("active"),s.classList.add("pharmacy-mode"),n.textContent="Nöbetçi Eczane",Ut()),$t()}function St(t){const e=document.getElementById("transition-overlay");e.classList.add("active"),setTimeout(()=>{S==="slideshow"?Ot():se(),t==="slideshow"&&(document.getElementById("slideshow-track").innerHTML="",document.getElementById("slideshow-progress").innerHTML=""),kt(t),setTimeout(()=>{e.classList.remove("active")},300)},500)}function me(){const t=document.getElementById("mode-toggle");t&&($t(),t.addEventListener("click",()=>{bt=!0,St(S==="slideshow"?"pharmacy":"slideshow")}))}function $t(){const t=document.getElementById("mode-toggle");t&&(S==="pharmacy"?t.classList.add("pharmacy-active"):t.classList.remove("pharmacy-active"))}function lt(){const t=document.getElementById("clock"),e=new Date,a=String(e.getHours()).padStart(2,"0"),s=String(e.getMinutes()).padStart(2,"0");t.textContent=`${a}:${s}`}document.addEventListener("DOMContentLoaded",de);
