/**
 * Experiments 171-180: Ultimate Creative Patterns
 *
 * 완전히 새로운 차원의 창의적 접근 방식
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

// 최종적 새로운 단어 집합
const ULTIMATE_NEW_WORDS = [
  // 차원 초월
  'hyperdimensional', 'transdimensional', 'metadimensional', 'paradimensional',
  'omnidimensional', 'pan dimensional', 'ultradimensional', 'superdimensional',

  // 양자 의식
  'quantumconscious', 'entangledmind', 'superpositioned', 'coherentthought',
  'tunneling', 'observer', 'eigenstate', 'wavefunction', 'probabilityamplitude',

  // 바이오디지털 융합
  'biodigital', 'cyberorganic', 'syntheticbiological', 'digitalbiological',
  'biocomputing', 'dnacomputing', 'neuromorphic', 'braincomputer', 'interface',

  // 우주적 용어
  'interstellar', 'galactic', 'cosmic', 'universe', 'multiverse', 'omniverse',
  'void', 'nexus', 'singularity', 'event', 'horizon', 'wormhole', 'spacetime',

  // 시간 역설
  'temporal', 'paradox', 'timeloop', 'causality', 'retrocausality', 'chronology',
  'anachronism', 'synchronicity', 'precognition', 'retrocognition', 'dejavu',

  // 언어적 진화
  'linguistic', 'evolution', 'morphology', 'syntax', 'semantic', 'pragmatic',
  'phonology', 'etymology', 'lexicon', 'vocabulary', 'grammar', 'discourse'
];

// 범용 단어 생성기
function generateWords(targetCount: number, wordGenerator: () => string): string[] {
  const existingWords = loadExistingWords();
  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 500;

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

// 실험 171: 차원 초월
function experiment171(): string[] {
  return generateWords(10000, () => {
    const dimensions = ['hyper', 'trans', 'meta', 'para', 'omni', 'pan', 'ultra', 'super'];
    const spaces = ['dimension', 'space', 'verse', 'realm', 'plane', 'existence'];
    const qualities = ['conscious', 'aware', 'sentient', 'intelligent', 'cognitive'];

    const dim = dimensions[Math.floor(Math.random() * dimensions.length)];
    const space = spaces[Math.floor(Math.random() * spaces.length)];
    const quality = qualities[Math.floor(Math.random() * qualities.length)];

    // 차원 초월 패턴
    const patterns = [
      `${dim}${space}`,
      `${dim}${quality}`,
      `${quality}${space}`,
      `${dim}${space}${quality}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 172: 양자 의식
function experiment172(): string[] {
  return generateWords(10000, () => {
    const quantum = ['quantum', 'entangle', 'superposition', 'coherent', 'tunnel', 'eigen'];
    const consciousness = ['mind', 'conscious', 'aware', 'sentient', 'cognitive', 'thought'];
    const tech = ['tech', 'soft', 'ware', 'sys', 'ops', 'lab', 'hub', 'core'];

    const q = quantum[Math.floor(Math.random() * quantum.length)];
    const cons = consciousness[Math.floor(Math.random() * consciousness.length)];
    const t = tech[Math.floor(Math.random() * tech.length)];

    // 양자 의식 패턴
    const patterns = [
      `${q}${cons}`,
      `${cons}${tech}`,
      `${q}${t}`,
      `${q}${cons}${t}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 173: 바이오디지털 융합
function experiment173(): string[] {
  return generateWords(10000, () => {
    const bio = ['bio', 'neuro', 'synapse', 'gene', 'cell', 'organism', 'evolution'];
    const digital = ['digital', 'cyber', 'tech', 'soft', 'ware', 'computing', 'interface'];
    const fusion = ['fusion', 'synthesis', 'integration', 'hybrid', 'merge', 'blend'];

    const b = bio[Math.floor(Math.random() * bio.length)];
    const d = digital[Math.floor(Math.random() * digital.length)];
    const f = fusion[Math.floor(Math.random() * fusion.length)];

    // 바이오디지털 패턴
    const patterns = [
      `${b}${d}`,
      `${d}${b}`,
      `${b}${f}`,
      `${f}${b}${d}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 174: 우주적 용어
function experiment174(): string[] {
  return generateWords(10000, () => {
    const cosmic = ['stellar', 'galaxy', 'nebula', 'cosmos', 'universe', 'interstellar', 'void'];
    const tech = ['tech', 'soft', 'ware', 'sys', 'ops', 'lab', 'hub', 'core'];
    const entities = ['entity', 'being', 'object', 'structure', 'construct', 'organism'];

    const c = cosmic[Math.floor(Math.random() * cosmic.length)];
    const t = tech[Math.floor(Math.random() * tech.length)];
    const e = entities[Math.floor(Math.random() * entities.length)];

    // 우주적 패턴
    const patterns = [
      `${c}${t}`,
      `${t}${e}`,
      `${c}${e}`,
      `${e}${c}${t}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 175: 시간 역설
function experiment175(): string[] {
  return generateWords(10000, () => {
    const temporal = ['temporal', 'chron', 'time', 'retro', 'future', 'past', 'present'];
    const paradox = ['loop', 'paradox', 'causality', 'sync', 'nity', 'logos'];
    const tech = ['tech', 'soft', 'ware', 'sys', 'ops', 'lab'];

    const temp = temporal[Math.floor(Math.random() * temporal.length)];
    const para = paradox[Math.floor(Math.random() * paradox.length)];
    const t = tech[Math.floor(Math.random() * tech.length)];

    // 시간 역설 패턴
    const patterns = [
      `${temp}${para}`,
      `${para}${tech}`,
      `${temp}${tech}`,
      `${temp}${para}${t}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 176: 언어적 진화
function experiment176(): string[] {
  return generateWords(10000, () => {
    const linguistic = ['lingu', 'syntax', 'semantic', 'pragmatic', 'phon', 'morph', 'lexicon'];
    const evolution = ['evolve', 'adapt', 'mutate', 'transform', 'shift', 'change', 'grow'];
    const tech = ['tech', 'soft', 'ware', 'sys', 'ops', 'lab'];

    const ling = linguistic[Math.floor(Math.random() * linguistic.length)];
    const evo = evolution[Math.floor(Math.random() * evolution.length)];
    const t = tech[Math.floor(Math.random() * tech.length)];

    // 언어적 진화 패턴
    const patterns = [
      `${ling}${evo}`,
      `${evo}${tech}`,
      `${ling}${tech}`,
      `${evo}${ling}${t}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 177: 의미적 변형
function experiment177(): string[] {
  return generateWords(10000, () => {
    const semantic = ['semantic', 'meaning', 'signify', 'denote', 'connote', 'reference'];
    const meta = ['meta', 'hyper', 'ultra', 'super', 'trans', 'auto', 'self'];
    const tech = ['tech', 'soft', 'ware', 'sys', 'ops', 'lab'];

    const sem = semantic[Math.floor(Math.random() * semantic.length)];
    const m = meta[Math.floor(Math.random() * meta.length)];
    const t = tech[Math.floor(Math.random() * tech.length)];

    // 의미적 변형 패턴
    const patterns = [
      `${sem}${m}`,
      `${m}${tech}`,
      `${sem}${tech}`,
      `${m}${sem}${t}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 178: 인지적 특이점
function experiment178(): string[] {
  return generateWords(10000, () => {
    const cognitive = ['cognitive', 'mental', 'thought', 'reason', 'logic', 'intuition'];
    const singularity = ['singular', 'singularity', 'ultimate', 'absolute', 'infinite'];
    const tech = ['tech', 'soft', 'ware', 'sys', 'ops', 'lab', 'hub'];

    const cog = cognitive[Math.floor(Math.random() * cognitive.length)];
    const sing = singularity[Math.floor(Math.random() * singularity.length)];
    const t = tech[Math.floor(Math.random() * tech.length)];

    // 인지적 특이점 패턴
    const patterns = [
      `${cog}${sing}`,
      `${sing}${tech}`,
      `${cog}${tech}`,
      `${sing}${cog}${t}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 179: 알고리즘적 꿈
function experiment179(): string[] {
  return generateWords(10000, () => {
    const algorithmic = ['algorithm', 'heuristic', 'computational', 'procedural'];
    const dream = ['dream', 'vision', 'imagine', 'create', 'generate', 'synthetic'];
    const tech = ['tech', 'soft', 'ware', 'sys', 'ops', 'lab'];

    const algo = algorithmic[Math.floor(Math.random() * algorithmic.length)];
    const dr = dream[Math.floor(Math.random() * dream.length)];
    const t = tech[Math.floor(Math.random() * tech.length)];

    // 알고리즘적 꿈 패턴
    const patterns = [
      `${algo}${dr}`,
      `${dr}${tech}`,
      `${algo}${tech}`,
      `${dr}${algo}${t}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 180: 엔트로피 역전
function experiment180(): string[] {
  return generateWords(10000, () => {
    const entropy = ['entropy', 'negentropy', 'order', 'chaos', 'complexity', 'simple'];
    const reverse = ['reverse', 'inverse', 'transpose', 'convert', 'transform'];
    const tech = ['tech', 'soft', 'ware', 'sys', 'ops', 'lab'];

    const ent = entropy[Math.floor(Math.random() * entropy.length)];
    const rev = reverse[Math.floor(Math.random() * reverse.length)];
    const t = tech[Math.floor(Math.random() * tech.length)];

    // 엔트로피 역전 패턴
    const patterns = [
      `${ent}${rev}`,
      `${rev}${tech}`,
      `${ent}${tech}`,
      `${rev}${ent}${t}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 메인
async function main() {
  console.log('=== Experiments 171-180: Ultimate Creative Patterns ===');
  console.log('');

  const existingWords = loadExistingWords();
  console.log(`기존 단어 수: ${existingWords.size}`);
  console.log('');

  const experiments = [
    { id: 171, name: 'Dimensional Transcendence', fn: experiment171 },
    { id: 172, name: 'Quantum Consciousness', fn: experiment172 },
    { id: 173, name: 'Bio-Digital Fusion', fn: experiment173 },
    { id: 174, name: 'Cosmic Terminology', fn: experiment174 },
    { id: 175, name: 'Temporal Paradoxes', fn: experiment175 },
    { id: 176, name: 'Linguistic Evolution', fn: experiment176 },
    { id: 177, name: 'Semantic Metamorphosis', fn: experiment177 },
    { id: 178, name: 'Cognitive Singularity', fn: experiment178 },
    { id: 179, name: 'Algorithmic Dreams', fn: experiment179 },
    { id: 180, name: 'Entropy Reversals', fn: experiment180 }
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
