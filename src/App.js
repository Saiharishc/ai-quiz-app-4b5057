import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    fetch('/api/topics')
      .then((res) => res.json())
      .then((data) => setTopics(data))
      .catch(() => setError('Could not load topics. Please refresh the page.'));
  }, []);

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setLoading(true);
    setError(null);
    setAnswers({});
    setRevealed({});

    fetch(`/api/quiz/${encodeURIComponent(topic)}`)
      .then((res) => res.json())
      .then((data) => {
        setQuiz(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load quiz questions. Please try again.');
        setLoading(false);
      });
  };

  const handleSelectOption = (questionIndex, option) => {
    if (revealed[questionIndex]) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: option }));
    setRevealed((prev) => ({ ...prev, [questionIndex]: true }));
  };

  const allAnswered = quiz.length > 0 && quiz.every((_, i) => answers[i] !== undefined);
  const score = quiz.reduce(
    (acc, q, i) => acc + (answers[i] === q.correct_answer ? 1 : 0),
    0
  );

  const handleReset = () => {
    setSelectedTopic(null);
    setQuiz([]);
    setAnswers({});
    setRevealed({});
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <span className="logo-badge">AI</span>
          <div>
            <h1>Generative AI Interview Quiz</h1>
            <p className="subtitle">Fresh, live-generated questions for your next AI interview</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        {!selectedTopic && (
          <section className="topic-picker">
            <h2>Choose a topic to start</h2>
            <div className="topic-grid">
              {topics.length === 0 && !error && (
                <p className="muted">Loading topics…</p>
              )}
              {topics.map((topic) => (
                <button
                  key={topic}
                  className="topic-card"
                  onClick={() => handleTopicSelect(topic)}
                >
                  <span className="topic-name">{topic}</span>
                  <span className="topic-arrow">→</span>
                </button>
              ))}
            </div>
            {error && <p className="error-banner">{error}</p>}
          </section>
        )}

        {selectedTopic && (
          <section className="quiz-section">
            <div className="quiz-toolbar">
              <button className="link-button" onClick={handleReset}>
                ← Back to topics
              </button>
              <h2>{selectedTopic}</h2>
              {quiz.length > 0 && (
                <span className="progress-pill">
                  {Object.keys(answers).length} / {quiz.length} answered
                </span>
              )}
            </div>

            {loading && <p className="muted">Generating your quiz…</p>}
            {error && <p className="error-banner">{error}</p>}

            {!loading &&
              quiz.map((q, index) => {
                const userAnswer = answers[index];
                const isRevealed = !!revealed[index];
                const isCorrect = userAnswer === q.correct_answer;

                return (
                  <div key={index} className="question-card">
                    <div className="question-header">
                      <span className="question-number">Q{index + 1}</span>
                      <h3>{q.question}</h3>
                    </div>

                    <div className="options-grid">
                      {q.options &&
                        q.options.map((option) => {
                          let optionClass = 'option-button';
                          if (isRevealed) {
                            if (option === q.correct_answer) {
                              optionClass += ' option-correct';
                            } else if (option === userAnswer) {
                              optionClass += ' option-incorrect';
                            } else {
                              optionClass += ' option-disabled';
                            }
                          }
                          return (
                            <button
                              key={option}
                              className={optionClass}
                              onClick={() => handleSelectOption(index, option)}
                              disabled={isRevealed}
                            >
                              {option}
                            </button>
                          );
                        })}
                    </div>

                    {isRevealed && (
                      <div className={`explanation-panel ${isCorrect ? 'is-correct' : 'is-incorrect'}`}>
                        <div className="explanation-result">
                          {isCorrect ? '✓ Correct' : `✗ Correct answer: ${q.correct_answer}`}
                        </div>
                        <p className="explanation-text">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}

            {!loading && quiz.length > 0 && allAnswered && (
              <div className="score-summary">
                <h3>Your score</h3>
                <p className="score-value">
                  {score} / {quiz.length}
                </p>
                <button className="primary-button" onClick={handleReset}>
                  Try another topic
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
