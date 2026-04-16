/**
 * Experiment 106: Acronym and Abbreviation Patterns
 *
 * 약어와 축약어 패턴으로 SaaS 제품명 생성
 * 예: SaaShub, APIflow, CRMcore, B2Bbase
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateWords, generateQAReport, saveQAReport } from '../src/word-generation/validator';

// 기술/비즈니스 약어 (확장 집합)
const ACRONYMS = [
  // 기술 약어
  'AI', 'ML', 'DL', 'NLP', 'CV', 'AR', 'VR', 'XR', 'MR',
  'IoT', 'API', 'SDK', 'CLI', 'GUI', 'UI', 'UX', 'CSS', 'HTML',
  'JS', 'TS', 'SQL', 'NoSQL', 'DB', 'OS', 'CPU', 'GPU', 'TPU',
  'SaaS', 'PaaS', 'IaaS', 'FaaS', 'BaaS', 'CaaS', 'MaaS',
  'B2B', 'B2C', 'C2C', 'P2P', 'O2O', 'D2C',

  // 비즈니스 약어
  'CRM', 'ERP', 'HRM', 'CMS', 'LMS', 'ATS', 'POS', 'BI',
  'KPI', 'OKR', 'ROI', 'ROAS', 'CAC', 'LTV', 'ARPU', 'MRR',
  'ARR', 'EbitDA', 'EPS', 'PE', 'ROI', 'YOY', 'MOM', 'QOQ',

  // 경영진 약어
  'CEO', 'CTO', 'CFO', 'COO', 'CMO', 'CPO', 'CRO', 'CISO', 'CSO',
  'VP', 'SVP', 'EVP', 'HR', 'PR', 'R&D', 'IT', 'OT',

  // 개발/운영
  'DevOps', 'DevSecOps', 'GitOps', 'CI', 'CD', 'CT', 'QA', 'QC',
  'UAT', 'SLA', 'SLO', 'NPS', 'CSAT', 'DSAT', 'CES', 'TTR',

  // 데이터/분석
  'ETL', 'ELT', 'DW', 'DM', 'BI', 'BA', 'DA', 'DS', 'DE',
  'ML', 'AI', 'DL', 'NLP', 'CV', 'RPA', 'OCR', 'ASR', 'TTS',

  // 보안
  'IAM', 'MFA', '2FA', 'SSO', 'OAuth', 'JWT', 'RBAC', 'ABAC',
  'PKI', 'SSL', 'TLS', 'HTTPS', 'SSH', 'VPN', 'FW', 'IDS', 'IPS',

  // 클라우드
  'AWS', 'GCP', 'Azure', 'IBM', 'Oracle', 'Alibaba', 'Tencent',
  'EC2', 'S3', 'Lambda', 'Dynamo', 'Cosmos', 'BigQuery',

  // 새로운 기술 약어
  'LLM', 'GPT', 'BERT', 'RAG', 'AGI', 'GenAI', 'Prompt', 'Finetune',
  'Stable', 'Diffusion', 'Midjourney', 'DALL'
];

// 접미사
const SUFFIXES = [
  'flow', 'stack', 'app', 'hub', 'core', 'base', 'ops', 'sys', 'net',
  'cloud', 'data', 'tech', 'soft', 'ware', 'platform', 'service'
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

// 약어 패턴 단어 생성
function generateAcronymWords(targetCount: number, existingWords: Set<string>): string[] {
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
      case 0: // 약어 + 접미사
        {
          const acronym = ACRONYMS[Math.floor(Math.random() * ACRONYMS.length)];
          const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
          word = `${acronym}${suffix}`;
        }
        break;

      case 1: // 접미사 + 약어
        {
          const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
          const acronym = ACRONYMS[Math.floor(Math.random() * ACRONYMS.length)];
          word = `${suffix}${acronym}`;
        }
        break;

      case 2: // 약어 + 숫자
        {
          const acronym = ACRONYMS[Math.floor(Math.random() * ACRONYMS.length)];
          const num = ['1', '2', '3', '24', '365', '9', '99', '101'][Math.floor(Math.random() * 8)];
          word = `${acronym}${num}`;
        }
        break;

      case 3: // 두 약어 조합
        {
          const ac1 = ACRONYMS[Math.floor(Math.random() * ACRONYMS.length)];
          const ac2 = ACRONYMS[Math.floor(Math.random() * ACRONYMS.length)];
          word = `${ac1}${ac2}`;
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
  console.log('=== Experiment 106: Acronym and Abbreviation Patterns ===');
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
  const words = generateAcronymWords(targetCount, existingWords);
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
  const qaReportPath = `input/generated/experiment106_qa_${Date.now()}.json`;
  saveQAReport(qaReport, qaReportPath);
  console.log(`QA 리포트 저장: ${qaReportPath}`);
  console.log('');

  // 최종 저장
  const outputPath = `input/generated/experiment106_acronyms_10000.txt`;
  saveWords(qaResult.passed, outputPath);
  console.log(`저장 경로: ${outputPath}`);
  console.log(`최종 단어 수: ${qaResult.passed.length}`);
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}
