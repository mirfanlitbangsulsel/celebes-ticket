import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Memperbaiki ikon marker bawaan Leaflet di React
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
});

const STASIUN = [
  "Mandai", "Maros", "Rammang-Rammang", "Pangkajene", 
  "Labakkang", "Ma'rang", "Mandalle", "Tanete Rilau", 
  "Barru", "Garongkong"
];
const NO_WA_TRAVEL = "6281234567890";

// Titik Koordinat Travel di Barru
const KOORDINAT_TRAVEL = { lat: -4.4107960269221085, lng: 119.62120491867925 }; 
const TARIF_DRAIV_PER_KM = 3000;
const TARIF_DASAR_DRAIV = 5000; 

function hitungJarakBumi(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Komponen untuk menandai lokasi pengguna
function PetaPilihLokasi({ posisi, setPosisi }) {
  useMapEvents({
    click(e) {
      setPosisi(e.latlng);
    },
  });
  return posisi === null ? null : (
    <Marker position={posisi}>
      <Popup>📍 Lokasi Pengantaran Draiv</Popup>
    </Marker>
  );
}

function App() {
  const [berangkat, setBerangkat] = useState(STASIUN[0]);
  const [tiba, setTiba] = useState(STASIUN[8]);
  const [jmlTiket, setJmlTiket] = useState(1);
  const [namaPenumpang, setNamaPenumpang] = useState("");
  const [pengiriman, setPengiriman] = useState("Ambil di Travel");
  
  // Set posisi default user sama dengan posisi travel pada awalnya
  const [posisiUser, setPosisiUser] = useState(KOORDINAT_TRAVEL);
  
  const [rincian, setRincian] = useState(null);
  const [loading, setLoading] = useState(false);

  const hitungBiaya = async () => {
    if (!namaPenumpang.trim()) { alert("⚠️ Isi nama penumpang!"); return; }
    if (berangkat === tiba) { alert("⚠️ Stasiun asal dan tujuan sama!"); return; }

    setLoading(true);
    try {
      const response = await fetch("https://celebes-ticket-production.up.railway.app/hitung-biaya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stasiun_berangkat: berangkat,
          stasiun_tiba: tiba,
          jumlah_tiket: parseInt(jmlTiket),
          nama_penumpang: namaPenumpang,
          metode_pengiriman: pengiriman
        })
      });
      const data = await response.json();
      
      let ongkirFinal = data.rincian.ongkir;
      let jarakKm = 0;
      
      if (pengiriman === "Diantar via Draiv") {
        jarakKm = hitungJarakBumi(KOORDINAT_TRAVEL.lat, KOORDINAT_TRAVEL.lng, posisiUser.lat, posisiUser.lng);
        // Jika user klik tepat di titik travel, minimal bayar tarif dasar
        ongkirFinal = jarakKm === 0 ? 0 : Math.round(TARIF_DASAR_DRAIV + (jarakKm * TARIF_DRAIV_PER_KM));
      }

      setRincian({
        ...data.rincian,
        ongkir: ongkirFinal,
        total_bayar: data.rincian.total_tiket + data.rincian.total_jasa + ongkirFinal,
        jarak: jarakKm.toFixed(1)
      });
    } catch (error) {
      alert("⚠️ Gagal terhubung ke Server!");
    }
    setLoading(false);
  };

  const kirimKeWhatsApp = () => {
    if (!rincian) return;
    
    let infoDraiv = "";
    if (pengiriman === "Diantar via Draiv") {
      // Menggunakan link Google Maps standar
      infoDraiv = `\n🛵 *Info Draiv:* Jarak ${rincian.jarak} km\n📍 *Peta:* https://maps.google.com/?q=${posisiUser.lat},${posisiUser.lng}\n`;
    }

    const teksPesan = `*RINGKASAN PEMESANAN TIKET*
------------------------------------------
🚉 *Rute:* ${berangkat} ➡️ ${tiba}
🎟️ *Jumlah:* ${jmlTiket} Tiket
👤 *Penumpang:* \n${namaPenumpang}
------------------------------------------
💰 *BIAYA:*
- Tiket: Rp ${rincian.total_tiket.toLocaleString('id-ID')}
- Jasa: Rp ${rincian.total_jasa.toLocaleString('id-ID')}
- Ongkir (${pengiriman}): Rp ${rincian.ongkir.toLocaleString('id-ID')} ${infoDraiv}
------------------------------------------
*TOTAL BAYAR = Rp ${rincian.total_bayar.toLocaleString('id-ID')}*`;

    window.open(`https://wa.me/${NO_WA_TRAVEL}?text=${encodeURIComponent(teksPesan)}`, '_blank');
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col items-center py-10 bg-slate-950">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-extrabold text-center text-cyan-400 mb-8">🚂 AnNur Travel</h1>
        
        <div className="grid grid-cols-2 gap-5 mb-5">
          <div><label className="block text-sm mb-2 text-slate-300">Berangkat</label><select value={berangkat} onChange={(e)=>setBerangkat(e.target.value)} className="w-full p-2 bg-slate-800 rounded text-white">{STASIUN.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label className="block text-sm mb-2 text-slate-300">Tujuan</label><select value={tiba} onChange={(e)=>setTiba(e.target.value)} className="w-full p-2 bg-slate-800 rounded text-white">{STASIUN.map(s=><option key={s}>{s}</option>)}</select></div>
        </div>
        
        <label className="block text-sm mb-2 text-slate-300">Jumlah Tiket</label>
        <input type="number" min="1" value={jmlTiket} onChange={(e)=>setJmlTiket(e.target.value)} className="w-full p-2 bg-slate-800 rounded text-white mb-5" />
        
        <label className="block text-sm mb-2 text-slate-300">Nama Penumpang</label>
        <textarea rows="2" value={namaPenumpang} onChange={(e)=>setNamaPenumpang(e.target.value)} className="w-full p-2 bg-slate-800 rounded text-white mb-5" />

        <label className="block text-sm mb-2 text-slate-300">Metode Pengiriman</label>
        <select value={pengiriman} onChange={(e)=>setPengiriman(e.target.value)} className="w-full p-2 bg-slate-800 rounded text-white mb-5 border-2 border-indigo-500">
          <option value="Ambil di Travel">Ambil di Travel</option>
          <option value="Diantar via Draiv">🛵 Diantar via Draiv (Pilih Lokasi di Peta)</option>
        </select>

        {pengiriman === "Diantar via Draiv" && (
          <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-indigo-500/50">
            <p className="text-sm text-indigo-300 mb-2 font-semibold">📍 Klik pada peta untuk menandai lokasi pengantaran Anda:</p>
            <div className="h-64 w-full rounded-lg overflow-hidden border border-slate-600 relative">
              <MapContainer center={KOORDINAT_TRAVEL} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap contributors' />
                
                {/* Marker Permanen: Loket Travel */}
                <Marker position={KOORDINAT_TRAVEL}>
                  <Popup>🏢 <b>Loket Travel Celebes</b><br/>Titik awal pengantaran</Popup>
                </Marker>
                
                {/* Marker Dinamis: Lokasi Pengguna */}
                <PetaPilihLokasi posisi={posisiUser} setPosisi={setPosisiUser} />
              </MapContainer>
            </div>
          </div>
        )}

        <button onClick={hitungBiaya} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg mt-2">
          {loading ? "Menghitung..." : "Hitung Total Biaya"}
        </button>

        {rincian && (
          <div className="mt-8 p-6 bg-slate-950 rounded-xl border border-slate-800">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">📋 Rincian</h3>
            {pengiriman === "Diantar via Draiv" && (
               <p className="text-xs text-indigo-400 mb-3 bg-indigo-900/30 p-2 rounded">Jarak pengantaran dari loket: {rincian.jarak} KM</p>
            )}
            <div className="flex justify-between mb-2"><span>Total Tiket & Jasa:</span><span>Rp {(rincian.total_tiket + rincian.total_jasa).toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between mb-4 border-b border-slate-700 pb-4"><span>Ongkos Kirim:</span><span>Rp {rincian.ongkir.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between text-xl font-bold mb-6"><span>Total Bayar:</span><span className="text-emerald-400">Rp {rincian.total_bayar.toLocaleString('id-ID')}</span></div>
            
            <button onClick={kirimKeWhatsApp} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
              🟢 Kirim ke WhatsApp Travel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default App;