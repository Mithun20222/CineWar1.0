import { supabase } from "./supabase";

let _moviesWithFramesCache = null;
let _allMoviesCache = null;
let _frameCount = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getFrameCount() {
  const now = Date.now();
  if (_frameCount !== null && now - _cacheTimestamp < CACHE_TTL_MS) {
    return _frameCount;
  }

  const { count, error } = await supabase
    .from("frames")
    .select("*", { count: "exact", head: true })
    .not("image_url", "is", null);

  if (error) throw new Error(`Frame count query failed: ${error.message}`);
  if (!count) throw new Error("No frames found in database.");

  _frameCount = count;
  _cacheTimestamp = now;
  return _frameCount;
}

async function getAllMovies() {
  const now = Date.now();
  if (_allMoviesCache && now - _cacheTimestamp < CACHE_TTL_MS) {
    return _allMoviesCache;
  }

  const { data, error } = await supabase
    .from("movies")
    .select("id, title, release_year, difficulty");

  if (error) throw new Error(`Movies fetch failed: ${error.message}`);
  if (!data?.length) throw new Error("No movies found in database.");

  _allMoviesCache = data;
  return _allMoviesCache;
}

async function getMoviesWithFrames() {
  const now = Date.now();
  if (_moviesWithFramesCache && now - _cacheTimestamp < CACHE_TTL_MS) {
    return _moviesWithFramesCache;
  }

  const { data, error } = await supabase
    .from("frames")
    .select("movie_id")
    .not("image_url", "is", null);

  if (error)
    throw new Error(`Movies with frames query failed: ${error.message}`);

  const validIds = [...new Set(data.map((f) => f.movie_id))];
  _moviesWithFramesCache = validIds;
  _cacheTimestamp = now;
  return _moviesWithFramesCache;
}

function buildQuestion(frame, correctMovie, allMovies) {
  const pool = allMovies.filter((m) => m.id !== correctMovie.id);

  for (let i = pool.length - 1; i > pool.length - 4; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const wrong = pool.slice(pool.length - 3);

  const options = [correctMovie, ...wrong];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return { frame, options, correctMovieId: correctMovie.id };
}

export async function loadQuestion(usedFrameIds = []) {
  const [count, allMovies, validMovieIds] = await Promise.all([
    getFrameCount(),
    getAllMovies(),
    getMoviesWithFrames(),
  ]);

  let frame = null;
  let correctMovie = null;
  let attempts = 0;

  while (!correctMovie && attempts < 10) {
    attempts++;
    const offset = Math.floor(Math.random() * count);

    const { data: frames, error } = await supabase
      .from("frames")
      .select("id, movie_id, image_url, hint, blur_level")
      .not("image_url", "is", null)
      .range(offset, offset);

    if (error || !frames?.length) continue;

    const candidate = frames[0];

    if (usedFrameIds.includes(candidate.id)) continue;

    if (validMovieIds.includes(candidate.movie_id)) {
      frame = candidate;
      correctMovie = allMovies.find((m) => m.id === frame.movie_id);
    }
  }

  if (!frame || !correctMovie) {
    throw new Error("Could not load a valid question. Please add more frames.");
  }

  return buildQuestion(frame, correctMovie, allMovies);
}

export async function warmCache() {
  await Promise.all([getFrameCount(), getAllMovies(), getMoviesWithFrames()]);
}
