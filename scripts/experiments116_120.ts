/**
 * Experiments 116-120: Advanced Pattern Experiments
 *
 * 더 다양하고 고급화된 패턴 실험
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

// 실험 116: 원소/화학 기반
function experiment116(targetCount: number, existingWords: Set<string>): string[] {
  const ELEMENTS = [
    'hydro', 'oxy', 'carbon', 'nitro', 'phosph', 'sulf', 'chlor', 'fluor',
    'calc', 'iron', 'copper', 'zinc', 'silver', 'gold', 'platin', 'titan',
    'chrome', 'nickel', 'cobalt', 'mangan', 'magnes', 'alumin', 'silicon'
  ];

  const TECH_SUFFIXES = ['gen', 'tech', 'lab', 'sys', 'ops', 'hub', 'core', 'base'];

  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 15;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    const suffix = TECH_SUFFIXES[Math.floor(Math.random() * TECH_SUFFIXES.length)];
    const word = `${element}${suffix}`;

    const normalized = word.toLowerCase().trim();
    if (normalized.length < 3 || normalized.length > 20) continue;
    if (!/^[a-z]+$/.test(normalized)) continue;
    if (existingWords.has(normalized) || newWordsSet.has(normalized)) continue;

    newWords.push(normalized);
    newWordsSet.add(normalized);
  }

  return newWords;
}

// 실험 117: 천문/우주 기반
function experiment117(targetCount: number, existingWords: Set<string>): string[] {
  const CELESTIAL = [
    'solar', 'lunar', 'stellar', 'cosmic', 'galaxy', 'nebula', 'orbit',
    'planet', 'star', 'moon', 'sun', 'mars', 'venus', 'jupiter', 'saturn',
    'mercury', 'pluto', 'comet', 'asteroid', 'meteor', 'space', 'void',
    'zenith', 'horizon', 'eclipse', 'nova', 'supernova', 'quasar', 'pulsar'
  ];

  const TECH_WORDS = ['tech', 'soft', 'ware', 'sys', 'ops', 'lab', 'hub', 'flow', 'core'];

  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 15;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    const celestial = CELESTIAL[Math.floor(Math.random() * CELESTIAL.length)];
    const tech = TECH_WORDS[Math.floor(Math.random() * TECH_WORDS.length)];
    const word = `${celestial}${tech}`;

    const normalized = word.toLowerCase().trim();
    if (normalized.length < 3 || normalized.length > 20) continue;
    if (!/^[a-z]+$/.test(normalized)) continue;
    if (existingWords.has(normalized) || newWordsSet.has(normalized)) continue;

    newWords.push(normalized);
    newWordsSet.add(normalized);
  }

  return newWords;
}

// 실험 118: 수학/기하학 기반
function experiment118(targetCount: number, existingWords: Set<string>): string[] {
  const MATH = [
    'vector', 'matrix', 'tensor', 'scalar', 'factor', 'ratio', 'rate',
    'index', 'log', 'exp', 'root', 'power', 'prime', 'composite', 'digit',
    'number', 'integer', 'fraction', 'decimal', 'percent', 'angle', 'curve',
    'line', 'plane', 'sphere', 'cube', 'circle', 'square', 'triangle'
  ];

  const TECH_SUFFIXES = ['tech', 'soft', 'ware', 'sys', 'ops', 'lab', 'hub', 'core', 'base'];

  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 15;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    const math = MATH[Math.floor(Math.random() * MATH.length)];
    const suffix = TECH_SUFFIXES[Math.floor(Math.random() * TECH_SUFFIXES.length)];
    const word = `${math}${suffix}`;

    const normalized = word.toLowerCase().trim();
    if (normalized.length < 3 || normalized.length > 20) continue;
    if (!/^[a-z]+$/.test(normalized)) continue;
    if (existingWords.has(normalized) || newWordsSet.has(normalized)) continue;

    newWords.push(normalized);
    newWordsSet.add(normalized);
  }

  return newWords;
}

// 실험 119: 도메인 특화 (공통 TLD 기반)
function experiment119(targetCount: number, existingWords: Set<string>): string[] {
  const TLDS = ['com', 'net', 'org', 'io', 'co', 'ai', 'tech', 'app', 'dev', 'cloud'];
  const BASE_WORDS = [
    'data', 'cloud', 'tech', 'soft', 'ware', 'web', 'app', 'api', 'hub',
    'flow', 'stack', 'core', 'base', 'ops', 'sys', 'lab', 'platform'
  ];

  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 15;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    const base = BASE_WORDS[Math.floor(Math.random() * BASE_WORDS.length)];
    const tld = TLDS[Math.floor(Math.random() * TLDS.length)];
    const word = `${base}${tld}`;

    const normalized = word.toLowerCase().trim();
    if (normalized.length < 3 || normalized.length > 20) continue;
    if (!/^[a-z]+$/.test(normalized)) continue;
    if (existingWords.has(normalized) || newWordsSet.has(normalized)) continue;

    newWords.push(normalized);
    newWordsSet.add(normalized);
  }

  return newWords;
}

// 실험 120: 무작위 조합 (완전 랜덤)
function experiment120(targetCount: number, existingWords: Set<string>): string[] {
  const RANDOM_PARTS = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'tr', 'br', 'st', 'sp', 'sk', 'sm', 'sn', 'pr', 'pl', 'cl', 'fl',
    'str', 'spr', 'spl', 'scr', 'thr', 'shr', 'squ'
  ];

  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 20;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    const len = 3 + Math.floor(Math.random() * 8); // 3-10자
    let word = '';

    for (let i = 0; i < len; i += 2) {
      const part = RANDOM_PARTS[Math.floor(Math.random() * RANDOM_PARTS.length)];
      word += part;
      if (word.length >= len) break;
    }

    word = word.substring(0, len);
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
  console.log('=== Experiments 116-120: Advanced Pattern Experiments ===');
  console.log('');

  const existingWords = loadExistingWords();
  console.log(`기존 단어 수: ${existingWords.size}`);
  console.log('');

  const experiments = [
    { id: 116, name: 'Element Based', fn: experiment116 },
    { id: 117, name: 'Celestial', fn: experiment117 },
    { id: 118, name: 'Mathematical', fn: experiment118 },
    { id: 119, name: 'TLD Based', fn: experiment119 },
    { id: 120, name: 'Random', fn: experiment120 }
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
