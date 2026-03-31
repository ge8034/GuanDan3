/**
 * 错误消息映射工具
 * 将各种错误码和错误消息转换为用户友好的中文提示
 */

const ERROR_MESSAGES: Record<string, string> = {
  // 游戏相关错误
  'turn_no_mismatch': '游戏状态已更新，请刷新页面',
  'not_a_member': '您不在房间中',
  'not_your_turn': '还未轮到您出牌',
  'invalid_cards': '选择的牌不符合规则',
  'cards_not_in_hand': '您没有这些牌',
  'game_not_started': '游戏尚未开始',
  'game_already_started': '游戏已经开始了',
  'room_full': '房间已满',
  'room_not_found': '房间不存在',
  'already_in_room': '您已经在房间中',
  'not_room_owner': '只有房主才能执行此操作',
  'player_not_ready': '有玩家未准备好',

  // 网络和限流错误
  'rate_limit_exceeded': '操作过于频繁，请稍后再试',
  'network_error': '网络连接失败，请检查网络',
  'timeout': '请求超时，请重试',
  'connection_lost': '连接已断开，正在重连...',

  // Supabase 错误码
  'PGRST116': '没有找到相关数据',
  'PGRST202': '权限不足',
  'PGRST301': '关系不存在',
  'PGRST204': '请求的资源不存在',

  // 认证和授权错误
  'auth_failed': '认证失败，请重新登录',
  'session_expired': '会话已过期，请刷新页面',
  'unauthorized': '未授权访问',
  'forbidden': '无权执行此操作',

  // 数据库错误
  'constraint_violation': '操作违反了约束条件',
  'duplicate_entry': '数据已存在',
  'foreign_key_violation': '关联数据不存在',

  // 默认错误
  'default': '操作失败，请稍后重试',
  'unknown_error': '发生未知错误，请重试',
};

/**
 * 错误类型接口
 */
interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

/**
 * 判断是否为应用错误对象
 */
function isAppError(error: unknown): error is AppError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error
  );
}

/**
 * 从错误对象中提取错误码或消息
 */
function extractErrorCode(error: AppError): string {
  // 优先使用 code 字段
  if (error.code && typeof error.code === 'string') {
    return error.code;
  }

  // 其次使用 message 字段
  if (error.message && typeof error.message === 'string') {
    return error.message;
  }

  return 'unknown_error';
}

/**
 * 获取用户友好的错误消息
 *
 * @param error - 错误对象或错误消息
 * @returns 用户友好的中文错误消息
 *
 * @example
 * ```typescript
 * try {
 *   await submitTurn(cards);
 * } catch (error) {
 *   const message = getSafeErrorMessage(error);
 *   toast.error(message);
 * }
 * ```
 */
export function getSafeErrorMessage(error: unknown): string {
  // 处理字符串错误
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || ERROR_MESSAGES['default'];
  }

  // 处理 Error 对象
  if (error instanceof Error) {
    const appError: AppError = {
      ...(error as AppError),
      message: error.message,
    };
    const errorCode = extractErrorCode(appError);
    return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['default'];
  }

  // 处理其他对象类型
  if (isAppError(error)) {
    const errorCode = extractErrorCode(error);
    return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['default'];
  }

  // 默认错误消息
  return ERROR_MESSAGES['default'];
}

/**
 * 获取详细错误信息（用于开发调试）
 *
 * @param error - 错误对象
 * @returns 包含错误详情的对象
 */
export function getErrorDetails(error: unknown): {
  message: string;
  code?: string;
  stack?: string;
  details?: unknown;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as AppError).code,
      stack: error.stack,
      details: (error as AppError).details,
    };
  }

  if (isAppError(error)) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  return {
    message: String(error),
  };
}

/**
 * 判断是否为网络错误
 */
export function isNetworkError(error: unknown): boolean {
  if (typeof error === 'string') {
    return error === 'network_error' || error === 'timeout';
  }

  if (error instanceof Error) {
    return (
      error.message.includes('Network') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout')
    );
  }

  return false;
}

/**
 * 判断是否为认证错误
 */
export function isAuthError(error: unknown): boolean {
  if (typeof error === 'string') {
    return (
      error === 'auth_failed' ||
      error === 'session_expired' ||
      error === 'unauthorized'
    );
  }

  if (error instanceof Error) {
    return (
      error.message.includes('auth') ||
      error.message.includes('Jwt') ||
      error.message.includes('session')
    );
  }

  return false;
}

/**
 * 判断是否为可重试的错误
 */
export function isRetryableError(error: unknown): boolean {
  if (typeof error === 'string') {
    return (
      error === 'rate_limit_exceeded' ||
      error === 'network_error' ||
      error === 'timeout'
    );
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('rate limit')
    );
  }

  return false;
}
