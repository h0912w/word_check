/**
 * Experiment 109: Multi-Word Compound Patterns
 *
 * 3개 이상의 단어를 결합하여 복합적인 SaaS 제품명 생성
 * 예: DataFlowStack, CloudHubCore, ApiSyncBase
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateWords, generateQAReport, saveQAReport } from '../src/word-generation/validator';

// 기본 단어 (3단어 조합용)
const COMPOUND_PARTS = [
  // 첫 번째 부분 (주제/영역)
  'data', 'cloud', 'web', 'api', 'app', 'soft', 'tech', 'digital',
  'smart', 'auto', 'ai', 'ml', 'iot', 'blockchain', 'crypto',

  // 두 번째 부분 (기능/동사)
  'flow', 'stack', 'sync', 'connect', 'link', 'bridge', 'route', 'path',
  'track', 'monitor', 'manage', 'control', 'handle', 'process', 'compute',

  // 세 번째 부분 (구조/시스템)
  'hub', 'core', 'base', 'ops', 'sys', 'net', 'platform', 'service',
  'solution', 'system', 'network', 'framework', 'engine', 'toolkit',

  // 추가 변형
  'ware', 'soft', 'app', 'api', 'dev', 'lab', 'center', 'central'
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

// 복합 단어 생성
function generateCompoundWords(targetCount: number, existingWords: Set<string>): string[] {
  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 20;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    // 랜덤 패턴 선택
    const pattern = Math.floor(Math.random() * 5);
    let word = '';

    switch (pattern) {
      case 0: // 3단어 조합 (기본)
        {
          const part1 = COMPOUND_PARTS[Math.floor(Math.random() * COMPOUND_PARTS.length)];
          const part2 = COMPOUND_PARTS[Math.floor(Math.random() * COMPOUND_PARTS.length)];
          const part3 = COMPOUND_PARTS[Math.floor(Math.random() * COMPOUND_PARTS.length)];
          word = `${part1}${part2}${part3}`;
        }
        break;

      case 1: // 4단어 조합
        {
          const part1 = COMPOUND_PARTS[Math.floor(Math.random() * Math.min(COMPOUND_PARTS.length, 15))];
          const part2 = COMPOUND_PARTS[Math.floor(Math.random() * Math.min(COMPOUND_PARTS.length, 20))];
          const part3 = COMPOUND_PARTS[Math.floor(Math.random() * Math.min(COMPOUND_PARTS.length, 25))];
          const part4 = COMPOUND_PARTS[Math.floor(Math.random() * Math.min(COMPOUND_PARTS.length, 30))];
          word = `${part1}${part2}${part3}${part4}`;
        }
        break;

      case 2: // 짧은 단어 3개 조합
        {
          const shortParts = COMPOUND_PARTS.filter(p => p.length <= 5);
          const part1 = shortParts[Math.floor(Math.random() * shortParts.length)];
          const part2 = shortParts[Math.floor(Math.random() * shortParts.length)];
          const part3 = shortParts[Math.floor(Math.random() * shortParts.length)];
          word = `${part1}${part2}${part3}`;
        }
        break;

      case 3: // 주제-기능-구조 순서
        {
          const topics = ['data', 'cloud', 'web', 'api', 'app', 'soft', 'tech'];
          const functions = ['flow', 'stack', 'sync', 'connect', 'link', 'bridge'];
          const structures = ['hub', 'core', 'base', 'ops', 'sys'];
          word = `${topics[Math.floor(Math.random() * topics.length)]}${functions[Math.floor(Math.random() * functions.length)]}${structures[Math.floor(Math.random() * structures.length)]}`;
        }
        break;

      case 4: // 2단어 + 접미사
        {
          const part1 = COMPOUND_PARTS[Math.floor(Math.random() * COMPOUND_PARTS.length)];
          const part2 = COMPOUND_PARTS[Math.floor(Math.random() * COMPOUND_PARTS.length)];
          const suffix = ['flow', 'stack', 'hub', 'core', 'base', 'ops'][Math.floor(Math.random() * 6)];
          word = `${part1}${part2}${suffix}`;
        }
        break;
    }

    // 정규화
    word = word.toLowerCase().trim();

    // 길이 체크 (3-20자)
    if (word.length < 3 || word.length > 20) {
      continue;
    }

    // 영어 체크
    if (!/^[a-z]+$/.test(word)) {
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
  console.log('=== Experiment 109: Multi-Word Compound Patterns ===');
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
  const words = generateCompoundWords(targetCount, existingWords);
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
  const qaReportPath = `input/generated/experiment109_qa_${Date.now()}.json`;
  saveQAReport(qaReport, qaReportPath);
  console.log(`QA 리포트 저장: ${qaReportPath}`);
  console.log('');

  // 최종 저장
  const outputPath = `input/generated/experiment109_compound_10000.txt`;
  saveWords(qaResult.passed, outputPath);
  console.log(`저장 경로: ${outputPath}`);
  console.log(`최종 단어 수: ${qaResult.passed.length}`);
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}
