import httpx
import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import json

app = FastAPI()

# Serve static files from the React app build folder
# Check if the build directory and static subdirectory exist before mounting
if os.path.isdir("frontend/build") and os.path.isdir("frontend/build/static"):
    app.mount("/static", StaticFiles(directory="frontend/build/static"))
else:
    print("Warning: 'frontend/build/static' directory not found. Static file serving might not work.")

@app.get("/api/topics")
async def get_topics():
    # In a real app, this would fetch from a database or configuration.
    # For now, returning hardcoded topics that align with LLM capabilities.
    return [
        "Generative AI Models",
        "Large Language Models",
        "Computer Vision",
        "Reinforcement Learning"
    ]

async def generate_content_with_llm(prompt: str):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set")

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent"
    headers = {"Content-Type": "application/json"}
    params = {"key": api_key}
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(url, json=payload, headers=headers, params=params)
            response.raise_for_status()  # Raise an exception for bad status codes
            
            result_json = response.json()
            content = result_json.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            # Attempt to strip markdown code fences
            if content.startswith("```json") and content.endswith("```"):
                content = content[7:-3].strip()
            elif content.startswith("```") and content.endswith("```"):
                content = content[3:-3].strip()

            return json.loads(content)
            
    except (httpx.RequestError, httpx.HTTPStatusError, json.JSONDecodeError, KeyError) as e:
        print(f"LLM API call failed or returned invalid data: {e}")
        # Fallback content
        return [
            {
                "question": "What is a fundamental concept in Machine Learning?",
                "options": ["Supervised Learning", "Quantum Computing", "Blockchain", "Relativity"],
                "correct_answer": "Supervised Learning",
                "explanation": "Supervised learning is a type of machine learning where an algorithm learns from labeled data. The goal is to map input to output based on input-output pairs.",
                "source": "fallback"
            },
            {
                "question": "What does API stand for?",
                "options": ["Application Programming Interface", "Advanced Processing Idea", "Automated Program Integration", "Artificial Protocol Interface"],
                "correct_answer": "Application Programming Interface",
                "explanation": "An API (Application Programming Interface) is a set of definitions and protocols for building and integrating application software. It's how different software components communicate with each other.",
                "source": "fallback"
            }
        ]

@app.get("/api/quiz/{topic}")
async def get_quiz(topic: str):
    prompt = f"Generate 5 current interview quiz questions about {topic} in generative AI, each with a detailed explainable answer, reflecting the latest models and techniques. Respond as a JSON array of {{question: str, options: list[str], correct_answer: str, explanation: str}}. Ensure the options are plausible distractors."
    quiz_data = await generate_content_with_llm(prompt)
    return quiz_data

@app.get("/api/flashcards/concepts/topics")
async def get_concept_flashcard_topics():
    return [
        "Transformers and Attention",
        "Retrieval-Augmented Generation",
        "Fine-tuning vs Prompt Engineering",
        "AI Agents and Tool Use",
        "Embeddings and Vector Search",
        "Model Evaluation and Guardrails"
    ]

@app.get("/api/flashcards/code/topics")
async def get_code_flashcard_topics():
    return [
        "FastAPI Basics",
        "FastAPI Async and Dependencies",
        "Python Fundamentals",
        "React Hooks",
        "React Component Patterns",
        "Calling LLM APIs from Python"
    ]

@app.get("/api/flashcards/concepts/{topic}")
async def get_concept_flashcards(topic: str):
    prompt = f"Generate 6 flashcards that teach the AI concept '{topic}' to someone preparing for a Generative AI / Agentic AI engineering interview. Each flashcard should have a short front-side title/term and a clear, concise back-side explanation (2-4 sentences). Respond as a JSON array of {{title: str, explanation: str}}."
    cards = await generate_content_with_llm(prompt)
    return cards

@app.get("/api/flashcards/code/{topic}")
async def get_code_flashcards(topic: str):
    prompt = f"Generate 6 flashcards that teach '{topic}' (a Python, FastAPI, or React concept) with a practical code snippet. Each flashcard should have a short front-side title, a back-side code snippet (as a string, using \\n for newlines), and a brief explanation of what the snippet demonstrates. Respond as a JSON array of {{title: str, snippet: str, explanation: str}}."
    cards = await generate_content_with_llm(prompt)
    return cards

@app.post("/api/quiz/submit")
async def submit_quiz(submission: dict):
    topic = submission.get("topic")
    user_answers = submission.get("answers", {})

    if not topic or not user_answers:
        raise HTTPException(status_code=400, detail="Invalid submission data.")

    # Re-fetch quiz to get correct answers and explanations for grading
    prompt = f"Generate 5 current interview quiz questions about {topic} in generative AI, each with a detailed explainable answer, reflecting the latest models and techniques. Respond as a JSON array of {{question: str, options: list[str], correct_answer: str, explanation: str}}. Ensure the options are plausible distractors."
    quiz_questions = await generate_content_with_llm(prompt)

    score = 0
    explanations = []

    for i, question_data in enumerate(quiz_questions):
        user_answer = user_answers.get(str(i))
        correct_answer = question_data.get("correct_answer")
        explanation = question_data.get("explanation", "No explanation available.")

        if user_answer is not None and user_answer == correct_answer:
            score += 1
        
        explanations.append({
            "explanation": explanation,
            "source": question_data.get("source", None)
        })

    return {
        "score": score,
        "total_questions": len(quiz_questions),
        "explanations": explanations
    }

# Fallback for serving the React app's index.html
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str = ""):
    # Ensure frontend/build exists before attempting to serve index.html
    if os.path.isdir("frontend/build") and not full_path.startswith("api/"):
        return FileResponse("frontend/build/index.html")
    raise HTTPException(status_code=404, detail="Not Found")
