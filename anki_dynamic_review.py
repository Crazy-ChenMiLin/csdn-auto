#!/usr/bin/env python3
"""
Anki 动态复习调整脚本
根据当前待复习数量，自动调整每日复习上限
"""

import json
import urllib.request

ANKI_URL = "http://47.108.66.230:8765"

def invoke(action, params=None):
    request_json = json.dumps({"action": action, "version": 6, "params": params or {}}).encode("utf-8")
    try:
        response = urllib.request.urlopen(
            urllib.request.Request(ANKI_URL, request_json, headers={"Content-Type": "application/json"}),
            timeout=30
        )
        return json.loads(response.read())
    except Exception as e:
        return {"error": str(e)}

def get_all_deck_stats():
    """获取所有牌组的统计信息"""
    decks = invoke("deckNames")
    if decks.get("error"):
        return {}
    
    deck_names = decks.get("result", [])
    stats = invoke("getDeckStats", {"decks": deck_names})
    return stats.get("result", {})

def calculate_review_limit(total_due):
    """
    根据待复习数量动态计算每日复习上限
    策略：
    - 0-50张：不限制（全部复习）
    - 51-100张：限制80张（避免疲劳）
    - 101-200张：限制100张
    - 201-500张：限制120张
    - 500+张：限制150张（避免压力过大）
    """
    if total_due <= 50:
        return 9999  # 不限制
    elif total_due <= 100:
        return 80
    elif total_due <= 200:
        return 100
    elif total_due <= 500:
        return 120
    else:
        return 150

def calculate_new_card_limit(total_due, deck_name):
    """
    根据复习压力动态调整新卡片上限
    策略：
    - 待复习 > 100：不学新卡片
    - 待复习 50-100：每天5张新卡片
    - 待复习 < 50：每天10张新卡片
    """
    if total_due > 100:
        return 0
    elif total_due > 50:
        return 5
    else:
        return 10

def update_deck_config(deck_name, review_limit, new_limit):
    """更新牌组配置"""
    # 获取牌组配置
    config_result = invoke("getDeckConfig", {"deck": deck_name})
    if config_result.get("error"):
        return False
    
    config = config_result.get("result", {})
    config_id = config.get("id")
    
    if not config_id:
        return False
    
    # 更新配置
    config["rev"]["perDay"] = review_limit
    config["new"]["perDay"] = new_limit
    
    # 保存配置（只需要 config 参数，不需要 deck）
    update_result = invoke("saveDeckConfig", {"config": config})
    return not update_result.get("error")

def main():
    print("=" * 60)
    print("📊 Anki 动态复习调整")
    print("=" * 60)
    
    # 获取所有牌组统计
    stats = get_all_deck_stats()
    if not stats:
        print("❌ 无法获取牌组统计")
        return
    
    # 计算总待复习数量
    total_review = 0
    total_learn = 0
    deck_stats = []
    
    for deck_id, info in stats.items():
        name = info.get("name", "")
        review_count = info.get("review_count", 0)
        learn_count = info.get("learn_count", 0)
        new_count = info.get("new_count", 0)
        
        # 只统计主要牌组（排除子牌组，避免重复计算）
        if "::" not in name:
            total_review += review_count
            total_learn += learn_count
        
        deck_stats.append({
            "name": name,
            "review": review_count,
            "learn": learn_count,
            "new": new_count
        })
    
    total_due = total_review + total_learn
    print(f"\n📈 总计待复习: {total_due} 张 (复习:{total_review} + 学习中:{total_learn})")
    
    # 计算动态调整值
    review_limit = calculate_review_limit(total_due)
    new_limit = calculate_new_card_limit(total_due, "all")
    
    print(f"\n⚙️  动态调整结果:")
    if review_limit >= 9999:
        print(f"   复习上限: 不限制 (待复习较少)")
    else:
        print(f"   复习上限: {review_limit} 张/天")
    print(f"   新卡片上限: {new_limit} 张/天")
    
    # 显示各牌组详情
    print(f"\n📋 各牌组详情:")
    for ds in deck_stats:
        if ds["review"] > 0 or ds["learn"] > 0 or ds["new"] > 0:
            print(f"   {ds['name']}: 复习{ds['review']} + 学习中{ds['learn']} + 新{ds['new']}")
    
    # 更新主要牌组配置
    main_decks = ["百月", "算法", "数据库", "英语"]
    print(f"\n🔄 正在更新牌组配置...")
    
    for deck in main_decks:
        if update_deck_config(deck, review_limit, new_limit):
            print(f"   ✅ {deck}: 复习上限={review_limit}, 新卡片={new_limit}")
        else:
            print(f"   ⚠️  {deck}: 更新失败或不存在")
    
    print(f"\n{'=' * 60}")
    if total_due > 100:
        print(f"💡 今天复习压力较大({total_due}张)，已适当降低上限，避免疲劳")
    elif total_due > 50:
        print(f"💡 今天复习量适中({total_due}张)，保持正常节奏")
    else:
        print(f"✅ 今天复习量不多({total_due}张)，可以多学新卡片")

if __name__ == "__main__":
    main()
