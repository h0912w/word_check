/**
 * Experiments 131-140: Creative and Innovative Patterns
 *
 * 완전히 새로운 창의적 패턴 실험
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

// 범용 단어 생성기
function generateWords(targetCount: number, wordGenerator: () => string): string[] {
  const existingWords = loadExistingWords();
  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 50;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    const word = wordGenerator();
    const normalized = word.toLowerCase().trim();

    if (normalized.length < 3 || normalized.length > 20) continue;
    if (!/^[a-z0-9\-]+$/.test(normalized)) continue;
    if (normalized.includes('--')) continue;
    if (normalized.startsWith('-') || normalized.endsWith('-')) continue;
    if (existingWords.has(normalized) || newWordsSet.has(normalized)) continue;

    newWords.push(normalized);
    newWordsSet.add(normalized);
  }

  return newWords;
}

// 실험 131: 역순 조합
function experiment131(): string[] {
  const words = ['tech', 'soft', 'ware', 'data', 'cloud', 'flow', 'stack', 'app', 'hub'];

  return generateWords(10000, () => {
    const w1 = words[Math.floor(Math.random() * words.length)];
    const w2 = words[Math.floor(Math.random() * words.length)];
    // 역순 조합: w2 + w1
    return `${w2}${w1}`;
  });
}

// 실험 132: 음절 혼합
function experiment132(): string[] {
  const syllables = [
    'tech', 'soft', 'ware', 'data', 'cloud', 'flow', 'stack', 'app', 'hub',
    'core', 'base', 'ops', 'sys', 'net', 'web', 'api', 'dev', 'lab'
  ];

  return generateWords(10000, () => {
    const s1 = syllables[Math.floor(Math.random() * syllables.length)];
    const s2 = syllables[Math.floor(Math.random() * syllables.length)];
    // 음절 섞기
    const mix = Math.random() > 0.5 ? `${s1.substring(0, 3)}${s2}` : `${s1}${s2.substring(0, 3)}`;
    return mix;
  });
}

// 실험 133: 자음 클러스터
function experiment133(): string[] {
  const consonantClusters = [
    'str', 'spr', 'spl', 'scr', 'thr', 'shr', 'squ',
    'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr',
    'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw'
  ];

  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const endings = ['tech', 'soft', 'ware', 'app', 'hub'];

  return generateWords(10000, () => {
    const cluster = consonantClusters[Math.floor(Math.random() * consonantClusters.length)];
    const vowel = vowels[Math.floor(Math.random() * vowels.length)];
    const ending = endings[Math.floor(Math.random() * endings.length)];
    return `${cluster}${vowel}${ending}`;
  });
}

// 실험 134: 모음 패턴
function experiment134(): string[] {
  const vowelPatterns = [
    'io', 'ea', 'ou', 'ai', 'ee', 'oo', 'ue', 'ie', 'au', 'ei'
  ];

  const bases = ['tech', 'soft', 'ware', 'data', 'cloud', 'flow', 'stack', 'app'];

  return generateWords(10000, () => {
    const base = bases[Math.floor(Math.random() * bases.length)];
    const pattern = vowelPatterns[Math.floor(Math.random() * vowelPatterns.length)];
    // 중간에 모음 패턴 삽입
    const mid = Math.floor(base.length / 2);
    return `${base.substring(0, mid)}${pattern}${base.substring(mid)}`;
  });
}

// 실험 135: 숫자-단어 하이브리드
function experiment135(): string[] {
  const words = ['tech', 'soft', 'ware', 'data', 'cloud', 'flow', 'stack', 'app', 'hub'];
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'x', 'xx'];

  return generateWords(10000, () => {
    const w = words[Math.floor(Math.random() * words.length)];
    const n = numbers[Math.floor(Math.random() * numbers.length)];
    // 여러 위치에 숫자 배치
    const pos = Math.floor(Math.random() * 3);
    switch (pos) {
      case 0: return `${n}${w}`;
      case 1: return `${w.substring(0, 2)}${n}${w.substring(2)}`;
      default: return `${w}${n}`;
    }
  });
}

// 실험 136: 기술 스택 조합
function experiment136(): string[] {
  const techStack = [
    'react', 'vue', 'angular', 'node', 'python', 'java', 'go', 'rust',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'mongodb', 'redis'
  ];

  const components = ['app', 'hub', 'core', 'base', 'ops', 'sys', 'lab', 'stack'];

  return generateWords(10000, () => {
    const tech = techStack[Math.floor(Math.random() * techStack.length)];
    const comp = components[Math.floor(Math.random() * components.length)];
    return `${tech}${comp}`;
  });
}

// 실험 137: 약어 확장
function experiment137(): string[] {
  const acronyms = ['AI', 'ML', 'SaaS', 'B2B', 'API', 'CRM', 'ERP', 'KPI', 'ROI', 'CEO'];
  const expansions = ['tech', 'soft', 'ware', 'app', 'hub', 'core', 'base', 'ops'];

  return generateWords(10000, () => {
    const acronym = acronyms[Math.floor(Math.random() * acronyms.length)];
    const expansion = expansions[Math.floor(Math.random() * expansions.length)];
    // 약어를 소문자로 변환하여 조합
    return `${acronym.toLowerCase()}${expansion}`;
  });
}

// 실험 138: 은유적 용어
function experiment138(): string[] {
  const metaphors = [
    'bridge', 'anchor', 'compass', 'engine', 'fuel', 'spark', 'fire',
    'wave', 'tide', 'storm', 'cloud', 'mountain', 'peak', 'valley'
  ];

  const techWords = ['tech', 'soft', 'ware', 'app', 'hub', 'flow', 'stack', 'core'];

  return generateWords(10000, () => {
    const metaphor = metaphors[Math.floor(Math.random() * metaphors.length)];
    const tech = techWords[Math.floor(Math.random() * techWords.length)];
    return `${metaphor}${tech}`;
  });
}

// 실험 139: 문화적 참조
function experiment139(): string[] {
  const cultural = [
    'zen', 'tao', 'chi', 'karma', 'ninja', 'samurai', 'sumo', 'anime',
    'sushi', 'ramen', 'bento', 'origami', 'bonsai', 'katana', 'shogun'
  ];

  const techWords = ['tech', 'soft', 'ware', 'app', 'hub', 'flow', 'stack', 'core'];

  return generateWords(10000, () => {
    const culture = cultural[Math.floor(Math.random() * cultural.length)];
    const tech = techWords[Math.floor(Math.random() * techWords.length)];
    return `${culture}${tech}`;
  });
}

// 실험 140: 신화적 용어
function experiment140(): string[] {
  const mythological = [
    'apollo', 'zeus', 'hera', 'athena', 'mars', 'venus', 'cupid', 'norse',
    'odin', 'thor', 'loki', 'freya', 'titan', 'olympus', 'valhalla', 'asgard'
  ];

  const techWords = ['tech', 'soft', 'ware', 'app', 'hub', 'flow', 'stack', 'core'];

  return generateWords(10000, () => {
    const myth = mythological[Math.floor(Math.random() * mythological.length)];
    const tech = techWords[Math.floor(Math.random() * techWords.length)];
    return `${myth}${tech}`;
  });
}

// 메인
async function main() {
  console.log('=== Experiments 131-140: Creative and Innovative Patterns ===');
  console.log('');

  const existingWords = loadExistingWords();
  console.log(`기존 단어 수: ${existingWords.size}`);
  console.log('');

  const experiments = [
    { id: 131, name: 'Reverse Combinations', fn: experiment131 },
    { id: 132, name: 'Syllable Mixing', fn: experiment132 },
    { id: 133, name: 'Consonant Clusters', fn: experiment133 },
    { id: 134, name: 'Vowel Patterns', fn: experiment134 },
    { id: 135, name: 'Number-Word Hybrids', fn: experiment135 },
    { id: 136, name: 'Tech Stack Combinations', fn: experiment136 },
    { id: 137, name: 'Acronym Expansions', fn: experiment137 },
    { id: 138, name: 'Metaphor Based Terms', fn: experiment138 },
    { id: 139, name: 'Cultural References', fn: experiment139 },
    { id: 140, name: 'Mythological Terms', fn: experiment140 }
  ];

  for (const exp of experiments) {
    console.log(`=== Experiment ${exp.id}: ${exp.name} ===`);

    const startTime = Date.now();
    const words = exp.fn();
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
