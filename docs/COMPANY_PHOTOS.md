# Foto Company Profile — 10 Prompt Siap Pakai

**Folder simpan:** `src/assets/company/` (semua kecuali no. 10).
**Aturan nama:** persis seperti kolom File (huruf kecil, tanpa spasi).
**Setelah taruh file:** push → rebuild otomatis → halaman memakai foto baru.
File yang belum ada menampilkan fallback gradien elegan (tidak rusak).

Palet merek: krem `#f6efe3` · krem terang `#fbf6ec` · emas `#b99a5b` · emas tua `#8a6d3f` ·
cokelat teks `#4a3426` · sage `#5f8564`. Gaya foto: hangat, lembut, editorial pernikahan
Indonesia. **Tidak ada teks kecil di dalam gambar** (pecah saat dikompres) dan
**tidak ada wajah tamu/klien asli** (privasi).

---

## 1. Hero beranda
- **File:** `src/assets/company/hero-couple.jpg`
- **Ukuran:** 1600×1000 px (aspek 8:5), landscape
- **Prompt:** `Warm elegant editorial wedding photo, Indonesian bride and groom in cream-gold modern attire standing in a sunlit garden at golden hour, soft bokeh, groom slightly behind bride, generous empty space on the left third for text overlay, cream `#f6efe3` and gold `#b99a5b` tones, romantic, high-end photography, no text, no watermark`
- **Teks di gambar:** tidak ada (ruang kosong kiri untuk headline halaman)
- **Detail:** wajah boleh tampak lembut/tidak dominan; fokus suasana, bukan identitas

## 2. Fitur RSVP
- **File:** `src/assets/company/feature-rsvp.jpg`
- **Ukuran:** 900×1100 px (aspek 4:5), portrait
- **Prompt:** `Close-up of hands holding a smartphone showing a wedding RSVP confirmation screen with gold accents, on a wooden table with white flowers and cream envelope, warm morning light, cream and gold `#b99a5b` palette, elegant flat-lay photography, screen content simple large buttons, no readable small text, no watermark`
- **Teks di gambar:** hanya tombol besar generik (mis. "Hadir"), tanpa teks kecil
- **Detail:** layar HP harus terlihat sederhana dan terang

## 3. Fitur desain
- **File:** `src/assets/company/feature-design.jpg`
- **Ukuran:** 900×1100 px (aspek 4:5), portrait
- **Prompt:** `Elegant workspace flat-lay, laptop showing a wedding invitation design with serif typography, printed invitation cards, gold pen, dried flowers on cream linen `#f6efe3`, warm tones with sage `#5f8564` accents, top-down photography, tidy composition, no readable small text, no watermark`
- **Teks di gambar:** tidak ada teks terbaca (blur teks latin generik bila perlu)
- **Detail:** kesan rapi dan profesional, bukan meja berantakan

## 4. Fitur bagikan
- **File:** `src/assets/company/feature-share.jpg`
- **Ukuran:** 900×1100 px (aspek 4:5), portrait
- **Prompt:** `Smartphone showing a WhatsApp chat with a wedding invitation link and QR code card beside it, on cream silk fabric `#fbf6ec` with soft shadows, gold `#b99a5b` accents, warm elegant product photography, chat bubbles blurred and unreadable, no watermark`
- **Teks di gambar:** gelembung chat sengaja blur/tidak terbaca
- **Detail:** fokus pada HP + kartu QR, komposisi diagonal

## 5. Contoh tema floral
- **File:** `src/assets/company/theme-floral.jpg`
- **Ukuran:** 800×1000 px (aspek 4:5), portrait
- **Prompt:** `Wedding invitation mockup with blush floral design standing on blush silk fabric with rose petals, soft daylight, blush cream and sage palette, elegant stationery photography, invitation text blurred and unreadable, no watermark`
- **Teks di gambar:** blur, tidak terbaca
- **Detail:** satu undangan tegak sebagai hero, kelopak mawar di sekeliling

## 6. Contoh tema adat
- **File:** `src/assets/company/theme-adat.jpg`
- **Ukuran:** 800×1000 px (aspek 4:5), portrait
- **Prompt:** `Wedding invitation mockup with Javanese batik pattern in deep brown and gold, placed on dark carved wood with jasmine flowers (melati), dramatic warm side light, luxurious traditional mood, invitation text blurred and unreadable, no watermark`
- **Teks di gambar:** blur, tidak terbaca
- **Detail:** nuansa agung, kayu gelap + melati putih sebagai kontras

## 7. Contoh tema mewah
- **File:** `src/assets/company/theme-luxury.jpg`
- **Ukuran:** 800×1000 px (aspek 4:5), portrait
- **Prompt:** `Luxury black and gold wedding invitation mockup beside lit candles on dark marble, night mood, gold `#b99a5b` foil glow, ultra elegant stationery photography, invitation text blurred and unreadable, no watermark`
- **Teks di gambar:** blur, tidak terbaca
- **Detail:** pantulan emas di marmer, jangan terlalu gelap (detail tetap terlihat)

## 8. Contoh tema modern
- **File:** `src/assets/company/theme-modern.jpg`
- **Ukuran:** 800×1000 px (aspek 4:5), portrait
- **Prompt:** `Minimalist wedding invitation mockup with clean sans-serif layout on bright white concrete background with soft shadow of eucalyptus leaves, airy daylight, white grey and single gold accent, Scandinavian elegant photography, invitation text blurred and unreadable, no watermark`
- **Teks di gambar:** blur, tidak terbaca
- **Detail:** banyak ruang kosong, kesan ringan dan modern

## 9. Tentang kami
- **File:** `src/assets/company/about-team.jpg`
- **Ukuran:** 1200×800 px (aspek 3:2), landscape
- **Prompt:** `Warm creative studio interior, designer desk with invitation sketches, color swatches and laptop, hanging dried flowers, afternoon sun through window, cream and wood tones, cozy professional atmosphere, no clear faces, no readable text, no watermark`
- **Teks di gambar:** tidak ada
- **Detail:** tanpa wajah jelas siapa pun (privasi tim), fokus suasana kerja

## 10. Gambar berbagi (preview WhatsApp/sosmed)
- **File:** `public/og-share.jpg` (**bukan** di `src/assets/`)
- **Ukuran:** 1200×630 px (aspek 1.91:1), landscape — wajib, jangan diganti
- **Prompt:** `Elegant wedding brand banner, cream `#f6efe3` background with thin gold `#b99a5b` double border frame, centered serif text "Talijiwa" large and "Undangan Pernikahan Digital yang Elegan" small below it, subtle floral corner ornaments, luxurious minimal design, exact centered composition with safe margins, no photo, no watermark`
- **Teks di gambar:** "Talijiwa" (besar, tengah) + "Undangan Pernikahan Digital yang Elegan" (kecil, di bawahnya) — satu-satunya gambar yang BOLEH memuat teks
- **Detail:** simpan sebagai JPG kualitas 80–85, ukuran file usahakan < 300 KB
