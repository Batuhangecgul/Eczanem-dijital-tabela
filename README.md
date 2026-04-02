# Eczanem - Vitrin ve Nöbet Bildirim Sistemi

Bu proje, eczaneler için özel olarak tasarlanmış bir vitrin (slideshow) ve nöbetçi eczane takip sistemidir.

## Özellikler

- **Vitrin (Slideshow) Modu:** Eczane vitrininde ürünlerin, kampanyaların veya duyuruların dönmesini sağlar.
- **Nöbetçi Eczane Modu:** 
  - Ekranı ikiye bölen şık tasarım: Sol tarafta eczanenin kendi iletişim bilgileri (Adı, Telefonu, Adresi) ve kapalı uyarı kartı.
  - Sağ tarafta nöbetçi eczanelerin konumlarını gösteren interaktif **Leaflet** haritası.
  - Alt kısımda bilgilerin sürekli aktığı kayan şerit (Ticker).
- **Dinamik Mod Değişimi:** Belirli saatler arasında vitrin modu, diğer saatlerde nöbetçi eczane modu otomatik aktif olur.
- **Gelişmiş Yönetim Paneli:** 
  - Görselleri sürükle-bırak ile yükleme (sunucu gerektirmez, IndexedDB kullanılır).
  - Eczane adı, telefon, adres ve lokasyon ayarlarını yönetme.
  - Çevrimdışı (offline) kullanım için nöbetçi listesi import edebilme.

## Yapılandırma

`src/config.js` dosyası üzerinden sistemin çalışma saatlerini ve diğer ayarlarını değiştirebilirsiniz.

Bu saatler dışında sistem otomatik olarak nöbetçi eczane moduna geçebilir (PHARMACY_START/END ile yapılandırılmışsa).

## Geliştirme

Projeyi yerel ortamda çalıştırmak için:

```bash
npm run dev
```

## Teknolojiler

- JavaScript (Vanilla)
- Vite
- IndexedDB (Görsel depolama için)
- Leaflet/Mapbox (Harita gösterimi için)
