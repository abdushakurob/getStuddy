# Studdy - Implementation Plan

## 🎯 Vision Summary

**Studdy** is an AI study companion that mirrors the student's focus and growth. It's a "Digital Colosseum" where students test their limits, grow their Buddy, and feel the rush of progress.

### Core Concepts
- **Studdy**: Your companion character whose "health/light" reflects your focus and performance
- **XP (Fuel)**: Study time converts to XP, levels you up
- **Credits (Refinement)**: Consumed when using AI features, can be earned or converted from XP
- **Battles**: Boss fights per course - comprehensive exams that award massive XP and evolve Studdy

---

## 🏗️ Technical Architecture

### Tech Stack

```
FRONTEND
├── Next.js 15 (App Router) + TypeScript
├── Tailwind CSS + shadcn/ui
├── Framer Motion (animations)
├── Zustand (state management)
└── Recharts (progress visualization)

BACKEND
├── Next.js API Routes (Route Handlers)
├── Supabase
│   ├── PostgreSQL (database)
│   ├── Auth (authentication)
│   └── Storage (file uploads)
└── Google Gemini API (AI)

DEPLOYMENT
├── Vercel (frontend + API)
└── Supabase (backend services)
```

### Project Structure

```
studdy/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx                    # Main dashboard
│   │   ├── courses/
│   │   │   ├── page.tsx                # All courses
│   │   │   ├── new/
│   │   │   │   └── page.tsx            # Create course
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Course detail
│   │   │       ├── study/
│   │   │       │   └── page.tsx        # Study session
│   │   │       └── battle/
│   │   │           └── page.tsx        # Boss battle
│   │   ├── progress/
│   │   │   └── page.tsx                # XP, levels, achievements
│   │   ├── exchange/
│   │   │   └── page.tsx                # XP ↔ Credits
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── courses/
│   │   ├── documents/
│   │   ├── study/
│   │   ├── battle/
│   │   └── ai/
│   ├── layout.tsx
│   ├── page.tsx                        # Landing page
│   └── globals.css
├── components/
│   ├── ui/                             # shadcn components
│   ├── studdy/
│   │   ├── StuddyAvatar.tsx            # The Buddy visual
│   │   ├── StuddyGlow.tsx              # Focus/health indicator
│   │   └── StuddyEvolution.tsx         # Evolution states
│   ├── dashboard/
│   │   ├── TopBar.tsx                  # Credits, XP, Level, Streak
│   │   ├── DailySuggestion.tsx         # AI study recommendation
│   │   └── QuickStats.tsx
│   ├── course/
│   │   ├── CourseCard.tsx
│   │   ├── DocumentUploader.tsx
│   │   ├── TopicGrid.tsx
│   │   └── TopicMastery.tsx
│   ├── study/
│   │   ├── ChatInterface.tsx           # Conversational UI
│   │   ├── QuestionCard.tsx
│   │   ├── ExplanationCard.tsx
│   │   └── SessionProgress.tsx
│   ├── battle/
│   │   ├── BossIntro.tsx
│   │   ├── BattleArena.tsx
│   │   ├── FlashcardBattle.tsx
│   │   ├── MultiChoiceBattle.tsx
│   │   └── BattleResults.tsx
│   ├── gamification/
│   │   ├── XPBar.tsx
│   │   ├── CreditCounter.tsx
│   │   ├── StreakFlame.tsx
│   │   ├── LevelBadge.tsx
│   │   └── AchievementToast.tsx
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── AnimatedCounter.tsx
│       └── ConfettiCelebration.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   ├── server.ts                   # Server client
│   │   └── middleware.ts               # Auth middleware
│   ├── ai/
│   │   ├── gemini.ts                   # Gemini client
│   │   ├── prompts/
│   │   │   ├── topic-extraction.ts
│   │   │   ├── study-session.ts
│   │   │   ├── question-generation.ts
│   │   │   └── battle-generation.ts
│   │   └── tools/                      # AI tool definitions
│   ├── gamification/
│   │   ├── xp-calculator.ts
│   │   ├── credit-calculator.ts
│   │   ├── level-thresholds.ts
│   │   ├── streak-manager.ts
│   │   └── achievements.ts
│   └── utils/
│       ├── pdf-parser.ts
│       └── date-helpers.ts
├── stores/
│   ├── user-store.ts                   # User state (XP, credits, level)
│   ├── session-store.ts                # Active study session
│   └── studdy-store.ts                 # Studdy's visual state
├── types/
│   ├── database.ts                     # Supabase types
│   ├── user.ts
│   ├── course.ts
│   ├── study.ts
│   └── battle.ts
├── hooks/
│   ├── useUser.ts
│   ├── useCourses.ts
│   ├── useStudySession.ts
│   ├── useBattle.ts
│   └── useStuddy.ts                    # Studdy's state/animations
└── public/
    ├── studdy/                         # Studdy visual assets
    └── sounds/                         # Audio feedback
```

---

## 📊 Database Schema

### Core Tables

```sql
-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  
  -- Gamification
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  total_credits INTEGER DEFAULT 100,
  
  -- Studdy State
  studdy_evolution INTEGER DEFAULT 1,      -- 1-5 evolution stages
  studdy_glow INTEGER DEFAULT 100,         -- 0-100 (focus/health)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks
CREATE TABLE public.streaks (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  streak_multiplier DECIMAL(3,2) DEFAULT 1.00
);

-- ============================================
-- COURSES & CONTENT
-- ============================================

-- Courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',           -- Course accent color
  exam_date DATE,
  
  -- Progress
  mastery_percentage INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0,      -- in minutes
  
  -- Battle
  boss_defeated BOOLEAN DEFAULT FALSE,
  boss_attempts INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,                 -- Supabase storage path
  file_size INTEGER,
  file_type TEXT,                          -- 'lecture', 'past_question', 'notes', 'other'
  
  -- Processing
  processed BOOLEAN DEFAULT FALSE,
  extracted_text TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics (AI-extracted)
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  key_concepts JSONB,                      -- Array of key concepts
  
  -- Mastery
  mastery_level INTEGER DEFAULT 0,         -- 0-100%
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  
  last_studied TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STUDY SESSIONS
-- ============================================

-- Study Sessions
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  
  -- Session Data
  session_type TEXT NOT NULL,              -- 'study', 'practice', 'review'
  duration_minutes INTEGER DEFAULT 0,
  
  -- Performance
  questions_asked INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  focus_score INTEGER DEFAULT 100,         -- Affects Studdy's glow
  
  -- Rewards
  xp_earned INTEGER DEFAULT 0,
  credits_earned INTEGER DEFAULT 0,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Chat Messages (for study sessions)
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL,                      -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  
  -- If it's a question
  is_question BOOLEAN DEFAULT FALSE,
  user_answer TEXT,
  is_correct BOOLEAN,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BATTLES (Boss Fights)
-- ============================================

-- Battles
CREATE TABLE public.battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  
  -- Battle Config
  difficulty TEXT DEFAULT 'normal',        -- 'easy', 'normal', 'hard', 'boss'
  total_questions INTEGER NOT NULL,
  
  -- Progress
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  current_question JSONB,
  
  -- Results
  victory BOOLEAN,
  xp_earned INTEGER DEFAULT 0,
  credits_earned INTEGER DEFAULT 0,
  studdy_evolution_gained BOOLEAN DEFAULT FALSE,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Battle Questions
CREATE TABLE public.battle_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  
  question_type TEXT NOT NULL,             -- 'flashcard', 'multiple_choice', 'short_answer'
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  options JSONB,                           -- For multiple choice
  explanation TEXT,
  
  -- User Response
  user_answer TEXT,
  is_correct BOOLEAN,
  time_taken INTEGER,                      -- seconds
  
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GAMIFICATION & TRANSACTIONS
-- ============================================

-- XP Transactions
CREATE TABLE public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  amount INTEGER NOT NULL,                 -- Positive = earned, Negative = spent
  transaction_type TEXT NOT NULL,          -- 'study', 'battle_win', 'streak', 'converted'
  description TEXT,
  
  -- Reference
  reference_type TEXT,                     -- 'session', 'battle', 'achievement'
  reference_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Transactions
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  amount INTEGER NOT NULL,                 -- Positive = earned, Negative = spent
  transaction_type TEXT NOT NULL,          -- 'earned', 'spent', 'converted_from_xp'
  description TEXT,
  
  -- Reference
  reference_type TEXT,
  reference_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE public.achievements (
  id TEXT PRIMARY KEY,                     -- e.g., 'first_steps', 'week_warrior'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common'             -- 'common', 'rare', 'epic', 'legendary'
);

-- User Achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_courses_user ON public.courses(user_id);
CREATE INDEX idx_documents_course ON public.documents(course_id);
CREATE INDEX idx_topics_course ON public.topics(course_id);
CREATE INDEX idx_sessions_user ON public.study_sessions(user_id);
CREATE INDEX idx_sessions_course ON public.study_sessions(course_id);
CREATE INDEX idx_battles_user ON public.battles(user_id);
CREATE INDEX idx_battles_course ON public.battles(course_id);
CREATE INDEX idx_xp_transactions_user ON public.xp_transactions(user_id);
CREATE INDEX idx_credit_transactions_user ON public.credit_transactions(user_id);
```

---

## 🎮 Gamification System

### XP (Fuel) - Earning

| Action | XP Earned |
|--------|-----------|
| Complete 5-min study session | +50 XP |
| Answer question correctly | +10 XP |
| Master a topic (90%+) | +200 XP |
| Maintain daily streak | +25 XP × multiplier |
| Upload course materials | +10 XP |
| Win a battle (normal) | +300 XP |
| Win a boss battle | +500 XP |
| First boss defeat (per course) | +1000 XP |

### Streak Multipliers

| Streak Days | Multiplier |
|-------------|------------|
| 1-6 days | 1.0x |
| 7-13 days | 1.2x |
| 14-29 days | 1.5x |
| 30+ days | 2.0x |

### Credits (Refinement) - Economy

**Earning:**
| Action | Credits Earned |
|--------|----------------|
| Complete study session | +10 credits |
| Answer correctly | +3 credits |
| Win battle | +50 credits |
| Daily login bonus | +20 credits |
| Convert from XP | 10 XP → 1 credit |

**Spending:**
| AI Feature | Credits Cost |
|------------|--------------|
| Quick explanation | 2 credits |
| Detailed explanation | 5 credits |
| Generate 5 practice questions | 10 credits |
| Create study plan | 15 credits |
| Start battle | 20 credits |
| AI chat message | 3 credits |

### Level Thresholds

```javascript
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2100,   // Level 7
  2800,   // Level 8
  3600,   // Level 9
  4500,   // Level 10
  // ... exponential growth
];
```

### Studdy Evolution

| Level Range | Evolution Stage | Visual |
|-------------|-----------------|--------|
| 1-10 | Spark | Base glow |
| 11-25 | Ember | Brighter, subtle animations |
| 26-50 | Flame | Dynamic effects |
| 51-75 | Blaze | Intense visuals |
| 76-100 | Inferno | Legendary appearance |

---

## 📅 Build Phases

### Phase 1: Foundation (Day 1-2)
- [x] Project setup (Next.js 15 + TypeScript)
- [ ] Tailwind CSS + shadcn/ui setup
- [ ] Supabase project + database schema
- [ ] Authentication (signup/login)
- [ ] Basic layouts and navigation
- [ ] Design system (colors, typography, components)

### Phase 2: Core Features (Day 3-5)
- [ ] Dashboard with TopBar (XP, Credits, Level, Streak)
- [ ] Course CRUD (create, list, view)
- [ ] Document upload (Supabase Storage)
- [ ] PDF text extraction
- [ ] AI topic extraction (Gemini)
- [ ] Studdy avatar component (basic glow states)

### Phase 3: Study Experience (Day 6-8)
- [ ] Study session interface
- [ ] Conversational AI chat
- [ ] Question generation
- [ ] Real-time XP/Credit feedback
- [ ] Focus tracking (Studdy's glow)
- [ ] Session completion

### Phase 4: Battle System (Day 9-10)
- [ ] Battle initiation (per course)
- [ ] Question types (flashcard, multiple choice)
- [ ] Battle UI with timer
- [ ] Victory/defeat screens
- [ ] Rewards distribution
- [ ] Studdy evolution on boss win

### Phase 5: Polish (Day 11-12)
- [ ] Animations (Framer Motion)
- [ ] Progress page
- [ ] Exchange page (XP ↔ Credits)
- [ ] Achievements system
- [ ] Responsive design
- [ ] Error handling
- [ ] Production deployment

---

## 🎨 Design System

### Color Palette

```css
/* Primary - Indigo/Purple (AI, wisdom) */
--primary-50: #eef2ff;
--primary-500: #6366f1;
--primary-600: #4f46e5;
--primary-900: #312e81;

/* Accent - Amber/Gold (XP, achievements) */
--accent-50: #fffbeb;
--accent-500: #f59e0b;
--accent-600: #d97706;

/* Success - Emerald (correct, wins) */
--success-500: #10b981;
--success-600: #059669;

/* Danger - Rose (wrong, loss) */
--danger-500: #f43f5e;
--danger-600: #e11d48;

/* Studdy Glow Colors */
--studdy-full: #a855f7;      /* Purple glow at 100% */
--studdy-medium: #8b5cf6;    /* Dimmer at 50-99% */
--studdy-low: #6b7280;       /* Gray when struggling */
--studdy-critical: #ef4444;  /* Red flash when very low */

/* Background (Dark Mode First) */
--bg-primary: #0f0f1a;
--bg-secondary: #1a1a2e;
--bg-card: #16213e;
```

### Typography

```css
/* Font: Inter for UI, JetBrains Mono for code/numbers */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Supabase account
- Google AI Studio API key (Gemini)

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google AI
GOOGLE_AI_API_KEY=your_gemini_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

*Last updated: January 29, 2026*
