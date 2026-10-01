# Cadence — daily vocabulary review

Cadence picks the vocabulary you should review each day. The **Today** screen uses spaced repetition to choose up to 30 of your highest-priority due words from every Study Set. You review them with flashcards or dictation.

Built with React, TypeScript, Vite, Tailwind CSS and Lucide icons. It has no backend: data is saved in the browser's `localStorage`.

## Live app

https://tonga219.github.io/vocab-learning-app/

Every push to the default branch is tested, built and deployed to GitHub Pages by `.github/workflows/deploy.yml`.

## Install & run

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
npm test           # unit tests for spaced repetition, daily priority, answer checking
```

On first launch the app loads demo data: the folders IELTS and Work, with five Study Sets. The data includes Hard, Medium and Easy words that are overdue, due today or due later. To remove or reset it, go to **Settings → Demo data**.

## Project structure

```
src/
  types/            Data model: Folder, StudySet, Vocabulary, ReviewHistory, Settings
  utils/
    spacedRepetition.ts   Review schedules and review / difficulty transitions
    dailyPriority.ts      Due pool, priority sort, today's selection
    date.ts               Calendar-day helpers
    answer.ts             Dictation answer checking and typo highlighting
    dataOps.ts            Pure cascade-delete helpers (folder → sets → words → history)
  services/
    storage.ts            The only module that touches localStorage
    dataService.ts        Async DataService interface + LocalDataService implementation
  data/demoData.ts        First-launch sample content
  hooks/
    useAppData.tsx        App state + actions (optimistic UI, persisted through DataService)
    useStudySession.ts    Session engine (progress, "reviewed when you move on")
    useLibrary.ts, useToday.ts, useToast.tsx
  components/             Flashcard, DifficultySelector, SegmentedControl, VocabularyRow,
                          Toggle/DefinitionToggle, ProgressIndicator, StudyModeSelector,
                          EmptyState, Modal, ConfirmDialog, Button, Layout, study/…
  pages/                  Today, Library, Folder, StudySet, AddVocabulary, Settings, review pages
```

## Where the core logic lives

| Concern | File |
| --- | --- |
| Spaced repetition (`getReviewInterval`, `calculateNextReview`, `changeDifficulty`, `completeReview`) | `src/utils/spacedRepetition.ts` |
| Daily Priority engine (`getDueVocabulary`, `sortByPriority`, `getTodayReview`, `getTodayPlan`) | `src/utils/dailyPriority.ts` |
| localStorage access | `src/services/storage.ts` (adapter), used only by `src/services/dataService.ts` |

### Scheduling rules

- **Hard:** 1 → 3 → 7 → 30 → 60 → 60… days
- **Medium:** 3 → 30 → 60… days
- **Easy:** 7 → 60… days

Rules for when a word is reviewed:

- **New words:** a new word starts as Hard at stage 0 and is due today. Its first completed review moves it to stage 1, which is 1 day for Hard.
- **Changing difficulty:** this resets the word to stage 1 of the new schedule and calculates the next review date from today. It does not count as a review.
- **Completing a review:** a word counts as reviewed when you move from it to the next word (Next or Finish). Only then does the app write a `ReviewHistory` entry, update `lastReviewedAt`, advance the stage and set the next review date.
  - If you changed the difficulty while the card was on screen, the review keeps stage 1 of the new difficulty.
  - In manual Study Set practice, a word that is not due yet is logged but keeps its schedule.
- **Today's selection:**
  1. Sort the due pool (`nextReviewAt ≤ today`) by overdue days (descending), then difficulty (Hard > Medium > Easy), then stage (ascending), then last reviewed (oldest first).
  2. Take the top `dailyReviewLimit` words. Empty slots are never filled with words that aren't due, and words left out keep their dates.
  3. Words already reviewed in today's Daily Review count toward the limit.

### Replacing localStorage with Supabase

The UI never reads storage directly. It calls `useAppData()` actions, which update state immediately and then persist through the async `DataService` interface (`src/services/dataService.ts`). To move to Supabase:

1. Implement `DataService` with Supabase table calls (`upsertFolder`, `upsertVocabulary`, `addReviewHistory` and the rest).
2. Pass the new implementation to `<AppDataProvider service={…}>`.
