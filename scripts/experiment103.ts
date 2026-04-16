/**
 * Experiment 103: Word Blending (Portmanteau)
 *
 * 두 단어를 부분적으로 결합하여 새로운 단어 생성
 * 예: Instagram (Instant + Telegram), Snapchat (Snap + Chat), PayPal (Pay + Pal)
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateWords, generateQAReport, saveQAReport } from '../src/word-generation/validator';

// 기본 단어 집합 (블렌딩용)
const BASE_WORDS_FOR_BLENDING = [
  // 짧은 기술 용어 (3-6자)
  'app', 'api', 'web', 'cloud', 'data', 'tech', 'soft', 'hard', 'ware',
  'net', 'link', 'sync', 'flow', 'stack', 'store', 'base', 'core', 'hub',
  'lab', 'kit', 'pad', 'deck', 'dock', 'port', 'gate', 'node', 'edge',

  // 7-10자 단어 (블렌딩용)
  'analytics', 'insights', 'metrics', 'reports', 'dashboard',
  'platform', 'service', 'solution', 'system', 'network',
  'workflow', 'process', 'project', 'program', 'product',
  'customer', 'client', 'partner', 'vendor', 'supplier',

  // 동사 (블렌딩용)
  'connect', 'sync', 'share', 'send', 'receive', 'transmit',
  'manage', 'control', 'handle', 'process', 'execute',
  'create', 'build', 'make', 'generate', 'produce',
  'track', 'monitor', 'watch', 'observe', 'measure',

  // 형용사 (블렌딩용)
  'smart', 'intelligent', 'automatic', 'digital', 'virtual',
  'secure', 'safe', 'protected', 'encrypted', 'authenticated',
  'fast', 'quick', 'rapid', 'instant', 'realtime', 'live',
  'flexible', 'scalable', 'reliable', 'available', 'accessible'
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

/**
 * 두 단어를 블렌딩하여 새 단어 생성
 * 예: data + gate = datagate, cloud + sync = cloudsync
 */
function blendWords(word1: string, word2: string): string[] {
  const results: string[] = [];

  // 패턴 1: word1의 앞부분 + word2
  // 예: ana(lytics) + gate = anagate
  const take1 = Math.max(2, Math.floor(word1.length / 2));
  results.push(word1.slice(0, take1) + word2);

  // 패턴 2: word1 + word2의 뒷부분
  // 예: cloud + (s)ync = cloudsync
  const take2 = Math.max(2, Math.floor(word2.length / 2));
  results.push(word1 + word2.slice(take2));

  // 패턴 3: word1의 앞부분 + word2의 뒷부분
  // 예: (ana)lytics + (ga)te = anagate
  results.push(word1.slice(0, take1) + word2.slice(take2));

  // 패턴 4: word1의 앞부분 + word2의 앞부분
  // 예: (ana)lytics + (ga)te = anaga
  results.push(word1.slice(0, take1) + word2.slice(0, Math.max(2, Math.floor(word2.length / 2))));

  // 패턴 5: word1 + word2 (기본)
  results.push(word1 + word2);

  return results;
}

// 블렌딩 단어 생성
function generateBlendedWords(targetCount: number, existingWords: Set<string>): string[] {
  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 30;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    // 두 개의 랜덤 단어 선택
    const idx1 = Math.floor(Math.random() * BASE_WORDS_FOR_BLENDING.length);
    const idx2 = Math.floor(Math.random() * BASE_WORDS_FOR_BLENDING.length);

    // 같은 단어는 제외
    if (idx1 === idx2) {
      continue;
    }

    const word1 = BASE_WORDS_FOR_BLENDING[idx1];
    const word2 = BASE_WORDS_FOR_BLENDING[idx2];

    // 블렌딩 시도
    const blendedWords = blendWords(word1, word2);

    for (const blended of blendedWords) {
      // 정규화
      const word = blended.toLowerCase().trim();

      // 길이 체크 (3-20자)
      if (word.length < 3 || word.length > 20) {
        continue;
      }

      // 영어 체크
      if (!/^[a-z]+$/.test(word)) {
        continue;
      }

      // 중복 체크
      if (existingWords.has(word) || newWordsSet.has(word)) {
        continue;
      }

      // 통과하면 추가
      newWords.push(word);
      newWordsSet.add(word);

      if (newWords.length >= targetCount) {
        break;
      }
    }
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
  console.log('=== Experiment 103: Word Blending (Portmanteau) ===');
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
  const words = generateBlendedWords(targetCount, existingWords);
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
  const qaReportPath = `input/generated/experiment103_qa_${Date.now()}.json`;
  saveQAReport(qaReport, qaReportPath);
  console.log(`QA 리포트 저장: ${qaReportPath}`);
  console.log('');

  // 최종 저장
  const outputPath = `input/generated/experiment103_blended_words_10000.txt`;
  saveWords(qaResult.passed, outputPath);
  console.log(`저장 경로: ${outputPath}`);
  console.log(`최종 단어 수: ${qaResult.passed.length}`);
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}
