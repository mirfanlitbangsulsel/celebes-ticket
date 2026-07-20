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

    # Harga dasar rute + penambahan komponen tarif/jasa (misal Rp2.500 per tiket)
    harga_rute = hitung_harga_dasar(data.asal_kab, data.tujuan_kab)
    tambahan_tarif = data.jumlah_tiket * 2500
    
    total_mentah = harga_rute + tambahan_tarif
    
    # Pembulatan ke kelipatan 500 terdekat ke atas
    ongkir_fix = math.ceil(total_mentah / 500) * 500
    
    return {"ongkir": ongkir_fix}