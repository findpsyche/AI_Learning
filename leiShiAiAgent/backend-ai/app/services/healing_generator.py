"""
疗愈内容生成服务
文件: backend-ai/app/services/healing_generator.py
功能: 为悲伤情绪生成疗愈内容(音乐、对话、冥想)
"""

import openai
import json
import os
from typing import Dict, List, Optional
from datetime import datetime

class HealingGenerator:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        openai.api_key = self.api_key
        
        # 疗愈音乐风格
        self.healing_styles = {
            "gentle": {
                "bpm": 60,
                "key": "C Major",
                "instruments": ["piano", "strings", "ambient pads"],
                "mood": "温柔抚慰"
            },
            "meditation": {
                "bpm": 55,
                "key": "A minor",
                "instruments": ["singing bowl", "chimes", "nature sounds"],
                "mood": "冥想放松"
            },
            "uplifting": {
                "bpm": 75,
                "key": "G Major",
                "instruments": ["acoustic guitar", "flute", "soft percussion"],
                "mood": "温暖治愈"
            }
        }
    
    async def generate_healing_conversation(
        self,
        user_message: str,
        emotion_intensity: float,
        conversation_history: List[Dict] = None
    ) -> Dict:
        """
        生成疗愈对话
        根据用户情绪强度调整回应策略
        """
        
        # 构建系统prompt
        intensity_level = "严重" if emotion_intensity > 0.7 else "中等" if emotion_intensity > 0.4 else "轻微"
        
        system_prompt = f"""
你是一个温暖、善解人意的AI情感陪伴者,专门帮助人们度过情绪低落的时刻。

当前用户情绪: 悲伤({intensity_level})

你的回应策略:
1. 首先确认和接纳对方的感受,不评判、不否定
2. 使用温暖、柔和的语言,避免说教
3. 适当沉默,给予思考空间(用"..."表示)
4. 询问细节前先表达共情
5. 适时提供积极但不强迫的视角
6. 回应长度保持在50-80字,不要过长
7. 适当使用疗愈性的隐喻和意象

禁止行为:
- 不要说"你应该..."、"你必须..."
- 不要轻易说"会好的"、"想开点"
- 不要立即提供解决方案
- 不要转移话题

语言风格: 像朋友般温暖,像诗人般细腻
        """
        
        # 构建消息历史
        messages = [{"role": "system", "content": system_prompt}]
        if conversation_history:
            messages.extend(conversation_history[-6:])  # 保留最近3轮对话
        messages.append({"role": "user", "content": user_message})
        
        # 调用OpenAI
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=messages,
            temperature=0.8,
            max_tokens=200
        )
        
        ai_response = response.choices[0].message.content
        
        # 生成语音(温柔女声)
        audio_response = await self._generate_voice(
            ai_response,
            voice="shimmer",
            speed=0.85  # 慢速,更舒缓
        )
        
        return {
            "text": ai_response,
            "audio_url": audio_response["url"],
            "emotion_shift": await self._predict_emotion_shift(user_message, ai_response),
            "suggested_action": self._suggest_next_action(emotion_intensity)
        }
    
    async def generate_healing_music(
        self,
        emotion_intensity: float,
        duration: int = 180,
        style: str = "gentle"
    ) -> Dict:
        """
        生成疗愈音乐
        根据情绪强度定制音乐参数
        """
        
        music_style = self.healing_styles.get(style, self.healing_styles["gentle"])
        
        # 生成音乐描述prompt
        prompt = f"""
为情绪低落的人创作一段疗愈音乐。

音乐参数:
- 时长: {duration}秒
- BPM: {music_style['bpm']}
- 调性: {music_style['key']}
- 乐器: {', '.join(music_style['instruments'])}
- 情绪强度: {emotion_intensity}

音乐结构要求:
1. 前30秒: 极其缓慢的引入,像晨曦般温柔
2. 中段: 主旋律展开,像溪流般流淌
3. 高潮: 不要过于激烈,保持克制的情感释放
4. 尾声: 渐弱至平静,留有余韵

请详细描述每个段落的:
- 旋律走向(音程、节奏)
- 和声进行
- 织体变化
- 动态起伏

以JSON格式返回音乐结构。
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "你是专业的疗愈音乐作曲家,擅长用声音抚慰心灵。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        music_structure = json.loads(response.choices[0].message.content)
        
        # 注: 实际音乐生成需要使用音乐AI API(如Suno, MusicGen等)
        # 这里返回音乐配方
        return {
            "id": f"healing_{int(datetime.now().timestamp())}",
            "structure": music_structure,
            "style": style,
            "duration": duration,
            "audio_url": f"/storage/audio/generated/healing_{style}_{duration}.mp3",
            "description": music_style["mood"],
            "suggested_activity": self._suggest_activity(emotion_intensity)
        }
    
    async def generate_meditation_guide(
        self,
        duration: int = 600,
        focus: str = "breath"
    ) -> Dict:
        """
        生成冥想引导语音
        """
        
        focus_themes = {
            "breath": "呼吸觉察",
            "body": "身体扫描",
            "emotion": "情绪观察",
            "loving-kindness": "慈心冥想"
        }
        
        prompt = f"""
创作一段{duration//60}分钟的冥想引导词,主题是: {focus_themes.get(focus, '呼吸觉察')}

要求:
1. 开始: 温柔地引导进入冥想状态(1-2分钟)
2. 主体: 分步骤引导,每个步骤30-60秒
3. 结束: 缓慢唤醒,回到当下(1分钟)

语言风格:
- 使用第二人称"你"
- 语速标记: 用"(停顿5秒)"标注静默时刻
- 用诗意的比喻描述内在体验
- 避免命令式,多用"尝试"、"如果愿意"

示例开头:
"让自己找一个舒适的姿势...感受身体与座椅的接触...(停顿5秒)
现在,轻轻地将注意力带到呼吸..."

请生成完整的引导词。
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "你是经验丰富的冥想导师,声音温柔而坚定。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        guide_text = response.choices[0].message.content
        
        # 生成语音(低沉平静的声音)
        audio = await self._generate_voice(
            guide_text,
            voice="onyx",
            speed=0.8
        )
        
        return {
            "id": f"meditation_{focus}_{duration}",
            "text": guide_text,
            "audio_url": audio["url"],
            "duration": duration,
            "focus": focus,
            "background_music": "soft_ambient"
        }
    
    async def generate_emotion_diary(
        self,
        conversation_summary: str,
        emotion_data: Dict
    ) -> Dict:
        """
        生成情绪日记
        将对话总结为诗意的日记
        """
        
        prompt = f"""
将这段情感对话总结为一篇温柔的日记。

对话摘要: {conversation_summary}
情绪数据: {json.dumps(emotion_data, ensure_ascii=False)}

要求:
1. 以第一人称"我"书写
2. 不超过150字
3. 捕捉核心情绪和重要瞬间
4. 以诗意而不矫情的方式表达
5. 结尾要留有希望,但不要刻意

风格参考: 三毛、张爱玲的散文笔触

示例:
"今天的情绪像秋雨,绵长而寂静。和AI聊了很久,
它没有急于安慰,只是静静地听。我说了很多,
也沉默了很久。有些话说出来,就轻了一些。
窗外的雨停了,心里的雨也慢了下来。"

请生成日记。
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "你是温柔的文字治疗师,用诗意记录情绪。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.8,
            max_tokens=300
        )
        
        diary_text = response.choices[0].message.content
        
        return {
            "date": datetime.now().strftime("%Y年%m月%d日"),
            "text": diary_text,
            "emotion": emotion_data.get("primary", "unknown"),
            "tags": self._extract_emotion_tags(diary_text)
        }
    
    async def _generate_voice(
        self,
        text: str,
        voice: str = "shimmer",
        speed: float = 0.85
    ) -> Dict:
        """生成语音"""
        
        # 调用OpenAI TTS
        try:
            response = await openai.Audio.acreate(
                model="tts-1-hd",  # 高清版,音质更好
                input=text,
                voice=voice,
                speed=speed
            )
            
            # 保存音频文件
            audio_filename = f"healing_{int(datetime.now().timestamp())}.mp3"
            # ... 保存逻辑
            
            return {
                "url": f"/storage/audio/generated/{audio_filename}",
                "duration": len(text) * 0.1 / speed
            }
        except Exception as e:
            print(f"Voice generation error: {e}")
            return {"url": "", "duration": 0}
    
    async def _predict_emotion_shift(
        self,
        user_message: str,
        ai_response: str
    ) -> Dict:
        """预测情绪变化趋势"""
        
        prompt = f"""
分析这段对话后用户的情绪变化:

用户: {user_message}
AI: {ai_response}

预测:
1. 情绪是否有所缓解? (0-1)
2. 用户可能的下一步反应
3. 建议的后续策略

以JSON返回。
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.5
        )
        
        return json.loads(response.choices[0].message.content)
    
    def _suggest_next_action(self, intensity: float) -> str:
        """根据情绪强度建议下一步行动"""
        
        if intensity > 0.7:
            return "建议进行深度冥想引导"
        elif intensity > 0.4:
            return "建议播放疗愈音乐"
        else:
            return "建议记录情绪日记"
    
    def _suggest_activity(self, intensity: float) -> str:
        """建议配合的活动"""
        
        activities = {
            0.8: "深呼吸,专注当下",
            0.6: "轻柔的伸展运动",
            0.4: "泡一杯热茶,慢慢品味",
            0.2: "看窗外的风景"
        }
        
        for threshold, activity in sorted(activities.items(), reverse=True):
            if intensity >= threshold:
                return activity
        
        return "自由放松"
    
    def _extract_emotion_tags(self, text: str) -> List[str]:
        """从文本提取情绪标签"""
        
        emotion_keywords = {
            "孤独": ["孤独", "一个人", "寂寞"],
            "失落": ["失落", "失去", "遗憾"],
            "疲惫": ["累", "疲惫", "耗尽"],
            "迷茫": ["迷茫", "不知", "困惑"],
            "平静": ["平静", "安静", "宁静"],
            "希望": ["希望", "期待", "明天"]
        }
        
        tags = []
        for tag, keywords in emotion_keywords.items():
            if any(keyword in text for keyword in keywords):
                tags.append(tag)
        
        return tags[:3]  # 最多3个标签


# ==========================================
# backend-nodejs/src/services/healingService.js
# Node.js侧的疗愈服务调用封装
# ==========================================

"""
// 文件: backend-nodejs/src/services/healingService.js

const axios = require('axios');

class HealingService {
  constructor(aiServiceUrl) {
    this.aiServiceUrl = aiServiceUrl || 'http://localhost:8000';
  }

  async startHealingConversation(userId, userMessage, emotionIntensity, history = []) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/healing/conversation`, {
        user_id: userId,
        message: userMessage,
        emotion_intensity: emotionIntensity,
        history
      });
      
      return response.data;
    } catch (error) {
      console.error('Healing conversation error:', error);
      throw error;
    }
  }

  async generateHealingMusic(emotionIntensity, duration = 180, style = 'gentle') {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/healing/music`, {
        emotion_intensity: emotionIntensity,
        duration,
        style
      });
      
      return response.data;
    } catch (error) {
      console.error('Healing music generation error:', error);
      throw error;
    }
  }

  async generateMeditationGuide(duration = 600, focus = 'breath') {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/healing/meditation`, {
        duration,
        focus
      });
      
      return response.data;
    } catch (error) {
      console.error('Meditation guide generation error:', error);
      throw error;
    }
  }

  async createEmotionDiary(userId, conversationSummary, emotionData) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/healing/diary`, {
        user_id: userId,
        conversation_summary: conversationSummary,
        emotion_data: emotionData
      });
      
      // 保存到数据库
      // await this.saveToDatabase(userId, response.data);
      
      return response.data;
    } catch (error) {
      console.error('Emotion diary creation error:', error);
      throw error;
    }
  }
}

module.exports = HealingService;
"""