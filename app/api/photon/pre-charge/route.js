// -*- coding: utf-8 -*-
// 玻尔平台光子预扣费 API 路由
// 用于 mixed 收费模式下，在发送消息前预扣固定费用

// Next.js Route Handler 的最长执行时间（秒）
const maxDuration = 30;

/**
 * POST /api/photon/pre-charge
 * 光子预扣费接口
 * 
 * 在 mixed 收费模式下，用户发送消息前调用此接口预扣固定费用。
 * 如果用户余额不足，返回错误，前端应阻止消息发送。
 * 
 * 请求参数：
 * - 无需参数，固定费用从环境变量 BOHRIUM_CHARGE_PER_REQUEST 获取
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
    // ========== 检查是否启用光子扣费 ==========
    const enablePhotonCharge = process.env.NEXT_PUBLIC_ENABLE_PHOTON_CHARGE === 'true';
    
    if (!enablePhotonCharge) {
      // 未启用光子扣费，直接返回成功（无需扣费）
      return Response.json({
        success: true,
        message: "光子扣费未启用",
        needsCharge: false,
        eventValue: 0
      });
    }
    
    // ========== 检查收费模式 ==========
    const chargeMode = process.env.BOHRIUM_CHARGE_MODE || 'fixed';
    
    if (chargeMode !== 'mixed') {
      // 非 mixed 模式，不需要预扣费
      return Response.json({
        success: true,
        message: `当前为 ${chargeMode} 模式，无需预扣费`,
        needsCharge: false,
        eventValue: 0,
        chargeMode: chargeMode
      });
    }
    
    // ========== 获取固定费用金额 ==========
    const chargePerRequest = parseInt(process.env.BOHRIUM_CHARGE_PER_REQUEST || '1');
    
    if (chargePerRequest <= 0) {
      // 固定费用为 0，无需扣费
      return Response.json({
        success: true,
        message: "固定费用为 0，无需预扣费",
        needsCharge: false,
        eventValue: 0
      });
    }
    
    // ========== 获取认证信息 ==========
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
      
      console.warn("预扣费：未从 Cookie 中获取到用户 AK，使用开发者 AK 进行调试");
    }
    
    // 验证 AK 是否配置
    if (!accessKey) {
      return Response.json(
        { 
          success: false,
          error: "缺少认证信息",
          message: "未获取到用户授权信息，请确保已登录。",
          needsCharge: true
        },
        { status: 401 }
      );
    }
    
    // ========== 获取 SKU ID ==========
    const skuId = process.env.BOHRIUM_SKU_ID;
    if (!skuId) {
      return Response.json(
        { 
          success: false,
          error: "服务器配置错误",
          message: "未配置 BOHRIUM_SKU_ID，请联系开发者。",
          needsCharge: true
        },
        { status: 500 }
      );
    }
    
    // ========== 生成 bizNo ==========
    const bizNo = parseInt(`${Date.now()}${Math.floor(Math.random() * 10000)}`);
    
    // ========== 调用光子扣费 API ==========
    const chargeUrl = "https://openapi.dp.tech/openapi/v1/api/integral/consume";
    
    const requestBody = {
      bizNo: bizNo,
      changeType: 1, // 固定值：扣费类型
      eventValue: chargePerRequest,
      skuId: parseInt(skuId),
      scene: "appCustomizeCharge"
    };
    
    const headers = {
      "accessKey": accessKey,
      "Content-Type": "application/json"
    };
    
    if (clientName) {
      headers["x-app-key"] = clientName;
    }
    
    console.log("发起光子预扣费请求：", {
      url: chargeUrl,
      bizNo: bizNo,
      eventValue: chargePerRequest,
      skuId: skuId,
      chargeMode: chargeMode,
      hasAccessKey: !!accessKey
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
      console.error("解析光子预扣费响应失败：", responseText);
      return Response.json(
        { 
          success: false,
          error: "扣费接口响应格式错误",
          message: "光子扣费接口返回了无效的响应格式",
          needsCharge: true
        },
        { status: 500 }
      );
    }
    
    // 检查扣费是否成功
    if (responseData.code === 0) {
      console.log("光子预扣费成功：", {
        bizNo: bizNo,
        eventValue: chargePerRequest
      });
      
      return Response.json({
        success: true,
        message: "预扣费成功",
        needsCharge: true,
        bizNo: bizNo,
        eventValue: chargePerRequest,
        chargeMode: chargeMode
      });
    } else {
      // 扣费失败
      console.error("光子预扣费失败：", responseData);
      
      // 根据错误码返回友好的错误消息
      let errorMessage = "扣费失败";
      let isInsufficientBalance = false;
      
      if (responseData.code === 401) {
        errorMessage = "用户认证失败，请重新登录";
      } else if (responseData.code === 403 || (responseData.message && responseData.message.includes("余额"))) {
        errorMessage = "光子余额不足，请充值后再试";
        isInsufficientBalance = true;
      } else if (responseData.message) {
        errorMessage = responseData.message;
      }
      
      return Response.json(
        { 
          success: false,
          error: "预扣费失败",
          message: errorMessage,
          code: responseData.code,
          isInsufficientBalance: isInsufficientBalance,
          needsCharge: true,
          chargeMode: chargeMode
        },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error("光子预扣费异常：", error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? error.stack : undefined;
    
    return Response.json(
      {
        success: false,
        error: "内部服务器错误",
        message: errorMessage,
        needsCharge: true,
        ...(process.env.NODE_ENV === 'development' && { details: errorDetails })
      },
      { status: 500 }
    );
  }
}

export { POST, maxDuration };
