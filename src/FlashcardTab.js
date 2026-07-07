import React, { useState, useEffect } from 'react';

function FlashcardTab({ topicsUrl, cardsUrlPrefix, mode }) {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState({});
  const [cardIndex, setCardIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTopics([]);
    setSelectedTopic(null);
    setCards([]);
    setError(null);
    fetch(topicsUrl)
      .then((res) => res.json())
      .then((data) => setTopics(data))
      .catch(() => setError('Could not load topics. Please refresh the page.'));
  }, [topicsUrl]);

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setLoading(true);
    setError(null);
    setFlipped({});
    setCardIndex(0);

    fetch(`${cardsUrlPrefix}/${encodeURIComponent(topic)}`)
      .then((res) => res.json())
      .then((data) => {
        setCards(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load flashcards. Please try again.');
        setLoading(false);
      });
  };

  const handleReset = () => {
    setSelectedTopic(null);
    setCards([]);
    setFlipped({});
    setCardIndex(0);
  };

  const toggleFlip = (index) => {
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (!selectedTopic) {
    return (
      <section className="topic-picker">
        <h2>Choose a topic</h2>
        <div className="topic-grid">
          {topics.length === 0 && !error && <p className="muted">Loading topics…</p>}
          {topics.map((topic) => (
            <button key={topic} className="topic-card" onClick={() => handleTopicSelect(topic)}>
              <span className="topic-name">{topic}</span>
              <span className="topic-arrow">→</span>
            </button>
          ))}
        </div>
        {error && <p className="error-banner">{error}</p>}
      </section>
    );
  }

  const card = cards[cardIndex];

  return (
    <section className="quiz-section">
      <div className="quiz-toolbar">
        <button className="link-button" onClick={handleReset}>
          ← Back to topics
        </button>
        <h2>{selectedTopic}</h2>
        {cards.length > 0 && (
          <span className="progress-pill">
            {cardIndex + 1} / {cards.length}
          </span>
        )}
      </div>

      {loading && <p className="muted">Generating flashcards…</p>}
      {error && <p className="error-banner">{error}</p>}

      {!loading && card && (
        <>
          <div className={`flashcard ${flipped[cardIndex] ? 'is-flipped' : ''}`} onClick={() => toggleFlip(cardIndex)}>
            <div className="flashcard-inner">
              <div className="flashcard-face flashcard-front">
                <span className="flashcard-hint">Tap to reveal</span>
                <h3>{card.title}</h3>
              </div>
              <div className="flashcard-face flashcard-back">
                {mode === 'code' && card.snippet && (
                  <pre className="code-snippet">
                    <code>{card.snippet}</code>
                  </pre>
                )}
                <p className="explanation-text">{card.explanation}</p>
              </div>
            </div>
          </div>

          <div className="flashcard-nav">
            <button
              className="secondary-button"
              onClick={() => setCardIndex((i) => Math.max(0, i - 1))}
              disabled={cardIndex === 0}
            >
              ← Previous
            </button>
            <button
              className="secondary-button"
              onClick={() => setCardIndex((i) => Math.min(cards.length - 1, i + 1))}
              disabled={cardIndex === cards.length - 1}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default FlashcardTab;
