/**
 * Experiments 161-170: Advanced AI Pattern Refinements
 *
 * 심화 학습, 트랜스포머, GAN 등 발전된 AI 패턴 실험
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

// 고급 과학/기술 용어 집합 (확장)
const ADVANCED_WORDS = [
  // 심화 학습
  'deep', 'neural', 'network', 'layer', 'activation', 'backprop', 'gradient',
  'descent', 'optimizer', 'adam', 'rmsprop', 'sgd', 'momentum', 'learning', 'rate',

  // 트랜스포머
  'attention', 'transformer', 'encoder', 'decoder', 'embedding', 'positional',
  'multihead', 'selfattention', 'crossattention', 'token', 'vocabulary', 'bert',

  // GAN
  'generative', 'adversarial', 'discriminator', 'generator', 'gan', 'vae',
  'latent', 'space', 'prior', 'posterior', 'likelihood', 'elbo',

  // 강화 학습
  'reinforcement', 'reward', 'policy', 'value', 'actor', 'critic', 'episode',
  'trajectory', 'montecarlo', 'temporal', 'difference', 'qlearning', 'sarsa',

  // 메타 학습
  'meta', 'learning', 'maml', 'reptile', 'fewshot', 'oneshot', 'zeroshot',
  'gradient', 'descent', 'inner', 'outer', 'loop', 'adaptation',

  // 신경망 아키텍처
  'convolution', 'recurrent', 'lstm', 'gru', 'attention', 'residual', 'skip',
  'connection', 'batch', 'normalization', 'dropout', 'regularization',

  // 자연어 처리
  'nlp', 'language', 'model', 'seq2seq', 'attention', 'beam', 'search',
  'bleu', 'perplexity', 'wordpiece', 'bpe', 'sentencepiece',

  // 컴퓨터 비전
  'cnn', 'rcnn', 'yolo', 'segmentation', 'detection', 'classification',
  'feature', 'map', 'pooling', 'convolution', 'kernel', 'filter',

  // 그래프 신경망
  'graph', 'node', 'edge', 'adjacency', 'matrix', 'laplacian', 'spectral',
  'convolution', 'message', 'passing', 'aggregation', 'readout'
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

// 실험 161: 심화 학습 변형
function experiment161(): string[] {
  return generateWords(10000, () => {
    const layers = ['deep', 'shallow', 'wide', 'narrow', 'residual'];
    const activations = ['relu', 'sigmoid', 'tanh', 'softmax', 'gelu', 'swish'];
    const architectures = ['cnn', 'rnn', 'lstm', 'gru', 'transformer'];

    const layer = layers[Math.floor(Math.random() * layers.length)];
    const activation = activations[Math.floor(Math.random() * activations.length)];
    const architecture = architectures[Math.floor(Math.random() * architectures.length)];

    // 랜덤 조합
    const patterns = [
      `${layer}${activation}`,
      `${activation}${architecture}`,
      `${architecture}${layer}`,
      `${layer}${architecture}${activation}`,
      `${activation}${layer}${architecture}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 162: 트랜스포머 영감
function experiment162(): string[] {
  return generateWords(10000, () => {
    const components = ['attention', 'token', 'embedding', 'positional', 'encoder', 'decoder'];
    const modifiers = ['multi', 'self', 'cross', 'bi', 'mono', 'uni', 'poly'];

    const comp = components[Math.floor(Math.random() * components.length)];
    const mod = modifiers[Math.floor(Math.random() * modifiers.length)];

    // 어텐션 패턴
    const attention = `${mod}${comp}`;

    // 트랜스포머 패턴
    const transformer = `transformer${['small', 'base', 'large', 'xl'][Math.floor(Math.random() * 4)]}`;

    // 결합
    return Math.random() > 0.5 ? attention : transformer;
  });
}

// 실험 163: GAN 기반 패턴
function experiment163(): string[] {
  return generateWords(10000, () => {
    const ganTypes = ['dcgan', 'wgan', 'stylegan', 'cyclegan', 'pix2pix', 'biggan'];
    const components = ['gen', 'disc', 'encoder', 'decoder', 'mapper'];
    const qualities = ['realistic', 'sharp', 'coherent', 'diverse', 'novel'];

    const gan = ganTypes[Math.floor(Math.random() * ganTypes.length)];
    const comp = components[Math.floor(Math.random() * components.length)];
    const quality = qualities[Math.floor(Math.random() * qualities.length)];

    // GAN 패턴
    const patterns = [
      `${gan}${comp}`,
      `${quality}${comp}`,
      `${gan}${quality}`,
      `${comp}${gan}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 164: 강화 학습 패턴
function experiment164(): string[] {
  return generateWords(10000, () => {
    const rlAlgorithms = ['dqn', 'ppo', 'a3c', 'a2c', 'sac', 'td3', 'trpo', 'acktr'];
    const components = ['policy', 'value', 'actor', 'critic', 'reward', 'state', 'action'];
    const environments = ['atari', 'mujoco', 'gym', 'unity', 'carla', 'airsim'];

    const algo = rlAlgorithms[Math.floor(Math.random() * rlAlgorithms.length)];
    const comp = components[Math.floor(Math.random() * components.length)];
    const env = environments[Math.floor(Math.random() * environments.length)];

    // RL 패턴
    const patterns = [
      `${algo}${comp}`,
      `${comp}${env}`,
      `${algo}${env}`,
      `${env}${algo}${comp}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 165: 어텐션 메커니즘
function experiment165(): string[] {
  return generateWords(10000, () => {
    const attentionTypes = ['self', 'cross', 'multi', 'single', 'global', 'local'];
    const components = ['attention', 'head', 'query', 'key', 'value', 'vector'];
    const applications = ['nlp', 'vision', 'audio', 'multimodal', 'graph'];

    const attType = attentionTypes[Math.floor(Math.random() * attentionTypes.length)];
    const comp = components[Math.floor(Math.random() * components.length)];
    const app = applications[Math.floor(Math.random() * applications.length)];

    // 어텐션 패턴
    const patterns = [
      `${attType}${comp}`,
      `${comp}${app}`,
      `${attType}${app}${comp}`,
      `${app}${attType}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 166: 신경망 아키텍처 서치
function experiment166(): string[] {
  return generateWords(10000, () => {
    const architectures = ['resnet', 'vgg', 'inception', 'densenet', 'mobilenet', 'efficientnet'];
    const components = ['block', 'layer', 'unit', 'cell', 'module'];
    const operations = ['conv', 'pool', 'skip', 'concat', 'add'];

    const arch = architectures[Math.floor(Math.random() * architectures.length)];
    const comp = components[Math.floor(Math.random() * components.length)];
    const op = operations[Math.floor(Math.random() * operations.length)];

    // NAS 패턴
    const patterns = [
      `${arch}${comp}`,
      `${comp}${op}`,
      `${arch}${comp}${op}`,
      `${op}${comp}${arch}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 167: 메타 학습
function experiment167(): string[] {
  return generateWords(10000, () => {
    const metaAlgorithms = ['maml', 'reptile', 'prototypical', 'relation', 'matching'];
    const learningTypes = ['fewshot', 'oneshot', 'zeroshot', 'meta', 'continual'];
    const components = ['learner', 'adapter', 'optimizer', 'network'];

    const algo = metaAlgorithms[Math.floor(Math.random() * metaAlgorithms.length)];
    const learnType = learningTypes[Math.floor(Math.random() * learningTypes.length)];
    const comp = components[Math.floor(Math.random() * components.length)];

    // 메타 학습 패턴
    const patterns = [
      `${algo}${learnType}`,
      `${learnType}${comp}`,
      `${algo}${comp}`,
      `${comp}${algo}${learnType}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 168: Few-Shot 패턴
function experiment168(): string[] {
  return generateWords(10000, () => {
    const shotTypes = ['zeroshot', 'oneshot', 'fewshot', 'manyshot'];
    const learningMethods = ['supervised', 'unsupervised', 'selfsupervised', 'semisupervised'];
    const tasks = ['classification', 'regression', 'segmentation', 'detection'];

    const shot = shotTypes[Math.floor(Math.random() * shotTypes.length)];
    const method = learningMethods[Math.floor(Math.random() * learningMethods.length)];
    const task = tasks[Math.floor(Math.random() * tasks.length)];

    // Few-Shot 패턴
    const patterns = [
      `${shot}${method}`,
      `${method}${task}`,
      `${shot}${task}`,
      `${task}${shot}${method}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 169: Transfer Learning
function experiment169(): string[] {
  return generateWords(10000, () => {
    const sourceDomains = ['imagenet', 'coco', 'voc', 'cityscapes', 'kitti'];
    const targetDomains = ['medical', 'satellite', 'drone', 'industrial', 'agricultural'];
    const methods = ['finetune', 'adapt', 'transfer', 'distill', 'compress'];

    const source = sourceDomains[Math.floor(Math.random() * sourceDomains.length)];
    const target = targetDomains[Math.floor(Math.random() * targetDomains.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];

    // Transfer Learning 패턴
    const patterns = [
      `${source}${target}`,
      `${method}${target}`,
      `${source}${method}`,
      `${target}${method}${source}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 실험 170: Federated Learning
function experiment170(): string[] {
  return generateWords(10000, () => {
    const fedComponents = ['client', 'server', 'aggregator', 'model', 'gradient'];
    const privacyTechs = ['differential', 'secure', 'privacy', 'encrypt', 'homomorphic'];
    const communication = ['round', 'epoch', 'batch', 'local', 'global'];

    const comp = fedComponents[Math.floor(Math.random() * fedComponents.length)];
    const privacy = privacyTechs[Math.floor(Math.random() * privacyTechs.length)];
    const comm = communication[Math.floor(Math.random() * communication.length)];

    // Federated Learning 패턴
    const patterns = [
      `${comp}${privacy}`,
      `${privacy}${comm}`,
      `${comp}${comm}`,
      `${comm}${comp}${privacy}`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
  });
}

// 메인
async function main() {
  console.log('=== Experiments 161-170: Advanced AI Pattern Refinements ===');
  console.log('');

  const existingWords = loadExistingWords();
  console.log(`기존 단어 수: ${existingWords.size}`);
  console.log('');

  const experiments = [
    { id: 161, name: 'Deep Learning Variants', fn: experiment161 },
    { id: 162, name: 'Transformer Inspired', fn: experiment162 },
    { id: 163, name: 'GAN Based Patterns', fn: experiment163 },
    { id: 164, name: 'Reinforcement Learning', fn: experiment164 },
    { id: 165, name: 'Attention Mechanisms', fn: experiment165 },
    { id: 166, name: 'Neural Architecture Search', fn: experiment166 },
    { id: 167, name: 'Meta Learning', fn: experiment167 },
    { id: 168, name: 'Few Shot Patterns', fn: experiment168 },
    { id: 169, name: 'Transfer Learning', fn: experiment169 },
    { id: 170, name: 'Federated Learning', fn: experiment170 }
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
