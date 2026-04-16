/**
 * Experiment 102: Industry-Specific Business Terms
 *
 * 산업별 전문 비즈니스 용어를 집중적으로 사용하여 SaaS 제품명 생성
 * - 금융/핀테크
 * - 헬스케어
 * - 교육/에듀테크
 * - 물류/공급망
 * - 제조/산업
 * - 리테일/이커머스
 * - 부동산
 * - 법률
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateWords, generateQAReport, saveQAReport } from '../src/word-generation/validator';

// 산업별 전문 용어
const INDUSTRY_WORDS = {
  // 금융/핀테크
  finance: [
    'payment', 'transaction', 'transfer', 'settlement', 'clearing', 'reconciliation',
    'ledger', 'account', 'balance', 'statement', 'invoice', 'receipt', 'bill',
    'credit', 'debit', 'deposit', 'withdrawal', 'loan', 'mortgage', 'lending',
    'trading', 'investment', 'portfolio', 'asset', 'wealth', 'capital', 'equity',
    'derivatives', 'futures', 'options', 'forex', 'crypto', 'blockchain', 'wallet',
    'bank', 'banking', 'neobank', 'challenger', 'insurtech', ' insurech'
  ],

  // 헬스케어
  health: [
    'health', 'medical', 'clinical', 'hospital', 'clinic', 'doctor', 'physician',
    'nurse', 'patient', 'care', 'treatment', 'therapy', 'diagnosis', 'prognosis',
    'symptom', 'disease', 'condition', 'wellness', 'fitness', 'nutrition', 'diet',
    'pharmacy', 'drug', 'medicine', 'prescription', 'telehealth', 'telemed',
    'electronic', 'health', 'record', 'ehr', 'emr', 'pac', 'imaging', 'radiology',
    'pathology', 'lab', 'laboratory', 'genomics', 'dna', 'genome', 'sequencing'
  ],

  // 교육/에듀테크
  education: [
    'education', 'learning', 'teaching', 'training', 'course', 'class', 'lesson',
    'curriculum', 'syllabus', 'subject', 'topic', 'skill', 'knowledge', 'expertise',
    'student', 'learner', 'teacher', 'instructor', 'professor', 'tutor', 'mentor',
    'school', 'university', 'college', 'academy', 'institute', 'bootcamp',
    'online', 'elearning', 'mooc', 'lms', 'assessment', 'quiz', 'exam', 'test',
    'grade', 'score', 'certification', 'credential', 'diploma', 'degree'
  ],

  // 물류/공급망
  logistics: [
    'logistics', 'supply', 'chain', 'shipping', 'delivery', 'freight', 'cargo',
    'warehouse', 'inventory', 'stock', 'fulfillment', 'order', 'tracking', 'trace',
    'route', 'optimization', 'fleet', 'vehicle', 'truck', 'van', 'driver', 'carrier',
    'customs', 'clearance', 'import', 'export', 'trade', 'compliance', 'duty',
    'tariff', 'crossborder', 'lastmile', 'firstmile', 'middlemile', 'coldchain'
  ],

  // 제조/산업
  manufacturing: [
    'manufacturing', 'production', 'factory', 'plant', 'facility', 'workshop',
    'assembly', 'fabrication', 'machining', 'casting', 'molding', 'forming',
    'quality', 'control', 'inspection', 'testing', 'assurance', 'compliance',
    'maintenance', 'repair', 'operation', 'equipment', 'machinery', 'tool', 'die',
    'industrial', 'iot', 'sensor', 'automation', 'robot', 'plc', 'scada', 'mes'
  ],

  // 리테일/이커머스
  retail: [
    'retail', 'ecommerce', 'store', 'shop', 'market', 'marketplace', 'platform',
    'product', 'catalog', 'inventory', 'stock', 'merchandise', 'pricing', 'discount',
    'promotion', 'coupon', 'deal', 'offer', 'cart', 'checkout', 'payment', 'ship',
    'return', 'refund', 'exchange', 'customer', 'consumer', 'shopper', 'buyer',
    'seller', 'merchant', 'vendor', 'brand', 'manufacturer', 'distributor'
  ],

  // 부동산
  realestate: [
    'real', 'estate', 'property', 'home', 'house', 'apartment', 'condo', 'villa',
    'land', 'lot', 'plot', 'building', 'construction', 'development', 'investment',
    'rental', 'lease', 'tenant', 'landlord', 'agent', 'broker', 'realtor',
    'listing', 'valuation', 'appraisal', 'mortgage', 'loan', 'financing',
    'title', 'deed', 'closing', 'escrow', 'inspection', 'survey'
  ],

  // 법률
  legal: [
    'legal', 'law', 'attorney', 'lawyer', 'counsel', 'firm', 'practice', 'case',
    'matter', 'litigation', 'lawsuit', 'dispute', 'contract', 'agreement', 'deal',
    'compliance', 'regulatory', 'regulation', 'policy', 'governance', 'risk',
    'intellectual', 'property', 'patent', 'trademark', 'copyright', 'license',
    'document', 'filing', 'court', 'judge', 'jury', 'verdict', 'settlement'
  ]
};

// 산업별 접두사
const INDUSTRY_PREFIXES = [
  'fin', 'pay', 'bank', 'insure', 'wealth', 'invest', 'trade',
  'med', 'health', 'care', 'well', 'pharma', 'clinic',
  'edu', 'learn', 'teach', 'skill', 'knowledge', 'academy',
  'logi', 'ship', 'freight', 'cargo', 'fleet', 'route',
  'manufact', 'factory', 'industrial', 'production', 'assembly',
  'retail', 'shop', 'store', 'market', 'ecommerce', 'brand',
  'prop', 'realty', 'home', 'estate', 'rental', 'lease',
  'legal', 'law', 'comply', 'contract', 'document'
];

// 산업별 접미사
const INDUSTRY_SUFFIXES = [
  'tech', 'sys', 'soft', 'ware', 'app', 'hub', 'core', 'base',
  'flow', 'stack', 'deck', 'mate', 'pal', 'buddy', 'helper',
  'ops', 'mgmt', 'admin', 'desk', 'portal', 'gateway',
  'net', 'cloud', 'space', 'zone', 'room', 'center'
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

// 산업별 단어 생성
function generateIndustryWords(targetCount: number, existingWords: Set<string>): string[] {
  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 20;

  // 모든 산업 단어를 하나의 배열로
  const allIndustryWords: string[] = [];
  Object.values(INDUSTRY_WORDS).forEach(words => {
    allIndustryWords.push(...words);
  });

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    // 랜덤 패턴 선택
    const pattern = Math.floor(Math.random() * 6);
    let word = '';

    switch (pattern) {
      case 0: // 산업 단어 + 접미사
        {
          const industryWord = allIndustryWords[Math.floor(Math.random() * allIndustryWords.length)];
          const suffix = INDUSTRY_SUFFIXES[Math.floor(Math.random() * INDUSTRY_SUFFIXES.length)];
          word = `${industryWord}${suffix}`;
        }
        break;

      case 1: // 접두사 + 산업 단어
        {
          const prefix = INDUSTRY_PREFIXES[Math.floor(Math.random() * INDUSTRY_PREFIXES.length)];
          const industryWord = allIndustryWords[Math.floor(Math.random() * allIndustryWords.length)];
          word = `${prefix}${industryWord}`;
        }
        break;

      case 2: // 산업 단어 + 숫자
        {
          const industryWord = allIndustryWords[Math.floor(Math.random() * allIndustryWords.length)];
          const num = ['1', '2', '3', '24', '365', '9', '99', '101'][Math.floor(Math.random() * 8)];
          word = `${industryWord}${num}`;
        }
        break;

      case 3: // 두 산업 단어 조합
        {
          const w1 = allIndustryWords[Math.floor(Math.random() * allIndustryWords.length)];
          const w2 = allIndustryWords[Math.floor(Math.random() * allIndustryWords.length)];
          word = `${w1}${w2}`;
        }
        break;

      case 4: // 하이픈 조합 (접두사-산업)
        {
          const prefix = INDUSTRY_PREFIXES[Math.floor(Math.random() * INDUSTRY_PREFIXES.length)];
          const industryWord = allIndustryWords[Math.floor(Math.random() * allIndustryWords.length)];
          word = `${prefix}-${industryWord}`;
        }
        break;

      case 5: // 하이픈 조합 (산업-접미사)
        {
          const industryWord = allIndustryWords[Math.floor(Math.random() * allIndustryWords.length)];
          const suffix = INDUSTRY_SUFFIXES[Math.floor(Math.random() * INDUSTRY_SUFFIXES.length)];
          word = `${industryWord}-${suffix}`;
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
  console.log('=== Experiment 102: Industry-Specific Business Terms ===');
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
  const words = generateIndustryWords(targetCount, existingWords);
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
  const qaReportPath = `input/generated/experiment102_qa_${Date.now()}.json`;
  saveQAReport(qaReport, qaReportPath);
  console.log(`QA 리포트 저장: ${qaReportPath}`);
  console.log('');

  // 최종 저장
  const outputPath = `input/generated/experiment102_industry_terms_10000.txt`;
  saveWords(qaResult.passed, outputPath);
  console.log(`저장 경로: ${outputPath}`);
  console.log(`최종 단어 수: ${qaResult.passed.length}`);
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}
