/**
 * Experiments 111-115: Batch Processing for Efficiency
 *
 * 여러 실험을 하나의 파일에서 효율적으로 처리
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateWords, generateQAReport, saveQAReport } from '../src/word-generation/validator';

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

// 파일 저장
function saveWords(words: string[], filepath: string): void {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filepath, words.join('\n'), 'utf-8');
}

// 실험 111: 접미사만 사용 (기본 단어 없이)
function experiment111(targetCount: number, existingWords: Set<string>): string[] {
  const SUFFIXES_ONLY = [
    'flow', 'stack', 'app', 'hub', 'lab', 'core', 'base', 'ops', 'sys',
    'net', 'web', 'cloud', 'data', 'tech', 'soft', 'ware', 'platform',
    'service', 'solution', 'system', 'network', 'engine', 'framework',
    'io', 'ly', 'ify', 'able', 'ible', 'ment', 'ness', 'ity', 'tion',
    'sion', 'ance', 'ence', 'ant', 'ent', 'age', 'ure', 'al', 'ial'
  ];

  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 10;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    // 두 접미사 조합
    const s1 = SUFFIXES_ONLY[Math.floor(Math.random() * SUFFIXES_ONLY.length)];
    const s2 = SUFFIXES_ONLY[Math.floor(Math.random() * SUFFIXES_ONLY.length)];
    const word = `${s1}${s2}`;

    const normalized = word.toLowerCase().trim();
    if (normalized.length < 3 || normalized.length > 20) continue;
    if (!/^[a-z]+$/.test(normalized)) continue;
    if (existingWords.has(normalized) || newWordsSet.has(normalized)) continue;

    newWords.push(normalized);
    newWordsSet.add(normalized);
  }

  return newWords;
}

// 실험 112: 접두사만 사용
function experiment112(targetCount: number, existingWords: Set<string>): string[] {
  const PREFIXES_ONLY = [
    'auto', 'self', 'multi', 'uni', 'bi', 'tri', 'quad', 'pent',
    'hex', 'sept', 'oct', 'non', 'dec', 'cent', 'milli', 'kilo',
    'mega', 'giga', 'tera', 'peta', 'micro', 'nano', 'pico', 'femto',
    'super', 'ultra', 'hyper', 'meta', 'neo', 'proto', 'pseudo', 'quasi',
    'semi', 'demi', 'hemi', 'pre', 'post', 'pro', 'anti', 'contra'
  ];

  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 10;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    const p1 = PREFIXES_ONLY[Math.floor(Math.random() * PREFIXES_ONLY.length)];
    const p2 = PREFIXES_ONLY[Math.floor(Math.random() * PREFIXES_ONLY.length)];
    const word = `${p1}${p2}`;

    const normalized = word.toLowerCase().trim();
    if (normalized.length < 3 || normalized.length > 20) continue;
    if (!/^[a-z]+$/.test(normalized)) continue;
    if (existingWords.has(normalized) || newWordsSet.has(normalized)) continue;

    newWords.push(normalized);
    newWordsSet.add(normalized);
  }

  return newWords;
}

// 실험 113: 자연/동물 영감
function experiment113(targetCount: number, existingWords: Set<string>): string[] {
  const NATURE_WORDS = [
    'storm', 'thunder', 'lightning', 'rain', 'cloud', 'sky', 'wind',
    'ocean', 'wave', 'tide', 'river', 'lake', 'stream', 'spring',
    'forest', 'tree', 'leaf', 'root', 'branch', 'flower', 'bloom',
    'mountain', 'peak', 'cliff', 'valley', 'canyon', 'plains', 'field',
    'eagle', 'hawk', 'falcon', 'owl', 'raven', 'wolf', 'bear', 'lion',
    'tiger', 'leopard', 'shark', 'whale', 'dolphin', 'fox', 'deer'
  ];

  const TECH_SUFFIXES = ['tech', 'soft', 'app', 'hub', 'core', 'base', 'flow'];

  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 15;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    const nature = NATURE_WORDS[Math.floor(Math.random() * NATURE_WORDS.length)];
    const suffix = TECH_SUFFIXES[Math.floor(Math.random() * TECH_SUFFIXES.length)];
    const word = `${nature}${suffix}`;

    const normalized = word.toLowerCase().trim();
    if (normalized.length < 3 || normalized.length > 20) continue;
    if (!/^[a-z]+$/.test(normalized)) continue;
    if (existingWords.has(normalized) || newWordsSet.has(normalized)) continue;

    newWords.push(normalized);
    newWordsSet.add(normalized);
  }

  return newWords;
}

// 실험 114: 색상 기반
function experiment114(targetCount: number, existingWords: Set<string>): string[] {
  const COLORS = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
    'black', 'white', 'gray', 'grey', 'silver', 'gold', 'bronze',
    'cyan', 'magenta', 'violet', 'indigo', 'crimson', 'scarlet',
    'azure', 'teal', 'navy', 'maroon', 'plum', 'olive', 'lime'
  ];

  const TECH_WORDS = ['tech', 'soft', 'ware', 'sys', 'ops', 'lab', 'hub', 'core', 'base'];

  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 15;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const tech = TECH_WORDS[Math.floor(Math.random() * TECH_WORDS.length)];
    const word = `${color}${tech}`;

    const normalized = word.toLowerCase().trim();
    if (normalized.length < 3 || normalized.length > 20) continue;
    if (!/^[a-z]+$/.test(normalized)) continue;
    if (existingWords.has(normalized) || newWordsSet.has(normalized)) continue;

    newWords.push(normalized);
    newWordsSet.add(normalized);
  }

  return newWords;
}

// 실험 115: 시간 기반
function experiment115(targetCount: number, existingWords: Set<string>): string[] {
  const TIME_WORDS = [
    'instant', 'quick', 'fast', 'rapid', 'swift', 'speed', 'velocity',
    'moment', 'minute', 'hour', 'day', 'week', 'month', 'year', 'era',
    'past', 'present', 'future', 'now', 'current', 'recent', 'ancient',
    'early', 'late', 'timely', 'schedule', 'calendar', 'clock', 'alarm'
  ];

  const ACTION_WORDS = ['flow', 'sync', 'track', 'monitor', 'manage', 'control'];

  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 15;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    const time = TIME_WORDS[Math.floor(Math.random() * TIME_WORDS.length)];
    const action = ACTION_WORDS[Math.floor(Math.random() * ACTION_WORDS.length)];
    const word = `${time}${action}`;

    const normalized = word.toLowerCase().trim();
    if (normalized.length < 3 || normalized.length > 20) continue;
    if (!/^[a-z]+$/.test(normalized)) continue;
    if (existingWords.has(normalized) || newWordsSet.has(normalized)) continue;

    newWords.push(normalized);
    newWordsSet.add(normalized);
  }

  return newWords;
}

// 메인
async function main() {
  console.log('=== Experiments 111-115: Batch Processing ===');
  console.log('');

  const existingWords = loadExistingWords();
  console.log(`기존 단어 수: ${existingWords.size}`);
  console.log('');

  const experiments = [
    { id: 111, name: 'Suffix Only', fn: experiment111 },
    { id: 112, name: 'Prefix Only', fn: experiment112 },
    { id: 113, name: 'Nature Inspired', fn: experiment113 },
    { id: 114, name: 'Color Based', fn: experiment114 },
    { id: 115, name: 'Time Based', fn: experiment115 }
  ];

  for (const exp of experiments) {
    console.log(`=== Experiment ${exp.id}: ${exp.name} ===`);

    const startTime = Date.now();
    const words = exp.fn(10000, existingWords);
    const elapsed = Date.now() - startTime;

    console.log(`생성: ${words.length}개 (${elapsed}ms)`);

    // QA 검증
    const qaResult = validateWords(words);
    console.log(`QA 통과: ${qaResult.passed.length} (${qaResult.passRate.toFixed(1)}%)`);

    // 저장
    saveWords(qaResult.passed, `input/generated/experiment${exp.id}_${exp.name.toLowerCase().replace(' ', '_')}_10000.txt`);

    // QA 리포트
    const qaReport = generateQAReport(qaResult.results);
    saveQAReport(qaReport, `input/generated/experiment${exp.id}_qa_${Date.now()}.json`);

    console.log(`저장 완료: ${qaResult.passed.length}개`);
    console.log('');
  }
}

if (require.main === module) {
  main().catch(console.error);
}
