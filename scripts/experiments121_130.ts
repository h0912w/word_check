/**
 * Experiments 121-130: Hybrid and Advanced Patterns
 *
 * 더 고급화된 하이브리드 패턴 실험
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
function generateWords(targetCount: number, existingWords: Set<string>, wordGenerator: () => string[]): string[] {
  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 30;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    const candidates = wordGenerator();
    for (const word of candidates) {
      const normalized = word.toLowerCase().trim();

      if (normalized.length < 3 || normalized.length > 20) continue;
      if (!/^[a-z0-9\-]+$/.test(normalized)) continue;
      if (normalized.includes('--')) continue;
      if (normalized.startsWith('-') || normalized.endsWith('-')) continue;
      if (existingWords.has(normalized) || newWordsSet.has(normalized)) continue;

      newWords.push(normalized);
      newWordsSet.add(normalized);

      if (newWords.length >= targetCount) break;
    }

    if (newWords.length >= targetCount) break;
  }

  return newWords;
}

// 실험 121: 혼합 길이 패턴
function experiment121(): string[] {
  const mixedLengthWords = [
    // 3-5자
    'app', 'hub', 'api', 'web', 'net', 'ops', 'dev', 'sys', 'cloud', 'data',
    // 6-10자
    'tech', 'soft', 'ware', 'stack', 'flow', 'core', 'base', 'platform', 'service',
    // 11-15자
    'infrastructure', 'architecture', 'intelligence', 'integration', 'innovation'
  ];

  const suffixes = ['io', 'app', 'hub', 'core', 'base', 'ops', 'sys', 'tech'];

  return generateWords(10000, loadExistingWords(), () => {
    const base = mixedLengthWords[Math.floor(Math.random() * mixedLengthWords.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return [`${base}${suffix}`];
  });
}

// 실험 122: 음성 변형 (Phonetic)
function experiment122(): string[] {
  const phoneticVariations = [
    'qu', 'kw', 'ph', 'f', 'ck', 'k', 'x', 'ks', 'y', 'i',
    'c', 's', 'z', 'j', 'g', 'v', 'w', 'uu', 'ee', 'oo'
  ];

  const bases = ['tech', 'soft', 'ware', 'app', 'hub', 'flow', 'stack', 'core', 'base'];

  return generateWords(10000, loadExistingWords(), () => {
    const base = bases[Math.floor(Math.random() * bases.length)];
    const phonetic = phoneticVariations[Math.floor(Math.random() * phoneticVariations.length)];
    return [`${base}${phonetic}`, `${phonetic}${base}`];
  });
}

// 실험 123: 브랜드 가능한 이름 (Brandable)
function experiment123(): string[] {
  const brandablePrefixes = [
    'vero', 'nov', 'alt', 'sol', 'lun', 'stell', 'aer', 'aqu', 'terr', 'ign',
    'fort', 'val', 'vit', 'viv', 'mort', 'temp', 'spa', 'aet', 'omni', 'pan'
  ];

  const brandableSuffixes = [
    'ia', 'ium', 'ora', 'ara', 'ella', 'etta', 'ina', 'ano', 'ico', 'io'
  ];

  return generateWords(10000, loadExistingWords(), () => {
    const prefix = brandablePrefixes[Math.floor(Math.random() * brandablePrefixes.length)];
    const suffix = brandableSuffixes[Math.floor(Math.random() * brandableSuffixes.length)];
    return [`${prefix}${suffix}`];
  });
}

// 실험 124: 복합 접미사
function experiment124(): string[] {
  const bases = ['data', 'cloud', 'tech', 'soft', 'app', 'web', 'api', 'flow', 'stack'];

  const compoundSuffixes = [
    'flow', 'stack', 'app', 'hub', 'lab', 'core', 'base', 'ops', 'sys', 'tech',
    'soft', 'ware', 'platform', 'service', 'solution', 'system'
  ];

  return generateWords(10000, loadExistingWords(), () => {
    const base = bases[Math.floor(Math.random() * bases.length)];
    const suffix1 = compoundSuffixes[Math.floor(Math.random() * compoundSuffixes.length)];
    const suffix2 = compoundSuffixes[Math.floor(Math.random() * compoundSuffixes.length)];
    return [`${base}${suffix1}${suffix2}`];
  });
}

// 실험 125: 접두사 체인
function experiment125(): string[] {
  const prefixes = ['auto', 'multi', 'hyper', 'super', 'ultra', 'meta', 'neo', 'proto'];
  const bases = ['data', 'cloud', 'tech', 'soft', 'app', 'web', 'api'];

  return generateWords(10000, loadExistingWords(), () => {
    const p1 = prefixes[Math.floor(Math.random() * prefixes.length)];
    const p2 = prefixes[Math.floor(Math.random() * prefixes.length)];
    const base = bases[Math.floor(Math.random() * bases.length)];
    return [`${p1}${p2}${base}`];
  });
}

// 실험 126: 주제별 클러스터
function experiment126(): string[] {
  const clusters = {
    analytics: ['data', 'metric', 'insight', 'report', 'dashboard', 'analytics'],
    security: ['secure', 'protect', 'shield', 'guard', 'safe', 'auth'],
    productivity: ['flow', 'stack', 'sync', 'track', 'manage', 'organize'],
    communication: ['chat', 'message', 'notify', 'alert', 'connect', 'link']
  };

  const suffixes = ['io', 'app', 'hub', 'core', 'base', 'ops', 'sys', 'tech'];

  return generateWords(10000, loadExistingWords(), () => {
    const clusterKeys = Object.keys(clusters);
    const clusterKey = clusterKeys[Math.floor(Math.random() * clusterKeys.length)];
    const cluster = clusters[clusterKey as keyof typeof clusters];
    const base = cluster[Math.floor(Math.random() * cluster.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return [`${base}${suffix}`];
  });
}

// 실험 127: 계절적 용어
function experiment127(): string[] {
  const seasonal = [
    'spring', 'summer', 'autumn', 'fall', 'winter', 'season',
    'monsoon', 'tropic', 'equinox', 'solstice', 'polar', 'temperate'
  ];

  const techWords = ['tech', 'soft', 'ware', 'app', 'hub', 'flow', 'stack', 'core'];

  return generateWords(10000, loadExistingWords(), () => {
    const season = seasonal[Math.floor(Math.random() * seasonal.length)];
    const tech = techWords[Math.floor(Math.random() * techWords.length)];
    return [`${season}${tech}`, `${tech}${season}`];
  });
}

// 실험 128: 방향성 용어
function experiment128(): string[] {
  const directional = [
    'north', 'south', 'east', 'west', 'up', 'down', 'left', 'right',
    'in', 'out', 'through', 'across', 'over', 'under', 'between', 'within'
  ];

  const techWords = ['flow', 'stack', 'app', 'hub', 'core', 'base', 'ops'];

  return generateWords(10000, loadExistingWords(), () => {
    const direction = directional[Math.floor(Math.random() * directional.length)];
    const tech = techWords[Math.floor(Math.random() * techWords.length)];
    return [`${direction}${tech}`, `${tech}${direction}`];
  });
}

// 실험 129: 차원적 용어
function experiment129(): string[] {
  const dimensional = [
    'space', 'time', 'dimension', 'realm', 'plane', 'sphere', 'circle',
    'square', 'triangle', 'cube', 'pyramid', 'matrix', 'vector', 'tensor'
  ];

  const techWords = ['tech', 'soft', 'ware', 'sys', 'ops', 'lab', 'hub'];

  return generateWords(10000, loadExistingWords(), () => {
    const dimension = dimensional[Math.floor(Math.random() * dimensional.length)];
    const tech = techWords[Math.floor(Math.random() * techWords.length)];
    return [`${dimension}${tech}`, `${tech}${dimension}`];
  });
}

// 실험 130: 양자 개념
function experiment130(): string[] {
  const quantum = [
    'quantum', 'qubit', 'entangle', 'superposition', 'coherence', 'decoherence',
    'tunnel', 'spin', 'wave', 'particle', 'field', 'flux', 'energy', 'matter'
  ];

  const techWords = ['tech', 'soft', 'ware', 'app', 'hub', 'flow', 'stack', 'core'];

  return generateWords(10000, loadExistingWords(), () => {
    const q = quantum[Math.floor(Math.random() * quantum.length)];
    const tech = techWords[Math.floor(Math.random() * techWords.length)];
    return [`${q}${tech}`, `${tech}${q}`];
  });
}

// 메인
async function main() {
  console.log('=== Experiments 121-130: Hybrid and Advanced Patterns ===');
  console.log('');

  const existingWords = loadExistingWords();
  console.log(`기존 단어 수: ${existingWords.size}`);
  console.log('');

  const experiments = [
    { id: 121, name: 'Mixed Length', fn: experiment121 },
    { id: 122, name: 'Phonetic Variations', fn: experiment122 },
    { id: 123, name: 'Brandable Names', fn: experiment123 },
    { id: 124, name: 'Compound Suffixes', fn: experiment124 },
    { id: 125, name: 'Prefix Chains', fn: experiment125 },
    { id: 126, name: 'Thematic Clusters', fn: experiment126 },
    { id: 127, name: 'Seasonal Terms', fn: experiment127 },
    { id: 128, name: 'Directional Terms', fn: experiment128 },
    { id: 129, name: 'Dimensional Terms', fn: experiment129 },
    { id: 130, name: 'Quantum Concepts', fn: experiment130 }
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
