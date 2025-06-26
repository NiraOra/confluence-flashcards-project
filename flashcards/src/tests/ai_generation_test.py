import pytest
from fastapi.testclient import TestClient
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))
from flashcards import app

client = TestClient(app)

# NOTE: python tests pass as edge cases are handled in airesolvers.test.ts


def test_generate_qa_success():
    # Sample input
    input_data = {"text": "The tiger is the largest cat species. Tigers are apex predators."}
    
    # Call the FastAPI endpoint
    response = client.post("/generate_qa", json=input_data)
    
    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)  # Output should be a list of Q&A pairs
    assert len(data) > 0  # Ensure some Q&A pairs are returned
    for qa_pair in data:
        assert "question" in qa_pair
        assert "answer" in qa_pair


def test_generate_deck_title_success():
    # Sample input
    input_data = {"text": "This article explains the history of AI and its applications in healthcare."}
    
    # Call the FastAPI endpoint
    response = client.post("/generate_deck_title", json=input_data)
    
    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert isinstance(data["title"], str)
    assert len(data["title"]) > 0  # Ensure the title is not empty
