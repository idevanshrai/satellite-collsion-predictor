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

# Preload satellites from local TLEs
satellites = load_tles(
    "tle/stations.tle",
    "tle/starlink.tle"
)

# --------- API ROUTES (must be defined first so they’re not shadowed) ---------
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

    min_dist = compute_min_distance(satellites[sat1_name], satellites[sat2_name])
    app.logger.info(f"Prediction: {sat1_name} vs {sat2_name}, min_dist={min_dist:.2f} km")

    return jsonify({
        "sat1": sat1_name,
        "sat2": sat2_name,
        "min_distance_km": float(round(min_dist, 2)),
        "collision_risk": bool(min_dist < 5)
    })


@app.route("/refresh", methods=["POST"])
def refresh():
    """Fetch latest TLEs from CelesTrak and reload satellites."""
    global satellites

    tle_dir = os.path.join(os.path.dirname(__file__), "tle")

    urls = {
        "stations.tle": "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle",
        "starlink.tle": "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle",
    }

    for filename, url in urls.items():
        path = os.path.join(tle_dir, filename)
        subprocess.run(["curl", "-s", url, "-o", path])

    # Reload after refreshing
    satellites = load_tles(
        "tle/stations.tle",
        "tle/starlink.tle"
    )

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
