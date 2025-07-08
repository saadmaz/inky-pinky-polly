from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)  # Allow frontend requests

choices = ['pinky', 'inky', 'polly']
scores = {"player": 0, "computer": 0}

@app.route("/play", methods=["POST"])
def play():
    data = request.json
    print("Received data:", data)
    player_name = data.get("player_name")
    player_choice = data.get("player_choice")

    if player_choice not in choices:
        return jsonify({"error": "Invalid choice."}), 400

    computer_choice = random.choice(choices)

    if player_choice == computer_choice:
        result = "It's a tie!"
    elif (player_choice == 'pinky' and computer_choice == 'inky') or \
         (player_choice == 'inky' and computer_choice == 'polly') or \
         (player_choice == 'polly' and computer_choice == 'pinky'):
        result = "You win!"
        scores["player"] += 1
    else:
        result = "BOT-47 wins!"
        scores["computer"] += 1

    return jsonify({
        "player_name": player_name,
        "player_choice": player_choice,
        "computer_choice": computer_choice,
        "result": result,
        "player_score": scores["player"],
        "computer_score": scores["computer"]
    })

@app.route("/reset", methods=["POST"])
def reset():
    scores["player"] = 0
    scores["computer"] = 0
    return jsonify({"message": "Scores reset."})

if __name__ == "__main__":
    app.run(debug=True)
