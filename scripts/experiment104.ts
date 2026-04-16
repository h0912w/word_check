/**
 * Experiment 104: Geographic and Location-Based Terms
 *
 * 지리적 위치, 도시, 국가 이름을 활용하여 SaaS 제품명 생성
 * 예: Silicon Valley → Silicon, Bay Area → Bay, Tokyo → TokyoFlow
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateWords, generateQAReport, saveQAReport } from '../src/word-generation/validator';

// 주요 기술 도시 및 지역
const TECH_CITIES = [
  'silicon', 'valley', 'bay', 'seattle', 'austin', 'boston', 'denver',
  'portland', 'chicago', 'atlanta', 'nashville', 'raleigh', 'dallas',
  'phoenix', 'san', 'jose', 'sanfran', 'sf', 'la', 'nyc', 'newyork',
  'london', 'paris', 'berlin', 'amsterdam', 'stockholm', 'helsinki',
  'telaviv', 'singapore', 'tokyo', 'seoul', 'shanghai', 'beijing',
  'shenzhen', 'bangalore', 'mumbai', 'sydney', 'melbourne', 'toronto',
  'vancouver', 'montreal', 'santiago', 'saopaulo', 'mexico', 'buenos'
];

// 대륙 및 지역
const REGIONS = [
  'asia', 'euro', 'europa', 'america', 'americas', 'africa', 'oceania',
  'arctic', 'antarctic', 'pacific', 'atlantic', 'indian', 'mediate',
  'nordic', 'baltic', 'alpine', 'mediterranean', 'caribbean', 'andes',
  'rocky', 'appalachian', 'himlayan', 'alps', 'pyrenees', 'ural'
];

// 기술 단어
const TECH_WORDS = [
  'tech', 'soft', 'ware', 'app', 'hub', 'core', 'base', 'flow', 'stack',
  'cloud', 'data', 'net', 'web', 'api', 'dev', 'ops', 'sys', 'lab',
  'platform', 'service', 'solution', 'system', 'network', 'digital'
];

// 방향 및 위치
const DIRECTIONS = [
  'north', 'south', 'east', 'west', 'central', 'mid', 'upper', 'lower',
  'global', 'world', 'international', 'national', 'regional', 'local'
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

// 지리적 단어 생성
function generateGeographicWords(targetCount: number, existingWords: Set<string>): string[] {
  const newWords: string[] = [];
  const newWordsSet = new Set<string>();
  let attempts = 0;
  const maxAttempts = targetCount * 20;

  while (newWords.length < targetCount && attempts < maxAttempts) {
    attempts++;

    // 랜덤 패턴 선택
    const pattern = Math.floor(Math.random() * 6);
    let word = '';

    switch (pattern) {
      case 0: // 도시 + 기술 단어
        {
          const city = TECH_CITIES[Math.floor(Math.random() * TECH_CITIES.length)];
          const tech = TECH_WORDS[Math.floor(Math.random() * TECH_WORDS.length)];
          word = `${city}${tech}`;
        }
        break;

      case 1: // 기술 단어 + 도시
        {
          const tech = TECH_WORDS[Math.floor(Math.random() * TECH_WORDS.length)];
          const city = TECH_CITIES[Math.floor(Math.random() * TECH_CITIES.length)];
          word = `${tech}${city}`;
        }
        break;

      case 2: // 지역 + 기술 단어
        {
          const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
          const tech = TECH_WORDS[Math.floor(Math.random() * TECH_WORDS.length)];
          word = `${region}${tech}`;
        }
        break;

      case 3: // 기술 단어 + 지역
        {
          const tech = TECH_WORDS[Math.floor(Math.random() * TECH_WORDS.length)];
          const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
          word = `${tech}${region}`;
        }
        break;

      case 4: // 방향 + 기술 단어
        {
          const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
          const tech = TECH_WORDS[Math.floor(Math.random() * TECH_WORDS.length)];
          word = `${direction}${tech}`;
        }
        break;

      case 5: // 기술 단어 + 방향
        {
          const tech = TECH_WORDS[Math.floor(Math.random() * TECH_WORDS.length)];
          const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
          word = `${tech}${direction}`;
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
    if (!/^[a-z]+$/.test(word)) {
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
  console.log('=== Experiment 104: Geographic and Location-Based Terms ===');
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
  const words = generateGeographicWords(targetCount, existingWords);
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
  const qaReportPath = `input/generated/experiment104_qa_${Date.now()}.json`;
  saveQAReport(qaReport, qaReportPath);
  console.log(`QA 리포트 저장: ${qaReportPath}`);
  console.log('');

  // 최종 저장
  const outputPath = `input/generated/experiment104_geographic_10000.txt`;
  saveWords(qaResult.passed, outputPath);
  console.log(`저장 경로: ${outputPath}`);
  console.log(`최종 단어 수: ${qaResult.passed.length}`);
}

// 실행
if (require.main === module) {
  main().catch(console.error);
}
