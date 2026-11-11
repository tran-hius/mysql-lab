import { Router } from 'express';
import { listCourse, getLesson, findExercise, examItems, examMeta, getExam } from '../course/index.js';
import { assertPracticeSql } from '../services/practiceGuard.js';
import { runPracticeSql } from '../services/practiceRunner.js';
import { compareResults } from '../services/resultCompare.js';
import { getExpected } from '../services/expectedResults.js';
import { isDatabaseUnavailable } from '../services/dbError.js';

const router = Router();

function publicExercise(exercise) {
  const { solution, answer, explanation, ...rest } = exercise;
  return rest;
}

function sendSqlError(res, error) {
  if (error.code === 'QUERY_TIMEOUT') {
    return res.status(422).json({
      ok: false,
      error: 'QUERY_TIMEOUT',
      message: error.message,
    });
  }

  if (isDatabaseUnavailable(error)) {
    return res.status(503).json({
      ok: false,
      error: 'DB_UNAVAILABLE',
      message: 'Không kết nối được MySQL.',
      hint: 'Kiểm tra backend/.env và service MySQL84.',
    });
  }

  return res.status(422).json({
    ok: false,
    error: 'SQL_ERROR',
    message: error.message,
  });
}

function buildFeedback(comparison, expected) {
  return {
    reason: comparison.reason,
    missingCount: comparison.missingCount,
    extraCount: comparison.extraCount,
    expectedRowCount: expected.rows.length,
    actualRowCount: comparison.actualRowCount,
    samples: {
      missing: comparison.missing,
      extra: comparison.extra,
    },
  };
}

router.get('/', (req, res) => {
  res.json({ ok: true, modules: listCourse() });
});

router.get('/lessons/:id', (req, res) => {
  const found = getLesson(req.params.id);

  if (!found) {
    return res.status(404).json({
      ok: false,
      error: 'LESSON_NOT_FOUND',
      message: `Không có bài học "${req.params.id}"`,
    });
  }

  res.json({
    ok: true,
    module: found.module,
    lesson: {
      ...found.lesson,
      exercises: found.lesson.exercises.map(publicExercise),
    },
  });
});

router.post('/exercises/:id/solve', async (req, res) => {
  const found = findExercise(req.params.id);

  if (!found || found.exercise.type !== 'sql') {
    return res.status(404).json({
      ok: false,
      error: 'EXERCISE_NOT_FOUND',
      message: `Không có bài tập SQL "${req.params.id}"`,
    });
  }

  try {
    assertPracticeSql(req.body?.sql);
  } catch (error) {
    return res.status(400).json({ ok: false, error: 'SQL_NOT_ALLOWED', message: error.message });
  }

  let user;
  try {
    user = await runPracticeSql(req.body.sql);
  } catch (error) {
    return sendSqlError(res, error);
  }

  try {
    const expected = await getExpected(found.exercise);
    const comparison = compareResults(expected, user, {
      orderMatters: found.exercise.orderMatters,
    });

    res.json({
      ok: true,
      correct: comparison.correct,
      feedback: buildFeedback(comparison, expected),
      user,
      expectedRowCount: expected.rows.length,
    });
  } catch (error) {
    return sendSqlError(res, error);
  }
});

router.post('/exercises/:id/answer', (req, res) => {
  const found = findExercise(req.params.id);

  if (!found || found.exercise.type !== 'quiz') {
    return res.status(404).json({
      ok: false,
      error: 'EXERCISE_NOT_FOUND',
      message: `Không có quiz "${req.params.id}"`,
    });
  }

  const choice = req.body?.choice;
  if (!Number.isInteger(choice) || choice < 0 || choice > 3) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_CHOICE',
      message: 'choice phải là số nguyên 0..3',
    });
  }

  res.json({
    ok: true,
    correct: choice === found.exercise.answer,
    answer: found.exercise.answer,
    explanation: found.exercise.explanation,
  });
});

router.get('/exercises/:id/solution', async (req, res) => {
  const found = findExercise(req.params.id);

  if (!found) {
    return res.status(404).json({
      ok: false,
      error: 'EXERCISE_NOT_FOUND',
      message: `Không có bài tập "${req.params.id}"`,
    });
  }

  if (found.exercise.type === 'quiz') {
    return res.json({
      ok: true,
      type: 'quiz',
      answer: found.exercise.answer,
      explanation: found.exercise.explanation,
    });
  }

  try {
    const expected = await getExpected(found.exercise);
    res.json({
      ok: true,
      type: 'sql',
      sql: found.exercise.solution,
      result: {
        columns: expected.columns,
        rows: expected.rows.slice(0, 10),
        rowCount: expected.rows.length,
        truncated: expected.rows.length > 10,
      },
    });
  } catch (error) {
    return sendSqlError(res, error);
  }
});

router.get('/exam', (req, res) => {
  res.json({ ok: true, ...getExam() });
});

router.post('/exam/submit', async (req, res) => {
  const submitted = req.body?.items;

  if (!Array.isArray(submitted)) {
    return res.status(422).json({
      ok: false,
      error: 'INCOMPLETE_EXAM',
      message: 'Cần trả lời đủ 12 câu.',
    });
  }

  const byId = new Map();
  for (const entry of submitted) {
    if (entry && typeof entry.id === 'string' && !byId.has(entry.id)) {
      byId.set(entry.id, entry);
    }
  }

  if (byId.size !== examItems.length || examItems.some((item) => !byId.has(item.id))) {
    return res.status(422).json({
      ok: false,
      error: 'INCOMPLETE_EXAM',
      message: 'Cần trả lời đủ 12 câu.',
    });
  }

  const results = [];

  for (const item of examItems) {
    const entry = byId.get(item.id);

    if (item.type === 'quiz') {
      if (!Number.isInteger(entry.choice) || entry.choice < 0 || entry.choice > 3) {
        return res.status(400).json({
          ok: false,
          error: 'INVALID_CHOICE',
          message: `choice của ${item.id} phải là 0..3`,
        });
      }

      results.push({
        id: item.id,
        correct: entry.choice === item.answer,
        explanation: item.explanation,
      });
      continue;
    }

    try {
      assertPracticeSql(entry.sql);
    } catch (error) {
      results.push({
        id: item.id,
        correct: false,
        feedback: { reason: 'SQL_ERROR', message: error.message },
      });
      continue;
    }

    let user;
    try {
      user = await runPracticeSql(entry.sql);
    } catch (error) {
      results.push({
        id: item.id,
        correct: false,
        feedback: {
          reason: error.code === 'QUERY_TIMEOUT' ? 'QUERY_TIMEOUT' : 'SQL_ERROR',
          message: error.message,
        },
      });
      continue;
    }

    try {
      const expected = await getExpected(item);
      const comparison = compareResults(expected, user, {
        orderMatters: item.orderMatters,
      });

      results.push({
        id: item.id,
        correct: comparison.correct,
        feedback: buildFeedback(comparison, expected),
      });
    } catch (error) {
      results.push({
        id: item.id,
        correct: false,
        feedback: { reason: 'SQL_ERROR', message: error.message },
      });
    }
  }

  const correctCount = results.filter((item) => item.correct).length;
  const score = Math.round((correctCount / examItems.length) * 100);

  res.json({
    ok: true,
    score,
    passed: score >= examMeta.passScore,
    correctCount,
    total: examItems.length,
    items: results,
  });
});

export default router;
