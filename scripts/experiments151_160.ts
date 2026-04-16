/**
 * Experiments 151-160: Generative AI and Advanced Computational Patterns
 *
 * 생성적 AI와 고급 계산 패턴을 활용한 실험
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

// 완전히 새로운 기본 단어 집합 (과학, 기술, 철학)
const RADICAL_NEW_WORDS = [
  // 양자/현대 물리
  'quantum', 'qubit', 'entangle', 'coherence', 'superposition', 'tunneling',
  'wavefunction', 'operator', 'observable', 'eigenstate', 'spin', 'fermion',

  // 뇌과학/인지
  'neural', 'synapse', 'dendrite', 'cortex', 'cognitive', 'perception', 'conscious',
  'subconscious', 'intuition', 'reasoning', 'logic', 'emotion', 'feeling',

  // 시스템 이론
  'complexity', 'emergence', 'selforganize', 'autopoiesis', 'synergetic', 'holonic',
  'fractal', 'chaos', 'attractor', 'bifurcation', 'phase', 'transition',

  // 정보 이론
  'entropy', 'negentropy', 'information', 'bit', 'byte', 'shannon', 'kolmogorov',
  'complexity', 'randomness', 'stochastic', 'deterministic', 'probabilistic',

  // 수학/기하
  'topology', 'manifold', 'tensor', 'calculus', 'algorithm', 'heuristic', 'optimization',
  'convergence', 'iteration', 'recursion', 'induction', 'deduction',

  // 철학/논리
  'epistemology', 'ontology', 'metaphysics', 'ethics', 'aesthetics', 'logic',
  'reason', 'rational', 'empirical', 'phenomenology', 'existential'
];

// 범용 단어 생성기
function generateWords(targetCount: number, wordGenerator: () => string): string[] {
  const existingWords = loadExistingWords();
  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 200;

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

// 실험 151: 신경망 스타일
function experiment151(): string[] {
  return generateWords(10000, () => {
    // 랜덤 가중치로 단어 조합
    const w1 = RADICAL_NEW_WORDS[Math.floor(Math.random() * RADICAL_NEW_WORDS.length)];
    const w2 = RADICAL_NEW_WORDS[Math.floor(Math.random() * RADICAL_NEW_WORDS.length)];
    const w3 = RADICAL_NEW_WORDS[Math.floor(Math.random() * RADICAL_NEW_WORDS.length)];

    // 가중치 기반 결합
    const weight1 = Math.random();
    const weight2 = Math.random() * (1 - weight1);
    const weight3 = 1 - weight1 - weight2;

    const len1 = Math.floor(w1.length * weight1);
    const len2 = Math.floor(w2.length * weight2);
    const len3 = Math.floor(w3.length * weight3);

    return `${w1.substring(0, len1)}${w2.substring(0, len2)}${w3.substring(0, len3)}`;
  });
}

// 실험 152: 알고리즘 조합
function experiment152(): string[] {
  const algorithms = ['sort', 'search', 'hash', 'tree', 'graph', 'path', 'flow', 'match', 'parse'];
  const structures = ['data', 'heap', 'stack', 'queue', 'set', 'map', 'list', 'array', 'tree'];

  return generateWords(10000, () => {
    const algo = algorithms[Math.floor(Math.random() * algorithms.length)];
    const struct = structures[Math.floor(Math.random() * structures.length)];
    const ops = ['opt', 'ize', 'ify', 'er', 'or'][Math.floor(Math.random() * 5)];
    return `${algo}${struct}${ops}`;
  });
}

// 실험 153: 확률적 생성
function experiment153(): string[] {
  return generateWords(10000, () => {
    // 확률 분포 기반 단어 선택
    const distribution = RADICAL_NEW_WORDS.map((w, i) => ({ word: w, prob: 1 / (i + 1) }));
    const totalProb = distribution.reduce((sum, item) => sum + item.prob, 0);
    let random = Math.random() * totalProb;

    let selectedWord = '';
    for (const item of distribution) {
      random -= item.prob;
      if (random <= 0) {
        selectedWord = item.word;
        break;
      }
    }

    // 확률적 접미사 추가
    const suffixes = ['gen', 'syn', 'corp', 'sys', 'net'];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return `${selectedWord.substring(0, 8)}${suffix}`;
  });
}

// 실험 154: 엔트로피 기반
function experiment154(): string[] {
  return generateWords(10000, () => {
    // 엔트로피 계산 기반 단어 생성
    const word1 = RADICAL_NEW_WORDS[Math.floor(Math.random() * RADICAL_NEW_WORDS.length)];
    const word2 = RADICAL_NEW_WORDS[Math.floor(Math.random() * RADICAL_NEW_WORDS.length)];

    // 문자열 엔트로피 계산 (간소)
    const combined = word1 + word2;
    let entropy = 0;
    const freq: { [key: string]: number } = {};
    for (const char of combined) {
      freq[char] = (freq[char] || 0) + 1;
    }
    for (const char in freq) {
      const p = freq[char] / combined.length;
      entropy -= p * Math.log2(p);
    }

    // 엔트로피 기반 필터링
    if (entropy > 3.5) {
      return combined.substring(0, 12);
    } else {
      // 엔트로피가 낮으면 더 섞기
      return `${word1.substring(0, 4)}${word2.substring(0, 4)}${word1.substring(4, 8)}`;
    }
  });
}

// 실험 155: 프랙탈 패턴
function experiment155(): string[] {
  return generateWords(10000, () => {
    // 프랙탈 패턴: 재귀적 단어 생성
    const base = ['tech', 'soft', 'ware', 'data', 'cloud'][Math.floor(Math.random() * 5)];

    function fractal(word: string, depth: number): string {
      if (depth <= 0 || word.length > 15) return word;

      const patterns = [
        word + 'tech',
        'tech' + word,
        word.substring(0, 5) + word,
        word + word.substring(word.length - 5)
      ];

      return fractal(patterns[Math.floor(Math.random() * patterns.length)], depth - 1);
    }

    return fractal(base, 3).substring(0, 15);
  });
}

// 실험 156: 세포 자동자 패턴
function experiment156(): string[] {
  return generateWords(10000, () => {
    // 세포 자동자: 이웃 세포와의 상호작용
    const grid = [
      ['a', 'b', 'c', 'd', 'e'],
      ['f', 'g', 'h', 'i', 'j'],
      ['k', 'l', 'm', 'n', 'o'],
      ['p', 'q', 'r', 's', 't'],
      ['u', 'v', 'w', 'x', 'y', 'z']
    ];

    const row = Math.floor(Math.random() * grid.length);
    const col = Math.floor(Math.random() * grid[row].length);

    // 이웃 세포 수집
    let word = grid[row][col];
    const neighbors = [
      row > 0 ? grid[row - 1][col] || '' : '',
      row < grid.length - 1 ? grid[row + 1][col] || '' : '',
      col > 0 ? grid[row][col - 1] || '' : '',
      col < grid[row].length - 1 ? grid[row][col + 1] || '' : ''
    ];

    // 이웃 세포 결합
    for (const neighbor of neighbors) {
      if (neighbor && Math.random() > 0.5) {
        word += neighbor;
      }
      if (word.length >= 10) break;
    }

    return word + 'tech';
  });
}

// 실��험 157: 유전 알고리즘 영감
function experiment157(): string[] {
  return generateWords(10000, () => {
    // 유전 알고리즘: 선택, 교배, 돌연변이
    const population = RADICAL_NEW_WORDS.slice(0, 20);

    // 선택 (적합도 기반)
    const fitness = population.map(word => ({ word, fitness: word.length % 7 + 1 }));
    fitness.sort((a, b) => b.fitness - a.fitness);

    // 교배
    const parent1 = fitness[0].word;
    const parent2 = fitness[1].word;

    // 일점 교차
    const crossover = Math.floor(Math.random() * Math.min(parent1.length, parent2.length));
    let offspring = parent1.substring(0, crossover) + parent2.substring(crossover);

    // 돌연변이
    if (Math.random() > 0.8) {
      const mutationPoint = Math.floor(Math.random() * offspring.length);
      const mutations = ['x', 'z', 'q', 'v'];
      offspring = offspring.substring(0, mutationPoint) +
                   mutations[Math.floor(Math.random() * mutations.length)] +
                   offspring.substring(mutationPoint + 1);
    }

    return offspring.substring(0, 15);
  });
}

// 실험 158: 몬테카를로 변형
function experiment158(): string[] {
  return generateWords(10000, () => {
    // 몬테카를로: 랜덤 샘플링 기반
    const samples: string[] = [];
    for (let i = 0; i < 5; i++) {
      samples.push(RADICAL_NEW_WORDS[Math.floor(Math.random() * RADICAL_NEW_WORDS.length)]);
    }

    // 가장 빈도 높은 문자 선택
    const charFreq: { [key: string]: number } = {};
    for (const sample of samples) {
      for (const char of sample) {
        charFreq[char] = (charFreq[char] || 0) + 1;
      }
    }

    // 상위 문자로 단어 구성
    const sortedChars = Object.entries(charFreq)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 10);

    return sortedChars.join('').substring(0, 12);
  });
}

// 실험 159: 마르코프 연쇄
function experiment159(): string[] {
  // 마르코프 연쇄 모델 구축
  const chain: { [key: string]: string[] } = {};
  for (const word of RADICAL_NEW_WORDS) {
    for (let i = 0; i < word.length - 1; i++) {
      const key = word.substring(i, i + 2);
      if (!chain[key]) chain[key] = [];
      chain[key].push(word[i + 2] || '');
    }
  }

  return generateWords(10000, () => {
    // 마르코프 연쇄로 단어 생성
    let word = '';
    let currentState = RADICAL_NEW_WORDS[Math.floor(Math.random() * RADICAL_NEW_WORDS.length)].substring(0, 2);

    word += currentState;

    for (let i = 0; i < 10; i++) {
      if (chain[currentState]) {
        const nextChar = chain[currentState][Math.floor(Math.random() * chain[currentState].length)];
        if (nextChar) {
          word += nextChar;
          currentState = currentState.substring(1) + nextChar;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return word.substring(0, 15);
  });
}

// 실험 160: 혼돈 이론 영감
function experiment160(): string[] {
  return generateWords(10000, () => {
    // 혼돈 이론: 초기 조건의 민감성
    const initial = Math.random().toString(36).substring(2, 6);
    let word = initial;

    // 로지스틱 맵 (혼돈 맵)
    let x = Math.random();
    const r = 3.9; // 혼돈 영역

    for (let i = 0; i < 6; i++) {
      x = r * x * (1 - x);

      // x를 문자로 변환
      const charCode = Math.floor(x * 26) + 97;
      const char = String.fromCharCode(charCode);
      word += char;

      if (word.length >= 12) break;
    }

    return word;
  });
}

// 메인
async function main() {
  console.log('=== Experiments 151-160: Generative AI and Advanced Computational Patterns ===');
  console.log('');

  const existingWords = loadExistingWords();
  console.log(`기존 단어 수: ${existingWords.size}`);
  console.log('');

  const experiments = [
    { id: 151, name: 'Neural Network Style', fn: experiment151 },
    { id: 152, name: 'Algorithmic Combinations', fn: experiment152 },
    { id: 153, name: 'Probabilistic Generation', fn: experiment153 },
    { id: 154, name: 'Entropy Based', fn: experiment154 },
    { id: 155, name: 'Fractal Patterns', fn: experiment155 },
    { id: 156, name: 'Cellular Automata', fn: experiment156 },
    { id: 157, name: 'Genetic Algorithm Inspired', fn: experiment157 },
    { id: 158, name: 'Monte Carlo Variations', fn: experiment158 },
    { id: 159, name: 'Markov Chain Patterns', fn: experiment159 },
    { id: 160, name: 'Chaos Theory Inspired', fn: experiment160 }
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
