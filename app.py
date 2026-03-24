from flask import Flask, render_template, request, jsonify
import datetime
import threading

app = Flask(__name__)

class TemporaryMessageManager:
    def __init__(self):
        self.messages = {}
        self.message_id_counter = 0
        self.lock = threading.Lock()
    
    def send_message(self, sender, recipient, content, expires_in_seconds):
        with self.lock:
            self.message_id_counter += 1
            message_id = f"msg_{self.message_id_counter}"
            sent_at = datetime.datetime.now()
            expires_at = sent_at + datetime.timedelta(seconds=expires_in_seconds)
            self.messages[message_id] = {
                "id": message_id,
                "sender": sender,
                "recipient": recipient,
                "content": content,
                "sent_at": sent_at.isoformat(),
                "expires_at": expires_at.isoformat(),
                "is_expired": False
            }
            self._schedule_deletion(message_id, expires_in_seconds)
            return message_id
    
    def get_message(self, message_id):
        with self.lock:
            message = self.messages.get(message_id)
            if message:
                expires_at = datetime.datetime.fromisoformat(message["expires_at"])
                if datetime.datetime.now() > expires_at:
                    return None
                return message
            return None
    
    def get_all_messages(self):
        with self.lock:
            active_messages = []
            now = datetime.datetime.now()
            for msg_id, msg in list(self.messages.items()):
                if now > datetime.datetime.fromisoformat(msg["expires_at"]):
                    del self.messages[msg_id]
                else:
                    active_messages.append(msg)
            return active_messages
    
    def _schedule_deletion(self, message_id, expires_in_seconds):
        def delete():
            import time
            time.sleep(expires_in_seconds + 0.5)
            with self.lock:
                if message_id in self.messages:
                    del self.messages[message_id]
        threading.Thread(target=delete, daemon=True).start()

message_manager = TemporaryMessageManager()

@app.route("/")
def index(): return render_template("index.html")

@app.route("/api/messages", methods=["POST"])
def create_message():
    data = request.get_json()
    msg_id = message_manager.send_message(data.get("sender"), data.get("recipient"), data.get("content"), int(data.get("expires_in_seconds", 10)))
    return jsonify({"success": True, "message": message_manager.get_message(msg_id)}), 201

@app.route("/api/messages", methods=["GET"])
def list_messages():
    return jsonify({"messages": message_manager.get_all_messages()}), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)
