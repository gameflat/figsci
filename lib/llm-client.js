// -*- coding: utf-8 -*-
/**
 * LLM 客户端工具函数
 * 
 * 提供与 LLM 提供商 API 交互的工具函数，主要用于获取可用模型列表。
 */

/**
 * 根据 Base URL 判断提供商类型
 * 
 * @param {string} baseUrl - API 基础 URL
 * @returns {'openai' | 'anthropic'} 提供商类型
 */
function deriveProviderType(baseUrl) {
  if (!baseUrl) {
    // 默认使用 OpenAI 兼容协议
    return 'openai';
  }
  
  try {
    const hostname = new URL(baseUrl).hostname.toLowerCase();
    
    // Anthropic API
    if (hostname.includes('anthropic') || hostname.includes('claude')) {
      return 'anthropic';
    }
    
    // 其他情况默认使用 OpenAI 兼容协议
    // 包括：OpenAI、OpenRouter、DeepSeek 等
    return 'openai';
  } catch {
    // URL 解析失败，默认使用 OpenAI 兼容协议
    return 'openai';
  }
}

/**
 * 从指定的 LLM 提供商获取可用模型列表
 * 
 * 参考实现，支持多种响应格式：
 * - OpenAI 标准格式: { data: [{ id: "...", ... }, ...] }
 * - 某些兼容 API: { models: [{ id: "...", ... }, ...] }
 * - 直接数组: [{ id: "...", ... }, ...]
 * - 字符串数组: ["model-1", "model-2", ...]
 * 
 * @param {'openai' | 'anthropic'} type - 提供商类型
 * @param {string} baseUrl - API 基础 URL
 * @param {string} apiKey - API 密钥
 * @returns {Promise<Array<{id: string, name: string}>>} 模型列表
 * @throws {Error} 当 API 调用失败时抛出错误
 */
export async function fetchModels(type, baseUrl, apiKey) {
  if (!baseUrl || !apiKey) {
    throw new Error('Base URL 和 API Key 不能为空');
  }

  // 规范化 Base URL（移除末尾斜杠）
  const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, '');
  const modelsUrl = `${normalizedBaseUrl}/models`;

  // 根据提供商类型设置请求头
  const headers = {};
  if (type === 'openai') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (type === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else {
    throw new Error(`不支持的提供商类型: ${type}`);
  }

  // 发送请求获取模型列表
  const response = await fetch(modelsUrl, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`获取模型列表失败: ${response.status} ${response.statusText}. ${errorText}`);
  }

  const data = await response.json();

  // 灵活解析多种响应格式
  let modelsArray = null;
  
  // 格式 1: { data: [...] }
  if (Array.isArray(data?.data)) {
    modelsArray = data.data;
  }
  // 格式 2: { models: [...] }
  else if (Array.isArray(data?.models)) {
    modelsArray = data.models;
  }
  // 格式 3: 直接数组
  else if (Array.isArray(data)) {
    modelsArray = data;
  }

  if (!modelsArray) {
    throw new Error('无法解析模型列表响应格式：响应中未找到模型数组');
  }

  // 映射模型数据，支持多种字段名
  // 支持：id, name, model, slug
  // 也支持字符串类型的模型（直接返回字符串数组的情况）
  const mappedModels = modelsArray
    .map((model) => {
      // 如果模型是字符串，直接使用
      if (typeof model === 'string') {
        return {
          id: model,
          name: model,
        };
      }
      
      // 如果是对象，尝试多种字段名
      const id = model.id || model.name || model.model || model.slug;
      const name = model.name || model.id || model.model || model.slug;
      
      return {
        id,
        name,
      };
    })
    // 过滤掉没有 id 的模型
    .filter((m) => m.id);

  return mappedModels;
}

/**
 * 根据 Base URL 自动判断提供商类型并获取模型列表
 * 
 * @param {string} baseUrl - API 基础 URL
 * @param {string} apiKey - API 密钥
 * @returns {Promise<Array<{id: string, name: string}>>} 模型列表
 */
export async function fetchModelsAuto(baseUrl, apiKey) {
  const type = deriveProviderType(baseUrl);
  return await fetchModels(type, baseUrl, apiKey);
}

/**
 * 测试配置连接（通过获取模型列表来验证）
 * 
 * @param {Object} config - 提供商配置
 * @property {'openai' | 'anthropic'} config.type - 提供商类型
 * @property {string} config.baseUrl - API 基础 URL
 * @property {string} config.apiKey - API 密钥
 * @returns {Promise<Object>} 测试结果
 * @property {boolean} success - 是否成功
 * @property {string} message - 结果消息
 * @property {Array} [models] - 前 5 个模型（预览用）
 */
export async function testConnection(config) {
  const { type, baseUrl, apiKey } = config;

  try {
    // 通过获取模型列表来测试连接
    const models = await fetchModels(type, baseUrl, apiKey);

    if (models && models.length > 0) {
      return {
        success: true,
        message: `连接成功，找到 ${models.length} 个可用模型`,
        models: models.slice(0, 5), // 返回前 5 个模型用于预览
      };
    } else {
      return {
        success: false,
        message: '连接成功但未找到可用模型',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `连接失败: ${error.message}`,
    };
  }
}
