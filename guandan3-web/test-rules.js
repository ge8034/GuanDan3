// 掼蛋规则验证测试
import { getCardValue, analyzeMove, canBeat } from '../src/lib/game/rules';
import type { Card } from '../src/lib/store/game';

// 级牌为2的测试
const levelRank = 2;

// 测试卡牌
const redJoker: Card = { id: 1, suit: 'J', rank: 'hr', val: 30 };
const blackJoker: Card = { id: 2, suit: 'J', rank: 'sb', val: 20 };
const heart2: Card = { id: 3, suit: 'H', rank: '2', val: 2 };  // 红桃2（级牌）
const spade2: Card = { id: 4, suit: 'S', rank: '2', val: 2 };  // 黑桃2（级牌）
const heartA: Card = { id: 5, suit: 'H', rank: 'A', val: 14 };
const spadeA: Card = { id: 6, suit: 'S', rank: 'A', val: 14 };
const heartK: Card = { id: 7, suit: 'H', rank: 'K', val: 13 };
const spade3: Card = { id: 8, suit: 'S', rank: '3', val: 3 };

console.log('=== 掼蛋规则验证测试 ===\n');

// 1. 测试级牌值计算
console.log('1. 级牌值计算测试');
console.log(`红王: ${getCardValue(redJoker, levelRank)} (期望: 200)`);
console.log(`黑王: ${getCardValue(blackJoker, levelRank)} (期望: 100)`);
console.log(`红桃2(级牌): ${getCardValue(heart2, levelRank)} (期望: 60)`);
console.log(`黑桃2(级牌): ${getCardValue(spade2, levelRank)} (期望: 50)`);
console.log(`A: ${getCardValue(heartA, levelRank)} (期望: 14)`);
console.log(`3: ${getCardValue(spade3, levelRank)} (期望: 3)`);
console.log(`级牌应该大于A: ${getCardValue(heart2, levelRank) > getCardValue(heartA, levelRank)} (期望: true)\n`);

// 2. 测试炸弹识别
console.log('2. 炸弹识别测试');
const bomb4444 = [
  { id: 1, suit: 'S', rank: '4', val: 4 },
  { id: 2, suit: 'H', rank: '4', val: 4 },
  { id: 3, suit: 'D', rank: '4', val: 4 },
  { id: 4, suit: 'C', rank: '4', val: 4 },
];
const bomb2222 = [
  heart2, spade2,
  { id: 5, suit: 'D', rank: '2', val: 2 },
  { id: 6, suit: 'C', rank: '2', val: 2 },
];
const jokerBomb = [redJoker, blackJoker,
  { id: 3, suit: 'J', rank: 'sb', val: 20 },
  { id: 4, suit: 'J', rank: 'hr', val: 30 }
];

const move4444 = analyzeMove(bomb4444, levelRank);
const move2222 = analyzeMove(bomb2222, levelRank);
const moveJoker = analyzeMove(jokerBomb, levelRank);

console.log(`4444炸弹: ${move4444?.type} (期望: bomb), 主值=${move4444?.primaryValue}`);
console.log(`2222级牌炸弹: ${move2222?.type} (期望: bomb), 主值=${move2222?.primaryValue}`);
console.log(`王炸: ${moveJoker?.type} (期望: bomb), 主值=${moveJoker?.primaryValue} (期望: 10000)`);
console.log(`级牌炸弹应该大于普通炸弹: ${move2222!.primaryValue > move4444!.primaryValue} (期望: true)`);
console.log(`王炸应该最大: ${moveJoker!.primaryValue > move2222!.primaryValue} (期望: true)\n`);

// 3. 测试飞机（连续三张）识别
console.log('3. 飞机（连续三张）识别测试');
const airplane = [
  { id: 1, suit: 'S', rank: '3', val: 3 },
  { id: 2, suit: 'H', rank: '3', val: 3 },
  { id: 3, suit: 'D', rank: '3', val: 3 },
  { id: 4, suit: 'S', rank: '4', val: 4 },
  { id: 5, suit: 'H', rank: '4', val: 4 },
  { id: 6, suit: 'D', rank: '4', val: 4 },
];
const moveAirplane = analyzeMove(airplane, levelRank);
console.log(`333444飞机: ${moveAirplane?.type} (期望: sequenceTriples)\n`);

// 4. 测试炸弹带牌（四带二会被识别为炸弹）
console.log('4. 四带二在掼蛋中是炸弹（4张相同）');
const bomb5 = [
  { id: 1, suit: 'S', rank: '5', val: 5 },
  { id: 2, suit: 'H', rank: '5', val: 5 },
  { id: 3, suit: 'D', rank: '5', val: 5 },
  { id: 4, suit: 'C', rank: '5', val: 5 },
  { id: 5, suit: 'S', rank: '3', val: 3 },
  { id: 6, suit: 'H', rank: 'K', val: 13 },
];
const moveBomb5 = analyzeMove(bomb5, levelRank);
console.log(`5555炸弹: ${moveBomb5?.type} (期望: bomb)\n`);

// 5. 测试canBeat规则
console.log('5. canBeat规则测试');
const single3 = analyzeMove([spade3], levelRank);
const single4 = analyzeMove([{ id: 9, suit: 'S', rank: '4', val: 4 }], levelRank);
console.log(`单张4能压单张3: ${canBeat(single4!, single3!)} (期望: true)`);

const pair33 = analyzeMove([
  { id: 1, suit: 'S', rank: '3', val: 3 },
  { id: 2, suit: 'H', rank: '3', val: 3 },
], levelRank);
const pair44 = analyzeMove([
  { id: 1, suit: 'S', rank: '4', val: 4 },
  { id: 2, suit: 'H', rank: '4', val: 4 },
], levelRank);
console.log(`对子44能压对子33: ${canBeat(pair44!, pair33!)} (期望: true)`);

console.log(`炸弹能压对子: ${canBeat(move4444!, pair33!)} (期望: true)`);
console.log(`钢板能压三张: ${canBeat(moveSteel!, { type: 'triple', cards: [], primaryValue: 3 })} (期望: true)`);

console.log('\n=== 测试完成 ===');
