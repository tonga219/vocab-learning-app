import type { AppData, Difficulty, Folder, StudySet, Vocabulary } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { addDays, startOfDay } from '../utils/date';
import { getReviewInterval } from '../utils/spacedRepetition';
import { DEMO_PREFIX } from '../utils/dataOps';

/** [term, definition, difficulty, reviewStage, nextReview offset in days from today] */
type Row = [string, string, Difficulty, number, number];

const DEMO: { folder: string; sets: { name: string; words: Row[] }[] }[] = [
  {
    folder: 'IELTS',
    sets: [
      {
        name: 'Environment',
        words: [
          ['deteriorate', 'xấu đi / suy giảm', 'hard', 2, -2],
          ['abundant', 'dồi dào', 'medium', 1, -1],
          ['sustainable', 'bền vững', 'hard', 1, -4],
          ['pollution', 'ô nhiễm', 'easy', 2, 20],
          ['biodiversity', 'đa dạng sinh học', 'hard', 0, 0],
          ['emission', 'khí thải / sự phát thải', 'hard', 3, -3],
          ['deforestation', 'nạn phá rừng', 'medium', 2, -6],
          ['renewable', 'có thể tái tạo', 'easy', 1, 3],
          ['contaminate', 'làm ô nhiễm', 'hard', 1, 0],
          ['mitigate', 'giảm nhẹ / làm dịu bớt', 'hard', 2, -1],
          ['habitat', 'môi trường sống', 'easy', 1, -2],
          ['scarcity', 'sự khan hiếm', 'medium', 1, 0],
          ['drought', 'hạn hán', 'hard', 0, 0],
        ],
      },
      {
        name: 'Education',
        words: [
          ['compulsory', 'bắt buộc', 'medium', 2, -5],
          ['curriculum', 'chương trình giảng dạy', 'easy', 1, -1],
          ['literacy', 'khả năng đọc viết', 'hard', 1, -2],
          ['tuition', 'học phí', 'easy', 2, 40],
          ['discipline', 'kỷ luật', 'medium', 1, 2],
          ['scholarship', 'học bổng', 'hard', 2, 0],
          ['vocational', 'thuộc về dạy nghề', 'hard', 0, 0],
          ['assessment', 'sự đánh giá', 'medium', 1, -3],
          ['plagiarism', 'đạo văn', 'hard', 3, -1],
          ['extracurricular', 'ngoại khóa', 'easy', 1, 0],
        ],
      },
      {
        name: 'Technology',
        words: [
          ['innovation', 'sự đổi mới', 'medium', 1, -2],
          ['obsolete', 'lỗi thời', 'hard', 1, -1],
          ['breakthrough', 'bước đột phá', 'hard', 2, 1],
          ['automation', 'tự động hóa', 'easy', 1, -4],
          ['surveillance', 'sự giám sát', 'hard', 0, 0],
          ['cutting-edge', 'tiên tiến nhất', 'medium', 2, 15],
          ['encryption', 'sự mã hóa', 'hard', 1, 0],
          ['redundant', 'dư thừa', 'medium', 1, -1],
        ],
      },
    ],
  },
  {
    folder: 'Work',
    sets: [
      {
        name: 'Banking Vocabulary',
        words: [
          ['collateral', 'tài sản bảo đảm', 'hard', 2, -3],
          ['mortgage', 'khoản vay thế chấp', 'medium', 1, -1],
          ['liquidity', 'tính thanh khoản', 'hard', 1, -7],
          ['interest rate', 'lãi suất', 'easy', 1, -2],
          ['overdraft', 'khoản thấu chi', 'hard', 3, 4],
          ['remittance', 'kiều hối / tiền chuyển về', 'medium', 2, 0],
          ['default', 'vỡ nợ / không trả được nợ', 'hard', 1, -1],
          ['creditworthy', 'có uy tín tín dụng', 'hard', 0, 0],
          ['deposit', 'tiền gửi', 'easy', 2, 30],
          ['audit', 'kiểm toán', 'medium', 1, -2],
        ],
      },
      {
        name: 'Meetings',
        words: [
          ['agenda', 'chương trình cuộc họp', 'easy', 1, -1],
          ['consensus', 'sự đồng thuận', 'hard', 1, -2],
          ['minutes', 'biên bản cuộc họp', 'medium', 1, 0],
          ['postpone', 'trì hoãn', 'hard', 2, 0],
          ['stakeholder', 'bên liên quan', 'hard', 1, 2],
          ['brainstorm', 'động não / cùng đưa ra ý tưởng', 'easy', 1, -3],
          ['follow up', 'theo dõi / tiếp tục xử lý', 'medium', 1, -1],
        ],
      },
    ],
  },
];

/**
 * Builds demo data relative to `now` so it always demonstrates
 * overdue, due-today and future reviews across all three levels.
 */
export function createDemoData(now: Date): AppData {
  const today = startOfDay(now);
  const folders: Folder[] = [];
  const studySets: StudySet[] = [];
  const vocabulary: Vocabulary[] = [];

  DEMO.forEach((folderDef, fi) => {
    const folderId = `${DEMO_PREFIX}folder_${fi}`;
    let folderCreated = today;

    folderDef.sets.forEach((setDef, si) => {
      const setId = `${DEMO_PREFIX}set_${fi}_${si}`;
      const words = setDef.words.map(([term, definition, difficulty, reviewStage, offset], wi) => {
        const nextReview = addDays(today, offset);
        const lastReviewed =
          reviewStage > 0 ? new Date(addDays(nextReview, -getReviewInterval(difficulty, reviewStage)).getTime() + 19 * 3600_000) : null;
        return { term, definition, difficulty, reviewStage, wi, nextReview, lastReviewed };
      });
      // The set (and every word in it) was created a few days before its earliest review.
      const setCreated = words.reduce(
        (min, w) => (w.lastReviewed && addDays(startOfDay(w.lastReviewed), -3) < min ? addDays(startOfDay(w.lastReviewed), -3) : min),
        addDays(today, -1),
      );
      for (const w of words) {
        vocabulary.push({
          id: `${DEMO_PREFIX}vocab_${fi}_${si}_${w.wi}`,
          studySetId: setId,
          term: w.term,
          definition: w.definition,
          difficulty: w.difficulty,
          reviewStage: w.reviewStage,
          // Keep the list order as written above.
          createdAt: new Date(setCreated.getTime() + 9 * 3600_000 + w.wi * 60_000).toISOString(),
          lastReviewedAt: w.lastReviewed ? w.lastReviewed.toISOString() : null,
          nextReviewAt: w.nextReview.toISOString(),
        });
      }

      if (setCreated < folderCreated) folderCreated = setCreated;
      studySets.push({ id: setId, folderId, name: setDef.name, createdAt: setCreated.toISOString() });
    });

    folders.push({ id: folderId, name: folderDef.folder, createdAt: addDays(folderCreated, -1).toISOString() });
  });

  return { folders, studySets, vocabulary, reviewHistory: [], settings: { ...DEFAULT_SETTINGS } };
}
