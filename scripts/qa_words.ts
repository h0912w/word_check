/**
 * Word QA Script
 *
 * 생성된 단어의 품질을 검증합니다.
 * 이 스크립트는 Claude Code 세션에서 실행되어야 합니다.
 */

import * as fs from 'fs';
import * as path from 'path';
import { WordQAResult, QAReport } from '../src/word-generation/types';
import {
  validateWord,
  validateWords,
  generateQAReport,
  saveQAReport
} from '../src/word-generation/validator';

/**
 * QA 옵션
 */
interface QAOptions {
  inputFile: string;
  outputReport?: string;
  verbose?: boolean;
}

/**
 * 기본 옵션
 */
const DEFAULT_OPTIONS: QAOptions = {
  inputFile: 'input/generated/words_latest.txt',
  outputReport: undefined,
  verbose: false
};

/**
 * 메인 함수
 */
async function main() {
  console.log('=== Word QA Script ===');
  console.log('');

  // 1. 옵션 로드
  const options = loadOptions();
  console.log('입력 파일:', options.inputFile);
  console.log('');

  // 2. 파일 존재 확인
  if (!fs.existsSync(options.inputFile)) {
    console.error(`오류: 파일을 찾을 수 없습니다 - ${options.inputFile}`);
    process.exit(1);
  }

  // 3. 단어 로드
  console.log('단어 로드 중...');
  const content = fs.readFileSync(options.inputFile, 'utf-8');
  const words = content.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  console.log(`총 ${words.length}개 단어 로드됨`);
  console.log('');

  // 4. QA 검증
  console.log('QA 검증 중...');
  const startTime = Date.now();
  const result = validateWords(words);
  const duration = Date.now() - startTime;

  console.log(`검증 완료 (${duration}ms)`);
  console.log('');

  // 5. 결과 출력
  console.log('=== QA 결과 ===');
  console.log(`총 단어: ${result.results.length}`);
  console.log(`통과: ${result.passed.length} (${result.passRate.toFixed(1)}%)`);
  console.log(`실패: ${result.failed.length}`);
  console.log(`평균 점수: ${result.averageScore.toFixed(1)}`);
  console.log('');

  // 6. 실패 사유 상세
  if (result.failed.length > 0) {
    console.log('=== 실패 사유 ===');
    const report = generateQAReport(result.results);

    for (const [reason, count] of Object.entries(report.failureReasons)) {
      console.log(`  - ${reason}: ${count}`);
    }
    console.log('');

    // 실패한 단어 예시 (최대 10개)
    if (options.verbose) {
      console.log('=== 실패한 단어 예시 ===');
      const failedResults = result.results.filter(r => !r.passed);
      const examples = failedResults.slice(0, 10);

      for (const example of examples) {
        console.log(`  - ${example.word}: ${example.reasons.join(', ')}`);
      }

      if (failedResults.length > 10) {
        console.log(`  ... 그 외 ${failedResults.length - 10}개`);
      }
      console.log('');
    }
  }

  // 7. 리포트 저장
  const reportPath = options.outputReport ||
    `input/generated/qa_report_${getDateSlug()}.json`;

  const report = generateQAReport(result.results);
  saveQAReport(report, reportPath);
  console.log(`QA 리포트 저장: ${reportPath}`);
  console.log('');

  // 8. 통과한 단어 저장
  if (result.passed.length > 0) {
    const passedPath = options.inputFile.replace('.txt', '_passed.txt');
    const passedContent = result.passed.join('\n');
    fs.writeFileSync(passedPath, passedContent, 'utf-8');
    console.log(`통과한 단어 저장: ${passedPath}`);
  }

  console.log('');
  console.log('=== 완료 ===');

  // 9. 종료 코드
  process.exit(result.passRate >= 70 ? 0 : 1);
}

/**
 * 옵션을 로드합니다.
 */
function loadOptions(): QAOptions {
  const args = process.argv.slice(2);

  const options: QAOptions = { ...DEFAULT_OPTIONS };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--input':
      case '-i':
        options.inputFile = args[++i];
        break;
      case '--output':
      case '-o':
        options.outputReport = args[++i];
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
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
Word QA Script

사용법:
  npm run qa-words -- [options]

옵션:
  -i, --input <file>     입력 파일 (기본값: input/generated/words_latest.txt)
  -o, --output <file>    출력 리포트 파일 (기본값: input/generated/qa_report_YYYY-MM-DD.json)
  -v, --verbose          실패한 단어 상세 출력
  -h, --help             도움말

예시:
  npm run qa-words -- --input input/generated/words_2026-04-16.txt
  npm run qa-words -- -i words.txt -v
  npm run qa-words -- --input words.txt --output custom_report.json
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

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

export { main, DEFAULT_OPTIONS };
