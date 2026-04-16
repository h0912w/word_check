/**
 * Mint Words with Real-time Deduplication
 *
 * 새로운 단어를 생성할 때마다 기존 단어와 비교하여 중복을 방지합니다.
 * 이 스크립트는 Claude Code 세션에서 단어 생성을 조율합니다.
 *
 * 사용법:
 * 1. Claude Code가 이 스크립트를 실행합니다.
 * 2. 기존 모든 단어를 로드합니다.
 * 3. 새로운 단어를 생성할 때마다 중복 체크를 수행합니다.
 * 4. 중복되지 않은 단어만 최종 저장합니다.
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadExistingWords } from '../src/word-generation/deduplication';
import { validateWords, generateQAReport, saveQAReport } from '../src/word-generation/validator';

/**
 * 단어 생성 옵션
 */
interface MintOptions {
  count?: number;
  category?: string;
  pattern?: string;
  outputPath?: string;
  runQA?: boolean;
}

/**
 * 기본 옵션
 */
const DEFAULT_OPTIONS: MintOptions = {
  count: 10000,
  category: 'mixed',
  pattern: 'mixed',
  outputPath: undefined,
  runQA: true
};

/**
 * 메인 함수
 */
async function main() {
  console.log('=== Mint Words with Real-time Deduplication ===');
  console.log('');

  // 1. 옵션 로드
  const options = loadOptions();
  console.log('옵션:', JSON.stringify(options, null, 2));
  console.log('');

  // 2. 기존 단어 로드 (중복 체크용)
  console.log('기존 단어 로드 중...');
  const existingWords = await loadAllExistingWords();
  console.log(`기존 단어 수: ${existingWords.size}`);
  console.log('');

  // 3. 단어 생성 프레임워크 제시
  console.log('=== 단어 생성 프레임워크 ===');
  console.log(`목표: ${options.count}개 단어 생성`);
  console.log(`카테고리: ${options.category}`);
  console.log(`패턴: ${options.pattern}`);
  console.log('');
  console.log('중복 체크 방법:');
  console.log('1. 기존 단어를 Set에 저장 (O(1) 검색)');
  console.log('2. 새 단어 생성 시 즉시 중복 체크');
  console.log('3. 중복되지 않은 단어만 목록에 추가');
  console.log('');

  // 4. 단어 생성 (Claude Code가 수행)
  const generatedWords = await generateWordsWithDedup(options.count, existingWords);

  console.log('');
  console.log('=== 생성 결과 ===');
  console.log(`생성 시도: ${options.count}개`);
  console.log(`실제 생성: ${generatedWords.length}개`);
  console.log(`중복 방지: ${options.count - generatedWords.length}개`);
  console.log('');

  // 5. QA 검증
  let qaResult;
  let finalWords = generatedWords;

  if (options.runQA) {
    console.log('=== QA 검증 ===');
    qaResult = validateWords(generatedWords);

    console.log(`QA 통과: ${qaResult.passed.length} (${qaResult.passRate.toFixed(1)}%)`);
    console.log(`QA 실패: ${qaResult.failed.length}`);
    console.log(`평균 점수: ${qaResult.averageScore.toFixed(1)}`);
    console.log('');

    finalWords = qaResult.passed;

    // QA 리포트 저장
    const qaReport = generateQAReport(qaResult.results);
    const qaReportPath = `input/generated/mint_qa_report_${getDateSlug()}.json`;
    saveQAReport(qaReport, qaReportPath);
    console.log(`QA 리포트 저장: ${qaReportPath}`);
  }

  // 6. 최종 저장
  const outputPath = options.outputPath || `input/generated/mint_words_${getDateSlug()}.txt`;
  saveWordsToFile(finalWords, outputPath);

  console.log('');
  console.log('=== 완료 ===');
  console.log(`저장 경로: ${outputPath}`);
  console.log(`최종 단어 수: ${finalWords.length}`);
}

/**
 * 모든 기존 단어를 로드합니다.
 */
async function loadAllExistingWords(): Promise<Set<string>> {
  const allWords = new Set<string>();

  // input/ 디렉터리의 단어 로드
  if (fs.existsSync('input')) {
    const inputWords = await loadExistingWords('input');
    inputWords.forEach(word => allWords.add(word));
  }

  // input/generated/ 디렉터리의 단어 로드
  if (fs.existsSync('input/generated')) {
    const genFiles = fs.readdirSync('input/generated')
      .filter(f => f.endsWith('.txt') || f.endsWith('_passed.txt'));

    for (const file of genFiles) {
      const filePath = path.join('input/generated', file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const words = content.split('\n')
        .map(line => line.trim().toLowerCase())
        .filter(line => line.length > 0);
      words.forEach(word => allWords.add(word));
    }
  }

  return allWords;
}

/**
 * 중복 체크를 포함하여 단어를 생성합니다.
 *
 * 이 함수는 Claude Code가 실제로 단어를 생성할 때 호출됩니다.
 * 각 단어 생성 시 즉시 중복 체크를 수행합니다.
 */
async function generateWordsWithDedup(
  targetCount: number,
  existingWords: Set<string>
): Promise<string[]> {
  const newWords: string[] = [];
  const newWordsSet = new Set<string>();

  // 기본 단어 집합 (실험에서 검증된 패턴)
  const baseWords = [
    // 3-5자 단어
    'app', 'api', 'hub', 'kit', 'lab', 'web', 'net', 'mob', 'ops', 'dev', 'sys',
    'data', 'cloud', 'flow', 'stack', 'view', 'card', 'list', 'table', 'node',
    'edge', 'path', 'root', 'leaf', 'host', 'port', 'gate', 'room', 'desk',
    'lamp', 'deck', 'dock', 'gear', 'tech', 'code', 'tool', 'pad', 'map',
    'set', 'bag', 'box', 'pack', 'spot', 'site', 'base', 'camp', 'nest',

    // 6-8자 단어
    'analytics', 'insights', 'metrics', 'reports', 'dashboard', 'forecast',
    'prediction', 'tracking', 'monitor', 'control', 'manage', 'organize',
    'optimize', 'automate', 'streamline', 'simplify', 'accelerate', 'scale',
    'deploy', 'connect', 'sync', 'share', 'collab', 'communicate', 'exchange',

    // 기술 용어
    'react', 'vue', 'angular', 'node', 'python', 'java', 'go', 'rust', 'swift',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'graphql', 'mongodb', 'redis',
    'postgresql', 'mysql', 'elasticsearch', 'kafka', 'rabbitmq', 'nginx',

    // 비즈니스 용어
    'revenue', 'profit', 'margin', 'growth', 'churn', 'retention', 'acquisition',
    'conversion', 'funnel', 'pipeline', 'lead', 'prospect', 'customer', 'client',

    // 접미사
    'io', 'app', 'hq', 'lab', 'fy', 'go', 'up', 'ex', 'pro', 'plus', 'max',
    'core', 'base', 'hub', 'kit', 'pad', 'deck', 'dock', 'gear', 'tech',

    // 접두사
    'super', 'ultra', 'hyper', 'mega', 'micro', 'mini', 'nano', 'smart', 'auto',
    'multi', 'all', 'pan', 'omni', 'meta', 'pre', 'post', 'pro', 'anti',

    // 숫자
    '1', '2', '3', '24', '365', '9', '10', '360', '99', '100', '500', '1000'
  ];

  // 접미사 조합
  const suffixes = [
    'flow', 'stack', 'app', 'hub', 'kit', 'lab', 'tech', 'base', 'core',
    'view', 'node', 'edge', 'path', 'host', 'port', 'gate', 'room', 'desk',
    'deck', 'gear', 'code', 'tool', 'pad', 'map', 'set', 'bag', 'box', 'pack'
  ];

  // 단어 생성 루프
  let attempts = 0;
  const maxAttempts = targetCount * 10; // 최대 10배 시도

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    // 랜덤 패턴 선택
    const pattern = Math.floor(Math.random() * 5);

    let word = '';

    switch (pattern) {
      case 0: // 기본 단어 + 접미사
        {
          const base = baseWords[Math.floor(Math.random() * baseWords.length)];
          const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
          word = `${base}${suffix}`;
        }
        break;

      case 1: // 기본 단어 + 숫자
        {
          const base = baseWords[Math.floor(Math.random() * baseWords.length)];
          const num = ['1', '2', '3', '24', '365', '9', '10', '360', '99'][Math.floor(Math.random() * 9)];
          word = `${base}${num}`;
        }
        break;

      case 2: // 두 단어 조합
        {
          const w1 = baseWords[Math.floor(Math.random() * Math.min(baseWords.length, 50))];
          const w2 = baseWords[Math.floor(Math.random() * Math.min(baseWords.length, 50))];
          word = `${w1}${w2}`;
        }
        break;

      case 3: // 접두사 + 기본 단어
        {
          const prefixes = ['super', 'ultra', 'hyper', 'mega', 'micro', 'mini', 'smart', 'auto', 'multi'];
          const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
          const base = baseWords[Math.floor(Math.random() * baseWords.length)];
          word = `${prefix}${base}`;
        }
        break;

      case 4: // 기본 단어만
        {
          word = baseWords[Math.floor(Math.random() * baseWords.length)];
        }
        break;
    }

    // 정규화
    word = word.toLowerCase().trim();

    // 길이 체크 (3-20자)
    if (word.length < 3 || word.length > 20) {
      continue;
    }

    // 영어 체크 (a-z, 0-9, - 만 허용)
    if (!/^[a-z0-9\-]+$/.test(word)) {
      continue;
    }

    // 중복 체크 (기존 단어 + 현재 배치)
    const normalizedWord = word.toLowerCase();
    if (existingWords.has(normalizedWord) || newWordsSet.has(normalizedWord)) {
      continue; // 중복이면 스킵
    }

    // 통과하면 추가
    newWords.push(word);
    newWordsSet.add(normalizedWord);
  }

  console.log(`생성 시도: ${attempts}회`);
  console.log(`중복 방지: ${attempts - newWords.length}개`);

  return newWords;
}

/**
 * 단어 목록을 파일에 저장합니다.
 */
function saveWordsToFile(words: string[], outputPath: string): void {
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const content = words.join('\n');
  fs.writeFileSync(outputPath, content, 'utf-8');
}

/**
 * 옵션을 로드합니다.
 */
function loadOptions(): MintOptions {
  const args = process.argv.slice(2);
  const options: MintOptions = { ...DEFAULT_OPTIONS };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--count':
      case '-c':
        options.count = parseInt(args[++i], 10);
        break;
      case '--category':
        options.category = args[++i];
        break;
      case '--pattern':
        options.pattern = args[++i];
        break;
      case '--output':
      case '-o':
        options.outputPath = args[++i];
        break;
      case '--no-qa':
        options.runQA = false;
        break;
      default:
        // 숫자로 시작하는 인자는 count로 처리
        if (!isNaN(parseInt(arg, 10))) {
          options.count = parseInt(arg, 10);
        }
    }
  }

  return options;
}

/**
 * 날짜 슬러그를 생성합니다.
 */
function getDateSlug(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Claude Code를 위한 단어 생성 가이드
 *
 * 중복 체크가 포함된 단어 생성 방법:
 *
 * 1. 기존 단어 로드: loadAllExistingWords()
 * 2. 새 단어 생성 시마다 기존 단어와 비교
 * 3. 중복되지 않은 단어만 목록에 추가
 * 4. 최종 저장 시 재검증
 *
 * 단어 조합 패턴:
 * - 기본 단어 + 접미사: dataflow, cloudstack
 * - 기본 단어 + 숫자: app1, data24
 * - 두 단어 조합: webhook, syncnode
 * - 접두사 + 기본 단어: superdata, ultrahub
 *
 * 길이 제한: 3-20자
 * 문자 제한: a-z, 0-9, - (하이픈)
 */

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

export { main, generateWordsWithDedup, DEFAULT_OPTIONS };
