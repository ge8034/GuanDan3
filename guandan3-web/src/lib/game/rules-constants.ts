/**
 * 游戏规则常量
 * 
 * 集中管理掼蛋游戏中的所有魔法数字
 */

/** 王牌相关常量 */
export const JOKER_VALUES = {
  /** 红王值 */
  RED: 200,
  /** 黑王值 */
  BLACK: 100,
} as const

/** 级牌相关常量 */
export const LEVEL_CARD_VALUES = {
  /** 红桃级牌逢人配值 */
  RED_LEVEL: 60,
  /** 其他级牌值 */
  NORMAL: 50,
} as const

/** 炸弹相关常量 */
export const BOMB_VALUES = {
  /** 王炸值 */
  JOKER_BOMB: 10000,
  /** 级牌炸弹基数 */
  LEVEL_BASE: 5000,
  /** 普通炸弹基数 */
  NORMAL_BASE: 1000,
} as const

/** 牌型长度常量 */
export const HAND_LENGTHS = {
  /** 顺子最小长度 */
  MIN_STRAIGHT: 5,
  /** 顺子最大长度（掼蛋规则） */
  MAX_STRAIGHT: 5,
  /** 连对最小对数 */
  MIN_SEQUENCE_PAIRS: 3,
  /** 连三最小个数 */
  MIN_SEQUENCE_TRIPLES: 2,
} as const

/** 进贡相关常量 */
export const TRIBUTE_THRESHOLDS = {
  /** 进贡牌最小值 */
  MIN_CARD_VALUE: 10,
  /** 抗贡策略 - 大牌阈值 */
  AGGRESSIVE_CARD: 14, // A
  /** 抗贡策略 - 高牌阈值 */
  HIGH_CARD: 12, // Q
  /** 抗贡策略 - 中高牌阈值 */
  MEDIUM_HIGH_CARD: 10, // 10
  /** 抗贡策略 - 高牌数量阈值 */
  HIGH_CARD_COUNT: 3,
  /** 抗贡策略 - 很高牌数量阈值 */
  VERY_HIGH_CARD_COUNT: 2,
} as const
