import React, { useState } from 'react';
import './App.css';
import QuizTab from './QuizTab';
import FlashcardTab from './FlashcardTab';

const TABS = [
  { id: 'quiz', label: 'Quiz Dashboard' },
  { id: 'ai-concepts', label: 'AI Concept Flashcards' },
  { id: 'code-flashcards', label: 'Code Flashcards' },
];

function App() {
  const [activeTab, setActiveTab] = useState('quiz');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <span className="logo-badge">AI</span>
          <div>
            <h1>Generative AI Interview Quiz</h1>
            <p className="subtitle">Fresh, live-generated questions and flashcards for your next AI interview</p>
          </div>
        </div>
      </header>

      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeTab === 'quiz' && <QuizTab />}
        {activeTab === 'ai-concepts' && (
          <FlashcardTab
            topicsUrl="/api/flashcards/concepts/topics"
            cardsUrlPrefix="/api/flashcards/concepts"
            mode="concept"
          />
        )}
        {activeTab === 'code-flashcards' && (
          <FlashcardTab
            topicsUrl="/api/flashcards/code/topics"
            cardsUrlPrefix="/api/flashcards/code"
            mode="code"
          />
        )}
      </main>
    </div>
  );
}

export default App;
