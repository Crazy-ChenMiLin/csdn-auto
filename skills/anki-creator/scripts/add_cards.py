#!/usr/bin/env python3
"""
Anki 批量添加卡片脚本
通过 AnkiConnect HTTP API 远程操作 Anki
"""

import json
import urllib.request
import urllib.error
import os
import sys
import argparse
from pathlib import Path

ANKI_URL = "http://47.108.66.230:8765"

def invoke(action, params=None):
    request_json = json.dumps({
        "action": action,
        "version": 6,
        "params": params or {}
    }).encode('utf-8')
    
    try:
        response = urllib.request.urlopen(
            urllib.request.Request(
                ANKI_URL,
                request_json,
                headers={"Content-Type": "application/json"}
            ),
            timeout=30
        )
        return json.loads(response.read())
    except Exception as e:
        return {"error": str(e)}

def read_cards_from_file(file_path):
    """从 JSON 文件读取卡片数据"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def add_cards(cards, deck_name="系统默认", model_name="ai"):
    """批量添加卡片"""
    success_count = 0
    failed_cards = []
    
    for i, card in enumerate(cards, 1):
        params = {
            "note": {
                "deckName": deck_name,
                "modelName": model_name,
                "fields": {
                    "Front": card["front"],
                    "Back": card["back"],
                    "Example": card.get("example", ""),
                    "Extra": card.get("extra", ""),
                    "Source": card.get("source", "")
                },
                "tags": card.get("tags", ["默认"])
            }
        }
        
        result = invoke("addNote", params)
        
        if result.get("error"):
            failed_cards.append((i, card["front"], result["error"]))
            print(f"❌ 卡片 {i}/{len(cards)} 失败: {card['front'][:30]}...")
            print(f"   错误: {result['error']}")
        else:
            success_count += 1
            print(f"✅ 卡片 {i}/{len(cards)} 成功: {card['front'][:35]}...")
    
    return success_count, failed_cards

def delete_cards_by_tags(tags):
    """通过标签查找并删除卡片"""
    tag_query = " ".join(f"tag:{tag}" for tag in tags)
    find_result = invoke("findNotes", {"query": tag_query})
    
    if find_result.get("error"):
        print(f"查找卡片失败: {find_result['error']}")
        return []
    
    note_ids = find_result.get("result", [])
    if note_ids:
        delete_result = invoke("deleteNotes", {"notes": note_ids})
        if delete_result.get("error"):
            print(f"删除卡片失败: {delete_result['error']}")
            return []
    
    return note_ids

def create_reference_dir(title):
    """创建参考目录"""
    # 规范化标题为文件名格式
    safe_title = title.replace(" ", "_")
    safe_title = ''.join([c if c.isalnum() or c in ['_', '-'] else '' for c in safe_title])
    reference_dir = Path(f"/home/node/.openclaw/workspace/skills/anki-creator/references/{safe_title}")
    reference_dir.mkdir(parents=True, exist_ok=True)
    return reference_dir

def write_cards_to_file(reference_dir, cards):
    """写入卡片数据到文件"""
    cards_file = reference_dir / "cards_data.json"
    with open(cards_file, 'w', encoding='utf-8') as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)
    return str(cards_file)

def main():
    # 解析命令行参数
    parser = argparse.ArgumentParser(description="Anki 批量制卡工具")
    parser.add_argument("--reference-dir", help="参考目录名称（可选，默认使用默认目录）")
    parser.add_argument("--cards-file", help="卡片数据文件路径（可选，默认读取默认目录的 cards_data.json）")
    parser.add_argument("--no-delete", action="store_true", help="不删除旧卡片（直接添加新卡片）")
    args = parser.parse_args()
    
    # 确定卡片数据文件
    if args.cards_file:
        cards_file = args.cards_file
    elif args.reference_dir:
        reference_dir = Path(f"/home/node/.openclaw/workspace/skills/anki-creator/references/{args.reference_dir}")
        # 自动创建目录
        reference_dir.mkdir(parents=True, exist_ok=True)
        cards_file = reference_dir / "cards_data.json"
        # 检查目录下是否有卡片文件
        if not os.path.exists(cards_file):
            print(f"错误: {cards_file} 不存在，请先创建卡片数据文件")
            # 可选：创建示例卡片文件
            sample_data = [
                {
                    "front": "请在此处添加您的问题",
                    "back": "请在此处添加答案",
                    "example": "此处可以添加具体示例",
                    "extra": "此处可以添加补充说明",
                    "source": "此处可以添加来源信息",
                    "tags": ["待整理"]
                }
            ]
            with open(cards_file, 'w', encoding='utf-8') as f:
                json.dump(sample_data, f, ensure_ascii=False, indent=2)
            print(f"已创建示例卡片文件: {cards_file}")
            sys.exit(1)
    else:
        # 交互式询问是否创建新目录
        print("=== Anki 批量制卡工具 ===")
        choice = input("是否要创建新的参考目录？(y/N): ").strip().lower()
        
        if choice == 'y' or choice == 'yes':
            # 获取目录名称
            dir_name = input("请输入参考目录名称（或留空自动生成）: ").strip()
            
            if not dir_name:
                # 自动生成目录名（使用时间戳）
                import time
                dir_name = f"新内容_{time.strftime('%Y%m%d_%H%M%S')}"
                print(f"自动生成目录名: {dir_name}")
            
            # 创建目录
            reference_dir = Path(f"/home/node/.openclaw/workspace/skills/anki-creator/references/{dir_name}")
            reference_dir.mkdir(parents=True, exist_ok=True)
            
            # 检查目录下是否有卡片文件
            cards_file = reference_dir / "cards_data.json"
            if not os.path.exists(cards_file):
                print(f"错误: {cards_file} 不存在，请先创建卡片数据文件")
                # 可选：创建示例卡片文件
                sample_data = [
                    {
                        "front": "请在此处添加您的问题",
                        "back": "请在此处添加答案",
                        "example": "此处可以添加具体示例",
                        "extra": "此处可以添加补充说明",
                        "source": "此处可以添加来源信息",
                        "tags": ["待整理"]
                    }
                ]
                with open(cards_file, 'w', encoding='utf-8') as f:
                    json.dump(sample_data, f, ensure_ascii=False, indent=2)
                print(f"已创建示例卡片文件: {cards_file}")
                sys.exit(1)
        else:
            # 使用默认目录
            print("使用默认参考目录...")
            cards_file = "/home/node/.openclaw/workspace/skills/anki-creator/references/cards_data.json"
    
    # 检查文件是否存在
    if not os.path.exists(cards_file):
        print(f"错误: 文件 {cards_file} 不存在")
        sys.exit(1)
    
    # 读取卡片数据
    cards = read_cards_from_file(cards_file)
    
    # 先删除旧卡片（如果不使用 --no-delete 选项）
    if not args.no_delete:
        print("1. 查找并删除旧卡片...")
        all_tags = set()
        for card in cards:
            for tag in card.get("tags", []):
                all_tags.add(tag)
        
        if all_tags:
            note_ids = delete_cards_by_tags(list(all_tags))
            if note_ids:
                print(f"   找到并删除 {len(note_ids)} 张卡片")
            else:
                print("   没有找到旧卡片")
        else:
            print("   卡片无标签，跳过删除操作")
    else:
        print("1. 跳过删除旧卡片（--no-delete 选项已启用）")
    
    # 批量添加卡片
    print("\n2. 批量添加新卡片...")
    success_count, failed_cards = add_cards(cards)
    
    # 输出结果
    print(f"\n{'='*50}")
    print(f"添加完成: {success_count}/{len(cards)} 张卡片成功")
    if failed_cards:
        print(f"失败: {len(failed_cards)} 张卡片")
        for i, front, err in failed_cards:
            print(f"   卡片 {i}: {err}")
    
    # 云同步
    print("\n3. 执行云同步...")
    sync_result = invoke("sync")
    if sync_result.get("error"):
        print(f"同步失败: {sync_result['error']}")
    else:
        print("同步成功")

if __name__ == "__main__":
    main()
