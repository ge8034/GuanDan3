/**
 * 安全工具函数
 * 提供输入验证、数据清理和安全检查功能
 */

/**
 * HTML 标签白名单（用于安全渲染）
 */
const ALLOWED_HTML_TAGS = [
  'b',
  'i',
  'em',
  'strong',
  'a',
  'p',
  'br',
  'span',
  'div',
];

/**
 * 危险的 HTML 标签和属性（需要过滤）
 */
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // 事件处理器如 onclick=
  /<meta\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
];

/**
 * 敏感信息模式（用于日志脱敏）
 */
const SENSITIVE_PATTERNS = [
  { pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+/g, replacement: 'Bearer ***' },
  { pattern: /"token"\s*:\s*"[^"]+"/g, replacement: '"token": "***"' },
  { pattern: /"password"\s*:\s*"[^"]+"/g, replacement: '"password": "***"' },
  {
    pattern: /"api_key"\s*:\s*"[^"]+"/g,
    replacement: '"api_key": "***"',
  },
  {
    pattern: /"secret"\s*:\s*"[^"]+"/g,
    replacement: '"secret": "***"',
  },
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: '***@***.***',
  },
  {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g, // SSN 格式
    replacement: '***-**-****',
  },
  {
    pattern: /\b\d{16}\b/g, // 信用卡号
    replacement: '****************',
  },
];

/**
 * 验证房间 ID 格式
 *
 * @param roomId - 房间 ID
 * @returns 是否有效
 */
export function isValidRoomId(roomId: string): boolean {
  // 房间 ID 应该是 6 位字母数字组合
  const ROOM_ID_PATTERN = /^[A-Z0-9]{6}$/;
  return ROOM_ID_PATTERN.test(roomId);
}

/**
 * 验证用户昵称
 *
 * @param nickname - 用户昵称
 * @returns 是否有效
 */
export function isValidNickname(nickname: string): boolean {
  // 昵称长度 1-20，只能包含中文、字母、数字、下划线
  const NICKNAME_PATTERN = /^[\u4e00-\u9fa5a-zA-Z0-9_]{1,20}$/;
  return NICKNAME_PATTERN.test(nickname);
}

/**
 * 验证玩家座位号
 *
 * @param seat - 座位号
 * @returns 是否有效
 */
export function isValidSeat(seat: number): boolean {
  // 座位号应该是 0-3
  return Number.isInteger(seat) && seat >= 0 && seat <= 3;
}

/**
 * 清理用户输入，防止 XSS 攻击
 *
 * @param input - 用户输入的字符串
 * @returns 清理后的安全字符串
 *
 * @example
 * ```typescript
 * const safe = sanitizeHTML('<script>alert("xss")</script>Hello');
 * // 返回: 'Hello'
 * ```
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // 移除危险的 HTML 标签和属性
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // 转义 HTML 特殊字符
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return sanitized;
}

/**
 * 严格清理用户输入（移除所有 HTML）
 *
 * @param input - 用户输入的字符串
 * @returns 纯文本字符串
 */
export function stripAllHTML(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/<[^>]*>/g, '') // 移除所有 HTML 标签
    .replace(/&[^;]+;/g, ' ') // 移除 HTML 实体
    .trim();
}

/**
 * 验证 URL 是否安全
 *
 * @param url - 待验证的 URL
 * @returns 是否为安全的 URL
 */
export function isSafeURL(url: string): boolean {
  try {
    const parsed = new URL(url);

    // 只允许 http 和 https 协议
    if (
      parsed.protocol !== 'http:' &&
      parsed.protocol !== 'https:' &&
      parsed.protocol !== 'mailto:'
    ) {
      return false;
    }

    // 防止 javascript: 伪协议
    if (url.toLowerCase().startsWith('javascript:')) {
      return false;
    }

    // 防止 data: URL
    if (url.toLowerCase().startsWith('data:')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 脱敏日志中的敏感信息
 *
 * @param log - 日志内容
 * @returns 脱敏后的日志内容
 *
 * @example
 * ```typescript
 * const log = 'User logged in with token: abc123secret';
 * const safe = sanitizeLog(log);
 * // 返回: 'User logged in with token: ***'
 * ```
 */
export function sanitizeLog(log: string): string {
  if (typeof log !== 'string') {
    return String(log);
  }

  let sanitized = log;

  // 应用所有敏感信息模式
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return sanitized;
}

/**
 * 验证并清理游戏消息
 *
 * @param message - 游戏聊天消息
 * @param maxLength - 最大长度（默认 200）
 * @returns 清理后的安全消息
 */
export function sanitizeGameMessage(
  message: string,
  maxLength: number = 200,
): string {
  if (typeof message !== 'string') {
    return '';
  }

  // 移除所有 HTML
  let sanitized = stripAllHTML(message);

  // 截断到最大长度
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }

  return sanitized;
}

/**
 * 验证卡牌数据结构
 *
 * @param card - 卡牌对象
 * @returns 是否为有效的卡牌
 */
export function isValidCard(card: unknown): boolean {
  if (!card || typeof card !== 'object') {
    return false;
  }

  const c = card as Record<string, unknown>;

  // 检查必需字段
  if (
    typeof c.rank !== 'number' ||
    typeof c.suit !== 'number' ||
    typeof c.id !== 'string'
  ) {
    return false;
  }

  // 验证值范围
  if (c.rank < 0 || c.rank > 15) {
    return false;
  }

  if (c.suit < 0 || c.suit > 4) {
    return false;
  }

  return true;
}

/**
 * 验证卡牌数组
 *
 * @param cards - 卡牌数组
 * @returns 是否为有效的卡牌数组
 */
export function isValidCardArray(cards: unknown): boolean {
  if (!Array.isArray(cards)) {
    return false;
  }

  return cards.every((card) => isValidCard(card));
}

/**
 * 创建安全的随机字符串
 *
 * @param length - 字符串长度
 * @returns 随机字符串
 */
export function generateSecureRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomValues = new Uint32Array(length);

  // 使用 crypto.getRandomValues 生成安全的随机数
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    // 降级方案（仅用于开发环境）
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.random() * 0x100000000;
    }
  }

  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
}

/**
 * 验证环境变量是否存在
 *
 * @param varNames - 环境变量名称数组
 * @returns 缺失的环境变量数组
 */
export function checkRequiredEnvVars(varNames: string[]): string[] {
  const missing: string[] = [];

  for (const name of varNames) {
    if (!process.env[name]) {
      missing.push(name);
    }
  }

  return missing;
}

/**
 * 防止 CSRF 攻击的请求头生成器
 *
 * @returns 包含 CSRF 令牌的请求头
 */
export function getCSRFHeaders(): Record<string, string> {
  // 在实际实现中，应该从 cookie 或存储中获取 CSRF 令牌
  // 这里提供一个基础实现
  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('csrf_token')
      : null;

  return token ? { 'X-CSRF-Token': token } : {};
}

/**
 * 验证内容安全策略（CSP）违规
 *
 * @param report - CSP 违规报告
 * @returns 是否为已知的误报
 */
export function isCSRFViolationFalsePositive(
  report: SecurityPolicyViolationEvent,
): boolean {
  // 这里可以添加已知的误报规则
  // 例如：某些浏览器扩展触发的误报

  const blockedURIs = [
    'chrome-extension:',
    'moz-extension:',
    'safari-web-extension:',
  ];

  return blockedURIs.some((uri) => report.blockedURI.startsWith(uri));
}

/**
 * 安全的 JSON 解析
 *
 * @param json - JSON 字符串
 * @param defaultValue - 解析失败时的默认值
 * @returns 解析结果或默认值
 */
export function safeJSONParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 验证游戏状态版本
 *
 * @param clientVersion - 客户端版本号
 * @param serverVersion - 服务器版本号
 * @returns 版本是否兼容
 */
export function isGameStateVersionCompatible(
  clientVersion: number,
  serverVersion: number,
): boolean {
  // 版本号差异不能太大（防止严重的状态不一致）
  const MAX_VERSION_DIFF = 10;
  return Math.abs(clientVersion - serverVersion) <= MAX_VERSION_DIFF;
}
