from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
import math


# Initialize FastAPI app
app = FastAPI()


# Models and Pipelines

# 1. Question Generation (QG)
qg_model = "ZhangCheng/T5-Base-Fine-Tuned-for-Question-Generation"
qg_tokenizer = "ZhangCheng/T5-Base-Fine-Tuned-for-Question-Generation"
qg_pipeline = pipeline("text2text-generation", model=qg_model, tokenizer=qg_tokenizer)

# 2. Question Answering (QA)
qa_pipeline = pipeline("question-answering", model="mrm8488/spanbert-finetuned-squadv1", tokenizer="mrm8488/spanbert-finetuned-squadv1")

# 3. Title Generation
title_model = "Michau/t5-base-en-generate-headline"
title_tokenizer = "Michau/t5-base-en-generate-headline"
title_pipeline = pipeline("text2text-generation", model=title_model, tokenizer=title_tokenizer)

# Input Model for Request
class TextInput(BaseModel):
    text: str


# Generate Q&A Pairs
@app.post("/generate_qa")
async def generate_qa(input: TextInput):
    # Determine number of questions to generate based on character count of input text
    #  - If input text exceeds 1500 characters, then generate 15 questions 
    #  - Else, calculate the number of questions as max(3, ((character_count // 100) + 1))
    num_q = 15 if len(input.text) > 1500 else max((math.floor(len(input.text)/100)) + 1, 3)

    # Generate and extract questions
    generated_questions = qg_pipeline(
        f"generate questions: {input.text}",
        max_length=40,
        num_return_sequences=num_q,
        do_sample=True,
        top_k=30,
        top_p=0.95,
    )

    generated_questions = [q['generated_text'] for q in generated_questions]

    # Generate answers and form flashcards
    flashcards = []
    for question in generated_questions:
        result = qa_pipeline(question=question, context=input.text)
        if result['score'] > 0.2:
            flashcards.append({"question": question, "answer": result['answer']})

    return flashcards


# Generate Deck Title
@app.post("/generate_deck_title")
async def generate_deck_title(input: TextInput):
    # Generate title using title pipeline
    generated_title = title_pipeline(
        f"headline: {input.text}",
        max_length=20,
        num_beams=3,
        early_stopping=True,
        num_return_sequences=1,
    )

    # Extract generated title
    title = generated_title[0]['generated_text'].replace("<pad>", "").strip()

    return {"title": title}
