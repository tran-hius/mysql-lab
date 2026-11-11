import { runPracticeSql } from './practiceRunner.js';

const cache = new Map();

/**
 * Kết quả đáp án, cache theo id bài tập/câu thi.
 * Promise memo: nhiều request đồng thời chỉ chạy solution một lần.
 */
export function getExpected(spec) {
  if (!cache.has(spec.id)) {
    const promise = runPracticeSql(spec.solution).catch((error) => {
      cache.delete(spec.id);
      throw error;
    });
    cache.set(spec.id, promise);
  }
  return cache.get(spec.id);
}
