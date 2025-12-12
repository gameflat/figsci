// -*- coding: utf-8 -*-
// 光子扣费提示组件
// 用于向用户展示当前操作的扣费信息

"use client";

import { useState, useEffect } from "react";

/**
 * 光子扣费提示组件
 * 
 * 在聊天界面显示当前扣费信息，帮助用户了解使用成本
 * 
 * @param {Object} props
 * @param {string} props.className - 自定义样式类名
 * @returns {JSX.Element|null}
 */
export function PhotonChargeNotice({ className = "" }) {
  const [chargeInfo, setChargeInfo] = useState(null);
  
  useEffect(() => {
    // 检查是否启用光子扣费
    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_PHOTON_CHARGE === 'true';
    
    if (!isEnabled) {
      return;
    }
    
    // 获取扣费配置
    // 支持三种模式：fixed（固定）、token（按量）、mixed（混合）
    const chargeMode = process.env.NEXT_PUBLIC_BOHRIUM_CHARGE_MODE || 'fixed';
    
    if (chargeMode === 'fixed') {
      const chargePerRequest = parseInt(process.env.NEXT_PUBLIC_PHOTON_CHARGE_PER_MESSAGE || '1');
      setChargeInfo({
        mode: 'fixed',
        amount: chargePerRequest,
        unit: '次'
      });
    } else if (chargeMode === 'token') {
      const chargePerKToken = parseFloat(process.env.NEXT_PUBLIC_PHOTON_CHARGE_PER_1K_TOKEN || '1');
      setChargeInfo({
        mode: 'token',
        amount: chargePerKToken,
        unit: '1000 tokens'
      });
    } else if (chargeMode === 'mixed') {
      // 混合模式：同时显示固定费用和按量费用
      const chargePerRequest = parseInt(process.env.NEXT_PUBLIC_PHOTON_CHARGE_PER_MESSAGE || '1');
      const chargePerKToken = parseFloat(process.env.NEXT_PUBLIC_PHOTON_CHARGE_PER_1K_TOKEN || '1');
      setChargeInfo({
        mode: 'mixed',
        fixedAmount: chargePerRequest,
        tokenAmount: chargePerKToken
      });
    }
  }, []);
  
  // 如果未启用扣费或配置未加载，不显示
  if (!chargeInfo) {
    return null;
  }
  
  return (
    <div className={`
      flex items-center gap-2 px-3 py-2 
      bg-blue-50 dark:bg-blue-900/20 
      border border-blue-200 dark:border-blue-800 
      rounded-lg text-sm
      ${className}
    `}>
      <span className="text-lg">💰</span>
      <div className="flex-1">
        {chargeInfo.mode === 'fixed' && (
          <span className="text-blue-700 dark:text-blue-300">
            每次成功生成图表需要 <strong>{chargeInfo.amount}</strong> 光子
          </span>
        )}
        {chargeInfo.mode === 'token' && (
          <span className="text-blue-700 dark:text-blue-300">
            按使用量计费：<strong>{chargeInfo.amount}</strong> 光子 / {chargeInfo.unit}
          </span>
        )}
        {chargeInfo.mode === 'mixed' && (
          <span className="text-blue-700 dark:text-blue-300">
            混合计费：成功生成 <strong>{chargeInfo.fixedAmount}</strong> 光子 + 
            <strong>{chargeInfo.tokenAmount}</strong> 光子/1000 tokens
          </span>
        )}
      </div>
      <a
        href="https://www.bohrium.com/consume?tab=topUpPhoton&menu=balance"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
      >
        充值
      </a>
    </div>
  );
}

/**
 * 光子余额不足提示组件
 * 
 * 当用户光子余额不足时显示
 * 
 * @param {Object} props
 * @param {() => void} props.onClose - 关闭回调
 * @returns {JSX.Element}
 */
export function PhotonInsufficientNotice({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="text-3xl">⚠️</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">光子余额不足</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              您的光子余额不足，无法完成本次操作。请充值后再试。
            </p>
            <div className="flex gap-2">
              <a
                href="https://www.bohrium.com/consume?tab=topUpPhoton&menu=balance"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
              >
                立即充值
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                稍后
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 光子扣费历史记录组件
 * 
 * 显示最近的扣费记录
 * 
 * @param {Object} props
 * @param {Array} props.records - 扣费记录列表
 * @returns {JSX.Element}
 */
export function PhotonChargeHistory({ records = [] }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        暂无扣费记录
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">扣费记录</h3>
        <a
          href="https://www.bohrium.com/consume?tab=photon&menu=bills"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          查看完整账单
        </a>
      </div>
      
      {records.map((record, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div>
            <div className="text-sm font-medium">{record.description}</div>
            <div className="text-xs text-gray-500">
              {new Date(record.timestamp).toLocaleString('zh-CN')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-red-600">
              -{record.amount} 光子
            </div>
            {record.status === 'success' && (
              <div className="text-xs text-green-600">成功</div>
            )}
            {record.status === 'failed' && (
              <div className="text-xs text-red-600">失败</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
