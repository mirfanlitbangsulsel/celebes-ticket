import React, { useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';

// Komponen Search untuk Peta
function SearchControl() {
  const map = useMapEvents({});
  React.useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: true,
      placeholder: 'Cari lokasi...',
    });
    map.addControl(searchControl);
    return () => map.removeControl(searchControl);
  }, [map]);
  return null;
}

function App() {
  const [tanggal, setTanggal] = useState('');
  const [asal, setAsal] = useState({ stasiun: '', kab: '' });
  const [tujuan, setTujuan] = useState({ stasiun: '', kab: '' });
  const [biaya, setBiaya] = useState(0);
  const waNumber = "6285298344955"; // Ganti dengan nomor Anda

  const dataStasiun = {
    Maros: ["Stasiun Maros", "Stasiun Rammang-Rammang"],
    Pangkep: ["Stasiun Pangkajene", "Stasiun Ma'rang", "Stasiun Labakkang", "Stasiun Mangilu"],
    Barru: ["Stasiun Mandalle", "Stasiun Tanete Rilau", "Stasiun Barru", "Stasiun Mangkoso", "Stasiun Palanro", "Stasiun Garongkong"]
  };

  const handleHitung = async () => {
    try {
      const response = await fetch("https://celebes-ticket-production.up.railway.app/hitung-biaya", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tanggal, 
          asal_kab: asal.kab, 
          tujuan_kab: tujuan.kab 
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

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Jastip Tiket AnNur Travel </h1>
      
      <label>Tanggal Keberangkatan (Min H-2):</label>
      <input type="date" className="border p-2 w-full mb-4" onChange={(e) => setTanggal(e.target.value)} />

      <label>Stasiun Asal:</label>
      <select className="border p-2 w-full mb-2" onChange={(e) => {
        const [kab, stasiun] = e.target.value.split('|');
        setAsal({ kab, stasiun });
      }}>
        <option value="">Pilih Asal</option>
        {Object.entries(dataStasiun).map(([kab, list]) => 
          list.map(s => <option key={s} value={`${kab}|${s}`}>{kab} - {s}</option>)
        )}
      </select>

      <label>Stasiun Tujuan:</label>
      <select className="border p-2 w-full mb-4" onChange={(e) => {
        const [kab, stasiun] = e.target.value.split('|');
        setTujuan({ kab, stasiun });
      }}>
        <option value="">Pilih Tujuan</option>
        {Object.entries(dataStasiun).map(([kab, list]) => 
          list.map(s => <option key={s} value={`${kab}|${s}`}>{kab} - {s}</option>)
        )}
      </select>

      <div className="h-48 w-full mb-4">
        <MapContainer center={[-4.5, 119.5]} zoom={9} style={{ height: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <SearchControl />
        </MapContainer>
      </div>

      <button onClick={handleHitung} className="bg-blue-600 text-white p-3 w-full rounded">Hitung Harga</button>
      
      {biaya > 0 && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="font-bold">Total Harga: Rp {biaya.toLocaleString()}</p>
          <button onClick={() => window.open(`https://wa.me/${waNumber}?text=Pesan tiket dari ${asal.stasiun} ke ${tujuan.stasiun} tanggal ${tanggal}`)} className="bg-green-600 text-white p-2 w-full mt-2 rounded">
            Pesan via WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}

export default App;