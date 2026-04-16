/**
 * Experiment 107: Number-Centric Combinations
 *
 * 숫자를 중심으로 한 현대적인 SaaS 제품명 생성
 * 예: App24, Data365, Cloud9, Hub101
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateWords, generateQAReport, saveQAReport } from '../src/word-generation/validator';

// 기본 단어
const BASE_WORDS = [
  'app', 'api', 'hub', 'lab', 'core', 'base', 'flow', 'stack', 'ops',
  'dev', 'sys', 'net', 'web', 'cloud', 'data', 'tech', 'soft', 'ware',
  'platform', 'service', 'solution', 'system', 'network', 'digital'
];

// 특별한 숫자 (의미 있는)
const SPECIAL_NUMBERS = [
  // 기본 숫자
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',

  // 시간 관련
  '24', '60', '365', '366', '52', '12', '7', '4',

  // 기술/비즈니스 관련
  '101', '202', '303', '404', '505', '606', '707', '808', '909',
  '99', '100', '1000', '10000', '100000', '360', '180', '90',

  // 연도
  '2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009',
  '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019',
  '2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029',
  '2030', '2040', '2050', '2060', '2070', '2080', '2090', '3000',

  // 기술 관련
  '32', '64', '128', '256', '512', '1024', '2048', '4096', '8192',
  '404', '500', '501', '502', '503', '403', '401', '403', '200', '201'
];

// 기존 단어 로드
function loadExistingWords(): Set<string> {
  const existingWords = new Set<string>();

  if (fs.existsSync('input/generated')) {
    const genFiles = fs.readdirSync('input/generated')
      .filter(f => f.endsWith('.txt'));

    for (const file of genFiles) {
      const filePath = path.join('input/generated', file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const words = content.split('\n')
        .map(line => line.trim().toLowerCase())
        .filter(line => line.length > 0);
      words.forEach(word => existingWords.add(word));
    }
  }

  return existingWords;
}

// 숫자 중심 단어 생성
function generateNumberWords(targetCount: number, existingWords: Set<string>): string[] {
  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 20;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    // 랜덤 패턴 선택
    const pattern = Math.floor(Math.random() * 4);
    let word = '';

    switch (pattern) {
      case 0: // 단어 + 숫자
        {
          const base = BASE_WORDS[Math.floor(Math.random() * BASE_WORDS.length)];
          const num = SPECIAL_NUMBERS[Math.floor(Math.random() * SPECIAL_NUMBERS.length)];
          word = `${base}${num}`;
        }
        break;

      case 1: // 숫자 + 단어
        {
          const num = SPECIAL_NUMBERS[Math.floor(Math.random() * SPECIAL_NUMBERS.length)];
          const base = BASE_WORDS[Math.floor(Math.random() * BASE_WORDS.length)];
          word = `${num}${base}`;
        }
        break;

      case 2: // 단어 + 숫자 + 단어
        {
          const base1 = BASE_WORDS[Math.floor(Math.random() * BASE_WORDS.length)];
          const num = SPECIAL_NUMBERS[Math.floor(Math.random() * Math.min(SPECIAL_NUMBERS.length, 50))];
          const base2 = BASE_WORDS[Math.floor(Math.random() * BASE_WORDS.length)];
          word = `${base1}${num}${base2}`;
        }
        break;

      case 3: // 숫자만 (특수 패턴)
        {
          const num1 = SPECIAL_NUMBERS[Math.floor(Math.random() * SPECIAL_NUMBERS.length)];
          const num2 = SPECIAL_NUMBERS[Math.floor(Math.random() * SPECIAL_NUMBERS.length)];
          word = `${num1}${num2}`;
        }
        break;
    }

    // 정규화
    word = word.toLowerCase().trim();

    // 길이 체크 (3-20자)
    if (word.length < 3 || word.length > 20) {
      continue;
    }

    // 영어/숫자 체크
    if (!/^[a-z0-9]+$/.test(word)) {
      continue;
    }

    // 중복 체크
    const normalizedWord = word.toLowerCase();
    if (existingWords.has(normalizedWord) || newWordsSet.has(normalizedWord)) {
      continue;
    }

    // 통과하면 추가
    newWords.push(word);
    newWordsSet.add(normalizedWord);
  }

  console.log(`생성 시도: ${attempts}회`);
  console.log(`중복 방지: ${attempts - newWords.length}개`);

  return newWords;
}

// 파일 저장
function saveWords(words: string[], filepath: string): void {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filepath, words.join('\n'), 'utf-8');
}

// 메인
async function main() {
  console.log('=== Experiment 107: Number-Centric Combinations ===');
  console.log('');

  // 기존 단어 로드
  console.log('기존 단어 로드 중...');
  const existingWords = loadExistingWords();
  console.log(`기존 단어 수: ${existingWords.size}`);
  console.log('');

  // 단어 생성
  const targetCount = 10000;
  console.log(`목표: ${targetCount}개 단어 생성`);
  console.log('');

  const startTime = Date.now();
  const words = generateNumberWords(targetCount, existingWords);
  const elapsed = Date.now() - startTime;

  console.log('');
  console.log('=== 생성 결과 ===');
  console.log(`실제 생성: ${words.length}개`);
  console.log(`소요 시간: ${elapsed}ms`);
  console.log('');

  // QA 검증
  console.log('=== QA 검증 ===');
  const qaResult = validateWords(words);

  console.log(`QA 통과: ${qaResult.passed.length} (${qaResult.passRate.toFixed(1)}%)`);
  console.log(`QA 실패: ${qaResult.failed.length}`);
  console.log(`평균 점수: ${qaResult.averageScore.toFixed(1)}`);
  console.log('');

  // QA 리포트 저장
  const qaReport = generateQAReport(qaResult.results);
  const qaReportPath = `input/generated/experiment107_qa_${Date.now()}.json`;
  saveQAReport(qaReport, qaReportPath);
  console.log(`QA 리포트 저장: ${qaReportPath}`);
  console.log('');

  // 최종 저장
  const outputPath = `input/generated/experiment107_numbers_10000.txt`;
  saveWords(qaResult.passed, outputPath);
  console.log(`저장 경로: ${outputPath}`);
  console.log(`최종 단어 수: ${qaResult.passed.length}`);
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}
