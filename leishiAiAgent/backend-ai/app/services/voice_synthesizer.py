
# ==========================================
# voice_synthesizer.py
# ==========================================

import openai
import os
from typing import Dict

class VoiceSynthesizer:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        openai.api_key = self.api_key
        
        # 语音风格映射
        self.voice_styles = {
            "companion": {"voice": "alloy", "speed": 1.0},
            "storyteller": {"voice": "onyx", "speed": 0.95},
            "energetic": {"voice": "nova", "speed": 1.1},
            "calm": {"voice": "shimmer", "speed": 0.9},
            "professional": {"voice": "echo", "speed": 1.0}
        }
    
    async def synthesize(
        self,
        text: str,
        emotion: str,
        age_group: str,
        voice_style: str = "companion"
    ) -> Dict:
        """合成带情感的语音"""
        
        # 根据情感调整文本
        adjusted_text = self._adjust_text_for_emotion(text, emotion)
        
        # 选择合适的语音
        voice_config = self.voice_styles.get(
            voice_style,
            self.voice_styles["companion"]
        )
        
        # 根据年龄调整
        if age_group == "child":
            voice_config["voice"] = "nova"
            voice_config["speed"] = 1.0
        elif age_group == "teen":
            voice_config["voice"] = "alloy"
            voice_config["speed"] = 1.05
        
        # 调用OpenAI TTS
        response = await openai.Audio.acreate(
            model="tts-1",
            input=adjusted_text,
            voice=voice_config["voice"],
            speed=voice_config["speed"]
        )
        
        # 这里应该保存音频文件并返回URL
        # 简化版本,返回模拟数据
        
        return {
            "url": f"https://api.example.com/audio/{hash(text)}.mp3",
            "duration": len(text) * 0.1,  # 粗略估算
            "format": "mp3",
            "voice": voice_config["voice"],
            "speed": voice_config["speed"]
        }
    
    def _adjust_text_for_emotion(self, text: str, emotion: str) -> str:
        """根据情感调整文本语气"""
        
        # 可以添加语气词、表情等
        emotion_markers = {
            "happy": "😊 ",
            "excited": "🎉 ",
            "sad": "",
            "calm": "",
            "angry": "",
            "anxious": ""
        }
        
        marker = emotion_markers.get(emotion, "")
        return f"{marker}{text}"