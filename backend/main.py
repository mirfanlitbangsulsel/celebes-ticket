from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, date
from pydantic import BaseModel
import math

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class TicketRequest(BaseModel):
    tanggal: str
    asal_kab: str
    tujuan_kab: str
    jumlah_tiket: int
    metode: str

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

    # 1. Hitung harga dasar rute dikalikan jumlah tiket
    harga_rute_satuan = hitung_harga_dasar(data.asal_kab, data.tujuan_kab)
    total_harga_rute = harga_rute_satuan * data.jumlah_tiket
    
    # 2. Komponen jasa/tarif per tiket (Rp2.500 * jumlah tiket)
    tambahan_tarif = data.jumlah_tiket * 2500
    
    # 3. Biaya tambahan jika diantarkan ke alamat (misalnya Rp10.000 biaya kurir)
    biaya_antar = 10000 if data.metode == "Antar" else 0
    
    total_mentah = total_harga_rute + tambahan_tarif + biaya_antar
    
    # Pembulatan ke kelipatan 500 terdekat ke atas
    ongkir_fix = math.ceil(total_mentah / 500) * 500
    
    return {"ongkir": ongkir_fix}