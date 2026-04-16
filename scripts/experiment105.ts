/**
 * Experiment 105: Action-Oriented Verb-First Patterns
 *
 * 동사를 중심으로 행동 지향적인 SaaS 제품명 생성
 * 예: GetFlow, MakeApp, BuildHub, RunOps
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateWords, generateQAReport, saveQAReport } from '../src/word-generation/validator';

// 행동 동사 (확장 집합)
const ACTION_VERBS = [
  // 가져오기/받기
  'get', 'fetch', 'pull', 'load', 'read', 'receive', 'collect', 'gather',
  'import', 'ingest', 'acquire', 'obtain', 'download', 'sync', 'retrieve',

  // 만들기/생성
  'make', 'build', 'create', 'generate', 'produce', 'construct', 'assemble',
  'fabricate', 'manufacture', 'craft', 'design', 'develop', 'form', 'shape',

  // 실행/작동
  'run', 'execute', 'start', 'launch', 'begin', 'initiate', 'activate',
  'trigger', 'invoke', 'perform', 'carry', 'operate', 'drive', 'power',

  // 관리/제어
  'manage', 'control', 'handle', 'govern', 'direct', 'oversee', 'supervise',
  'administer', 'regulate', 'moderate', 'coordinate', 'orchestrate', 'organize',

  // 분석/처리
  'analyze', 'process', 'compute', 'calculate', 'evaluate', 'assess', 'measure',
  'track', 'monitor', 'observe', 'watch', 'inspect', 'examine', 'study',

  // 변경/변환
  'transform', 'convert', 'change', 'modify', 'alter', 'adjust', 'adapt',
  'mutate', 'evolve', 'shift', 'translate', 'map', 'migrate', 'transfer',

  // 최적화/향상
  'optimize', 'improve', 'enhance', 'boost', 'accelerate', 'speed', 'fast',
  'streamline', 'simplify', 'refine', 'perfect', 'polish', 'tune', 'calibrate',

  // 보호/보안
  'protect', 'secure', 'defend', 'guard', 'shield', 'safe', 'save', 'backup',
  'archive', 'preserve', 'retain', 'keep', 'store', 'hold', 'maintain',

  // 연결/통합
  'connect', 'link', 'join', 'unite', 'merge', 'combine', 'integrate',
  'bridge', 'sync', 'align', 'attach', 'couple', 'pair', 'match', 'bind',

  // 확장/성장
  'scale', 'grow', 'expand', 'extend', 'stretch', 'multiply', 'increase',
  'amplify', 'magnify', 'enhance', 'elevate', 'raise', 'boost', 'upgrade'
];

// 명사 (확장 집합)
const ACTION_NOUNS = [
  // 기술/시스템
  'flow', 'stack', 'app', 'hub', 'core', 'base', 'ops', 'sys', 'net', 'web',
  'cloud', 'data', 'api', 'dev', 'tech', 'soft', 'ware', 'platform', 'service',

  // 비즈니스/운영
  'work', 'job', 'task', 'process', 'workflow', 'pipeline', 'project',
  'business', 'company', 'team', 'org', 'department', 'division', 'unit',

  // 분석/보고
  'report', 'metric', 'insight', 'analytics', 'dashboard', 'chart', 'graph',
  'view', 'display', 'presentation', 'summary', 'overview', 'status',

  // 관리/제어
  'control', 'manager', 'admin', 'controller', 'handler', 'monitor',
  'tracker', 'watcher', 'observer', 'inspector', 'checker', 'validator',

  // 저장/보관
  'store', 'storage', 'vault', 'archive', 'repository', 'database', 'db',
  'warehouse', 'library', 'collection', 'registry', 'log', 'journal'
];

// 접미사 (동사+명사 강조용)
const VERB_SUFFIXES = [
  'flow', 'ops', 'works', 'hub', 'lab', 'base', 'core', 'center', 'central'
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

// 동사 중심 단어 생성
function generateVerbFirstWords(targetCount: number, existingWords: Set<string>): string[] {
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
      case 0: // 동사 + 명사 (붙여쓰기)
        {
          const verb = ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)];
          const noun = ACTION_NOUNS[Math.floor(Math.random() * ACTION_NOUNS.length)];
          word = `${verb}${noun}`;
        }
        break;

      case 1: // 동사 + 접미사
        {
          const verb = ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)];
          const suffix = VERB_SUFFIXES[Math.floor(Math.random() * VERB_SUFFIXES.length)];
          word = `${verb}${suffix}`;
        }
        break;

      case 2: // 동사 + 숫자
        {
          const verb = ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)];
          const num = ['1', '2', '3', '24', '365', '9', '99', '101'][Math.floor(Math.random() * 8)];
          word = `${verb}${num}`;
        }
        break;

      case 3: // 동사 + 동사 (새로운 패턴)
        {
          const verb1 = ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)];
          const verb2 = ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)];
          word = `${verb1}${verb2}`;
        }
        break;

      case 4: // 동사만 (짧은 것 위주)
        {
          const shortVerbs = ACTION_VERBS.filter(v => v.length <= 6);
          if (shortVerbs.length > 0) {
            word = shortVerbs[Math.floor(Math.random() * shortVerbs.length)];
          }
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
  console.log('=== Experiment 105: Action-Oriented Verb-First Patterns ===');
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
  const words = generateVerbFirstWords(targetCount, existingWords);
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
  const qaReportPath = `input/generated/experiment105_qa_${Date.now()}.json`;
  saveQAReport(qaReport, qaReportPath);
  console.log(`QA 리포트 저장: ${qaReportPath}`);
  console.log('');

  // 최종 저장
  const outputPath = `input/generated/experiment105_action_verbs_10000.txt`;
  saveWords(qaResult.passed, outputPath);
  console.log(`저장 경로: ${outputPath}`);
  console.log(`최종 단어 수: ${qaResult.passed.length}`);
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}
