from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib, json, pandas as pd, numpy as np

app = Flask(__name__)
CORS(app)  # allow requests from your Next.js frontend

rf = joblib.load('model.pkl')
with open('feature_cols.json') as f:
    feature_cols = json.load(f)

# Same health rules from your notebook
EXPECTED_RANGES = {
    "rumination": (45, 60),
    "eating":     (30, 45),
    "resting":    (60, 90),
    "walking":    (8,  23),
}

@app.route('/predict', methods=['POST'])
def predict():
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    df = pd.read_csv(file)

    # Run Random Forest prediction
    X = df[feature_cols].values
    predictions = rf.predict(X)

    # Count behavior windows
    from collections import Counter
    counts = Counter(predictions)

    # Apply health rules
    abnormal = []
    healthy = True
    for behavior, (low, high) in EXPECTED_RANGES.items():
        observed = counts.get(behavior, 0)
        if observed < low:
            healthy = False
            abnormal.append(f"{behavior.upper()} too low ({observed} windows, expected {low}-{high})")
        elif observed > high:
            healthy = False
            abnormal.append(f"{behavior.upper()} too high ({observed} windows, expected {low}-{high})")

    return jsonify({
        "healthy": healthy,
        "status": "HEALTHY" if healthy else "ABNORMAL",
        "behavior_counts": dict(counts),
        "issues": abnormal
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)