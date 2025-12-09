"""
声音剧场 - 播客/电台生成服务
文件: backend-ai/app/services/podcast_generator.py
功能: 为平静情绪生成播客、电台、有声书内容
"""

import openai
import json
import os
from typing import Dict, List
from datetime import datetime

class PodcastGenerator:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        openai.api_key = self.api_key
        
        # 内容类型模板
        self.content_types = {
            "history": {
                "name": "历史时刻",
                "description": "重温历史,感悟人生",
                "topics": ["古代智慧", "历史人物", "文明演变", "战争与和平"]
            },
            "culture": {
                "name": "人文漫谈",
                "description": "艺术、文学、哲学的诗意对话",
                "topics": ["诗歌赏析", "电影艺术", "哲学思考", "文化符号"]
            },
            "science": {
                "name": "科学之声",
                "description": "用诗意解读科学之美",
                "topics": ["宇宙奥秘", "生命起源", "物理之美", "数学之美"]
            },
            "story": {
                "name": "深夜故事",
                "description": "温暖治愈的睡前故事",
                "topics": ["人生故事", "城市传说", "温情瞬间", "哲理寓言"]
            },
            "music": {
                "name": "音乐电台",
                "description": "音乐背后的故事",
                "topics": ["经典歌曲", "音乐家", "音乐流派", "创作故事"]
            }
        }
    
    async def generate_podcast_episode(
        self,
        content_type: str,
        duration: int = 600,  # 10分钟
        user_interests: List[str] = None
    ) -> Dict:
        """
        生成播客节目
        """
        
        content_template = self.content_types.get(
            content_type,
            self.content_types["story"]
        )
        
        # 选择话题
        topic = await self._select_topic(content_type, user_interests)
        
        # 生成节目脚本
        script = await self._generate_script(
            content_type,
            topic,
            duration
        )
        
        # 生成音频(多声部)
        audio_segments = await self._generate_audio_segments(script)
        
        return {
            "id": f"podcast_{content_type}_{int(datetime.now().timestamp())}",
            "title": script["title"],
            "description": script["description"],
            "content_type": content_template["name"],
            "duration": duration,
            "script": script,
            "audio_segments": audio_segments,
            "full_audio_url": f"/storage/audio/podcast/{content_type}_{int(datetime.now().timestamp())}.mp3",
            "transcript": script["full_text"],
            "tags": script["tags"],
            "created_at": datetime.now().isoformat()
        }
    
    async def generate_radio_show(
        self,
        theme: str,
        duration: int = 1800  # 30分钟
    ) -> Dict:
        """
        生成电台节目
        """
        
        prompt = f"""
创作一期{duration//60}分钟的深夜电台节目,主题: {theme}

节目结构:
1. 开场白(1-2分钟): 温暖的问候,引入主题
2. 主要内容(20-25分钟):
   - 3-4个相关话题或故事
   - 每个话题之间有音乐过渡
3. 互动环节(3-5分钟): 读听众来信(虚构但真实)
4. 结束语(2分钟): 温暖道别,留下思考

语言风格:
- 第一人称"我"和第二人称"你"交替
- 像深夜知己般倾诉
- 适当留白和停顿
- 用"(音乐)"标注音乐插入点
- 语速标记: (慢速)(常速)(停顿)

音乐选择:
- 开场: 温暖的爵士乐
- 过渡: 轻柔的钢琴曲
- 结尾: 治愈系吉他

示例片段:
"午夜好,我是你的声音朋友...(停顿)
窗外是不是又下雨了?这样的夜晚,
适合聊聊那些藏在心里的故事...(音乐淡入)"

请生成完整的节目脚本,以JSON格式返回:
{{
  "title": "节目标题",
  "opening": "开场白",
  "segments": [
    {{
      "type": "content/music/interaction",
      "text": "内容",
      "duration": 时长(秒)
    }}
  ],
  "closing": "结束语",
  "music_list": ["音乐1", "音乐2"],
  "emotional_arc": "情绪曲线描述"
}}
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "你是资深的深夜电台主持人,声音温暖而富有磁性。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.8
        )
        
        script = json.loads(response.choices[0].message.content)
        
        # 生成主持人音频
        audio_segments = await self._generate_radio_audio(script)
        
        return {
            "id": f"radio_{theme}_{int(datetime.now().timestamp())}",
            "title": script["title"],
            "theme": theme,
            "duration": duration,
            "script": script,
            "audio_url": f"/storage/audio/radio/{theme}_{int(datetime.now().timestamp())}.mp3",
            "segments": audio_segments,
            "music_list": script.get("music_list", [])
        }
    
    async def generate_audiobook_chapter(
        self,
        book_genre: str,
        chapter_number: int,
        previous_summary: str = None
    ) -> Dict:
        """
        生成有声书章节
        """
        
        genres = {
            "philosophy": "哲学随笔",
            "fiction": "文学小说",
            "biography": "人物传记",
            "essay": "散文诗集"
        }
        
        prompt = f"""
创作一个{genres.get(book_genre, '故事')}的第{chapter_number}章。

{f'前情提要: {previous_summary}' if previous_summary else '这是第一章'}

要求:
1. 章节长度: 2000-3000字
2. 语言: 优美、有画面感、适合朗读
3. 节奏: 缓急有致,适合倾听
4. 结构: 
   - 开头: 引人入胜
   - 中段: 情节/思想展开
   - 结尾: 留有余韵
5. 用"(停顿)"标注自然停顿点
6. 适合成人深度阅读

风格参考: 余华、莫言、三毛的叙事风格

生成章节内容和摘要。
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "你是优秀的文学创作者和朗读者。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.8,
            max_tokens=4000
        )
        
        chapter_content = response.choices[0].message.content
        
        # 生成朗读音频
        audio = await self._generate_audiobook_audio(chapter_content)
        
        # 生成章节摘要
        summary = await self._generate_chapter_summary(chapter_content)
        
        return {
            "chapter_number": chapter_number,
            "genre": book_genre,
            "content": chapter_content,
            "summary": summary,
            "audio_url": audio["url"],
            "duration": audio["duration"],
            "word_count": len(chapter_content)
        }
    
    async def _select_topic(
        self,
        content_type: str,
        user_interests: List[str] = None
    ) -> str:
        """智能选择话题"""
        
        template = self.content_types.get(content_type)
        available_topics = template["topics"]
        
        if user_interests:
            # 根据用户兴趣推荐
            prompt = f"""
            可选话题: {available_topics}
            用户兴趣: {user_interests}
            
            推荐最合适的话题,并说明理由。
            """
            
            response = await openai.ChatCompletion.acreate(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=100
            )
            
            return response.choices[0].message.content
        else:
            # 随机选择
            import random
            return random.choice(available_topics)
    
    async def _generate_script(
        self,
        content_type: str,
        topic: str,
        duration: int
    ) -> Dict:
        """生成播客脚本"""
        
        word_count = duration * 2.5  # 假设每秒2.5个字
        
        prompt = f"""
创作一期播客节目脚本。

类型: {content_type}
话题: {topic}
时长: {duration//60}分钟
字数: 约{int(word_count)}字

脚本结构:
1. 标题: 吸引人的标题
2. 引言(100字): 开场白
3. 主体(核心内容):
   - 分3-4个小节
   - 每节有小标题
   - 内容深入浅出
   - 包含故事、例子、思考
4. 结语(100字): 总结和感悟

语言要求:
- 口语化,像面对面聊天
- 用"你"和"我"拉近距离
- 适当提问,引发思考
- 避免说教,多用故事
- 标注停顿点: (停顿)

示例开头:
"嗨,今天想和你聊聊...(停顿)
你有没有想过,为什么..."

请以JSON格式返回:
{{
  "title": "标题",
  "description": "简介",
  "intro": "引言",
  "sections": [
    {{
      "subtitle": "小节标题",
      "content": "内容",
      "duration": 预估时长
    }}
  ],
  "outro": "结语",
  "full_text": "完整文本",
  "tags": ["标签1", "标签2"],
  "key_points": ["要点1", "要点2"]
}}
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "你是专业的播客主播,善于用声音讲故事。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=3000
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def _generate_audio_segments(
        self,
        script: Dict
    ) -> List[Dict]:
        """生成音频片段"""
        
        segments = []
        
        # 引言
        intro_audio = await self._text_to_speech(
            script["intro"],
            voice="alloy",
            speed=0.95
        )
        segments.append({
            "type": "intro",
            "text": script["intro"],
            "audio_url": intro_audio["url"],
            "duration": intro_audio["duration"]
        })
        
        # 各小节
        for idx, section in enumerate(script["sections"]):
            section_audio = await self._text_to_speech(
                section["content"],
                voice="alloy",
                speed=0.95
            )
            segments.append({
                "type": "section",
                "index": idx + 1,
                "subtitle": section["subtitle"],
                "text": section["content"],
                "audio_url": section_audio["url"],
                "duration": section_audio["duration"]
            })
        
        # 结语
        outro_audio = await self._text_to_speech(
            script["outro"],
            voice="alloy",
            speed=0.9
        )
        segments.append({
            "type": "outro",
            "text": script["outro"],
            "audio_url": outro_audio["url"],
            "duration": outro_audio["duration"]
        })
        
        return segments
    
    async def _generate_radio_audio(
        self,
        script: Dict
    ) -> List[Dict]:
        """生成电台音频"""
        
        audio_segments = []
        
        # 开场
        opening_audio = await self._text_to_speech(
            script["opening"],
            voice="onyx",  # 更有磁性的声音
            speed=0.9
        )
        audio_segments.append({
            "type": "opening",
            "text": script["opening"],
            "audio_url": opening_audio["url"]
        })
        
        # 各个片段
        for segment in script["segments"]:
            if segment["type"] == "music":
                audio_segments.append({
                    "type": "music",
                    "name": segment["text"],
                    "duration": segment["duration"]
                })
            else:
                seg_audio = await self._text_to_speech(
                    segment["text"],
                    voice="onyx",
                    speed=0.9
                )
                audio_segments.append({
                    "type": segment["type"],
                    "text": segment["text"],
                    "audio_url": seg_audio["url"]
                })
        
        # 结束
        closing_audio = await self._text_to_speech(
            script["closing"],
            voice="onyx",
            speed=0.85
        )
        audio_segments.append({
            "type": "closing",
            "text": script["closing"],
            "audio_url": closing_audio["url"]
        })
        
        return audio_segments
    
    async def _generate_audiobook_audio(
        self,
        content: str
    ) -> Dict:
        """生成有声书音频"""
        
        # 分段处理长文本
        max_chunk = 4000  # OpenAI TTS限制
        chunks = [content[i:i+max_chunk] for i in range(0, len(content), max_chunk)]
        
        audio_urls = []
        total_duration = 0
        
        for chunk in chunks:
            audio = await self._text_to_speech(
                chunk,
                voice="nova",  # 适合朗读的声音
                speed=0.9
            )
            audio_urls.append(audio["url"])
            total_duration += audio["duration"]
        
        # 实际应用中需要合并音频文件
        return {
            "url": f"/storage/audio/audiobook/{int(datetime.now().timestamp())}.mp3",
            "duration": total_duration,
            "segments": audio_urls
        }
    
    async def _text_to_speech(
        self,
        text: str,
        voice: str = "alloy",
        speed: float = 1.0
    ) -> Dict:
        """文本转语音"""
        
        try:
            response = await openai.Audio.acreate(
                model="tts-1-hd",
                input=text,
                voice=voice,
                speed=speed
            )
            
            filename = f"tts_{int(datetime.now().timestamp())}_{hash(text)}.mp3"
            # 保存音频...
            
            return {
                "url": f"/storage/audio/generated/{filename}",
                "duration": len(text) * 0.12 / speed  # 粗略估算
            }
        except Exception as e:
            print(f"TTS Error: {e}")
            return {"url": "", "duration": 0}
    
    async def _generate_chapter_summary(
        self,
        content: str
    ) -> str:
        """生成章节摘要"""
        
        prompt = f"用50字概括这一章的核心内容:\n\n{content[:500]}..."
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=100
        )
        
        return response.choices[0].message.content