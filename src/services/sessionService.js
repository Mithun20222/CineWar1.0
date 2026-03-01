import { supabase } from './supabase';

export async function saveGameSession({ score, totalQuestions }) {
  const { error } = await supabase
    .from('game_sessions')
    .insert({ score, total_questions: totalQuestions });

  if (error) {
    console.warn('Failed to save game session:', error.message);
  }
}