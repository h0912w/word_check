/**
 * Word Generation Script (Framework)
 *
 * 이 스크립트는 Claude Code 세션에서 단어 생성 작업을 조율하는 프레임워크입니다.
 * 실제 단어 생성은 Claude Code LLM이 직접 수행합니다.
 *
 * 사용법:
 * 1. Claude Code 세션에서 이 스크립트를 실행합니다.
 * 2. Claude Code가 카테고리별로 단어를 생성합니다.
 * 3. 중복 검증 및 QA를 수행합니다.
 * 4. 최종 단어를 input/generated/에 저장합니다.
 *
 * 중요: 생산 런타임에서는 LLM API를 호출하지 않습니다.
 * 이 스크립트는 Claude Code 세션에서만 실행되어야 합니다.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  WordCategory,
  WordPattern,
  AgentType,
  GeneratedWord,
  WordGenerationOptions,
  WordGenerationResult,
  CATEGORY_EXAMPLES,
  PATTERN_EXAMPLES
} from '../src/word-generation/types';
import {
  deduplicateWords,
  saveWordsToFile,
  saveWordsToJson
} from '../src/word-generation/deduplication';
import {
  validateWords,
  generateQAReport,
  saveQAReport
} from '../src/word-generation/validator';

/**
 * 기본 옵션
 */
const DEFAULT_OPTIONS: WordGenerationOptions = {
  count: 200000,
  categories: undefined, // 모든 카테고리
  patterns: undefined,   // 모든 패턴
  outputPath: undefined, // 자동 생성
  checkDuplicates: true,
  runQA: true
};

/**
 * 메인 함수
 */
async function main() {
  console.log('=== Word Generation Framework ===');
  console.log('이 스크립트는 Claude Code 세션에서 실행되어야 합니다.');
  console.log('');

  // 1. 옵션 로드
  const options = loadOptions();
  console.log('옵션:', JSON.stringify(options, null, 2));
  console.log('');

  // 2. 카테고리 및 패턴 결정
  const categories = options.categories || Object.keys(CATEGORY_EXAMPLES) as WordCategory[];
  const patterns = options.patterns || Object.keys(PATTERN_EXAMPLES) as WordPattern[];

  console.log(`카테고리 (${categories.length}):`, categories.join(', '));
  console.log(`패턴 (${patterns.length}):`, patterns.join(', '));
  console.log('');

  // 3. 단어 생성 (Claude Code가 수행)
  console.log('=== Claude Code: 단어 생성 시작 ===');
  console.log(`${options.count}개 단어 생성을 요청합니다.`);
  console.log('');

  // 여기서 Claude Code가 실제로 단어를 생성합니다.
  // 이 프레임워크는 구조만 제공합니다.
  const generatedWords: GeneratedWord[] = [];

  // 예시: 카테고리별 단어 생성
  const wordsPerCategory = Math.ceil(options.count / categories.length);

  console.log('카테고리별 생성 할당:');
  for (const category of categories) {
    const count = Math.ceil(wordsPerCategory / patterns.length);
    console.log(`  - ${category}: ${count * patterns.length}단어`);

    // 실제 생성은 Claude Code가 수행
    // 이곳은 프레임워크 예시입니다.
  }

  console.log('');
  console.log('=== 중복 검증 ===');

  // 4. 중복 검증
  const words = generatedWords.map(w => w.word);
  let deduplicationResult;

  if (options.checkDuplicates) {
    deduplicationResult = await deduplicateWords(words, 'input');
    console.log(`총 단어: ${deduplicationResult.totalWords}`);
    console.log(`중복 제거: ${deduplicationResult.duplicatesRemoved}`);
    console.log(`고유 단어: ${deduplicationResult.uniqueWords}`);
    console.log('');
  }

  // 5. QA 검증
  console.log('=== QA 검증 ===');
  let qaResult;

  if (options.runQA) {
    const uniqueWords = deduplicationResult ?
      deduplicationResult.uniqueWords :
      words;

    qaResult = validateWords(uniqueWords);
    console.log(`QA 통과: ${qaResult.passed.length}`);
    console.log(`QA 실패: ${qaResult.failed.length}`);
    console.log(`통과율: ${qaResult.passRate.toFixed(1)}%`);
    console.log(`평균 점수: ${qaResult.averageScore.toFixed(1)}`);
    console.log('');

    // QA 리포트 저장
    const qaReport = generateQAReport(qaResult.results);
    const qaReportPath = `input/generated/qa_report_${getDateSlug()}.json`;
    saveQAReport(qaReport, qaReportPath);
    console.log(`QA 리포트 저장: ${qaReportPath}`);
  }

  // 6. 최종 저장
  const finalWords = qaResult ? qaResult.passed : words;
  const outputPath = options.outputPath || `input/generated/words_${getDateSlug()}.txt`;

  saveWordsToFile(finalWords, outputPath);
  console.log('');
  console.log('=== 완료 ===');
  console.log(`저장 경로: ${outputPath}`);
  console.log(`최종 단어 수: ${finalWords.length}`);

  // 7. 메타데이터 저장
  const metadata = {
    generatedAt: new Date().toISOString(),
    totalGenerated: generatedWords.length,
    uniqueWords: deduplicationResult?.uniqueWords || finalWords.length,
    duplicatesRemoved: deduplicationResult?.duplicatesRemoved || 0,
    qaPassed: qaResult?.passed.length || finalWords.length,
    qaFailed: qaResult?.failed.length || 0,
    categories,
    patterns
  };

  const metadataPath = `input/generated/generation_report_${getDateSlug()}.json`;
  saveWordsToJson(finalWords, metadata, metadataPath);
  console.log(`메타데이터 저장: ${metadataPath}`);
}

/**
 * 옵션을 로드합니다.
 */
function loadOptions(): WordGenerationOptions {
  // 환경변수 또는 기본값 사용
  return {
    count: parseInt(process.env.WORD_COUNT || '200000', 10),
    categories: process.env.WORD_CATEGORIES?.split(',') as WordCategory[] || undefined,
    patterns: process.env.WORD_PATTERNS?.split(',') as WordPattern[] || undefined,
    outputPath: process.env.WORD_OUTPUT_PATH || undefined,
    checkDuplicates: process.env.WORD_CHECK_DUPLICATES !== 'false',
    runQA: process.env.WORD_RUN_QA !== 'false'
  };
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

/**
 * Claude Code를 위한 단어 생성 가이드
 *
 * Claude Code가 이 스크립트를 실행할 때:
 *
 * 1. 각 카테고리별로 전문 용어를 생성합니다.
 * 2. 각 패턴별로 단어 조합을 생성합니다.
 * 3. SaaS 제목에 적합한 단어만 선택합니다.
 * 4. 중복을 방지하기 위해 기존 단어를 확인합니다.
 * 5. QA 기준을 충족하는 단어만 최종 목록에 포함합니다.
 *
 * 카테고리별 예시:
 * - business: analytics, dashboard, insights, metrics, reports
 * - marketing: growth, conversion, acquisition, retention, campaign
 * - product: platform, engine, framework, builder, toolkit
 * - design: interface, experience, visual, creative, studio
 * - data: intelligence, prediction, automation, smart, analytics
 * - communication: messaging, collaboration, notification, chat, inbox
 * - security: security, protection, verified, compliance, shield
 * - finance: billing, payment, invoice, transaction, ledger
 * - hr: recruitment, onboarding, payroll, performance, training
 * - support: support, helpdesk, ticket, satisfaction, assistance
 *
 * 패턴별 예시:
 * - single_noun: analytics, dashboard, platform, engine
 * - compound_noun: workflow, workspace, marketplace, toolbox
 * - verb_noun: manage, track, optimize, analyze, monitor
 * - adjective_noun: smart, intelligent, automated, cloud, digital
 * - prefix_suffix: auto, self, ify, ly, io
 */

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

export { main, DEFAULT_OPTIONS };
