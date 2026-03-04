import { useCallback, useEffect, useReducer, useRef } from "react";
import { loadQuestion, warmCache } from "../services/frameService";
import { saveGameSession } from "../services/sessionService";
import { QUESTIONS_PER_GAME, FEEDBACK_DELAY_MS } from "../utils/constants";

const initialState = {
  phase: "start",
  frame: null,
  options: [],
  correctMovieId: null,
  selectedId: null,
  isCorrect: null,
  score: 0,
  questionIndex: 0,
  error: null,
  usedFrameIds: [],
};

function gameReducer(state, action) {
  switch (action.type) {
    case "LOADING":
      return {
        ...state,
        phase: "loading",
        frame: null,
        options: [],
        selectedId: null,
        isCorrect: null,
        error: null,
      };
    case "QUESTION_LOADED":
      return {
        ...state,
        phase: "playing",
        frame: action.frame,
        options: action.options,
        correctMovieId: action.correctMovieId,
        usedFrameIds: [...state.usedFrameIds, action.frame.id],
      };
    case "ANSWER_SELECTED": {
      const isCorrect = action.movieId === state.correctMovieId;
      return {
        ...state,
        phase: "feedback",
        selectedId: action.movieId,
        isCorrect,
        score: state.score + (isCorrect ? 1 : 0),
      };
    }
    case "NEXT_QUESTION":
      return { ...state, questionIndex: state.questionIndex + 1 };
    case "GAME_OVER":
      return { ...state, phase: "gameover" };
    case "ERROR":
      return { ...state, phase: "error", error: action.message };
    case "RESTART":
      return { ...initialState };
    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const timerRef = useRef(null);

  useEffect(() => {
    warmCache().catch(() => {});
  }, []);

  const fetchNextQuestion = useCallback(async (usedFrameIds = []) => {
    dispatch({ type: "LOADING" });
    try {
      const { frame, options, correctMovieId } =
        await loadQuestion(usedFrameIds);
      dispatch({ type: "QUESTION_LOADED", frame, options, correctMovieId });
    } catch (err) {
      dispatch({ type: "ERROR", message: err.message });
    }
  }, []);

  const startGame = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    dispatch({ type: "RESTART" });
    dispatch({ type: "LOADING" });
    fetchNextQuestion([]);
  }, [fetchNextQuestion]);

  const selectAnswer = useCallback(
    (movieId) => {
      if (state.phase !== "playing") return;
      dispatch({ type: "ANSWER_SELECTED", movieId });

      timerRef.current = setTimeout(() => {
        const nextIndex = state.questionIndex + 1;
        if (nextIndex >= QUESTIONS_PER_GAME) {
          dispatch({ type: "GAME_OVER" });
          const isCorrect = movieId === state.correctMovieId;
          const finalScore = state.score + (isCorrect ? 1 : 0);
          saveGameSession({
            score: finalScore,
            totalQuestions: QUESTIONS_PER_GAME,
          });
        } else {
          dispatch({ type: "NEXT_QUESTION" });
          dispatch({ type: "LOADING" });
          fetchNextQuestion([...state.usedFrameIds, state.frame.id]);
        }
      }, FEEDBACK_DELAY_MS);
    },
    [state.phase, state.questionIndex, state.score, state.correctMovieId],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    ...state,
    startGame,
    selectAnswer,
    totalQuestions: QUESTIONS_PER_GAME,
  };
}
