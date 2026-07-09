from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="API CelebesTicket")

# Tambahkan blok ini untuk mengizinkan React menghubungi Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Mengizinkan semua akses
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- (Kode model PesananBaru, HARGA_TIKET, dan fungsi lainnya biarkan tetap sama persis seperti sebelumnya di bawah sini) ---

# Model Data yang diharapkan dari Frontend (React)
class PesananBaru(BaseModel):
    stasiun_berangkat: str
    stasiun_tiba: str
    jumlah_tiket: int
    nama_penumpang: str
    metode_pengiriman: str

# Harga Default
HARGA_TIKET = 10000
JASA_TRAVEL = 2500

@app.get("/")
def baca_root():
    return {"pesan": "Selamat datang di API CelebesTicket Server!"}

@app.post("/hitung-biaya")
def hitung_biaya(pesanan: PesananBaru):
    total_tiket = pesanan.jumlah_tiket * HARGA_TIKET
    total_jasa = pesanan.jumlah_tiket * JASA_TRAVEL
    
    # Ongkir hanya dihitung jika Draiv (karena nanti dihitung di Frontend via koordinat)
    ongkir = 0
    
    total_bayar = total_tiket + total_jasa + ongkir
    
    return {
        "status": "sukses",
        "rincian": {
            "total_tiket": total_tiket,
            "total_jasa": total_jasa,
            "ongkir": ongkir,
            "total_bayar": total_bayar
        }
    }
