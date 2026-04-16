/**
 * Experiments 141-150: Linguistic Creativity and Innovation
 *
 * 언어학적 창의성을 활용한 완전히 새로운 패턴 실험
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

// 새로운 기본 단어 집합 (완전히 새로운)
const FRESH_BASIC_WORDS = [
  // 현대적 기술 용어 (새로운)
  'blockchain', 'crypto', 'defi', 'nft', 'web3', 'metaverse', 'ar', 'vr',
  'quantum', 'edge', 'serverless', 'microservice', 'container', 'kubernetes',
  'tensorflow', 'pytorch', 'react', 'vue', 'angular', 'svelte', 'nextjs',
  'graphql', 'grpc', 'websocket', 'eventstream', 'kafka', 'rabbitmq',

  // 비즈니스 용어 (새로운)
  'revenue', 'profit', 'margin', 'churn', 'retention', 'cac', 'ltv', 'mrr', 'arr',
  'burnrate', 'runway', 'valuation', 'equity', 'dilution', 'liquidity', 'solvency',
  'growth', 'scale', 'expansion', 'diversification', 'acquisition', 'merger',

  // 과학 용어 (새로운)
  'genomics', 'proteomics', 'metabolomics', 'bioinformatics', 'computational',
  'nanotechnology', 'biotechnology', 'neuroscience', 'cognitive', 'behavioral',
  'psychology', 'sociology', 'anthropology', 'economics', 'finance', 'marketing',

  // 예술/디자인 용어 (새로운)
  'minimal', 'brutalist', 'scandinavian', 'industrial', 'modern', 'postmodern',
  'bauhaus', 'artdeco', 'victorian', 'colonial', 'futuristic', 'retro', 'vintage'
];

// 범용 단어 생성기
function generateWords(targetCount: number, wordGenerator: () => string): string[] {
  const existingWords = loadExistingWords();
  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 100;

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

// 실험 141: 포트만토 융합
function experiment141(): string[] {
  return generateWords(10000, () => {
    const w1 = FRESH_BASIC_WORDS[Math.floor(Math.random() * FRESH_BASIC_WORDS.length)];
    const w2 = FRESH_BASIC_WORDS[Math.floor(Math.random() * FRESH_BASIC_WORDS.length)];
    // 중간에서 병합
    const mid1 = Math.floor(w1.length / 2);
    const mid2 = Math.floor(w2.length / 2);
    return `${w1.substring(0, mid1)}${w2.substring(mid2)}`;
  });
}

// 실험 142: 음절 추출
function experiment142(): string[] {
  return generateWords(10000, () => {
    const word = FRESH_BASIC_WORDS[Math.floor(Math.random() * FRESH_BASIC_WORDS.length)];
    // 3-6자 음절 추출
    const start = Math.floor(Math.random() * (word.length - 2));
    const len = 3 + Math.floor(Math.random() * 4);
    return word.substring(start, Math.min(start + len, word.length));
  });
}

// 실험 143: 음성 재구성
function experiment143(): string[] {
  const phoneticMap: { [key: string]: string[] } = {
    'c': ['k', 's', 'ch'],
    's': ['z', 'sh', 'sch'],
    't': ['th', 'd', 'dt'],
    'f': ['ph', 'v'],
    'x': ['ks', 'cs', 'z']
  };

  return generateWords(10000, () => {
    const word = FRESH_BASIC_WORDS[Math.floor(Math.random() * FRESH_BASIC_WORDS.length)];
    let result = '';
    for (const char of word) {
      if (phoneticMap[char] && Math.random() > 0.7) {
        const replacements = phoneticMap[char];
        result += replacements[Math.floor(Math.random() * replacements.length)];
      } else {
        result += char;
      }
    }
    return result.substring(0, Math.min(result.length, 15));
  });
}

// 실험 144: 형태론적 블렌딩
function experiment144(): string[] {
  const prefixes = ['un', 're', 'pre', 'post', 'anti', 'pro', 'sub', 'super', 'hyper', 'meta'];
  const roots = FRESH_BASIC_WORDS.filter(w => w.length >= 5);
  const suffixes = ['er', 'or', 'ist', 'ism', 'tion', 'sion', 'ment', 'ness', 'ity', 'ty'];

  return generateWords(10000, () => {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const root = roots[Math.floor(Math.random() * roots.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    // 루트의 일부만 사용
    const rootPart = root.substring(0, Math.min(root.length, 8));
    return `${prefix}${rootPart}${suffix}`;
  });
}

// 실험 145: 어원학적 조합
function experiment145(): string[] {
  const latinRoots = ['nov', 'novus', 'ante', 'post', 'multi', 'omni', 'pan', 'contra', 'extra', 'infra'];
  const greekRoots = ['auto', 'bio', 'chron', 'geo', 'hydro', 'log', 'micro', 'mega', 'tele', 'photo'];
  const englishWords = ['tech', 'soft', 'ware', 'app', 'hub', 'core', 'base', 'flow'];

  return generateWords(10000, () => {
    const isLatin = Math.random() > 0.5;
    const root = isLatin ?
      latinRoots[Math.floor(Math.random() * latinRoots.length)] :
      greekRoots[Math.floor(Math.random() * greekRoots.length)];
    const word = englishWords[Math.floor(Math.random() * englishWords.length)];
    return `${root}${word}`;
  });
}

// 실험 146: 신조어
function experiment146(): string[] {
  return generateWords(10000, () => {
    const w1 = FRESH_BASIC_WORDS[Math.floor(Math.random() * FRESH_BASIC_WORDS.length)];
    const w2 = FRESH_BASIC_WORDS[Math.floor(Math.random() * FRESH_BASIC_WORDS.length)];
    // 첫 3자 + 마지막 3자 조합
    const first = w1.substring(0, Math.min(3, w1.length));
    const last = w2.substring(Math.max(0, w2.length - 3));
    return `${first}${last}`;
  });
}

// 실험 147: 의미론적 융합
function experiment147(): string[] {
  const semanticGroups = {
    action: ['run', 'go', 'move', 'act', 'do', 'make', 'build', 'create'],
    object: ['thing', 'item', 'object', 'entity', 'unit', 'element', 'part', 'piece'],
    quality: ['good', 'best', 'top', 'high', 'great', 'super', 'ultra', 'hyper'],
    location: ['place', 'space', 'area', 'zone', 'region', 'spot', 'site', 'field']
  };

  const techWords = ['tech', 'soft', 'ware', 'app', 'hub', 'core', 'base'];

  return generateWords(10000, () => {
    const groups = Object.keys(semanticGroups);
    const group1 = groups[Math.floor(Math.random() * groups.length)];
    const group2 = groups[Math.floor(Math.random() * groups.length)];
    const word1 = semanticGroups[group1 as keyof typeof semanticGroups][Math.floor(Math.random() * 8)];
    const word2 = semanticGroups[group2 as keyof typeof semanticGroups][Math.floor(Math.random() * 8)];
    const tech = techWords[Math.floor(Math.random() * techWords.length)];
    return `${word1}${word2}${tech}`;
  });
}

// 실험 148: 타이포그래픽 혁신
function experiment148(): string[] {
  return generateWords(10000, () => {
    const word = FRESH_BASIC_WORDS[Math.floor(Math.random() * FRESH_BASIC_WORDS.length)];
    // 중간 문자 대문자화 후 소문자 변환
    if (word.length < 4) return word.toLowerCase();
    const mid = Math.floor(word.length / 2);
    return (word.substring(0, mid) + word[mid].toUpperCase() + word.substring(mid + 1)).toLowerCase();
  });
}

// 실험 149: 언어 간 차용
function experiment149(): string[] {
  const loanWords = [
    'kindergarten', 'wanderlust', 'schadenfreude', 'zeitgeist',
    'savoirfaire', 'raisonetre', 'avantgarde', 'cliche',
    'karaoke', 'tsunami', 'tycoon', 'honcho',
    'piano', 'opera', 'balcony', 'confetti', 'studio'
  ];

  const techWords = ['tech', 'soft', 'ware', 'app', 'hub', 'core', 'base'];

  return generateWords(10000, () => {
    const loan = loanWords[Math.floor(Math.random() * loanWords.length)];
    const tech = techWords[Math.floor(Math.random() * techWords.length)];
    // 대출어의 일부만 사용
    const loanPart = loan.substring(0, Math.min(loan.length, 8));
    return `${loanPart}${tech}`;
  });
}

// 실험 150: 약어 포트만토
function experiment150(): string[] {
  const acronyms = ['AI', 'ML', 'SaaS', 'B2B', 'API', 'CRM', 'ERP', 'KPI', 'ROI', 'CEO', 'CTO', 'CFO'];
  const words = ['tech', 'soft', 'ware', 'app', 'hub', 'core', 'base', 'flow', 'stack'];

  return generateWords(10000, () => {
    const acronym = acronyms[Math.floor(Math.random() * acronyms.length)];
    const word = words[Math.floor(Math.random() * words.length)];
    // 약어와 단어를 결합
    return `${acronym}${word}`;
  });
}

// 메인
async function main() {
  console.log('=== Experiments 141-150: Linguistic Creativity and Innovation ===');
  console.log('');

  const existingWords = loadExistingWords();
  console.log(`기존 단어 수: ${existingWords.size}`);
  console.log('');

  const experiments = [
    { id: 141, name: 'Portmanteau Fusion', fn: experiment141 },
    { id: 142, name: 'Syllable Extraction', fn: experiment142 },
    { id: 143, name: 'Phonetic Reconstruction', fn: experiment143 },
    { id: 144, name: 'Morphological Blending', fn: experiment144 },
    { id: 145, name: 'Etymological Combinations', fn: experiment145 },
    { id: 146, name: 'Neologisms', fn: experiment146 },
    { id: 147, name: 'Semantic Fusion', fn: experiment147 },
    { id: 148, name: 'Typographical Innovations', fn: experiment148 },
    { id: 149, name: 'Cross-Language Borrowing', fn: experiment149 },
    { id: 150, name: 'Acronym Portmanteau', fn: experiment150 }
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
