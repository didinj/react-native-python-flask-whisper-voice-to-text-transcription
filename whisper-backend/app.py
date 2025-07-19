from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import os
import uuid

app = Flask(__name__)
CORS(app)

# Load Whisper model once
model = whisper.load_model("base")

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/transcribe", methods=["POST"])
def transcribe_audio():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio = request.files["audio"]
    extension = os.path.splitext(audio.filename)[1]
    filename = f"{uuid.uuid4().hex}{extension}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    try:
        audio.save(filepath)
        result = model.transcribe(filepath)
        transcription = result.get("text", "")
        return jsonify({"transcription": transcription})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)  # Optional: cleanup file

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
