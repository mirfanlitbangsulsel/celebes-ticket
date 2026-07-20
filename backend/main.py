from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, date
from pydantic import BaseModel
import math

app = FastAPI()

# Konfigurasi CORS agar bisa diakses dari Frontend Netlify Anda
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Ganti dengan URL Netlify Anda di masa depan untuk keamanan
    allow_methods=["*"],
    allow_headers=["*"],
)

class TicketRequest(BaseModel):
    tanggal: str
    asal_kab: str
    tujuan_kab: str

def hitung_harga_dasar(asal_kab, tujuan_kab):
    # Logika harga 5000 untuk kabupaten bersebelahan
    # Pasangan: Maros-Pangkep atau Pangkep-Barru
    bersebelahan = [
        ("Maros", "Pangkep"), ("Pangkep", "Maros"),
        ("Pangkep", "Barru"), ("Barru", "Pangkep")
    ]
    
    if (asal_kab, tujuan_kab) in bersebelahan:
        return 5000
    return 10000 # Harga default untuk rute lainnya

@app.post("/hitung-biaya")
def hitung_biaya(data: TicketRequest):
    # 1. Validasi Tanggal (Minimal 2 hari sebelum keberangkatan)
    try:
        tgl_pesan = datetime.strptime(data.tanggal, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Format tanggal salah.")
        
    tgl_hari_ini = date.today()
    
    # Cek apakah selisih hari kurang dari 2
    if (tgl_pesan - tgl_hari_ini).days < 2:
        raise HTTPException(
            status_code=400, 
            detail="Pemesanan harus dilakukan minimal 2 hari sebelum keberangkatan."
        )

    # 2. Perhitungan Harga
    harga_dasar = hitung_harga_dasar(data.asal_kab, data.tujuan_kab)
    
    # Pembulatan ke kelipatan 500 ke atas
    ongkir_fix = math.ceil(harga_dasar / 500) * 500
    
    return {"ongkir": ongkir_fix}

# Untuk menjalankan lokal: uvicorn main:app --reload