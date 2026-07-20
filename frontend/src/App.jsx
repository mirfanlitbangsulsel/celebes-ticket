import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';

// Komponen untuk menangani klik pada peta & Search Lokasi
function MapHelper({ setKoordinatTujuan }) {
  const map = useMapEvents({
    click(e) {
      setKoordinatTujuan(e.latlng);
    },
  });

  React.useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: true,
      placeholder: 'Cari alamat tujuan...',
    });
    map.addControl(searchControl);
    return () => map.removeControl(searchControl);
  }, [map]);

  return null;
}

function App() {
  const [tanggal, setTanggal] = useState('');
  const [namaPenumpang, setNamaPenumpang] = useState('');
  const [jumlahTiket, setJumlahTiket] = useState(1);
  const [asal, setAsal] = useState({ stasiun: '', kab: '' });
  const [tujuan, setTujuan] = useState({ stasiun: '', kab: '' });
  const [koordinatTujuan, setKoordinatTujuan] = useState(null);
  const [biaya, setBiaya] = useState(0);
  const waNumber = "628123456789"; // Ganti dengan nomor WhatsApp Anda

  // Data stasiun dengan perbaikan (Mandalle masuk Pangkep)
  const dataStasiun = {
    Maros: ["Stasiun Maros", "Stasiun Rammang-Rammang"],
    Pangkep: ["Stasiun Pangkajene", "Stasiun Ma'rang", "Stasiun Labakkang", "Stasiun Mangilu", "Stasiun Mandalle"],
    Barru: ["Stasiun Tanete Rilau", "Stasiun Barru", "Stasiun Mangkoso", "Stasiun Palanro", "Stasiun Garongkong"]
  };

  const handleHitung = async () => {
    try {
      const response = await fetch("https://celebes-ticket-production.up.railway.app/hitung-biaya", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tanggal, 
          asal_kab: asal.kab, 
          tujuan_kab: tujuan.kab,
          jumlah_tiket: Number(jumlahTiket)
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.detail || "Terjadi kesalahan");
        return;
      }
      
      const data = await response.json();
      setBiaya(data.ongkir);
    } catch (err) {
      alert("Gagal terhubung ke server");
    }
  };

  const kirimWA = () => {
    const pesan = `Halo, saya ingin memesan tiket AnNur Travel.\n` +
                  `Nama: ${namaPenumpang}\n` +
                  `Tanggal: ${tanggal}\n` +
                  `Jumlah Tiket: ${jumlahTiket} Orang\n` +
                  `Dari: ${asal.stasiun} (${asal.kab})\n` +
                  `Ke: ${tujuan.stasiun} (${tujuan.kab})\n` +
                  `Total Biaya: Rp ${biaya.toLocaleString()}`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(pesan)}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8">
      <div className="max-w-xl mx-auto bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
        
        {/* Header dengan teks terang agar terlihat jelas */}
        <h1 className="text-2xl font-bold text-center text-amber-400 mb-1">Jastip Tiket AnNur Travel</h1>
        <p className="text-sm text-center text-slate-400 mb-6">Pemesanan Tiket Kereta & Pengantaran</p>
        
        {/* Tanggal Keberangkatan */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-200 mb-1">Tanggal Keberangkatan (Min H-2):</label>
          <input 
            type="date" 
            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white" 
            onChange={(e) => setTanggal(e.target.value)} 
          />
        </div>

        {/* Nama Penumpang */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-200 mb-1">Nama Penumpang:</label>
          <input 
            type="text" 
            placeholder="Masukkan nama lengkap"
            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white" 
            value={namaPenumpang}
            onChange={(e) => setNamaPenumpang(e.target.value)} 
          />
        </div>

        {/* Jumlah Tiket */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-200 mb-1">Jumlah Tiket:</label>
          <input 
            type="number" 
            min="1"
            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white" 
            value={jumlahTiket}
            onChange={(e) => setJumlahTiket(e.target.value)} 
          />
        </div>

        {/* Stasiun Asal */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-200 mb-1">Stasiun Asal:</label>
          <select 
            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white"
            onChange={(e) => {
              const [kab, stasiun] = e.target.value.split('|');
              setAsal({ kab, stasiun });
            }}
          >
            <option value="">-- Pilih Stasiun Asal --</option>
            {Object.entries(dataStasiun).map(([kab, list]) => 
              list.map(s => <option key={s} value={`${kab}|${s}`}>{kab} - {s}</option>)
            )}
          </select>
        </div>

        {/* Stasiun Tujuan */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-200 mb-1">Stasiun Tujuan:</label>
          <select 
            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white"
            onChange={(e) => {
              const [kab, stasiun] = e.target.value.split('|');
              setTujuan({ kab, stasiun });
            }}
          >
            <option value="">-- Pilih Stasiun Tujuan --</option>
            {Object.entries(dataStasiun).map(([kab, list]) => 
              list.map(s => <option key={s} value={`${kab}|${s}`}>{kab} - {s}</option>)
            )}
          </select>
        </div>

        {/* Peta Interaktif & Search */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-200 mb-1">Tandai Lokasi / Cari Alamat di Peta:</label>
          <div className="h-64 w-full rounded overflow-hidden border border-slate-600">
            <MapContainer center={[-4.5, 119.5]} zoom={9} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapHelper setKoordinatTujuan={setKoordinatTujuan} />
              {koordinatTujuan && <Marker position={koordinatTujuan} />}
            </MapContainer>
          </div>
          {koordinatTujuan && (
            <p className="text-xs text-emerald-400 mt-1">✓ Titik koordinat tujuan terpilih di peta.</p>
          )}
        </div>

        {/* Tombol Hitung */}
        <button 
          onClick={handleHitung} 
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded transition duration-200"
        >
          Hitung Total Harga
        </button>
        
        {/* Hasil Perhitungan & Tombol WA */}
        {biaya > 0 && (
          <div className="mt-6 p-4 bg-slate-700 rounded-lg border border-slate-600 text-center">
            <p className="text-sm text-slate-300">Total Biaya (Termasuk Tarif & Kelipatan 500):</p>
            <p className="text-2xl font-bold text-emerald-400 my-2">Rp {biaya.toLocaleString()}</p>
            <button 
              onClick={kirimWA} 
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold p-3 rounded transition duration-200 mt-2"
            >
              Pesan via WhatsApp
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;