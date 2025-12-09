"""
AI音乐创作服务
文件: backend-ai/app/services/music_composer.py
功能: 为快乐情绪创作音乐(哼唱转歌曲、自动编曲)
"""

import openai
import json
import os
from typing import Dict, List
from datetime import datetime

class MusicComposer:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        openai.api_key = self.api_key
        
        self.music_styles = {
            "pop": {"bpm": 120, "structure": "ABABCB", "mood": "欢快流行"},
            "electronic": {"bpm": 128, "structure": "Intro-Drop-Break-Drop", "mood": "电子律动"},
            "acoustic": {"bpm": 90, "structure": "AABA", "mood": "民谣清新"},
            "rock": {"bpm": 140, "structure": "ABABCB", "mood": "摇滚激情"},
            "jazz": {"bpm": 110, "structure": "AABA", "mood": "爵士即兴"}
        }
    
    async def hum_to_song(
        self,
        audio_data: str,  # base64编码的哼唱音频
        style: str = "pop",
        lyrics_theme: str = None
    ) -> Dict:
        """
        哼唱转完整歌曲
        1. 识别哼唱的旋律
        2. 生成完整编曲
        3. 创作歌词
        4. 合成人声
        """
        
        # Step 1: 使用Whisper转录哼唱
        melody_info = await self._analyze_hum(audio_data)
        
        # Step 2: 生成歌曲结构
        song_structure = await self._create_song_structure(
            melody_info,
            style,
            lyrics_theme
        )
        
        # Step 3: 创作歌词
        lyrics = await self._generate_lyrics(
            song_structure,
            lyrics_theme
        )
        
        # Step 4: 生成编曲方案
        arrangement = await self._create_arrangement(
            melody_info,
            song_structure,
            style
        )
        
        return {
            "id": f"song_{int(datetime.now().timestamp())}",
            "title": song_structure["title"],
            "style": style,
            "structure": song_structure,
            "lyrics": lyrics,
            "arrangement": arrangement,
            "audio_url": f"/storage/audio/songs/song_{int(datetime.now().timestamp())}.mp3",
            "stems": {  # 分轨
                "melody": "/storage/audio/stems/melody.mp3",
                "drums": "/storage/audio/stems/drums.mp3",
                "bass": "/storage/audio/stems/bass.mp3",
                "harmony": "/storage/audio/stems/harmony.mp3"
            },
            "created_at": datetime.now().isoformat()
        }
    
    async def auto_compose(
        self,
        mood: str,
        style: str,
        duration: int = 180
    ) -> Dict:
        """
        自动作曲
        根据情绪和风格自动创作完整歌曲
        """
        
        prompt = f"""
创作一首{style}风格的歌曲。

情绪: {mood}
时长: {duration}秒
风格参数: {json.dumps(self.music_styles.get(style, {}), ensure_ascii=False)}

请设计完整的音乐结构:

1. 歌曲信息:
   - 标题(有创意的)
   - BPM
   - 调性
   - 整体情绪曲线

2. 段落结构:
   {{
     "intro": {{
       "duration": 8,
       "description": "前奏设计",
       "instruments": ["乐器列表"],
       "melody": "旋律描述"
     }},
     "verse": {{
       "duration": 16,
       "description": "主歌设计",
       "chord_progression": "和弦进行",
       "melody_range": "音域范围"
     }},
     "chorus": {{
       "duration": 16,
       "description": "副歌设计",
       "hook": "记忆点设计",
       "energy_level": "能量等级(1-10)"
     }},
     ... 其他段落
   }}

3. 配器方案:
   - 主旋律乐器
   - 和声乐器
   - 节奏组
   - 音效点缀

4. 混音建议:
   - 各轨音量平衡
   - 声像分布
   - 效果器使用

以JSON格式返回完整的创作方案。
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "你是专业的音乐制作人和作曲家。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        composition = json.loads(response.choices[0].message.content)
        
        return {
            "id": f"composition_{int(datetime.now().timestamp())}",
            "title": composition.get("title", "未命名作品"),
            "style": style,
            "mood": mood,
            "composition": composition,
            "audio_url": f"/storage/audio/compositions/{int(datetime.now().timestamp())}.mp3",
            "sheet_music_url": f"/storage/sheets/{int(datetime.now().timestamp())}.pdf"
        }
    
    async def remix_song(
        self,
        original_song_id: str,
        remix_style: str,
        user_preferences: Dict
    ) -> Dict:
        """
        歌曲混音
        对已有歌曲进行个性化混音
        """
        
        # 获取原始歌曲信息
        # original = await get_song(original_song_id)
        
        prompt = f"""
为一首歌曲设计混音方案。

混音风格: {remix_style}
用户偏好: {json.dumps(user_preferences, ensure_ascii=False)}

请设计:
1. 整体混音风格
2. 每个音轨的处理:
   - EQ设置
   - 压缩参数
   - 效果器链
   - 音量自动化
3. 空间感设计:
   - Reverb设置
   - Delay运用
   - 声像分布
4. 创意点:
   - 特殊音效
   - 过渡技巧
   - 惊喜元素

以JSON返回混音方案。
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        remix_plan = json.loads(response.choices[0].message.content)
        
        return {
            "id": f"remix_{original_song_id}_{int(datetime.now().timestamp())}",
            "original_song_id": original_song_id,
            "remix_style": remix_style,
            "remix_plan": remix_plan,
            "audio_url": f"/storage/audio/remixes/{int(datetime.now().timestamp())}.mp3"
        }
    
    async def _analyze_hum(self, audio_data: str) -> Dict:
        """分析哼唱音频"""
        
        # 使用Whisper转录(虽然是哼唱,但可以提取音调信息)
        # 实际应用中需要音乐分析库(如librosa)
        
        return {
            "key": "C Major",
            "bpm": 120,
            "melody_contour": [60, 62, 64, 65, 67],  # MIDI音符
            "rhythm_pattern": [1, 0.5, 0.5, 1, 1],
            "duration": 8
        }
    
    async def _create_song_structure(
        self,
        melody_info: Dict,
        style: str,
        theme: str
    ) -> Dict:
        """创建歌曲结构"""
        
        style_template = self.music_styles.get(style, self.music_styles["pop"])
        
        prompt = f"""
基于哼唱的旋律,设计完整歌曲结构。

旋律信息: {json.dumps(melody_info, ensure_ascii=False)}
风格: {style}
主题: {theme or '自由发挥'}

请设计:
1. 歌曲标题(要有创意和意境)
2. 完整结构(Intro-Verse-Chorus-Bridge-Outro)
3. 每段的情绪和能量
4. 旋律发展策略
5. 和声进行

以JSON返回。
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def _generate_lyrics(
        self,
        song_structure: Dict,
        theme: str
    ) -> Dict:
        """生成歌词"""
        
        prompt = f"""
为歌曲创作歌词。

歌曲标题: {song_structure.get('title', '未命名')}
主题: {theme or '快乐、自由'}
结构: {json.dumps(song_structure, ensure_ascii=False)}

要求:
1. 符合歌曲情绪和能量曲线
2. 有画面感和意境
3. 押韵自然
4. 副歌要有记忆点
5. 适合演唱

以JSON返回:
{{
  "verse1": ["第一句", "第二句", ...],
  "chorus": ["副歌第一句", ...],
  "verse2": [...],
  "bridge": [...],
  "chorus_repeat": [...]
}}
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "你是优秀的作词人,擅长创作有意境的歌词。"
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.8
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def _create_arrangement(
        self,
        melody_info: Dict,
        song_structure: Dict,
        style: str
    ) -> Dict:
        """创建编曲方案"""
        
        prompt = f"""
为歌曲设计完整编曲。

风格: {style}
旋律: {json.dumps(melody_info, ensure_ascii=False)}
结构: {json.dumps(song_structure, ensure_ascii=False)}

请设计:
1. 乐器配置
2. 每段的编曲层次
3. 织体变化
4. 音色选择
5. 效果使用

以JSON返回详细编曲方案。
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)


# ==========================================
# 记忆管理服务
# backend-ai/app/services/memory_manager.py
# ==========================================

class MemoryManager:
    """
    长期记忆管理
    功能: 存储、检索、总结用户的情感历程
    """
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        openai.api_key = self.api_key
    
    async def save_memory(
        self,
        user_id: str,
        memory_type: str,  # 'conversation', 'music', 'podcast', 'diary'
        content: Dict,
        emotion: str
    ) -> Dict:
        """保存记忆"""
        
        # 生成记忆摘要
        summary = await self._generate_summary(memory_type, content)
        
        # 提取关键标签
        tags = await self._extract_tags(content)
        
        memory = {
            "id": f"memory_{user_id}_{int(datetime.now().timestamp())}",
            "user_id": user_id,
            "type": memory_type,
            "summary": summary,
            "content": content,
            "emotion": emotion,
            "tags": tags,
            "created_at": datetime.now().isoformat()
        }
        
        # 保存到数据库
        # await db.memories.insert(memory)
        
        return memory
    
    async def retrieve_memories(
        self,
        user_id: str,
        filters: Dict = None,
        limit: int = 20
    ) -> List[Dict]:
        """检索记忆"""
        
        # 从数据库查询
        # memories = await db.memories.find(user_id, filters, limit)
        
        # 按时间排序
        # memories.sort(key=lambda x: x['created_at'], reverse=True)
        
        return []  # 返回记忆列表
    
    async def generate_memory_summary(
        self,
        user_id: str,
        time_range: str = "week"
    ) -> Dict:
        """
        生成记忆总结
        总结用户一段时间的情感历程
        """
        
        # 获取时间范围内的记忆
        # memories = await self.retrieve_memories(user_id, {"time_range": time_range})
        
        prompt = f"""
总结用户这段时间的情感历程。

时间范围: {time_range}
记忆数量: X条

请生成:
1. 整体情感趋势
2. 主要情绪变化
3. 重要时刻
4. 成长和变化
5. 温暖的鼓励

用温柔、诗意的语言,像朋友般书写。
字数: 200-300字

以JSON返回:
{{
  "title": "这周的声音旅程",
  "summary": "总结文本",
  "emotion_trend": "情感曲线描述",
  "highlights": ["亮点1", "亮点2"],
  "encouragement": "鼓励的话"
}}
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def create_memory_collage(
        self,
        user_id: str,
        memory_ids: List[str]
    ) -> Dict:
        """
        创建记忆拼贴
        将多个记忆组合成一个作品
        """
        
        # 获取记忆内容
        # memories = [await get_memory(mid) for mid in memory_ids]
        
        prompt = f"""
将这些记忆片段组合成一个完整的故事或作品。

记忆类型: [音乐、对话、播客、日记]

请创作:
1. 一个标题
2. 将记忆串联成诗意的叙事
3. 配合合适的背景音乐建议
4. 情感线索

用第一人称"我"书写,像回忆录般温暖。

以JSON返回创作结果。
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.8
        )
        
        collage = json.loads(response.choices[0].message.content)
        
        return {
            "id": f"collage_{user_id}_{int(datetime.now().timestamp())}",
            "title": collage["title"],
            "narrative": collage["narrative"],
            "music_suggestion": collage["music"],
            "memory_ids": memory_ids,
            "created_at": datetime.now().isoformat()
        }
    
    async def _generate_summary(
        self,
        memory_type: str,
        content: Dict
    ) -> str:
        """生成记忆摘要"""
        
        prompt = f"用一句话(20字内)概括这段{memory_type}记忆: {str(content)[:200]}"
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=50
        )
        
        return response.choices[0].message.content
    
    async def _extract_tags(self, content: Dict) -> List[str]:
        """提取标签"""
        
        prompt = f"从内容中提取3-5个关键标签: {str(content)[:300]}"
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5
        )
        
        tags_text = response.choices[0].message.content
        return [tag.strip() for tag in tags_text.split(',')][:5]