from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, date
from pydantic import BaseModel, Optional
import math

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Coord(BaseModel):
    lat: float
    lng: float

class TicketRequest(BaseModel):
    tanggal: str
    asal_kab: str
    tujuan_kab: str
    jumlah_tiket: int
    metode: str
    koordinat_tujuan: Optional[Coord] = None

# Koordinat Kantor AnNur Travel
LOKASI_TRAVEL_LAT = -4.410800745861638
LOKASI_TRAVEL_LNG = 119.62120360634566

def hitung_jarak_km(lat1, lon1, lat2, lon2):
    # Rumus Haversine untuk menghitung jarak dalam kilometer
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def hitung_biaya_antar(koordinat):
    if not koordinat:
        return 10000 # Default minimal jika metode antar tapi belum klik peta
    
    jarak_km = hitung_jarak_km(LOKASI_TRAVEL_LAT, LOKASI_TRAVEL_LNG, koordinat.lat, koordinat.lng)
    jarak_meter = jarak_km * 1000
    
    if jarak_meter <= 2000:
        return 10000
    else:
        kelebihan_meter = jarak_meter - 2000
        kelipatan_500 = math.ceil(kelebihan_meter / 500)
        return 10000 + (kelipatan_500 * 2000)

def hitung_harga_dasar(asal_kab, tujuan_kab):
    bersebelahan = [
        ("Maros", "Pangkep"), ("Pangkep", "Maros"),
        ("Pangkep", "Barru"), ("Barru", "Pangkep")
    ]
    if (asal_kab, tujuan_kab) in bersebelahan:
        return 5000
    return 10000

@app.post("/hitung-biaya")
def hitung_biaya(data: TicketRequest):
    try:
        tgl_pesan = datetime.strptime(data.tanggal, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Format tanggal salah.")
        
    tgl_hari_ini = date.today()
    if (tgl_pesan - tgl_hari_ini).days < 2:
        raise HTTPException(
            status_code=400, 
            detail="Pemesanan harus dilakukan minimal 2 hari sebelum keberangkatan."
        )

    harga_rute_satuan = hitung_harga_dasar(data.asal_kab, data.tujuan_kab)
    total_harga_rute = harga_rute_satuan * data.jumlah_tiket
    tambahan_tarif = data.jumlah_tiket * 2500
    
    biaya_antar = hitung_biaya_antar(data.koordinat_tujuan) if data.metode == "Antar" else 0
    
    total_mentah = total_harga_rute + tambahan_tarif + biaya_antar
    ongkir_fix = math.ceil(total_mentah / 500) * 500
    
    return {"ongkir": ongkir_fix}