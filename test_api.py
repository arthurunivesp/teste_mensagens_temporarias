import pytest
from app import app, message_manager
import json
import time

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        # Limpar mensagens antes de cada teste
        message_manager.messages = {}
        message_manager.message_id_counter = 0
        yield client

def test_index_page(client):
    rv = client.get("/")
    assert rv.status_code == 200
    assert b"Mensagens Temporarias" in rv.data

def test_create_message(client):
    data = {
        "sender": "TestSender",
        "recipient": "TestRecipient",
        "content": "Hello, this is a test message!",
        "expires_in_seconds": 5
    }
    rv = client.post("/api/messages", json=data)
    assert rv.status_code == 201
    json_data = json.loads(rv.data)
    assert json_data["success"] == True
    assert "message" in json_data
    assert json_data["message"]["sender"] == "TestSender"
    assert json_data["message"]["content"] == "Hello, this is a test message!"
    assert "id" in json_data["message"]

def test_create_message_missing_content(client):
    data = {
        "sender": "TestSender",
        "recipient": "TestRecipient",
        "expires_in_seconds": 5
    }
    rv = client.post("/api/messages", json=data)
    assert rv.status_code == 400
    json_data = json.loads(rv.data)
    assert json_data["error"] == "Conteúdo da mensagem é obrigatório"

def test_get_message_before_expiration(client):
    # Envia uma mensagem que vai durar 5 segundos
    send_data = {
        "sender": "Alice",
        "recipient": "Bob",
        "content": "Mensagem que deve ser visível",
        "expires_in_seconds": 5
    }
    post_rv = client.post("/api/messages", json=send_data)
    message_id = json.loads(post_rv.data)["message"]["id"]

    # Aguarda um pouco, mas não o suficiente para expirar
    time.sleep(1)

    get_rv = client.get(f"/api/messages/{message_id}")
    assert get_rv.status_code == 200
    json_data = json.loads(get_rv.data)
    assert json_data["content"] == "Mensagem que deve ser visível"

def test_get_message_after_expiration(client):
    # Envia uma mensagem que expira em 1 segundo
    send_data = {
        "sender": "Alice",
        "recipient": "Bob",
        "content": "Mensagem que deve sumir",
        "expires_in_seconds": 1
    }
    post_rv = client.post("/api/messages", json=send_data)
    message_id = json.loads(post_rv.data)["message"]["id"]

    # Aguarda o tempo suficiente para a mensagem expirar
    time.sleep(2)

    get_rv = client.get(f"/api/messages/{message_id}")
    assert get_rv.status_code == 404
    json_data = json.loads(get_rv.data)
    assert json_data["error"] == "Mensagem não encontrada ou expirou"

def test_list_messages(client):
    # Envia algumas mensagens
    client.post("/api/messages", json={
        "sender": "User1", "recipient": "User2", "content": "Msg1", "expires_in_seconds": 10
    })
    client.post("/api/messages", json={
        "sender": "User3", "recipient": "User4", "content": "Msg2", "expires_in_seconds": 10
    })

    rv = client.get("/api/messages")
    assert rv.status_code == 200
    json_data = json.loads(rv.data)
    assert "messages" in json_data
    assert len(json_data["messages"]) == 2

def test_list_messages_with_expired(client):
    # Envia uma mensagem que expira rapidamente
    client.post("/api/messages", json={
        "sender": "UserA", "recipient": "UserB", "content": "ExpiredMsg", "expires_in_seconds": 1
    })
    # Envia uma mensagem que permanece ativa
    client.post("/api/messages", json={
        "sender": "UserC", "recipient": "UserD", "content": "ActiveMsg", "expires_in_seconds": 10
    })

    # Aguarda a primeira mensagem expirar
    time.sleep(2)

    rv = client.get("/api/messages")
    assert rv.status_code == 200
    json_data = json.loads(rv.data)
    assert "messages" in json_data
    assert len(json_data["messages"]) == 1 # Apenas a mensagem ativa deve ser listada
    assert json_data["messages"][0]["content"] == "ActiveMsg"