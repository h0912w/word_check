/**
 * Word Deduplication Engine
 *
 * 기존 input/ 파일과 비교하여 중복 단어를 제거합니다.
 * 이 기능은 스크립트로 구현되며, LLM 의존성이 없습니다.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';

/**
 * input/ 디렉터리에서 모든 기존 단어를 로드합니다.
 */
export async function loadExistingWords(inputDir: string = 'input'): Promise<Set<string>> {
  const existingWords = new Set<string>();

  // input/ 디렉터리가 존재하는지 확인
  if (!fs.existsSync(inputDir)) {
    return existingWords;
  }

  const files = fs.readdirSync(inputDir);

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const stat = fs.statSync(filePath);

    // 디렉터리는 건너뜀
    if (stat.isDirectory()) {
      continue;
    }

    // .txt 파일 처리
    if (file.endsWith('.txt')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      lines.forEach(word => existingWords.add(word.toLowerCase()));
    }

    // .csv 파일 처리
    if (file.endsWith('.csv')) {
      const words = await parseCsvFile(filePath);
      words.forEach(word => existingWords.add(word.toLowerCase()));
    }
  }

  return existingWords;
}

/**
 * CSV 파일을 파싱하여 단어 목록을 추출합니다.
 */
async function parseCsvFile(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const words: string[] = [];

    fs.createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }))
      .on('data', (row) => {
        // 'word' 컬럼이 있으면 사용, 없으면 첫 번째 컬럼 사용
        const word = row.word || row[Object.keys(row)[0]];
        if (word && typeof word === 'string') {
          words.push(word.trim());
        }
      })
      .on('end', () => resolve(words))
      .on('error', reject);
  });
}

/**
 * 중복 단어를 제거합니다.
 */
export function removeDuplicates(words: string[], existingWords: Set<string>): {
  uniqueWords: string[];
  duplicatesRemoved: number;
  duplicateWords: string[];
} {
  const uniqueWords: string[] = [];
  const duplicateWords: string[] = [];

  for (const word of words) {
    const normalizedWord = word.toLowerCase().trim();
    if (existingWords.has(normalizedWord)) {
      duplicateWords.push(word);
    } else {
      uniqueWords.push(word);
      existingWords.add(normalizedWord); // 현재 배치 내 중복도 방지
    }
  }

  return {
    uniqueWords,
    duplicatesRemoved: duplicateWords.length,
    duplicateWords
  };
}

/**
 * 중복 제거 결과를 생성합니다.
 */
export interface DeduplicationResult {
  totalWords: number;
  uniqueWords: number;
  duplicatesRemoved: number;
  duplicateWords: string[];
}

/**
 * 단어 목록에서 중복을 제거하고 결과를 반환합니다.
 */
export async function deduplicateWords(
  words: string[],
  inputDir: string = 'input'
): Promise<DeduplicationResult> {
  // 기존 단어 로드
  const existingWords = await loadExistingWords(inputDir);

  // 중복 제거
  const result = removeDuplicates(words, existingWords);

  return {
    totalWords: words.length,
    uniqueWords: result.uniqueWords.length,
    duplicatesRemoved: result.duplicatesRemoved,
    duplicateWords: result.duplicateWords
  };
}

/**
 * 단어 목록을 파일에 저장합니다.
 */
export function saveWordsToFile(words: string[], outputPath: string): void {
  const dir = path.dirname(outputPath);

  // 디렉터리가 없으면 생성
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 단어 목록을 파일에 저장 (한 줄에 하나씩)
  const content = words.join('\n');
  fs.writeFileSync(outputPath, content, 'utf-8');
}

/**
 * 단어 목록을 JSON 파일로 저장합니다.
 */
export function saveWordsToJson(words: string[], metadata: Record<string, any>, outputPath: string): void {
  const dir = path.dirname(outputPath);

  // 디렉터리가 없으면 생성
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const data = {
    metadata,
    words,
    savedAt: new Date().toISOString()
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
}
