Eczanem - Vitrin ve Nöbet Bildirim Sistemi
Bu proje, eczaneler için özel olarak tasarlanmış bir vitrin (slideshow) ve nöbetçi eczane takip sistemidir.

Özellikler
Vitrin (Slideshow) Modu: Eczane vitrininde ürünlerin, kampanyaların veya duyuruların dönmesini sağlar.
Nöbetçi Eczane Takibi: Otomatik olarak nöbetçi eczaneleri çeker ve gösterir.
Dinamik Mod Değişimi: Belirli saatler arasında vitrin modu, diğer saatlerde nöbetçi eczane modu aktif olur.
Yönetim Paneli: Görselleri yüklemek ve ayarları yönetmek için basit bir arayüz.
Yapılandırma
src/config.js dosyası üzerinden sistemin çalışma saatlerini ve diğer ayarlarını değiştirebilirsiniz.

Vitrin Modu Saatleri
Şu anki yapılandırmaya göre vitrin modu:

Başlangıç: 08:00
Bitiş: 17:00
Bu saatler dışında sistem otomatik olarak nöbetçi eczane moduna geçebilir (PHARMACY_START/END ile yapılandırılmışsa).

Geliştirme
Projeyi yerel ortamda çalıştırmak için:

npm run dev
Teknolojiler
JavaScript (Vanilla)
Vite
IndexedDB (Görsel depolama için)
Leaflet/Mapbox (Harita gösterimi için)
