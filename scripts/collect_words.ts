/**
 * Word Collector Script
 *
 * 인터넷에서 수집한 실제 SaaS 단어를 관리합니다.
 * 이 스크립트는 Claude Code 세션에서 WebSearch로 수집한 단어를 정리합니다.
 */

import * as fs from 'fs';
import * as path from 'path';
import { WordCollectionOptions, WordCollectionResult } from '../src/word-generation/types';

/**
 * 기본 옵션
 */
const DEFAULT_OPTIONS: WordCollectionOptions = {
  source: 'web',
  categories: undefined,
  outputPath: undefined,
  deduplicate: true,
  runQA: true
};

/**
 * 메인 함수
 */
async function main() {
  console.log('=== Word Collector ===');
  console.log('이 스크립트는 Claude Code 세션에서 WebSearch로 수집한 단어를 정리합니다.');
  console.log('');

  // 1. 옵션 로드
  const options = loadOptions();
  console.log('옵션:', JSON.stringify(options, null, 2));
  console.log('');

  // 2. 수집된 단어 파일 경로
  const collectedFilePath = options.inputPath || 'input/generated/real_world_collected.txt';

  if (!fs.existsSync(collectedFilePath)) {
    console.error(`오류: 수집된 단어 파일을 찾을 수 없습니다 - ${collectedFilePath}`);
    console.log('');
    console.log('사용법:');
    console.log('1. Claude Code에서 WebSearch로 SaaS 단어 수집');
    console.log('2. 수집된 단어를 파일로 저장');
    console.log('3. 이 스크립트로 정리');
    process.exit(1);
  }

  // 3. 단어 로드
  console.log('수집된 단어 로드 중...');
  const content = fs.readFileSync(collectedFilePath, 'utf-8');
  const rawWords = content.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  console.log(`총 ${rawWords.length}개 단어 로드됨`);
  console.log('');

  // 4. 정규화
  console.log('단어 정규화 중...');
  const normalizedWords = rawWords.map(word => {
    // 소문자 변환
    let normalized = word.toLowerCase();

    // 특수문자 제거 (영어, 숫자, 하이픈만 유지)
    normalized = normalized.replace(/[^a-z0-9\-]/g, '');

    return normalized;
  }).filter(word => word.length > 0);

  console.log(`정규화된 단어: ${normalizedWords.length}개`);
  console.log('');

  // 5. 중복 제거
  let uniqueWords = normalizedWords;
  if (options.deduplicate) {
    console.log('중복 제거 중...');
    const wordSet = new Set(normalizedWords);
    uniqueWords = Array.from(wordSet);
    console.log(`중복 제거: ${normalizedWords.length - uniqueWords.length}개 제거`);
    console.log(`고유 단어: ${uniqueWords.length}개`);
    console.log('');
  }

  // 6. 카테고리별 분류
  const categorized = categorizeWords(uniqueWords);
  console.log('카테고리별 분류:');
  for (const [category, words] of Object.entries(categorized)) {
    console.log(`  - ${category}: ${words.length}개`);
  }
  console.log('');

  // 7. QA 검증
  let qaResult;
  let finalWords = uniqueWords;

  if (options.runQA) {
    console.log('QA 검증 중...');
    const { validateWords } = await import('../src/word-generation/validator');
    qaResult = validateWords(uniqueWords);

    console.log(`QA 통과: ${qaResult.passed.length} (${qaResult.passRate.toFixed(1)}%)`);
    console.log(`QA 실패: ${qaResult.failed.length}`);
    console.log(`평균 점수: ${qaResult.averageScore.toFixed(1)}`);
    console.log('');

    finalWords = qaResult.passed;

    // QA 리포트 저장
    const qaReportPath = `input/generated/collection_qa_report_${getDateSlug()}.json`;
    const { generateQAReport, saveQAReport } = await import('../src/word-generation/validator');
    const report = generateQAReport(qaResult.results);
    saveQAReport(report, qaReportPath);
    console.log(`QA 리포트 저장: ${qaReportPath}`);
  }

  // 8. 최종 저장
  const outputPath = options.outputPath || `input/generated/real_world_words_${getDateSlug()}.txt`;
  saveWordsToFile(finalWords, outputPath);

  // 9. 카테고리별 파일 저장
  const categorizedPath = `input/generated/real_world_by_category_${getDateSlug()}.json`;
  saveCategorizedWords(categorized, categorizedPath);
  console.log(`카테고리별 파일 저장: ${categorizedPath}`);

  // 10. 수집 리포트 저장
  const report: WordCollectionResult = {
    source: options.source,
    totalCollected: rawWords.length,
    normalized: normalizedWords.length,
    duplicatesRemoved: options.deduplicate ? normalizedWords.length - uniqueWords.length : 0,
    unique: uniqueWords.length,
    qaPassed: qaResult ? qaResult.passed.length : finalWords.length,
    qaFailed: qaResult ? qaResult.failed.length : 0,
    final: finalWords.length,
    categories: categorized,
    outputPath,
    collectedAt: new Date(),
    duration: 0
  };

  const reportPath = `input/generated/collection_report_${getDateSlug()}.json`;
  saveReport(report, reportPath);
  console.log(`수집 리포트 저장: ${reportPath}`);
  console.log('');

  console.log('=== 완료 ===');
  console.log(`최종 단어 수: ${finalWords.length}`);
  console.log(`저장 경로: ${outputPath}`);
}

/**
 * 단어를 카테고리별로 분류합니다.
 */
function categorizeWords(words: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    crm: [],
    marketing: [],
    project: [],
    communication: [],
    analytics: [],
    infrastructure: [],
    payment: [],
    ecommerce: [],
    security: [],
    hr: [],
    finance: [],
    support: [],
    development: [],
    data: [],
    ai: [],
    collaboration: [],
    other: []
  };

  const crmKeywords = ['sales', 'crm', 'lead', 'deal', 'pipeline', 'contact', 'customer'];
  const marketingKeywords = ['mail', 'campaign', 'marketing', 'automation', 'ads', 'social'];
  const projectKeywords = ['task', 'project', 'kanban', 'scrum', 'agile', 'workflow', 'asana', 'trello', 'jira'];
  const communicationKeywords = ['chat', 'message', 'slack', 'teams', 'zoom', 'video', 'call', 'meet'];
  const analyticsKeywords = ['analytics', 'metric', 'data', 'insight', 'report', 'dashboard', 'chart'];
  const infraKeywords = ['cloud', 'server', 'hosting', 'aws', 'azure', 'docker', 'kubernetes', 'devops'];
  const paymentKeywords = ['pay', 'payment', 'stripe', 'paypal', 'billing', 'invoice', 'transaction'];
  const ecommerceKeywords = ['shop', 'store', 'commerce', 'cart', 'checkout', 'shopify', 'woocommerce'];
  const securityKeywords = ['security', 'auth', 'login', 'protect', 'shield', 'safe', 'identity'];
  const hrKeywords = ['hr', 'recruit', 'payroll', 'employee', 'onboarding', 'performance'];
  const financeKeywords = ['finance', 'accounting', 'book', 'tax', 'audit', 'budget'];
  const supportKeywords = ['support', 'help', 'desk', 'ticket', 'service', 'assist'];
  const devKeywords = ['git', 'code', 'develop', 'api', 'sdk', 'framework', 'library'];
  const dataKeywords = ['database', 'sql', 'nosql', 'mongo', 'postgres', 'redis'];
  const aiKeywords = ['ai', 'ml', 'learning', 'neural', 'smart', 'predict'];
  const collabKeywords = ['collab', 'team', 'share', 'document', 'workspace'];

  for (const word of words) {
    let categorized = false;

    if (crmKeywords.some(k => word.includes(k))) {
      categories.crm.push(word);
      categorized = true;
    }
    if (marketingKeywords.some(k => word.includes(k))) {
      categories.marketing.push(word);
      categorized = true;
    }
    if (projectKeywords.some(k => word.includes(k))) {
      categories.project.push(word);
      categorized = true;
    }
    if (communicationKeywords.some(k => word.includes(k))) {
      categories.communication.push(word);
      categorized = true;
    }
    if (analyticsKeywords.some(k => word.includes(k))) {
      categories.analytics.push(word);
      categorized = true;
    }
    if (infraKeywords.some(k => word.includes(k))) {
      categories.infrastructure.push(word);
      categorized = true;
    }
    if (paymentKeywords.some(k => word.includes(k))) {
      categories.payment.push(word);
      categorized = true;
    }
    if (ecommerceKeywords.some(k => word.includes(k))) {
      categories.ecommerce.push(word);
      categorized = true;
    }
    if (securityKeywords.some(k => word.includes(k))) {
      categories.security.push(word);
      categorized = true;
    }
    if (hrKeywords.some(k => word.includes(k))) {
      categories.hr.push(word);
      categorized = true;
    }
    if (financeKeywords.some(k => word.includes(k))) {
      categories.finance.push(word);
      categorized = true;
    }
    if (supportKeywords.some(k => word.includes(k))) {
      categories.support.push(word);
      categorized = true;
    }
    if (devKeywords.some(k => word.includes(k))) {
      categories.development.push(word);
      categorized = true;
    }
    if (dataKeywords.some(k => word.includes(k))) {
      categories.data.push(word);
      categorized = true;
    }
    if (aiKeywords.some(k => word.includes(k))) {
      categories.ai.push(word);
      categorized = true;
    }
    if (collabKeywords.some(k => word.includes(k))) {
      categories.collaboration.push(word);
      categorized = true;
    }

    if (!categorized) {
      categories.other.push(word);
    }
  }

  return categories;
}

/**
 * 단어 목록을 파일에 저장합니다.
 */
function saveWordsToFile(words: string[], outputPath: string): void {
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const content = words.join('\n');
  fs.writeFileSync(outputPath, content, 'utf-8');
}

/**
 * 카테고리별 단어를 JSON으로 저장합니다.
 */
function saveCategorizedWords(categorized: Record<string, string[]>, outputPath: string): void {
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const data = {
    categorized,
    total: Object.values(categorized).reduce((sum, words) => sum + words.length, 0),
    categories: Object.keys(categorized).length,
    savedAt: new Date().toISOString()
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 수집 리포트를 저장합니다.
 */
function saveReport(report: WordCollectionResult, outputPath: string): void {
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const data = {
    ...report,
    collectedAt: report.collectedAt.toISOString()
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 옵션을 로드합니다.
 */
function loadOptions(): WordCollectionOptions {
  const args = process.argv.slice(2);

  const options: WordCollectionOptions = { ...DEFAULT_OPTIONS };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--input':
      case '-i':
        options.inputPath = args[++i];
        break;
      case '--output':
      case '-o':
        options.outputPath = args[++i];
        break;
      case '--source':
      case '-s':
        options.source = args[++i];
        break;
      case '--no-dedupe':
        options.deduplicate = false;
        break;
      case '--no-qa':
        options.runQA = false;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        console.error(`알 수 없는 옵션: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return options;
}

/**
 * 도움말을 출력합니다.
 */
function printHelp(): void {
  console.log(`
Word Collector Script

사용법:
  npm run collect -- [options]

옵션:
  -i, --input <file>     수집된 단어 입력 파일 (기본값: input/generated/real_world_collected.txt)
  -o, --output <file>    출력 파일 (기본값: input/generated/real_world_words_YYYY-MM-DD.txt)
  -s, --source <name>    수집 소스 (기본값: web)
  --no-dedupe            중복 제거 건너뛰기
  --no-qa                QA 검증 건너뛰기
  -h, --help             도움말

예시:
  npm run collect -- --input collected.txt --output final_words.txt
  npm run collect -- -i raw_words.txt -s "g2 directory"
`);
}

/**
 * 날짜 슬러그를 생성합니다.
 */
function getDateSlug(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 타입 정의 확장
declare module '../src/word-generation/types' {
  interface WordCollectionOptions {
    inputPath?: string;
    source?: string;
    categories?: string[];
    outputPath?: string;
    deduplicate?: boolean;
    runQA?: boolean;
  }

  interface WordCollectionResult {
    source: string;
    totalCollected: number;
    normalized: number;
    duplicatesRemoved: number;
    unique: number;
    qaPassed: number;
    qaFailed: number;
    final: number;
    categories: Record<string, string[]>;
    outputPath: string;
    collectedAt: Date;
    duration: number;
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

export { main, DEFAULT_OPTIONS };
