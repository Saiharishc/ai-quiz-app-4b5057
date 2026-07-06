import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetch('/api/topics')
      .then(res => res.json())
      .then(data => setTopics(data))
      .catch(err => console.error('Error fetching topics:', err));
  }, []);

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    fetch(`/api/quiz/${topic}`)
      .then(res => res.json())
      .then(data => {
        setQuiz(data);
        setAnswers({});
        setResults(null);
      })
      .catch(err => console.error(`Error fetching quiz for ${topic}:`, err));
  };

  const handleAnswerChange = (questionIndex, selectedOption) => {
    setAnswers({
      ...answers,
      [questionIndex]: selectedOption
    });
  };

  const handleSubmitQuiz = () => {
    fetch('/api/quiz/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic: selectedTopic, answers: answers }),
    })
      .then(res => res.json())
      .then(data => setResults(data))
      .catch(err => console.error('Error submitting quiz:', err));
  };

  return (
    <div className="App">
      <h1>AI Quiz App</h1>

      {!selectedTopic && (
        <div>
          <h2>Select a Topic</h2>
          <ul>
            {topics.map((topic, index) => (
              <li key={index}>
                <button onClick={() => handleTopicSelect(topic)}>{topic}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedTopic && !results && (
        <div>
          <h2>Quiz on {selectedTopic}</h2>
          {quiz.map((q, index) => (
            <div key={index} className="question-block">
              <h3>{q.question}</h3>
              {q.options && (
                <div className="options-container">
                  {q.options.map((option, optionIndex) => (
                    <label key={optionIndex}>
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option}
                        checked={answers[index] === option}
                        onChange={() => handleAnswerChange(index, option)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button onClick={handleSubmitQuiz} disabled={quiz.length === 0}>Submit Answers</button>
        </div>
      )}

      {results && (
        <div>
          <h2>Quiz Results</h2>
          <p>Score: {results.score} / {quiz.length}</p>
          <h3>Explanations:</h3>
          {results.explanations.map((explanation, index) => (
            <div key={index} className="explanation-block">
              <h4>Question {index + 1}:</h4>
              <p>Your Answer: {answers[index] || 'Not answered'}</p>
              <p>Correct Answer: {quiz[index].correct_answer}</p>
              <p><strong>Explanation:</strong> {explanation}</p>
              {explanation.source && <p><em>Source: {explanation.source}</em></p>}
            </div>
          ))}
          <button onClick={() => setSelectedTopic(null)}>Choose Another Topic</button>
        </div>
      )}
    </div>
  );
}

export default App;
