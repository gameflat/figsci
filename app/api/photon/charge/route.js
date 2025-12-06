// -*- coding: utf-8 -*-
// 玻尔平台光子扣费 API 路由
// 根据玻尔平台开发者文档实现：https://dptechnology.feishu.cn/wiki/LQKKwMet7i70XNk3TcjcwH8jnJi

// Next.js Route Handler 的最长执行时间（秒）
const maxDuration = 30;

/**
 * POST /api/photon/charge
 * 光子扣费接口
 * 
 * 调用玻尔平台的光子扣费 API，向用户收取光子费用
 * 
 * 请求参数：
 * - eventValue: 扣费数额（必需）
 * - scene: 扣费场景，默认 "appCustomizeCharge"（可选）
 * - bizNo: 请求唯一 ID，如不提供则自动生成（可选）
 * 
 * 认证方式：
 * - 优先从 Cookie 中获取用户 AK (appAccessKey)
 * - 如果 Cookie 中没有，则使用开发者 AK（仅用于开发调试）
 * 
 * @param {Request} req - Next.js 请求对象
 * @returns {Promise<Response>} 返回 JSON 响应
 */
async function POST(req) {
  try {
    // ========== 解析请求参数 ==========
    const { eventValue, scene, bizNo } = await req.json();
    
    // 验证必需参数
    if (!eventValue || typeof eventValue !== 'number') {
      return Response.json(
        { error: "缺少必需参数 eventValue，或类型错误（必须为数字）" },
        { status: 400 }
      );
    }
    
    if (eventValue <= 0) {
      return Response.json(
        { error: "扣费数额必须大于 0" },
        { status: 400 }
      );
    }
    
    // ========== 获取认证信息 ==========
    // 优先从 Cookie 中获取用户 AK（用于生产环境）
    const cookies = req.headers.get('cookie');
    let accessKey = null;
    let clientName = null;
    
    if (cookies) {
      // 解析 Cookie
      const cookieMap = Object.fromEntries(
        cookies.split('; ').map(c => {
          const [key, ...v] = c.split('=');
          return [key, v.join('=')];
        })
      );
      
      accessKey = cookieMap['appAccessKey'];
      clientName = cookieMap['clientName'];
    }
    
    // 如果 Cookie 中没有 AK，使用开发者 AK（仅用于开发调试）
    if (!accessKey) {
      accessKey = process.env.BOHRIUM_DEV_ACCESS_KEY;
      clientName = process.env.BOHRIUM_CLIENT_NAME;
      
      console.warn("未从 Cookie 中获取到用户 AK，使用开发者 AK 进行调试");
    }
    
    // 验证 AK 是否配置
    if (!accessKey) {
      return Response.json(
        { 
          error: "缺少认证信息",
          message: "未获取到用户授权信息，请确保已开启 OAuth 能力并获取用户授权。开发调试阶段可配置 BOHRIUM_DEV_ACCESS_KEY 环境变量。"
        },
        { status: 401 }
      );
    }
    
    // ========== 获取 SKU ID ==========
    const skuId = process.env.BOHRIUM_SKU_ID;
    if (!skuId) {
      return Response.json(
        { 
          error: "服务器配置错误",
          message: "未配置 BOHRIUM_SKU_ID，请联系开发者配置后再试。"
        },
        { status: 500 }
      );
    }
    
    // ========== 生成 bizNo ==========
    // 如果未提供 bizNo，自动生成：时间戳 + 随机数
    const finalBizNo = bizNo || parseInt(`${Date.now()}${Math.floor(Math.random() * 10000)}`);
    
    // ========== 调用光子扣费 API ==========
    const chargeUrl = "https://openapi.dp.tech/openapi/v1/api/integral/consume";
    
    const requestBody = {
      bizNo: finalBizNo,
      changeType: 1, // 固定值：扣费类型
      eventValue: eventValue,
      skuId: parseInt(skuId),
      scene: scene || "appCustomizeCharge"
    };
    
    const headers = {
      "accessKey": accessKey,
      "Content-Type": "application/json"
    };
    
    // 如果有 clientName，添加到 header
    if (clientName) {
      headers["x-app-key"] = clientName;
    }
    
    console.log("发起光子扣费请求：", {
      url: chargeUrl,
      bizNo: finalBizNo,
      eventValue: eventValue,
      skuId: skuId,
      scene: scene || "appCustomizeCharge",
      hasAccessKey: !!accessKey,
      hasClientName: !!clientName
    });
    
    const response = await fetch(chargeUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    // ========== 处理响应 ==========
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error("解析光子扣费响应失败：", responseText);
      return Response.json(
        { 
          error: "扣费接口响应格式错误",
          message: "光子扣费接口返回了无效的响应格式",
          details: process.env.NODE_ENV === 'development' ? responseText : undefined
        },
        { status: 500 }
      );
    }
    
    // 检查扣费是否成功
    if (responseData.code === 0) {
      console.log("光子扣费成功：", {
        bizNo: finalBizNo,
        eventValue: eventValue
      });
      
      return Response.json({
        success: true,
        message: "扣费成功",
        bizNo: finalBizNo,
        eventValue: eventValue,
        data: responseData.data
      });
    } else {
      // 扣费失败
      console.error("光子扣费失败：", responseData);
      
      // 根据错误码返回友好的错误消息
      let errorMessage = "扣费失败";
      
      if (responseData.code === 401) {
        errorMessage = "用户认证失败，请重新授权";
      } else if (responseData.code === 403) {
        errorMessage = "用户光子余额不足，请充值后再试";
      } else if (responseData.message) {
        errorMessage = responseData.message;
      }
      
      return Response.json(
        { 
          error: "扣费失败",
          message: errorMessage,
          code: responseData.code,
          details: process.env.NODE_ENV === 'development' ? responseData : undefined
        },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error("光子扣费异常：", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? error.stack : undefined;
    
    return Response.json(
      {
        error: "内部服务器错误",
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { details: errorDetails })
      },
      { status: 500 }
    );
  }
}

export { POST, maxDuration };
