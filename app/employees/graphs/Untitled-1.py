"""this is a sample way how to load the data and get predictions"""

from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

# Load model + encoder ONCE (important)
model = joblib.load("cow_model.pkl")
le = joblib.load("label_encoder.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    # expected: 6 IMU values
    features = np.array([
        data["AX"],
        data["AY"],
        data["AZ"],
        data["GX"],
        data["GY"],
        data["GZ"]
    ]).reshape(1, -1)

    probs = model.predict_proba(features)[0]
    pred = model.predict(features)[0]

    return jsonify({
        "prediction": le.inverse_transform([pred])[0],
        "probabilities": {
            cls: float(prob)
            for cls, prob in zip(le.classes_, probs)
        }
    })

if __name__ == "__main__":
    app.run(debug=True)