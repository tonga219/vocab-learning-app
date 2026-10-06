export type Difficulty = 'hard' | 'medium' | 'easy';
export type ReviewMode = 'flashcard' | 'dictation';
export type FlashcardFront = 'english' | 'vietnamese';
/** Where a review happened: the Today (daily) review or manual study of a Study Set. */
export type SessionType = 'daily' | 'manual';
/** Order of Study Sets inside a folder, by the Study Set's creation date. */
export type StudySetSort = 'newest' | 'oldest';

/** ISO-8601 timestamp string. */
export type ISODateString = string;

export interface Folder {
  id: string;
  name: string;
  createdAt: ISODateString;
}

export interface StudySet {
  id: string;
  folderId: string;
  name: string;
  createdAt: ISODateString;
}

export interface Vocabulary {
  id: string;
  studySetId: string;
  term: string;
  definition: string;
  difficulty: Difficulty;
  /**
   * Position in the difficulty's schedule.
   * 0 = new, never reviewed (due immediately).
   * n >= 1 = the interval of stage n is what produced `nextReviewAt`.
   */
  reviewStage: number;
  createdAt: ISODateString;
  lastReviewedAt: ISODateString | null;
  nextReviewAt: ISODateString;
}

export interface ReviewHistory {
  id: string;
  vocabularyId: string;
  reviewedAt: ISODateString;
  oldDifficulty: Difficulty;
  newDifficulty: Difficulty;
  reviewMode: ReviewMode;
  /** null for flashcard reviews. */
  isCorrect: boolean | null;
  sessionType: SessionType;
}

export interface Settings {
  /** null = unlimited */
  dailyReviewLimit: number | null;
  preferredReviewMode: ReviewMode;
  flashcardFront: FlashcardFront;
  studySetSort: StudySetSort;
}

export interface AppData {
  folders: Folder[];
  studySets: StudySet[];
  vocabulary: Vocabulary[];
  reviewHistory: ReviewHistory[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  dailyReviewLimit: 30,
  preferredReviewMode: 'flashcard',
  flashcardFront: 'english',
  studySetSort: 'newest',
};

export const DIFFICULTIES: Difficulty[] = ['hard', 'medium', 'easy'];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  hard: 'Hard',
  medium: 'Medium',
  easy: 'Easy',
};
