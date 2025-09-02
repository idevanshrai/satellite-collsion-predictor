# 🌍 Orbital Analysis System (Satellite Collision Predictor) 

## 📖 Overview  

**Orbital Analysis System** is an interactive platform that predicts potential satellite collisions using real orbital data.  
It combines a **Flask backend** (for fetching and analyzing Two-Line Element sets — TLEs) with a **Three.js powered frontend** that visualizes Earth, satellites, and orbital paths in real time.  

The system pulls TLE data from [CelesTrak](https://celestrak.org), simulates orbits, and provides an intuitive dashboard for mission control–style collision risk analysis.  

---

## ✨ Features  

- 🔄 **Live TLE updates** from CelesTrak (`/refresh` endpoint).  
- 📡 **Backend API** to list satellites and calculate closest approach between any two.  
- 🌍 **3D Earth visualization** using Three.js with atmosphere & star field.  
- 🛰️ **Satellite modeling** with orbit paths & target selection.  
- ⚡ **Collision predictor** – calculates minimum distance and flags risks under 5 km.  
- 🎛️ **Mission control dashboard** with stats, logs, and interactive controls.  
- 🎨 **Launch splash screen** (optional) with rocket liftoff animation.  

---

## 🛠️ Tech Stack  

**Frontend**  
- HTML, CSS  
- JavaScript (ES6)  
- Three.js 

**Backend**  
- Python 3  
- Flask  
- Flask-CORS  
- `sgp4` (orbital mechanics library)  
- Subprocess (`curl`) to refresh TLEs  

---

## 📂 Project Structure  

```bash
satellite-collision-predictor/
│
├── backend/
│   ├── app.py             
│   ├── predictor.py       # TLE loader & min distance calculator
│   └── tle/               # Cached TLE files (stations, starlink)
│
├── frontend/
│   ├── index.html         
│   ├── app.js             
│   └── styles.css         
│
└── README.md
````

---

## 🚀 Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/idevanshrai/satellite-collision-predictor.git
cd satellite-collision-predictor
```

### 2. Backend Setup (Flask)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # On Mac/Linux
venv\Scripts\activate      # On Windows

pip install flask flask-cors sgp4
python3 app.py
```

Backend will start on `http://127.0.0.1:5000`.

### 3. Frontend Setup

Run a simple local server from the `frontend/` folder:

```bash
cd frontend
python3 -m http.server 5500
```

Then open:
👉 [http://127.0.0.1:5500/index.html](http://127.0.0.1:5500/index.html)

---

## 📡 API Endpoints

### `GET /list`

Returns all satellites loaded from local TLE files.

```json
{
  "count": 5321,
  "satellites": ["ISS (ZARYA)", "STARLINK-35001", ...]
}
```

### `GET /predict?sat1=ISS (ZARYA)&sat2=STARLINK-35001`

Computes minimum distance between two satellites.

```json
{
  "sat1": "ISS (ZARYA)",
  "sat2": "STARLINK-35001",
  "min_distance_km": 12.43,
  "collision_risk": false
}
```

### `POST /refresh`

Fetches latest TLE data from CelesTrak and reloads them.

---

## 🎮 Controls

* 🖱️ **Drag** – Rotate camera around Earth
* 🖱️ **Scroll** – Zoom in/out (clamped between 8–50 Earth radii)
* ⌨️ **Keyboard shortcuts** (e.g., reset camera, pause rotation)
* 🎯 **Selectors** – Choose two satellites and analyze risk

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!
Fork the repo and submit a PR 🚀

---

## 📜 License

MIT License © 2025
