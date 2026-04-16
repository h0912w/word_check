#!/usr/bin/env tsx

/**
 * Update Task Progress
 *
 * 작업 완료 후 task-progress.md를 업데이트하는 유틸리티
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

interface TaskUpdate {
  completed: string[];
  current: string;
  next: string[];
  timestamp: string;
}

function updateTaskProgress(update: TaskUpdate): void {
  const progressPath = path.join(PROJECT_ROOT, 'docs/task-progress.md');

  const template = `# 작업 진행 상태

> **Claude 참고**: 이 프로젝트 작업 시작 시 반드시 이 파일을 먼저 확인하세요.
>
> 최신 작업 내용만 유지합니다. 오래된 내용은 덮어씁니다.

---

## 마지막 작업 (${update.timestamp})

### 완료된 작업
${update.completed.map(x => `- ✅ ${x}`).join('\n')}

### 현재 상태
- **진행 중**: ${update.current}

---

## 다음 작업

${update.next.map((x, i) => `${i + 1}. ${x}`).join('\n')}

---

## 기술 스택 (로컬 실행)

- **실행 환경**: Node.js (로컬 PC)
- **데이터베이스**: SQLite (\`data/word-check.db\`)
- **Google Ads API**: google-ads-node (직접 gRPC 호출)
- **주기 실행**: node-cron (선택사항)

---

## 실행 명령어 참조

\`\`\`bash
# 초기화
npm run init-db                    # DB 초기화

# 데이터 처리
npm run prepare-input              # 입력 정규화
npm run build-shards               # Shard 분할
npm run bootstrap-storage          # DB에 shard 등록

# 메트릭 수집
npm run collect-metrics            # Google Ads API 호출
npm run collect-metrics -- --dry-run  # 테스트

# 내보내기/배포
npm run export                     # CSV/XLSX 내보내기
npm run publish                    # Drive/Sheets 배포

# 전체 실행
npm run run-all                    # 전체 파이프라인
npm run schedule                   # 주기 실행 (node-cron)

# 검증
npm run qa                         # QA 실행
npm run health                     # 상태 확인
\`\`\`
`;

  fs.writeFileSync(progressPath, template);
  console.log(`✓ Task progress updated: ${progressPath}`);
}

// CLI로 실행 시
const args = process.argv.slice(2);
if (args.length > 0) {
  const command = args[0];

  switch (command) {
    case 'complete':
      // 작업 완료 표시
      const task = args[1];
      if (!task) {
        console.error('Usage: tsx update_task_progress.ts complete <task description>');
        process.exit(1);
      }
      updateTaskProgress({
        completed: [task],
        current: '대기 중',
        next: [],
        timestamp: new Date().toISOString().split('T')[0],
      });
      break;

    case 'status':
      // 현재 상태 업데이트
      const current = args[1];
      if (!current) {
        console.error('Usage: tsx update_task_progress.ts status <current status>');
        process.exit(1);
      }
      // 기존 파일 읽고 상태만 업데이트 (구현 생략)
      console.log('Status update: 구현 필요');
      break;

    default:
      console.log(`
Usage: tsx update_task_progress.ts <command> [args]

Commands:
  complete <task>     작업 완료 표시
  status <current>    현재 상태 업데이트

Examples:
  tsx update_task_progress.ts complete "의존성 설치 완료"
  tsx update_task_progress.ts status "npm install 진행 중"
      `);
  }
}

export { updateTaskProgress };
