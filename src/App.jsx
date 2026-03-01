import { useState, useEffect, useCallback } from "react";
import { useGame } from "./hooks/useGame";
import './App.css'

function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "300px",
      }}
    >
      <div className="spinner" />
    </div>
  );
}

function ScoreBar({ score, index, total }) {
  const pct = (index / total) * 100;
  return (
    <div className="score-bar">
      <div className="score-label">
        <span className="score-value">{score}</span>
        <span className="score-text">pts</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="question-counter">
        {index}/{total}
      </div>
    </div>
  );
}

function FrameDisplay({ frame }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => setLoaded(false), [frame.image_url]);

  return (
    <div className="frame-wrapper">
      {!loaded && (
        <div className="frame-skeleton">
          <div className="skeleton-pulse" />
          <div className="skeleton-icon">
            <span className="skeleton-reel">🎞</span>
            <div className="skeleton-dots">
              <div className="skeleton-dot" />
              <div className="skeleton-dot" />
              <div className="skeleton-dot" />
            </div>
            <span className="skeleton-text">Loading frame</span>
          </div>
        </div>
      )}
      <img
        src={frame.image_url}
        alt="Movie frame"
        className={`frame-img ${loaded ? 'frame-visible' : 'frame-hidden'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      {frame.hint && (
        <div className="hint-badge">
          <span>💡</span>
          <span>{frame.hint}</span>
        </div>
      )}
    </div>
  );
}

function OptionButton({ movie, btnState, onSelect }) {
  const classMap = {
    idle: "option-btn opt-idle",
    "selected-correct": "option-btn opt-correct",
    "selected-wrong": "option-btn opt-wrong",
    "reveal-correct": "option-btn opt-reveal",
  };

  return (
    <button
      className={classMap[btnState]}
      onClick={() => onSelect(movie.id)}
      disabled={btnState !== "idle"}
    >
      <span className="opt-title">{movie.title}</span>
      {btnState === "selected-correct" && <span className="opt-icon">✓</span>}
      {btnState === "selected-wrong" && <span className="opt-icon">✗</span>}
      {btnState === "reveal-correct" && <span className="opt-icon">✓</span>}
    </button>
  );
}

function OptionGrid({ options, selectedId, correctMovieId, phase, onSelect }) {
  function getBtnState(movie) {
    if (phase !== "feedback") return "idle";
    if (movie.id === selectedId && movie.id === correctMovieId)
      return "selected-correct";
    if (movie.id === selectedId) return "selected-wrong";
    if (movie.id === correctMovieId) return "reveal-correct";
    return "idle";
  }

  return (
    <div className="option-grid">
      {options.map((m) => (
        <OptionButton
          key={m.id}
          movie={m}
          btnState={getBtnState(m)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function FeedbackBanner({ isCorrect }) {
  return (
    <div className={`feedback-banner ${isCorrect ? "fb-correct" : "fb-wrong"}`}>
      {isCorrect ? "🎬 Correct! Great eye!" : "❌ Not quite..."}
    </div>
  );
}

function StartScreen({ onStart }) {
  return (
    <div className="center-screen">
      <span className="film-reel">🎞</span>
      <h1 className="app-title">
        Cine<span className="title-accent">War</span>
      </h1>
      <p className="app-sub">
        Identify the Telugu movie from a single frame. 10 questions. Can you ace
        it?
      </p>
      <button className="start-btn" onClick={onStart}>
        Start Quiz
      </button>
    </div>
  );
}

function GameOverScreen({ score, total, onRestart }) {
  const pct = Math.round((score / total) * 100);
  const grade =
    pct >= 80
      ? "🏆 Excellent!"
      : pct >= 50
        ? "🎯 Good effort!"
        : "🎬 Keep watching!";

  return (
    <div className="center-screen">
      <div className="go-grade">{grade}</div>
      <div className="go-score">
        {score}
        <span className="go-total">/{total}</span>
      </div>
      <div className="go-pct">{pct}% accuracy</div>
      <div className="go-bar-track">
        <div className="go-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <button className="start-btn" onClick={onRestart}>
        Play Again
      </button>
    </div>
  );
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div className="center-screen">
      <div style={{ fontSize: "3rem" }}>⚠️</div>
      <p style={{ color: "var(--muted)", maxWidth: "280px", lineHeight: 1.6 }}>
        {message || "Something went wrong."}
      </p>
      <button className="start-btn" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export default function App() {
  const {
    phase,
    frame,
    options,
    correctMovieId,
    selectedId,
    isCorrect,
    score,
    questionIndex,
    totalQuestions,
    error,
    startGame,
    selectAnswer,
  } = useGame();

  const showScoreBar = ["loading", "playing", "feedback"].includes(phase);

  return (
    <>
      <div className="app-shell">
        <header className="app-header">
          <div className="logo">
            🎬 <span>CineWar</span>
          </div>
          {showScoreBar && (
            <ScoreBar
              score={score}
              index={questionIndex}
              total={totalQuestions}
            />
          )}
        </header>

        <main className="app-main">
          {phase === "start" && <StartScreen onStart={startGame} />}
          {phase === "loading" && <Spinner />}
          {phase === "error" && (
            <ErrorScreen message={error} onRetry={startGame} />
          )}
          {phase === "gameover" && (
            <GameOverScreen
              score={score}
              total={totalQuestions}
              onRestart={startGame}
            />
          )}

          {(phase === "playing" || phase === "feedback") && frame && (
            <div className="game-area">
              <FrameDisplay frame={frame} />
              {phase === "feedback" && <FeedbackBanner isCorrect={isCorrect} />}
              <OptionGrid
                options={options}
                selectedId={selectedId}
                correctMovieId={correctMovieId}
                phase={phase}
                onSelect={selectAnswer}
              />
            </div>
          )}
        </main>
      </div>
    </>
  );
}
