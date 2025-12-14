// -*- coding: utf-8 -*-
// 扣费信息工具函数
// 用于格式化和处理扣费相关的信息

/**
 * @typedef {Object} ChargeInfo
 * @property {boolean} success - 是否扣费成功
 * @property {string} message - 扣费消息
 * @property {number} eventValue - 扣费金额（光子数）
 * @property {string} chargeMode - 扣费模式（'fixed' | 'token' | 'mixed'）
 * @property {boolean} [isInsufficientBalance] - 是否余额不足
 * @property {boolean} [needsRollback] - 是否需要回滚
 */

/**
 * 格式化扣费模式为中文显示
 * 
 * @param {string} chargeMode - 扣费模式
 * @returns {string} 中文描述
 */
export function formatChargeMode(chargeMode) {
  switch (chargeMode) {
    case 'fixed':
      return '固定扣费';
    case 'token':
      return 'Token 扣费';
    case 'mixed':
      return '混合扣费';
    default:
      return '未知模式';
  }
}

/**
 * 格式化扣费状态为中文显示
 * 
 * @param {ChargeInfo} chargeInfo - 扣费信息
 * @returns {string} 状态描述
 */
export function formatChargeStatus(chargeInfo) {
  if (!chargeInfo) {
    return '无扣费信息';
  }
  
  if (chargeInfo.success) {
    return '扣费成功';
  }
  
  if (chargeInfo.isInsufficientBalance) {
    return '余额不足';
  }
  
  return '扣费失败';
}

/**
 * 获取扣费信息的完整描述（用于日志或通知）
 * 
 * @param {ChargeInfo} chargeInfo - 扣费信息
 * @returns {string} 完整描述
 */
export function getChargeDescription(chargeInfo) {
  if (!chargeInfo || chargeInfo.eventValue === 0) {
    return '本次未扣费';
  }
  
  const status = formatChargeStatus(chargeInfo);
  const mode = formatChargeMode(chargeInfo.chargeMode);
  const amount = chargeInfo.eventValue;
  
  if (chargeInfo.success) {
    return `${status}：扣除 ${amount} 光子（${mode}）`;
  } else {
    return `${status}：尝试扣除 ${amount} 光子（${mode}）- ${chargeInfo.message || '未知错误'}`;
  }
}

/**
 * 打印扣费信息到控制台（格式化输出）
 * 
 * @param {ChargeInfo} chargeInfo - 扣费信息
 * @param {string} [prefix=''] - 日志前缀
 */
export function logChargeInfo(chargeInfo, prefix = '') {
  if (!chargeInfo || chargeInfo.eventValue === 0) {
    console.log(`${prefix}本次未扣费`);
    return;
  }
  
  const emoji = chargeInfo.success ? '✅' : '❌';
  const status = formatChargeStatus(chargeInfo);
  const mode = formatChargeMode(chargeInfo.chargeMode);
  
  console.log(`${prefix}${emoji} ${status}`);
  console.log(`${prefix}   - 扣费金额: ${chargeInfo.eventValue} 光子`);
  console.log(`${prefix}   - 扣费模式: ${mode}`);
  
  if (chargeInfo.needsRollback) {
    console.log(`${prefix}   - ⚠️ 需要回滚状态`);
  }
  
  if (!chargeInfo.success) {
    console.log(`${prefix}   - 失败原因: ${chargeInfo.message || '未知错误'}`);
  }
}

/**
 * 计算基于 token 的扣费金额
 * 
 * @param {number} totalTokens - 总 token 数
 * @param {number} chargePerKToken - 每 1000 tokens 的扣费金额
 * @returns {number} 扣费金额（向上取整）
 */
export function calculateTokenCharge(totalTokens, chargePerKToken) {
  if (totalTokens <= 0 || chargePerKToken <= 0) {
    return 0;
  }
  return Math.ceil((totalTokens / 1000) * chargePerKToken);
}

/**
 * 获取扣费信息的简短摘要（用于 UI 显示）
 * 
 * @param {ChargeInfo} chargeInfo - 扣费信息
 * @returns {string|null} 摘要文本，如果无扣费则返回 null
 */
export function getChargeInfoSummary(chargeInfo) {
  if (!chargeInfo || chargeInfo.eventValue === 0) {
    return null;
  }
  
  const emoji = chargeInfo.success ? '💰' : '⚠️';
  const amount = chargeInfo.eventValue;
  
  if (chargeInfo.success) {
    return `${emoji} -${amount} 光子`;
  } else if (chargeInfo.isInsufficientBalance) {
    return `${emoji} 余额不足`;
  } else {
    return `${emoji} 扣费失败`;
  }
}

/**
 * 从环境变量获取扣费配置
 * 
 * @returns {Object} 扣费配置
 */
export function getChargeConfig() {
  // 客户端环境变量
  if (typeof window !== 'undefined') {
    return {
      enabled: process.env.NEXT_PUBLIC_ENABLE_PHOTON_CHARGE === 'true',
      chargePerMessage: parseInt(process.env.NEXT_PUBLIC_PHOTON_CHARGE_PER_MESSAGE || '0'),
      chargePerKToken: parseFloat(process.env.NEXT_PUBLIC_PHOTON_CHARGE_PER_1K_TOKEN || '0'),
    };
  }
  
  // 服务端环境变量
  return {
    enabled: process.env.NEXT_PUBLIC_ENABLE_PHOTON_CHARGE === 'true',
    chargeMode: process.env.BOHRIUM_CHARGE_MODE || 'fixed',
    chargePerRequest: parseInt(process.env.BOHRIUM_CHARGE_PER_REQUEST || '1'),
    chargePerKToken: parseFloat(process.env.BOHRIUM_CHARGE_PER_1K_TOKEN || '1'),
    skuId: process.env.BOHRIUM_SKU_ID,
  };
}

/**
 * 检查是否启用了扣费功能
 * 
 * @returns {boolean} 是否启用
 */
export function isChargeEnabled() {
  const config = getChargeConfig();
  return config.enabled;
}

/**
 * 预估本次请求的扣费金额（用于前端提示）
 * 
 * @param {number} [estimatedTokens=0] - 预估的 token 数（可选）
 * @returns {Object} 预估信息
 */
export function estimateCharge(estimatedTokens = 0) {
  const config = getChargeConfig();
  
  if (!config.enabled) {
    return {
      enabled: false,
      amount: 0,
      description: '未启用扣费',
    };
  }
  
  const chargePerMessage = config.chargePerMessage || 0;
  const chargePerKToken = config.chargePerKToken || 0;
  
  let amount = chargePerMessage;
  let description = '固定扣费';
  
  if (estimatedTokens > 0 && chargePerKToken > 0) {
    const tokenCharge = calculateTokenCharge(estimatedTokens, chargePerKToken);
    if (chargePerMessage > 0) {
      amount = chargePerMessage + tokenCharge;
      description = `混合扣费（${chargePerMessage} 固定 + ${tokenCharge} Token）`;
    } else {
      amount = tokenCharge;
      description = 'Token 扣费';
    }
  }
  
  return {
    enabled: true,
    amount,
    description,
  };
}
