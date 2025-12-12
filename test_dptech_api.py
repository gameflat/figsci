#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DP Tech API 测试脚本
测试 API Key 和模型的有效性
"""

import requests
import json
from typing import List, Dict, Any

# 配置
API_KEY = "6380cffbb8b641c682ecd3d2293389af"
BASE_URL = "https://openapi.dp.tech/openapi/v1"

# 需要测试的模型列表
TEST_MODELS = [
    "qwen-plus",
    "qwen-turbo",
    "qwen-max",
    "qwen2-72b-instruct",
    "qwen2-7b-instruct",
    "qwen-long",
    "deepseek-chat",
    "gpt-3.5-turbo",
    "gpt-4",
    "gpt-4-turbo",
    "gpt-4o",
    "gpt-4o-mini",
]


def print_header(text: str):
    """打印标题"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")


def print_section(text: str):
    """打印小节标题"""
    print(f"\n--- {text} ---\n")


def test_model(model_id: str) -> Dict[str, Any]:
    """
    测试单个模型
    
    Args:
        model_id: 模型 ID
        
    Returns:
        测试结果字典
    """
    url = f"{BASE_URL}/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "accessKey": API_KEY,  # DP Tech 使用 accessKey 而不是 Authorization
    }
    
    payload = {
        "model": model_id,
        "messages": [
            {"role": "user", "content": "你好"}
        ],
        "max_tokens": 10,
        "stream": False,
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        result = {
            "model": model_id,
            "status_code": response.status_code,
            "success": response.status_code == 200,
        }
        
        try:
            result["response"] = response.json()
        except:
            result["response"] = {"raw": response.text[:500]}
        
        return result
        
    except Exception as e:
        return {
            "model": model_id,
            "status_code": "ERROR",
            "success": False,
            "error": str(e),
        }


def main():
    """主函数"""
    
    print_header("DP Tech API 测试工具")
    
    print(f"API Key: {API_KEY[:8]}...")
    print(f"Base URL: {BASE_URL}")
    print(f"认证方式: accessKey (DP Tech 自定义头部)")
    
    # 测试所有模型
    print_section("开始测试模型")
    
    results = []
    for i, model in enumerate(TEST_MODELS, 1):
        print(f"[{i}/{len(TEST_MODELS)}] 测试 {model:<25} ... ", end="", flush=True)
        
        result = test_model(model)
        results.append(result)
        
        if result["success"]:
            print("✅ 可用")
        elif result["status_code"] == 403:
            error_msg = result.get("response", {}).get("error", {}).get("message", "")
            print(f"❌ 403 - {error_msg or 'Forbidden'}")
        elif result["status_code"] == 401:
            error_msg = result.get("response", {}).get("error", "")
            print(f"❌ 401 - {error_msg or 'Unauthorized'}")
        elif result["status_code"] == 404:
            print("❌ 404 - 模型不存在")
        elif result["status_code"] == 400:
            error_msg = result.get("response", {}).get("error", {}).get("message", "")
            print(f"❌ 400 - {error_msg or 'Bad Request'}")
        elif result["status_code"] == "ERROR":
            print(f"❌ 网络错误 - {result.get('error', 'Unknown')}")
        else:
            print(f"❌ {result['status_code']} - 未知错误")
    
    # 汇总结果
    print_header("测试结果汇总")
    
    available = [r for r in results if r["success"]]
    need_permission = [r for r in results if r["status_code"] == 403]
    auth_failed = [r for r in results if r["status_code"] == 401]
    not_found = [r for r in results if r["status_code"] == 404]
    other_errors = [r for r in results if not r["success"] and r["status_code"] not in [401, 403, 404]]
    
    # 可用的模型
    if available:
        print_section("✅ 可用的模型 (已有访问权限)")
        for r in available:
            print(f"  • {r['model']}")
            # 显示模型回复
            if "response" in r and "choices" in r["response"]:
                try:
                    content = r["response"]["choices"][0]["message"]["content"]
                    print(f"    回复: {content[:50]}...")
                except:
                    pass
        
        print(f"\n共 {len(available)} 个模型可用")
        
        # 生成配置建议
        print("\n推荐配置 (.env):")
        print("-" * 70)
        models_config = [
            {
                "id": r["model"],
                "label": r["model"],
                "description": f"{r['model']} 模型",
                "isStreaming": True
            }
            for r in available
        ]
        print(f"SYSTEM_MODELS='{json.dumps(models_config, ensure_ascii=False)}'")
        print("-" * 70)
    else:
        print_section("❌ 没有可用的模型")
    
    # 需要申请权限的模型
    if need_permission:
        print_section("⚠️  需要申请访问权限的模型 (403)")
        for r in need_permission:
            error_msg = r.get("response", {}).get("error", {}).get("message", "")
            print(f"  • {r['model']:<30} - {error_msg}")
        
        print(f"\n共 {len(need_permission)} 个模型需要申请权限")
        print("\n请访问以下地址申请模型访问权限:")
        print("  https://bohrium.dp.tech/settings/user")
    
    # 认证失败
    if auth_failed:
        print_section("❌ 认证失败的模型 (401)")
        for r in auth_failed:
            error_msg = r.get("response", {}).get("error", "")
            print(f"  • {r['model']:<30} - {error_msg}")
        
        print("\n⚠️  警告: 检测到认证失败!")
        print("  可能原因:")
        print("  1. API Key 无效或已过期")
        print("  2. API Key 格式不正确")
        print("  3. 认证头部配置错误")
    
    # 模型不存在
    if not_found:
        print_section("❓ 模型不存在 (404)")
        for r in not_found:
            print(f"  • {r['model']}")
        
        print(f"\n共 {len(not_found)} 个模型不存在")
    
    # 其他错误
    if other_errors:
        print_section("⚠️  其他错误")
        for r in other_errors:
            error_msg = r.get("error") or r.get("response", {}).get("error", {}).get("message", "Unknown")
            print(f"  • {r['model']:<30} - [{r['status_code']}] {error_msg}")
    
    # 总结
    print_header("测试完成")
    
    print(f"总计测试: {len(results)} 个模型")
    print(f"  ✅ 可用: {len(available)} 个")
    print(f"  ⚠️  需要权限: {len(need_permission)} 个")
    print(f"  ❌ 认证失败: {len(auth_failed)} 个")
    print(f"  ❓ 不存在: {len(not_found)} 个")
    print(f"  ⚠️  其他错误: {len(other_errors)} 个")
    
    # API Key 状态判断
    print("\n" + "=" * 70)
    if auth_failed and not available:
        print("⚠️  API Key 状态: 无效或已过期")
        print("   建议: 请检查 API Key 是否正确，或在平台上重新生成")
    elif available:
        print("✅ API Key 状态: 有效")
        print("   已有模型访问权限，可以立即使用")
    elif need_permission:
        print("✅ API Key 状态: 有效")
        print("⚠️  但需要申请模型访问权限才能使用")
    else:
        print("❓ API Key 状态: 未知")
        print("   无法确定 API Key 是否有效")
    
    print("=" * 70)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n测试已中断")
    except Exception as e:
        print(f"\n\n测试出错: {e}")
        import traceback
        traceback.print_exc()

