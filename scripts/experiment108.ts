/**
 * Experiment 108: Ultra-Short Word Focus
 *
 * 3-6자 짧은 단어만 집중적으로 생성
 * 예: App, Hub, Api, Flow, Sync, Core, Base, Ops
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateWords, generateQAReport, saveQAReport } from '../src/word-generation/validator';

// 3-4자 짧은 기본 단어
const ULTRA_SHORT_WORDS = [
  // 3자
  'app', 'api', 'hub', 'lab', 'kit', 'pad', 'map', 'set', 'bag', 'box',
  'net', 'web', 'dev', 'ops', 'sys', 'sec', 'dat', 'cod', 'log', 'msg',
  'bot', 'ai', 'ml', 'io', 'saas', 'b2b', 'b2c', 'crm', 'erp', 'pos',
  'kpi', 'roi', 'ceo', 'cto', 'cfo', 'coo', 'hr', 'pr', 'qa', 'qc',

  // 4자
  'flow', 'stack', 'core', 'base', 'tech', 'soft', 'ware', 'cloud',
  'data', 'node', 'host', 'port', 'gate', 'edge', 'path', 'root',
  'user', 'admin', 'auth', 'token', 'key', 'cert', 'sign', 'hash',
  'code', 'test', 'build', 'deploy', 'release', 'stage', 'prod',

  // 5자
  'agent', 'broker', 'store', 'vault', 'shelf', 'cache', 'queue',
  'topic', 'event', 'stream', 'batch', 'worker', 'server', 'client',
  'driver', 'parser', 'writer', 'reader', 'loader', 'saver', 'deleter',

  // 6자
  'bridge', 'router', 'switch', 'socket', 'tunnel', 'gateway', 'portal',
  'dashboard', 'console', 'terminal', 'service', 'process', 'daemon',
  'worker', 'manager', 'handler', 'checker', 'scanner', 'cleaner', 'fixer'
];

// 짧은 접미사
const SHORT_SUFFIXES = [
  'io', 'app', 'hub', 'lab', 'ops', 'sys', 'net', 'web', 'api', 'dev'
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

// 초단어 단어 생성
function generateUltraShortWords(targetCount: number, existingWords: Set<string>): string[] {
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
      case 0: // 기본 단어만
        {
          word = ULTRA_SHORT_WORDS[Math.floor(Math.random() * ULTRA_SHORT_WORDS.length)];
        }
        break;

      case 1: // 기본 단어 + 짧은 접미사
        {
          const base = ULTRA_SHORT_WORDS[Math.floor(Math.random() * ULTRA_SHORT_WORDS.length)];
          const suffix = SHORT_SUFFIXES[Math.floor(Math.random() * SHORT_SUFFIXES.length)];
          word = `${base}${suffix}`;
        }
        break;

      case 2: // 두 기본 단어 조합
        {
          const w1 = ULTRA_SHORT_WORDS[Math.floor(Math.random() * ULTRA_SHORT_WORDS.length)];
          const w2 = ULTRA_SHORT_WORDS[Math.floor(Math.random() * ULTRA_SHORT_WORDS.length)];
          word = `${w1}${w2}`;
        }
        break;

      case 3: // 기본 단어 + 숫자 (한 자리)
        {
          const base = ULTRA_SHORT_WORDS[Math.floor(Math.random() * ULTRA_SHORT_WORDS.length)];
          const num = ['1', '2', '3', '4', '5', '6', '7', '8', '9'][Math.floor(Math.random() * 9)];
          word = `${base}${num}`;
        }
        break;
    }

    // 정규화
    word = word.toLowerCase().trim();

    // 길이 체크 (3-8자만)
    if (word.length < 3 || word.length > 8) {
      continue;
    }

    // 영어 체크
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
  console.log('=== Experiment 108: Ultra-Short Word Focus ===');
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
  const words = generateUltraShortWords(targetCount, existingWords);
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
  const qaReportPath = `input/generated/experiment108_qa_${Date.now()}.json`;
  saveQAReport(qaReport, qaReportPath);
  console.log(`QA 리포트 저장: ${qaReportPath}`);
  console.log('');

  // 최종 저장
  const outputPath = `input/generated/experiment108_ultrashort_10000.txt`;
  saveWords(qaResult.passed, outputPath);
  console.log(`저장 경로: ${outputPath}`);
  console.log(`최종 단어 수: ${qaResult.passed.length}`);
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}
