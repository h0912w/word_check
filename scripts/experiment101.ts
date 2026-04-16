/**
 * Experiment 101: New Pattern Combinations
 *
 * 새로운 패턴과 기본 단어 집합으로 실험
 * - 현대적인 기술 용어
 * - 새로운 접두사/접미사 조합
 * - 산업별 특화 용어
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateWords, generateQAReport, saveQAReport } from '../src/word-generation/validator';

// 새로운 기본 단어 집합 (현대적인 기술/비즈니스 용어)
const MODERN_BASE_WORDS = [
  // 클라우드/인프라
  'cloud', 'server', 'cluster', 'node', 'pod', 'container', 'vm', 'instance',
  'deployment', 'scaling', 'load', 'balance', 'traffic', 'network', 'subnet',
  'firewall', 'gateway', 'proxy', 'cdn', 'edge', 'region', 'zone', 'datacenter',

  // DevOps/CI/CD
  'pipeline', 'workflow', 'build', 'release', 'deploy', 'stage', 'prod', 'test',
  'ci', 'cd', 'artifact', 'registry', 'repository', 'branch', 'merge', 'commit',
  'pr', 'issue', 'ticket', 'kanban', 'scrum', 'agile', 'sprint', 'standup',

  // 데이터/ML
  'dataset', 'model', 'training', 'inference', 'prediction', 'feature', 'label',
  'tensor', 'vector', 'embedding', 'transformer', 'llm', 'gpt', 'prompt', 'completion',
  'finetune', 'rag', 'agent', 'orchestration', 'serving', 'endpoint',

  // 보안
  'auth', 'token', 'jwt', 'oauth', 'sso', 'mfa', '2fa', 'identity', 'access',
  'permission', 'role', 'policy', 'compliance', 'audit', 'log', 'monitor', 'alert',
  'incident', 'response', 'remediation', 'vulnerability', 'scan', 'penetration',

  // API/통합
  'rest', 'graphql', 'grpc', 'websocket', 'event', 'message', 'queue', 'stream',
  'pubsub', 'webhook', 'callback', 'integration', 'connector', 'adapter', 'bridge',
  'gateway', 'proxy', 'middleware', 'interceptor', 'filter', 'route',

  // UI/UX
  'component', 'widget', 'module', 'layout', 'theme', 'style', 'design', 'prototype',
  'wireframe', 'mockup', 'user', 'customer', 'journey', 'funnel', 'conversion', 'retention',
  'engagement', 'churn', 'session', 'pageview', 'click', 'impression',

  // 비즈니스
  'revenue', 'profit', 'margin', 'ebitda', 'mrr', 'arr', 'ltv', 'cac', 'arpu',
  'churn', 'retention', 'growth', 'scale', 'expansion', 'upsell', 'cross', 'sell',
  'lead', 'prospect', 'opportunity', 'deal', 'pipeline', 'forecast', 'quota',

  // 짧은 기술 용어
  'ai', 'ml', 'dl', 'nlp', 'cv', 'iot', 'ar', 'vr', 'xr', 'mr',
  'saas', 'paas', 'iaas', 'faas', 'baas', 'caas',
  'b2b', 'b2c', 'c2c', 'p2p',
  'kpi', 'okr', 'roi', 'roc', 'aar',
  'api', 'sdk', 'cli', 'gui', 'ui', 'ux',

  // 동사
  'sync', 'connect', 'link', 'join', 'merge', 'split', 'parse', 'format', 'validate',
  'transform', 'convert', 'encode', 'decode', 'compress', 'encrypt', 'decrypt',
  'sign', 'verify', 'auth', 'login', 'logout', 'register', 'subscribe', 'unsubscribe',

  // 명사
  'hub', 'core', 'base', 'center', 'central', 'master', 'main', 'primary', 'secondary',
  'replica', 'shard', 'partition', 'segment', 'bucket', 'namespace', 'scope', 'context',
  'environment', 'config', 'setting', 'option', 'parameter', 'argument', 'variable'
];

// 새로운 접두사 (현대적)
const MODERN_PREFIXES = [
  'ai', 'smart', 'intelli', 'auto', 'self', 'meta', 'hyper', 'super', 'ultra',
  'micro', 'mini', 'nano', 'macro', 'mega', 'giga', 'tera', 'peta',
  'neo', 'new', 'next', 'future', 'advanced', 'pro', 'plus', 'prime', 'premium',
  'cloud', 'digital', 'virtual', 'remote', 'distributed', 'federated', 'decentralized',
  'secure', 'safe', 'protected', 'trusted', 'verified', 'certified', 'compliant'
];

// 새로운 접미사 (현대적)
const MODERN_SUFFIXES = [
  'io', 'ai', 'ai', 'ly', 'ify', 'app', 'hq', 'lab', 'hub', 'core', 'base',
  'flow', 'stack', 'deck', 'kit', 'pad', 'mate', 'buddy', 'pal', 'friend',
  'ops', 'dev', 'sys', 'admin', 'master', 'node', 'host', 'server', 'client',
  'gate', 'port', 'bridge', 'link', 'path', 'route', 'way', 'lane', 'street',
  'cloud', 'space', 'zone', 'region', 'area', 'field', 'domain', 'realm'
];

// 숫자 (현대적)
const MODERN_NUMBERS = [
  '1', '2', '3', '4', '5', '24', '365', '360', '99', '100',
  '101', '2024', '2025', '3000', '4000', '5000', '9000'
];

// 기존 단어 로드
function loadExistingWords(): Set<string> {
  const existingWords = new Set<string>();

  // input/generated/ 디렉터리의 단어 로드
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

// 단어 생성
function generateWords(targetCount: number, existingWords: Set<string>): string[] {
  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 20;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    // 랜덤 패턴 선택 (더 다양한 패턴)
    const pattern = Math.floor(Math.random() * 8);
    let word = '';

    switch (pattern) {
      case 0: // 기본 단어 + 접미사
        {
          const base = MODERN_BASE_WORDS[Math.floor(Math.random() * MODERN_BASE_WORDS.length)];
          const suffix = MODERN_SUFFIXES[Math.floor(Math.random() * MODERN_SUFFIXES.length)];
          word = `${base}${suffix}`;
        }
        break;

      case 1: // 접두사 + 기본 단어
        {
          const prefix = MODERN_PREFIXES[Math.floor(Math.random() * MODERN_PREFIXES.length)];
          const base = MODERN_BASE_WORDS[Math.floor(Math.random() * MODERN_BASE_WORDS.length)];
          word = `${prefix}${base}`;
        }
        break;

      case 2: // 기본 단어 + 숫자
        {
          const base = MODERN_BASE_WORDS[Math.floor(Math.random() * MODERN_BASE_WORDS.length)];
          const num = MODERN_NUMBERS[Math.floor(Math.random() * MODERN_NUMBERS.length)];
          word = `${base}${num}`;
        }
        break;

      case 3: // 두 단어 조합 (새로운 방식)
        {
          const w1 = MODERN_BASE_WORDS[Math.floor(Math.random() * MODERN_BASE_WORDS.length)];
          const w2 = MODERN_BASE_WORDS[Math.floor(Math.random() * MODERN_BASE_WORDS.length)];
          word = `${w1}${w2}`;
        }
        break;

      case 4: // 하이픈 조합 (접두사-단어)
        {
          const prefix = MODERN_PREFIXES[Math.floor(Math.random() * MODERN_PREFIXES.length)];
          const base = MODERN_BASE_WORDS[Math.floor(Math.random() * MODERN_BASE_WORDS.length)];
          word = `${prefix}-${base}`;
        }
        break;

      case 5: // 하이픈 조합 (단어-접미사)
        {
          const base = MODERN_BASE_WORDS[Math.floor(Math.random() * MODERN_BASE_WORDS.length)];
          const suffix = MODERN_SUFFIXES[Math.floor(Math.random() * MODERN_SUFFIXES.length)];
          word = `${base}-${suffix}`;
        }
        break;

      case 6: // 접두사-단어-접미사 (새로운 패턴)
        {
          const prefix = MODERN_PREFIXES[Math.floor(Math.random() * Math.min(MODERN_PREFIXES.length, 20))];
          const base = MODERN_BASE_WORDS[Math.floor(Math.random() * Math.min(MODERN_BASE_WORDS.length, 30))];
          const suffix = MODERN_SUFFIXES[Math.floor(Math.random() * Math.min(MODERN_SUFFIXES.length, 20))];
          word = `${prefix}-${base}-${suffix}`;
        }
        break;

      case 7: // 기본 단어만 (짧은 것 위주)
        {
          const shortWords = MODERN_BASE_WORDS.filter(w => w.length <= 6);
          if (shortWords.length > 0) {
            word = shortWords[Math.floor(Math.random() * shortWords.length)];
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
    if (!/^[a-z0-9\-]+$/.test(word)) {
      continue;
    }

    // 연속 하이픈 체크
    if (word.includes('--')) {
      continue;
    }

    // 하이픈으로 시작/끝 체크
    if (word.startsWith('-') || word.endsWith('-')) {
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
  console.log('=== Experiment 101: New Pattern Combinations ===');
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
  const words = generateWords(targetCount, existingWords);
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
  const qaReportPath = `input/generated/experiment101_qa_${Date.now()}.json`;
  saveQAReport(qaReport, qaReportPath);
  console.log(`QA 리포트 저장: ${qaReportPath}`);
  console.log('');

  // 최종 저장
  const outputPath = `input/generated/experiment101_modern_patterns_10000.txt`;
  saveWords(qaResult.passed, outputPath);
  console.log(`저장 경로: ${outputPath}`);
  console.log(`최종 단어 수: ${qaResult.passed.length}`);
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}
