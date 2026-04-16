/**
 * Word Generation Types
 *
 * 단어 생성 기능을 위한 타입 정의
 * 이 기능은 Claude Code 세션에서만 실행되며, 생산 런타임에서는 LLM API를 호출하지 않습니다.
 */

/**
 * SaaS 제목용 단어 카테고리
 */
export type WordCategory =
  | 'business'
  | 'marketing'
  | 'product'
  | 'design'
  | 'data'
  | 'communication'
  | 'security'
  | 'finance'
  | 'hr'
  | 'support';

/**
 * 단어 생성 패턴
 */
export type WordPattern =
  | 'single_noun'
  | 'compound_noun'
  | 'verb_noun'
  | 'adjective_noun'
  | 'prefix_suffix';

/**
 * 단어 생성 에이전트 유형
 */
export type AgentType =
  | 'category_specialist'
  | 'pattern_generator'
  | 'variation_generator'
  | 'qa_agent';

/**
 * 생성된 단어 메타데이터
 */
export interface GeneratedWord {
  word: string;
  category: WordCategory;
  pattern: WordPattern;
  generatedBy: AgentType;
  generatedAt: Date;
  isDuplicate: boolean;
  qaPassed: boolean;
  qaScore: number;
}

/**
 * 단어 생성 옵션
 */
export interface WordGenerationOptions {
  count: number;
  categories?: WordCategory[];
  patterns?: WordPattern[];
  outputPath?: string;
  checkDuplicates?: boolean;
  runQA?: boolean;
}

/**
 * 단어 생성 결과
 */
export interface WordGenerationResult {
  totalGenerated: number;
  uniqueWords: number;
  duplicatesRemoved: number;
  qaPassed: number;
  qaFailed: number;
  words: GeneratedWord[];
  outputPath: string;
  generatedAt: Date;
  duration: number;
}

/**
 * 중복 검증 결과
 */
export interface DeduplicationResult {
  totalWords: number;
  uniqueWords: number;
  duplicatesRemoved: number;
  duplicateWords: string[];
}

/**
 * QA 검증 결과
 */
export interface WordQAResult {
  word: string;
  passed: boolean;
  score: number;
  reasons: string[];
  errors: {
    notEnglish?: boolean;
    tooShort?: boolean;
    tooLong?: boolean;
    notSaaSSuitable?: boolean;
    isSpam?: boolean;
    poorQuality?: boolean;
  };
}

/**
 * 단어 생성 리포트
 */
export interface GenerationReport {
  generatedAt: Date;
  duration: number;
  totalGenerated: number;
  byCategory: Record<WordCategory, number>;
  byPattern: Record<WordPattern, number>;
  byAgent: Record<AgentType, number>;
  deduplication: DeduplicationResult;
  qa: {
    total: number;
    passed: number;
    failed: number;
    averageScore: number;
  };
}

/**
 * SaaS 제목용 카테고리별 단어 예시
 */
export const CATEGORY_EXAMPLES: Record<WordCategory, string[]> = {
  business: ['analytics', 'dashboard', 'insights', 'metrics', 'reports'],
  marketing: ['growth', 'conversion', 'acquisition', 'retention', 'campaign'],
  product: ['platform', 'engine', 'framework', 'builder', 'toolkit'],
  design: ['interface', 'experience', 'visual', 'creative', 'studio'],
  data: ['intelligence', 'prediction', 'automation', 'smart', 'analytics'],
  communication: ['messaging', 'collaboration', 'notification', 'chat', 'inbox'],
  security: ['security', 'protection', 'verified', 'compliance', 'shield'],
  finance: ['billing', 'payment', 'invoice', 'transaction', 'ledger'],
  hr: ['recruitment', 'onboarding', 'payroll', 'performance', 'training'],
  support: ['support', 'helpdesk', 'ticket', 'satisfaction', 'assistance']
};

/**
 * PATTERN_EXAMPLES: 단어 패턴별 예시
 */
export const PATTERN_EXAMPLES: Record<WordPattern, string[]> = {
  single_noun: ['analytics', 'dashboard', 'platform', 'engine'],
  compound_noun: ['workflow', 'workspace', 'marketplace', 'toolbox'],
  verb_noun: ['manage', 'track', 'optimize', 'analyze', 'monitor'],
  adjective_noun: ['smart', 'intelligent', 'automated', 'cloud', 'digital'],
  prefix_suffix: ['auto', 'self', 'ify', 'ly', 'io']
};

/**
 * WordCollectionOptions: 단어 수집 옵션
 */
export interface WordCollectionOptions {
  inputPath?: string;
  source?: string;
  categories?: string[];
  outputPath?: string;
  deduplicate?: boolean;
  runQA?: boolean;
}

/**
 * WordCollectionResult: 단어 수집 결과
 */
export interface WordCollectionResult {
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
