/**
 * Experiment 110: Abstract and Conceptual Terms
 *
 * 추상적이고 개념적인 용어를 사용하여 고급스러운 SaaS 제품명 생성
 * 예: Nexus, Quantum, Zenith, Apex, Prime, Core
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateWords, generateQAReport, saveQAReport } from '../src/word-generation/validator';

// 추상적/개념적 용어
const ABSTRACT_TERMS = [
  // 정점/최고
  'apex', 'zenith', 'peak', 'pinnacle', 'summit', 'acme', 'top', 'prime',
  'supreme', 'ultimate', 'paramount', 'foremost', 'leading', 'premier',

  // 중심/핵심
  'core', 'heart', 'center', 'central', 'nucleus', 'hub', 'focus',
  'pivot', 'axis', 'keystone', 'cornerstone', 'foundation', 'base',

  // 연결/통합
  'nexus', 'bridge', 'link', 'connection', 'synthesis', 'fusion', 'merge',
  'unify', 'integrate', 'converge', 'amalgamate', 'blend', 'mix',

  // 미래/혁신
  'quantum', 'nova', 'nebula', 'cosmos', 'stellar', 'solar', 'lunar',
  'horizon', 'vanguard', 'pioneer', 'innovate', 'create', 'invent',

  // 속도/역동
  'velocity', 'momentum', 'impulse', 'drive', 'force', 'power', 'energy',
  'kinetic', 'dynamic', 'active', 'rapid', 'swift', 'fast', 'quick',

  // 지능/통찰
  'insight', 'wisdom', 'genius', 'brilliant', 'luminous', 'clarity',
  'vision', 'foresight', 'perspective', 'understanding', 'grasp',

  // 성장/확장
  'evolve', 'growth', 'expand', 'scale', 'ascend', 'rise', 'elevate',
  'advance', 'progress', 'develop', 'mature', 'flourish', 'thrive',

  // 안정/신뢰
  'stable', 'secure', 'safe', 'protect', 'guard', 'shield', 'fortress',
  'reliable', 'dependable', 'trust', 'faith', 'confident', 'certain',

  // 효율/최적화
  'optimal', 'efficient', 'effective', 'productive', 'streamlined',
  'refined', 'polished', 'perfect', 'flawless', 'impeccable'
];

// 기술적 접미사
const TECH_SUFFIXES = [
  'tech', 'soft', 'ware', 'sys', 'ops', 'lab', 'hub', 'core', 'base',
  'flow', 'stack', 'platform', 'service', 'solution', 'system', 'engine'
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

// 추상적 단어 생성
function generateAbstractWords(targetCount: number, existingWords: Set<string>): string[] {
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
      case 0: // 추상 용어만
        {
          word = ABSTRACT_TERMS[Math.floor(Math.random() * ABSTRACT_TERMS.length)];
        }
        break;

      case 1: // 추상 용어 + 접미사
        {
          const abstract = ABSTRACT_TERMS[Math.floor(Math.random() * ABSTRACT_TERMS.length)];
          const suffix = TECH_SUFFIXES[Math.floor(Math.random() * TECH_SUFFIXES.length)];
          word = `${abstract}${suffix}`;
        }
        break;

      case 2: // 접미사 + 추상 용어
        {
          const suffix = TECH_SUFFIXES[Math.floor(Math.random() * TECH_SUFFIXES.length)];
          const abstract = ABSTRACT_TERMS[Math.floor(Math.random() * ABSTRACT_TERMS.length)];
          word = `${suffix}${abstract}`;
        }
        break;

      case 3: // 두 추상 용어 조합
        {
          const abs1 = ABSTRACT_TERMS[Math.floor(Math.random() * ABSTRACT_TERMS.length)];
          const abs2 = ABSTRACT_TERMS[Math.floor(Math.random() * ABSTRACT_TERMS.length)];
          word = `${abs1}${abs2}`;
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
  console.log('=== Experiment 110: Abstract and Conceptual Terms ===');
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
  const words = generateAbstractWords(targetCount, existingWords);
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
  const qaReportPath = `input/generated/experiment110_qa_${Date.now()}.json`;
  saveQAReport(qaReport, qaReportPath);
  console.log(`QA 리포트 저장: ${qaReportPath}`);
  console.log('');

  // 최종 저장
  const outputPath = `input/generated/experiment110_abstract_10000.txt`;
  saveWords(qaResult.passed, outputPath);
  console.log(`저장 경로: ${outputPath}`);
  console.log(`최종 단어 수: ${qaResult.passed.length}`);
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}
