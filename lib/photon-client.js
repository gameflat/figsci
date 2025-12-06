// -*- coding: utf-8 -*-
// 玻尔平台光子支付客户端工具库

/**
 * 光子扣费客户端
 * 
 * 提供便捷的光子扣费调用方法，封装了与光子扣费 API 的交互逻辑
 */

/**
 * 调用光子扣费接口
 * 
 * @param {number} eventValue - 扣费数额（光子数量）
 * @param {Object} options - 可选配置
 * @param {string} options.scene - 扣费场景，默认 "appCustomizeCharge"
 * @param {number} options.bizNo - 请求唯一 ID，不提供则自动生成
 * @returns {Promise<{success: boolean, message: string, bizNo: number, eventValue: number}>}
 */
export async function chargePhoton(eventValue, options = {}) {
  const { scene, bizNo } = options;
  
  try {
    const response = await fetch('/api/photon/charge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventValue,
        scene,
        bizNo
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || '扣费失败');
    }
    
    return data;
  } catch (error) {
    console.error('光子扣费失败：', error);
    throw error;
  }
}

/**
 * 根据消息数量计算扣费金额
 * 
 * @param {number} messageCount - 消息数量
 * @returns {number} 应扣除的光子数量
 */
export function calculateChargeAmount(messageCount) {
  // 可以根据业务需求调整计费规则
  // 示例：每条消息扣除 1 光子
  const chargePerMessage = parseInt(process.env.NEXT_PUBLIC_PHOTON_CHARGE_PER_MESSAGE || '1');
  return messageCount * chargePerMessage;
}

/**
 * 根据 token 使用量计算扣费金额
 * 
 * @param {Object} tokenUsage - Token 使用量信息
 * @param {number} tokenUsage.promptTokens - 输入 token 数
 * @param {number} tokenUsage.completionTokens - 输出 token 数
 * @param {number} tokenUsage.totalTokens - 总 token 数
 * @returns {number} 应扣除的光子数量
 */
export function calculateChargeByTokens(tokenUsage) {
  // 可以根据业务需求调整计费规则
  // 示例：每 1000 token 扣除 1 光子
  const chargePerKToken = parseFloat(process.env.NEXT_PUBLIC_PHOTON_CHARGE_PER_1K_TOKEN || '1');
  const totalTokens = tokenUsage.totalTokens || 0;
  return Math.ceil((totalTokens / 1000) * chargePerKToken);
}

/**
 * 检查是否启用光子扣费
 * 
 * @returns {boolean} 是否启用光子扣费
 */
export function isPhotonChargeEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_PHOTON_CHARGE === 'true';
}
