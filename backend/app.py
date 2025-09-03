import subprocess
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from predictor import load_tles, compute_min_distance

# Absolute path to frontend folder
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))

# Flask setup
app = Flask(__name__, static_folder=frontend_dir, static_url_path="")
CORS(app)

# TLE sources (local + remote)
TLE_SOURCES = {
    "stations.tle": "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle",
    "starlink.tle": "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle",
    "india.tle": "https://celestrak.org/NORAD/elements/gp.php?GROUP=india&FORMAT=tle",
    "glonass.tle": "https://celestrak.org/NORAD/elements/gp.php?GROUP=glonass&FORMAT=tle",
    "weather.tle": "https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle",
    "active.tle": "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
}

tle_dir = os.path.join(os.path.dirname(__file__), "tle")

# Preload satellites from all TLEs
satellites = load_tles(*[os.path.join("tle", fname) for fname in TLE_SOURCES.keys() if os.path.exists(os.path.join(tle_dir, fname))])

# --------- API ROUTES ---------
@app.route("/list", methods=["GET"])
def list_sats():
    app.logger.info("Frontend requested satellite list")
    return jsonify({"count": len(satellites), "satellites": list(satellites.keys())})


@app.route("/predict", methods=["GET"])
def predict():
    sat1_name = request.args.get("sat1")
    sat2_name = request.args.get("sat2")

    if sat1_name not in satellites or sat2_name not in satellites:
        app.logger.warning(f"Prediction failed: {sat1_name}, {sat2_name}")
        return jsonify({"error": "Satellite not found in local TLEs"}), 400

    # Compute min distance and closest approach time
    min_dist, closest_time = compute_min_distance(
        satellites[sat1_name],
        satellites[sat2_name]
    )

    # Risk classification
    if min_dist < 5:
        risk = "CRITICAL"
        risk_msg = "High probability of collision. Immediate evasive action required."
    elif min_dist < 50:
        risk = "ELEVATED"
        risk_msg = "Satellites will pass dangerously close. Monitoring recommended."
    elif min_dist < 200:
        risk = "MODERATE"
        risk_msg = "Close approach detected, but no immediate collision risk."
    else:
        risk = "LOW"
        risk_msg = "Satellites remain at safe separation distance."

    app.logger.info(
        f"Prediction: {sat1_name} vs {sat2_name}, min_dist={min_dist:.2f} km at {closest_time}"
    )

    return jsonify({
        "sat1": sat1_name,
        "sat2": sat2_name,
        "min_distance_km": float(round(min_dist, 2)),
        "closest_approach_time": closest_time.isoformat() if closest_time else None,
        "risk_category": risk,
        "risk_message": risk_msg
    })


@app.route("/refresh", methods=["POST"])
def refresh():
    """Fetch latest TLEs from CelesTrak and reload satellites."""
    global satellites

    os.makedirs(tle_dir, exist_ok=True)

    for filename, url in TLE_SOURCES.items():
        path = os.path.join(tle_dir, filename)
        subprocess.run(["curl", "-s", url, "-o", path])

    # Reload after refreshing
    satellites = load_tles(*[os.path.join("tle", fname) for fname in TLE_SOURCES.keys()])

    app.logger.info(f"TLEs refreshed, total satellites: {len(satellites)}")
    return jsonify({"message": "TLEs refreshed successfully!", "count": len(satellites)})


# --------- FRONTEND ROUTES ---------
@app.route("/")
def index():
    return send_from_directory(frontend_dir, "index.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(frontend_dir, path)


if __name__ == "__main__":
    app.run(debug=True)
