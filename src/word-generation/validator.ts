/**
 * Word Validator
 *
 * SaaS 제목용 영어 단어를 검증합니다.
 * 이 기능은 스크립트로 구현되며, LLM 의존성이 없습니다.
 */

import { WordQAResult } from './types';

/**
 * 스팸 단어 목록 (부적절한 단어 필터링)
 */
const SPAM_WORDS = new Set([
  // 적절하지 않은 단어들...
]);

/**
 * SaaS 제목에 적합하지 않은 단어 패턴
 */
const UNSA_PATTERNS = [
  /^\d+$/,                    // 숫자만
  /^[^a-zA-Z]+$/,             // 영어가 포함되지 않음
  /.{30,}/,                   // 너무 긴 단어 (30자 이상)
  /^[0-9a-f]{32,}$/i,        // 해시 같은 패턴
  /[^a-zA-Z0-9\-]/,           // 허용되지 않는 문자 (영어, 숫자, 하이픈만 허용)
];

/**
 * 단어를 검증합니다.
 */
export function validateWord(word: string): WordQAResult {
  const reasons: string[] = [];
  const errors = {
    notEnglish: false,
    tooShort: false,
    tooLong: false,
    notSaaSSuitable: false,
    isSpam: false,
    poorQuality: false
  };

  let score = 0;
  const trimmedWord = word.trim();

  // 1. 영어 단어 여부 (30%)
  if (isEnglishWord(trimmedWord)) {
    score += 30;
  } else {
    errors.notEnglish = true;
    reasons.push('영어 단어가 아닙니다 (a-z, A-Z, 0-9, - 만 허용)');
  }

  // 2. 길이 적절성 (15%)
  if (trimmedWord.length >= 3 && trimmedWord.length <= 20) {
    score += 15;
  } else if (trimmedWord.length < 3) {
    errors.tooShort = true;
    reasons.push('너무 짧습니다 (최소 3자)');
  } else {
    errors.tooLong = true;
    reasons.push('너무 깁니다 (최대 20자)');
  }

  // 3. SaaS 적합성 (25%)
  if (isSaaSSuitable(trimmedWord)) {
    score += 25;
  } else {
    errors.notSaaSSuitable = true;
    reasons.push('SaaS 제목에 적합하지 않습니다');
  }

  // 4. 스팸 필터링 (10%)
  if (!isSpam(trimmedWord)) {
    score += 10;
  } else {
    errors.isSpam = true;
    reasons.push('부적절한 단어입니다');
  }

  // 5. 기본 품질 (20%) - 에러로 처리
  if (!hasBasicQuality(trimmedWord)) {
    errors.poorQuality = true;
    reasons.push('기본 품질 기준을 충족하지 않습니다 (하이픈 규칙 위반)');
  } else {
    score += 20;
  }

  const passed = score >= 70 && Object.values(errors).every(e => !e);

  return {
    word: trimmedWord,
    passed,
    score,
    reasons,
    errors
  };
}

/**
 * 영어 단어인지 확인합니다.
 */
function isEnglishWord(word: string): boolean {
  // a-z, A-Z, 0-9, 하이픈(-)만 허용
  const englishPattern = /^[a-zA-Z0-9\-]+$/;
  return englishPattern.test(word) && word.length > 0;
}

/**
 * SaaS 제목에 적합한지 확인합니다.
 */
function isSaaSSuitable(word: string): boolean {
  // 부적합한 패턴 체크
  for (const pattern of UNSA_PATTERNS) {
    if (pattern.test(word)) {
      return false;
    }
  }

  // 적어도 하나의 영문자가 포함되어야 함
  const hasLetter = /[a-zA-Z]/.test(word);
  if (!hasLetter) {
    return false;
  }

  return true;
}

/**
 * 스팸 단어인지 확인합니다.
 */
function isSpam(word: string): boolean {
  const lowerWord = word.toLowerCase();
  return SPAM_WORDS.has(lowerWord);
}

/**
 * 기본 품질을 확인합니다.
 */
function hasBasicQuality(word: string): boolean {
  // 비어있지 않아야 함
  if (word.length === 0) {
    return false;
  }

  // 너무 많은 하이픈 (2개 이상 연속)
  if (/--/.test(word)) {
    return false;
  }

  // 하이픈으로 시작하거나 끝나면 안 됨
  if (word.startsWith('-') || word.endsWith('-')) {
    return false;
  }

  return true;
}

/**
 * 단어 목록을 검증합니다.
 */
export function validateWords(words: string[]): {
  results: WordQAResult[];
  passed: string[];
  failed: string[];
  passRate: number;
  averageScore: number;
} {
  const results: WordQAResult[] = [];

  for (const word of words) {
    const result = validateWord(word);
    results.push(result);
  }

  const passed = results.filter(r => r.passed).map(r => r.word);
  const failed = results.filter(r => !r.passed).map(r => r.word);
  const passRate = (passed.length / words.length) * 100;
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

  return {
    results,
    passed,
    failed,
    passRate,
    averageScore
  };
}

/**
 * QA 리포트를 생성합니다.
 */
export interface QAReport {
  totalWords: number;
  passed: number;
  failed: number;
  passRate: number;
  averageScore: number;
  failureReasons: Record<string, number>;
  timestamp: Date;
}

/**
 * QA 결과에서 리포트를 생성합니다.
 */
export function generateQAReport(results: WordQAResult[]): QAReport {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const passRate = (passed / results.length) * 100;
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

  // 실패 사유 집계
  const failureReasons: Record<string, number> = {};
  for (const result of results) {
    if (!result.passed) {
      for (const reason of result.reasons) {
        failureReasons[reason] = (failureReasons[reason] || 0) + 1;
      }
    }
  }

  return {
    totalWords: results.length,
    passed,
    failed,
    passRate,
    averageScore,
    failureReasons,
    timestamp: new Date()
  };
}

/**
 * QA 리포트를 JSON 파일로 저장합니다.
 */
export function saveQAReport(report: QAReport, outputPath: string): void {
  const fs = require('fs');
  const path = require('path');

  const dir = path.dirname(outputPath);

  // 디렉터리가 없으면 생성
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const data = {
    ...report,
    timestamp: report.timestamp.toISOString()
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
}
