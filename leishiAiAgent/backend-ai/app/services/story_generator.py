"""
故事生成和音乐混音服务
文件: backend/ai-agent/app/services/story_generator.py 和 music_mixer.py
"""

# ==========================================
# story_generator.py
# ==========================================

import openai
import json
import uuid
from typing import Dict, List
import os

class StoryGenerator:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        openai.api_key = self.api_key
        
        # 故事类型模板
        self.story_templates = {
            "adventure": {
                "themes": ["探险", "寻宝", "冒险旅程"],
                "tone": "exciting",
                "age_suitable": [8, 60]
            },
            "mystery": {
                "themes": ["侦探", "解谜", "悬疑"],
                "tone": "suspenseful",
                "age_suitable": [12, 60]
            },
            "romance": {
                "themes": ["爱情", "友情", "成长"],
                "tone": "emotional",
                "age_suitable": [15, 60]
            },
            "comedy": {
                "themes": ["搞笑", "日常", "轻松"],
                "tone": "lighthearted",
                "age_suitable": [5, 60]
            },
            "educational": {
                "themes": ["学习", "科普", "历史"],
                "tone": "informative",
                "age_suitable": [5, 15]
            }
        }
    
    async def create_story(
        self,
        scene_type: str,
        participants: List[Dict],
        settings: Dict
    ) -> Dict:
        """创建互动故事"""
        
        # 根据参与者年龄选择合适的故事类型
        avg_age = sum(p["age"] for p in participants) / len(participants)
        story_type = self._select_story_type(avg_age, scene_type)
        
        # 生成故事
        prompt = self._build_story_prompt(
            story_type,
            participants,
            settings
        )
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "你是一个专业的互动故事创作者,擅长根据参与者特点创作引人入胜的故事。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.8
        )
        
        story_data = json.loads(response.choices[0].message.content)
        
        # 构造完整故事对象
        story = {
            "id": str(uuid.uuid4()),
            "type": story_type,
            "title": story_data.get("title", "未命名故事"),
            "intro": story_data.get("intro", ""),
            "characters": self._assign_characters(participants, story_data),
            "scenes": [story_data.get("first_scene", {})],
            "options": story_data.get("options", []),
            "current_scene": 0,
            "participants": participants,
            "created_at": None
        }
        
        return story
    
    async def process_action(
        self,
        story_id: str,
        action: str,
        participant_id: str
    ) -> Dict:
        """处理故事互动动作"""
        
        # 这里应该从数据库获取故事状态
        # 简化版本,直接生成下一场景
        
        prompt = f"""
        基于之前的故事情节和参与者的选择,继续创作下一个场景。
        
        参与者选择了: {action}
        
        请创作下一个场景,包含:
        1. 场景描述(150-250字)
        2. 角色反应和对话
        3. 3-4个新的选择选项
        4. 故事进展提示
        
        以JSON格式返回。
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "继续上一个故事场景。"},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.8
        )
        
        next_scene = json.loads(response.choices[0].message.content)
        
        return {
            "story_id": story_id,
            "scene": next_scene,
            "participant_id": participant_id
        }
    
    def _select_story_type(self, avg_age: float, scene: str) -> str:
        """根据年龄和场景选择故事类型"""
        
        if avg_age < 12:
            return "educational" if scene == "car" else "adventure"
        elif avg_age < 18:
            return "mystery" if scene == "ktv" else "adventure"
        else:
            return "mystery" if scene == "ktv" else "romance"
    
    def _build_story_prompt(
        self,
        story_type: str,
        participants: List[Dict],
        settings: Dict
    ) -> str:
        """构建故事生成prompt"""
        
        participant_desc = ", ".join([
            f"{p['name']}({p['age']}岁)" for p in participants
        ])
        
        template = self.story_templates.get(story_type, self.story_templates["adventure"])
        
        return f"""
        创作一个{story_type}类型的互动故事。
        
        参与者: {participant_desc}
        主题范围: {template['themes']}
        故事基调: {template['tone']}
        
        要求:
        1. 故事开头要吸引人,快速进入情节
        2. 为每个参与者分配独特的角色
        3. 提供3-4个不同的选择方向
        4. 语言要符合参与者年龄
        5. 场景描述要生动有画面感
        
        以JSON格式返回:
        {{
            "title": "故事标题",
            "intro": "故事背景介绍(50-100字)",
            "first_scene": {{
                "description": "第一场景描述(150-250字)",
                "characters_state": {{"角色名": "角色状态"}},
                "atmosphere": "场景氛围"
            }},
            "options": [
                {{
                    "id": 1,
                    "text": "选项文本",
                    "hint": "选择提示",
                    "risk_level": "low/medium/high"
                }}
            ]
        }}
        """
    
    def _assign_characters(
        self,
        participants: List[Dict],
        story_data: Dict
    ) -> Dict:
        """为参与者分配角色"""
        
        characters = {}
        suggested_roles = story_data.get("suggested_roles", [])
        
        for i, participant in enumerate(participants):
            role = suggested_roles[i] if i < len(suggested_roles) else {
                "role": "探险者",
                "ability": "通用"
            }
            
            characters[participant["name"]] = {
                "participant_id": participant["id"],
                "role": role.get("role", "参与者"),
                "ability": role.get("ability", "无"),
                "status": "active"
            }
        
        return characters