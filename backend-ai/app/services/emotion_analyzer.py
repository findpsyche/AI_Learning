"""
情感分析服务
文件: backend/ai-agent/app/services/emotion_analyzer.py
功能: 使用OpenAI API进行音频和文本情感识别
"""

import openai
import base64
import json
from typing import Optional, Dict, List
import os
from datetime import datetime

class EmotionAnalyzer:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        openai.api_key = self.api_key
        
        # 情感映射
        self.emotion_map = {
            "happy": {"valence": 0.8, "arousal": 0.7, "color": "#FFD700"},
            "excited": {"valence": 0.9, "arousal": 0.9, "color": "#FF6B6B"},
            "calm": {"valence": 0.6, "arousal": 0.2, "color": "#4ECDC4"},
            "sad": {"valence": 0.2, "arousal": 0.3, "color": "#95A3B3"},
            "angry": {"valence": 0.1, "arousal": 0.9, "color": "#FF0000"},
            "anxious": {"valence": 0.3, "arousal": 0.8, "color": "#FFA500"},
            "neutral": {"valence": 0.5, "arousal": 0.5, "color": "#808080"}
        }
        
    async def analyze(
        self,
        audio_data: Optional[str] = None,
        text: Optional[str] = None,
        scene: str = "general",
        user_age: int = 25
    ) -> Dict:
        """
        分析情感 - 支持音频和文本
        """
        
        emotions = []
        
        # 1. 音频情感分析
        if audio_data:
            audio_emotion = await self._analyze_audio(audio_data)
            emotions.append(audio_emotion)
        
        # 2. 文本情感分析
        if text:
            text_emotion = await self._analyze_text(text, scene, user_age)
            emotions.append(text_emotion)
        
        # 3. 融合结果
        final_emotion = self._merge_emotions(emotions)
        
        # 4. 生成场景建议
        suggestions = self._generate_suggestions(
            final_emotion,
            scene,
            user_age
        )
        
        return {
            "emotion": final_emotion["primary"],
            "confidence": final_emotion["confidence"],
            "valence": final_emotion["valence"],
            "arousal": final_emotion["arousal"],
            "all_emotions": final_emotion["all"],
            "suggestions": suggestions,
            "color": self.emotion_map.get(
                final_emotion["primary"],
                self.emotion_map["neutral"]
            )["color"]
        }
    
    async def _analyze_audio(self, audio_base64: str) -> Dict:
        """使用OpenAI Whisper + GPT分析音频情感"""
        
        try:
            # 1. 转录音频
            audio_bytes = base64.b64decode(audio_base64)
            
            # 使用Whisper API
            transcription = await openai.Audio.atranscribe(
                model="whisper-1",
                file=audio_bytes,
                response_format="verbose_json"
            )
            
            text = transcription["text"]
            
            # 2. 分析语音特征 (音调、语速等)
            # 注: OpenAI暂不直接提供音频特征提取,这里用GPT推理
            prompt = f"""
            分析以下语音转录文本的情感,并推断说话者的情绪状态:
            
            文本: "{text}"
            
            请以JSON格式返回:
            {{
                "primary_emotion": "主要情绪(happy/sad/angry/calm/excited/anxious/neutral)",
                "confidence": 0.0-1.0的置信度,
                "secondary_emotions": ["次要情绪列表"],
                "reasoning": "判断理由"
            }}
            """
            
            response = await openai.ChatCompletion.acreate(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "你是一个专业的情感分析专家。"},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return {
                "primary": result["primary_emotion"],
                "confidence": result["confidence"],
                "secondary": result["secondary_emotions"],
                "source": "audio"
            }
            
        except Exception as e:
            print(f"Audio analysis error: {e}")
            return {
                "primary": "neutral",
                "confidence": 0.5,
                "secondary": [],
                "source": "audio"
            }
    
    async def _analyze_text(
        self,
        text: str,
        scene: str,
        user_age: int
    ) -> Dict:
        """使用GPT分析文本情感"""
        
        # 根据年龄调整分析策略
        age_context = ""
        if user_age < 12:
            age_context = "这是儿童的表达,注意儿童情感特点。"
        elif user_age < 18:
            age_context = "这是青少年的表达,注意青春期情感特点。"
        else:
            age_context = "这是成年人的表达。"
        
        # 根据场景调整
        scene_context = {
            "car": "这是在车内场景,可能涉及旅行、通勤等情境。",
            "ktv": "这是在KTV场景,可能涉及娱乐、社交等情境。",
            "story": "这是在互动故事中,可能涉及角色扮演等情境。"
        }.get(scene, "")
        
        prompt = f"""
        {age_context}
        {scene_context}
        
        分析以下文本的情感:
        "{text}"
        
        请以JSON格式返回:
        {{
            "primary_emotion": "主要情绪",
            "confidence": 置信度(0-1),
            "secondary_emotions": ["次要情绪"],
            "intensity": 情感强度(0-1),
            "reasoning": "判断理由"
        }}
        """
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "你是情感分析专家,擅长理解不同年龄段和场景的情感表达。"},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return {
                "primary": result["primary_emotion"],
                "confidence": result["confidence"],
                "secondary": result["secondary_emotions"],
                "intensity": result.get("intensity", 0.5),
                "source": "text"
            }
            
        except Exception as e:
            print(f"Text analysis error: {e}")
            return {
                "primary": "neutral",
                "confidence": 0.5,
                "secondary": [],
                "source": "text"
            }
    
    def _merge_emotions(self, emotions: List[Dict]) -> Dict:
        """融合多个情感分析结果"""
        
        if not emotions:
            return {
                "primary": "neutral",
                "confidence": 0.5,
                "valence": 0.5,
                "arousal": 0.5,
                "all": []
            }
        
        # 按置信度加权
        total_weight = sum(e["confidence"] for e in emotions)
        
        # 统计所有情绪
        emotion_scores = {}
        for e in emotions:
            weight = e["confidence"] / total_weight if total_weight > 0 else 1.0 / len(emotions)
            
            if e["primary"] not in emotion_scores:
                emotion_scores[e["primary"]] = 0
            emotion_scores[e["primary"]] += weight
            
            for sec in e.get("secondary", []):
                if sec not in emotion_scores:
                    emotion_scores[sec] = 0
                emotion_scores[sec] += weight * 0.5
        
        # 找出主要情绪
        primary = max(emotion_scores.items(), key=lambda x: x[1])
        
        # 计算valence和arousal
        emotion_info = self.emotion_map.get(primary[0], self.emotion_map["neutral"])
        
        return {
            "primary": primary[0],
            "confidence": primary[1],
            "valence": emotion_info["valence"],
            "arousal": emotion_info["arousal"],
            "all": sorted(emotion_scores.items(), key=lambda x: x[1], reverse=True)[:3]
        }
    
    def _generate_suggestions(
        self,
        emotion: Dict,
        scene: str,
        user_age: int
    ) -> Dict:
        """根据情感生成AI建议"""
        
        primary = emotion["primary"]
        valence = emotion["valence"]
        arousal = emotion["arousal"]
        
        suggestions = {
            "actions": [],
            "music_style": "",
            "voice_tone": "",
            "content_type": ""
        }
        
        # 场景: 汽车
        if scene == "car":
            if primary == "anxious" or primary == "angry":
                suggestions["actions"] = [
                    "播放舒缓音乐",
                    "建议休息片刻",
                    "播放轻松故事"
                ]
                suggestions["music_style"] = "calm_ambient"
                suggestions["voice_tone"] = "gentle"
            elif primary == "sad":
                suggestions["actions"] = [
                    "播放治愈音乐",
                    "分享正能量故事",
                    "提供情感支持"
                ]
                suggestions["music_style"] = "uplifting"
                suggestions["voice_tone"] = "warm"
            elif primary == "happy" or primary == "excited":
                suggestions["actions"] = [
                    "播放欢快音乐",
                    "互动小游戏",
                    "分享趣事"
                ]
                suggestions["music_style"] = "upbeat"
                suggestions["voice_tone"] = "energetic"
        
        # 场景: KTV
        elif scene == "ktv":
            if valence > 0.6 and arousal > 0.6:
                suggestions["actions"] = [
                    "推荐热门歌曲",
                    "开启合唱模式",
                    "添加音效增强"
                ]
                suggestions["music_style"] = "party"
                suggestions["content_type"] = "group_activity"
            elif valence < 0.4:
                suggestions["actions"] = [
                    "推荐抒情歌曲",
                    "个人独唱模式",
                    "情感表达支持"
                ]
                suggestions["music_style"] = "ballad"
                suggestions["content_type"] = "emotional_release"
        
        # 场景: 故事
        elif scene == "story":
            if user_age < 12:
                suggestions["content_type"] = "adventure" if arousal > 0.6 else "educational"
            elif user_age < 18:
                suggestions["content_type"] = "mystery" if arousal > 0.6 else "romance"
            else:
                suggestions["content_type"] = "thriller" if arousal > 0.6 else "drama"
        
        return suggestions