import module01 from './module-01.js';
import module02 from './module-02.js';
import module03 from './module-03.js';
import module04 from './module-04.js';
import module05 from './module-05.js';
import module06 from './module-06.js';
import module07 from './module-07.js';
import module08 from './module-08.js';
import module09 from './module-09.js';

export { examItems, getExam, examMeta } from './exam.js';

export const allModules = [
  module01,
  module02,
  module03,
  module04,
  module05,
  module06,
  module07,
  module08,
  module09,
];

const BLOCK_TYPES = new Set(['p', 'h3', 'list', 'code', 'table', 'callout', 'steps']);

function eachExercise() {
  const rows = [];
  for (const module of allModules) {
    for (const lesson of module.lessons) {
      for (const exercise of lesson.exercises) {
        rows.push({ module, lesson, exercise });
      }
    }
  }
  return rows;
}

/** Tóm tắt khóa học cho trang chủ — không lộ nội dung/đáp án. */
export function listCourse() {
  return allModules.map((module) => ({
    id: module.id,
    title: module.title,
    summary: module.summary,
    lessons: module.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      goal: lesson.goal,
      exerciseCount: lesson.exercises.length,
    })),
  }));
}

export function getLesson(id) {
  for (const module of allModules) {
    const lesson = module.lessons.find((item) => item.id === id);
    if (lesson) {
      return {
        module: { id: module.id, title: module.title, summary: module.summary },
        lesson,
      };
    }
  }
  return null;
}

export function findExercise(id) {
  return eachExercise().find((row) => row.exercise.id === id) ?? null;
}

/** Kiểm tra cấu trúc dữ liệu khóa học; trả danh sách lỗi (rỗng = hợp lệ). */
export function validateCourse() {
  const errors = [];
  const moduleIds = new Set();
  const lessonIds = new Set();
  const exerciseIds = new Set();

  for (const module of allModules) {
    if (!module.id || moduleIds.has(module.id)) errors.push(`module id trùng/thiếu: ${module.id}`);
    moduleIds.add(module.id);
    if (!module.title) errors.push(`${module.id} thiếu title`);
    if (!Array.isArray(module.lessons) || module.lessons.length === 0) {
      errors.push(`${module.id} không có bài học`);
      continue;
    }

    for (const lesson of module.lessons) {
      if (!lesson.id || lessonIds.has(lesson.id)) errors.push(`lesson id trùng/thiếu: ${lesson.id}`);
      lessonIds.add(lesson.id);
      if (!lesson.title) errors.push(`${lesson.id} thiếu title`);
      if (!lesson.goal) errors.push(`${lesson.id} thiếu goal`);
      if (!Array.isArray(lesson.blocks) || lesson.blocks.length < 4) {
        errors.push(`${lesson.id} cần ít nhất 4 block`);
      }

      for (const block of lesson.blocks ?? []) {
        if (!BLOCK_TYPES.has(block.type)) {
          errors.push(`${lesson.id} có block lạ: ${block.type}`);
        }
      }

      if (!Array.isArray(lesson.exercises) || lesson.exercises.length === 0) {
        errors.push(`${lesson.id} không có bài tập`);
      }

      for (const exercise of lesson.exercises ?? []) {
        if (!exercise.id || exerciseIds.has(exercise.id)) {
          errors.push(`exercise id trùng/thiếu: ${exercise.id}`);
        }
        exerciseIds.add(exercise.id);
        if (!exercise.title) errors.push(`${exercise.id} thiếu title`);

        if (exercise.type === 'sql') {
          if (!exercise.prompt) errors.push(`${exercise.id} thiếu prompt`);
          if (!Array.isArray(exercise.hints) || exercise.hints.length !== 3) {
            errors.push(`${exercise.id} phải có đúng 3 hints`);
          }
          if (!Array.isArray(exercise.outputColumns) || exercise.outputColumns.length === 0) {
            errors.push(`${exercise.id} thiếu outputColumns`);
          }
          if (typeof exercise.solution !== 'string' || !/^\s*(select|with)\b/i.test(exercise.solution)) {
            errors.push(`${exercise.id} solution phải bắt đầu bằng SELECT/WITH`);
          }
        } else if (exercise.type === 'quiz') {
          if (!exercise.prompt) errors.push(`${exercise.id} thiếu prompt`);
          if (!Array.isArray(exercise.options) || exercise.options.length !== 4) {
            errors.push(`${exercise.id} phải có đúng 4 lựa chọn`);
          }
          if (!Number.isInteger(exercise.answer) || exercise.answer < 0 || exercise.answer > 3) {
            errors.push(`${exercise.id} answer phải là 0..3`);
          }
          if (!exercise.explanation) errors.push(`${exercise.id} thiếu explanation`);
        } else {
          errors.push(`${exercise.id} có type lạ: ${exercise.type}`);
        }
      }
    }

    const lastLesson = module.lessons.at(-1);
    if (!lastLesson.exercises.some((exercise) => exercise.type === 'quiz')) {
      errors.push(`${module.id} thiếu quiz ở bài cuối`);
    }
  }

  return errors;
}
