import os
from sgp4.api import Satrec, jday
import numpy as np
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_tles(*file_paths):
    """Load one or more TLE files into a single dict of satellites."""
    satellites = {}
    for file_path in file_paths:
        full_path = os.path.join(BASE_DIR, file_path)
        with open(full_path, "r") as f:
            lines = f.readlines()
            for i in range(0, len(lines), 3):
                if i + 2 < len(lines):
                    name = lines[i].strip()
                    l1 = lines[i+1].strip()
                    l2 = lines[i+2].strip()
                    try:
                        satellites[name] = Satrec.twoline2rv(l1, l2)
                    except Exception as e:
                        print(f"⚠️ Skipping {name} due to parse error: {e}")
    return satellites

def get_position(satrec_obj, dt):
    jd, fr = jday(dt.year, dt.month, dt.day,
                  dt.hour, dt.minute,
                  dt.second + dt.microsecond*1e-6)
    error, r, v = satrec_obj.sgp4(jd, fr)
    if error != 0:
        return None
    return np.array(r)

def compute_min_distance(sat1, sat2, hours=24, step_minutes=5):
    now = datetime.utcnow()
    min_dist = float("inf")
    for t in range(0, hours * 60, step_minutes):
        dt = now + timedelta(minutes=t)
        pos1 = get_position(sat1, dt)
        pos2 = get_position(sat2, dt)
        if pos1 is not None and pos2 is not None:
            dist = np.linalg.norm(pos1 - pos2)
            if dist < min_dist:
                min_dist = dist
    return min_dist
