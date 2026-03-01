# 🎬 CineWar

> A Telugu movie frame guessing game. Identify the movie from a single cinematic frame — 10 questions, 4 options, one shot.

---

## 🖥️ Live Demo

[▶ Play CineWar](https://cine-war1-0.vercel.app/) ← replace with your actual Vercel URL

---

## 📸 Screenshots

> Start Screen → Game Screen → Result Screen

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Hosting | Vercel |
| Styling | Plain CSS with CSS variables |

---

## 🗂️ Folder Structure

```
src/
├── components/
│   ├── ui/           # Reusable primitives (Button, Spinner)
│   ├── game/         # Game-domain components (FrameDisplay, OptionGrid)
│   └── layout/       # AppShell, header
├── hooks/
│   └── useGame.js    # Core game state machine (useReducer)
├── services/
│   ├── supabase.js   # Supabase client singleton
│   ├── frameService.js  # Frame fetching + in-memory cache
│   └── sessionService.js # Game session persistence
├── utils/
│   └── constants.js  # QUESTIONS_PER_GAME, FEEDBACK_DELAY_MS
├── pages/
│   └── GamePage.jsx
├── App.jsx
└── main.jsx
```

---

## 🚀 Getting Started (Local Setup)

### Prerequisites

- Node.js v20+
- npm v10+
- A Supabase account → [supabase.com](https://supabase.com)

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/Mithun20222/CineWar1.0
cd CineWar
npm install
```

---

### Step 2 — Set up Supabase

#### 2a. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it `CineWar`, pick region closest to you
3. Save your database password

#### 2b. Run the database schema
Go to **SQL Editor** in your Supabase dashboard and run:

```sql
-- Movies table
CREATE TABLE movies (
  id            BIGSERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  release_year  SMALLINT,
  difficulty    SMALLINT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3)
);

CREATE INDEX idx_movies_difficulty ON movies(difficulty);

-- Frames table
CREATE TABLE frames (
  id          BIGSERIAL PRIMARY KEY,
  movie_id    BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  hint        TEXT,
  blur_level  SMALLINT DEFAULT 0 CHECK (blur_level BETWEEN 0 AND 10)
);

CREATE INDEX idx_frames_movie_id ON frames(movie_id);

-- Game sessions table
CREATE TABLE game_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score           SMALLINT NOT NULL DEFAULT 0,
  total_questions SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

#### 2c. Set up Row Level Security (RLS)

```sql
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read movies" ON movies FOR SELECT USING (true);
CREATE POLICY "Public read frames" ON frames FOR SELECT USING (true);
CREATE POLICY "Public insert sessions" ON game_sessions FOR INSERT WITH CHECK (true);
```

#### 2d. Create Storage bucket
1. Go to **Storage** → New bucket
2. Name: `frames`
3. Toggle **Public bucket** ON

#### 2e. Seed movies

```sql
INSERT INTO movies (title, release_year, difficulty) VALUES
  ('Baahubali: The Beginning', 2015, 1),
  ('Arjun Reddy', 2017, 2),
  ('Magadheera', 2009, 1),
  ('Pushpa: The Rise', 2021, 1),
  ('RRR', 2022, 1);
-- Add more as needed
```

#### 2f. Upload frames
1. Go to **Storage → frames bucket** → Upload files
2. Use naming convention: `movie-name-1.webp`, `movie-name-2.webp`
3. Compress images at [squoosh.app](https://squoosh.app) → WebP, 75% quality, under 200KB each
4. Copy the public URL of each uploaded file

#### 2g. Insert frames into DB

```sql
INSERT INTO frames (movie_id, image_url, hint, blur_level) VALUES
  (1, 'https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/frames/baahubali-1.webp', 'Epic mythological kingdom', 0),
  (1, 'https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/frames/baahubali-2.webp', 'Epic mythological kingdom', 0);
-- Repeat for each movie
```

> ⚠️ Only add movies that have at least one frame uploaded. Movies with no frames will cause blank image issues.

---

### Step 3 — Configure environment variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: **Supabase Dashboard → Project Settings → API**

> Never commit your `.env` file. It is already in `.gitignore`.

---

### Step 4 — Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🌐 Deploying to Vercel

### Option A — Via Vercel Dashboard (recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Add New Project
3. Import your GitHub repository
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**

Every `git push` to `main` will auto-deploy.

### Option B — Via CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts and add your environment variables when asked.

---

## ➕ Adding More Movies

Every time you want to add new movies:

1. Take a screenshot from the movie (VLC → `Shift+S`)
2. Compress at [squoosh.app](https://squoosh.app) → WebP, 75%
3. Upload to **Supabase Storage → frames bucket**
4. Copy the public URL
5. Insert into `movies` table if not already there
6. Insert into `frames` table with the correct `movie_id` and URL

```sql
-- Add movie
INSERT INTO movies (title, release_year, difficulty)
VALUES ('Movie Name', 2023, 1);

-- Check its ID
SELECT id, title FROM movies ORDER BY id DESC LIMIT 1;

-- Add frames
INSERT INTO frames (movie_id, image_url, hint, blur_level) VALUES
  (NEW_ID, 'https://...supabase.co/storage/v1/object/public/frames/movie-name-1.webp', 'Your hint here', 0),
  (NEW_ID, 'https://...supabase.co/storage/v1/object/public/frames/movie-name-2.webp', 'Your hint here', 0);
```

---

## ⚙️ Configuration

| Constant | File | Default | Description |
|---|---|---|---|
| `QUESTIONS_PER_GAME` | `utils/constants.js` | `10` | Number of questions per game |
| `FEEDBACK_DELAY_MS` | `utils/constants.js` | `1800` | How long to show correct/wrong feedback |
| `CACHE_TTL_MS` | `services/frameService.js` | `300000` | Movies cache duration (5 min) |

---

## 🎮 How the Game Works

1. User clicks **Start Quiz**
2. App fetches a random frame from Supabase using offset-based random (no `ORDER BY RANDOM()`)
3. 3 wrong movie options are picked from the in-memory movies cache
4. All 4 options are shuffled and displayed
5. User selects an answer — correct/wrong feedback shown for 1.8 seconds
6. Next question loads automatically
7. After 10 questions, game over screen shows score and accuracy
8. Game session is saved to Supabase `game_sessions` table

---

## 🔧 Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Blank image appears | Movie has no frames in DB | Only insert movies that have uploaded frames |
| "Missing Supabase env vars" | `.env` file missing or wrong location | Place `.env` in project root next to `package.json` |
| Images 404 | Wrong URL in DB or file not uploaded | Open the URL directly in browser to verify |
| Options don't show | Less than 4 movies in DB | Add at least 10 movies for good variety |
| RLS blocks reads | Missing SELECT policies | Re-run the RLS policy SQL |
| Supabase unreachable (India) | ISP DNS block | Use Cloudflare DNS `1.1.1.1` or a VPN |

---

## 📄 License

MIT — feel free to fork and build your own movie quiz for any film industry.

---

<p align="center">Made with ❤️‍🔥 by <strong>Mithun</strong> for his love of cinema 🎬</p>