
# ==========================================
# music_mixer.py
# ==========================================

import openai
import json
import uuid
from typing import Dict, List
import os

class MusicMixer:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        openai.api_key = self.api_key
        
        # 音乐风格映射
        self.style_map = {
            "happy": {"bpm": 120, "key": "C Major", "mood": "uplifting"},
            "sad": {"bpm": 70, "key": "A minor", "mood": "melancholic"},
            "excited": {"bpm": 140, "key": "D Major", "mood": "energetic"},
            "calm": {"bpm": 80, "key": "F Major", "mood": "peaceful"},
            "anxious": {"bpm": 100, "key": "E minor", "mood": "tense"},
            "angry": {"bpm": 130, "key": "G minor", "mood": "aggressive"}
        }
    
    async def create_mix(
        self,
        emotions: List[str],
        participants: List[Dict],
        style: str
    ) -> Dict:
        """创建个性化音乐混音"""
        
        # 1. 分析情感组合
        emotion_profile = self._analyze_emotion_profile(emotions)
        
        # 2. 生成混音方案
        mix_plan = await self._generate_mix_plan(
            emotion_profile,
            participants,
            style
        )
        
        # 3. 使用OpenAI生成音乐描述
        music_description = await self._generate_music_description(mix_plan)
        
        # 4. 构造混音结果
        mix_result = {
            "id": str(uuid.uuid4()),
            "tracks": mix_plan.get("tracks", []),
            "bpm": mix_plan.get("bpm", 120),
            "key": mix_plan.get("key", "C Major"),
            "structure": mix_plan.get("structure", {}),
            "effects": mix_plan.get("effects", []),
            "audio_url": f"https://api.example.com/audio/{uuid.uuid4()}.mp3",
            "duration": 180,  # 3分钟
            "description": music_description,
            "participants_tracks": self._assign_participant_tracks(
                participants,
                mix_plan
            )
        }
        
        return mix_result
    
    async def control(
        self,
        mix_id: str,
        action: str,
        params: Dict
    ) -> Dict:
        """控制音乐播放"""
        
        controls = {
            "play": "开始播放",
            "pause": "暂停",
            "adjust_bpm": "调整速度",
            "change_key": "转调",
            "add_effect": "添加效果",
            "adjust_volume": "调整音量"
        }
        
        return {
            "mix_id": mix_id,
            "action": action,
            "status": "applied",
            "message": controls.get(action, "未知操作")
        }
    
    def _analyze_emotion_profile(self, emotions: List[str]) -> Dict:
        """分析情感组合"""
        
        # 统计情感分布
        emotion_count = {}
        for emotion in emotions:
            emotion_count[emotion] = emotion_count.get(emotion, 0) + 1
        
        # 找出主导情感
        dominant_emotion = max(emotion_count.items(), key=lambda x: x[1])[0]
        
        # 计算平均BPM和调性
        avg_bpm = sum(
            self.style_map.get(e, {"bpm": 100})["bpm"] 
            for e in emotions
        ) / len(emotions)
        
        return {
            "dominant": dominant_emotion,
            "distribution": emotion_count,
            "avg_bpm": int(avg_bpm),
            "diversity": len(emotion_count)
        }
    
    async def _generate_mix_plan(
        self,
        emotion_profile: Dict,
        participants: List[Dict],
        style: str
    ) -> Dict:
        """生成混音计划"""
        
        prompt = f"""
        为多人场景创作个性化音乐混音方案。
        
        情感分析:
        - 主导情感: {emotion_profile['dominant']}
        - 情感分布: {emotion_profile['distribution']}
        - 建议BPM: {emotion_profile['avg_bpm']}
        
        参与者: {len(participants)}人
        风格偏好: {style}
        
        请设计一个音乐混音方案,包含:
        1. 整体结构(intro, verse, chorus, outro)
        2. 使用的乐器和音色
        3. 每个参与者的个性化音轨
        4. 音效和处理建议
        
        以JSON格式返回。
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "你是专业的音乐制作人,擅长根据情感创作适配的音乐。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        return json.loads(response.choices[0].message.content)
    
    async def _generate_music_description(self, mix_plan: Dict) -> str:
        """生成音乐描述"""
        
        prompt = f"""
        用生动的语言描述这个音乐混音:
        
        {json.dumps(mix_plan, ensure_ascii=False, indent=2)}
        
        用50-80字描述这段音乐的感觉和氛围。
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "你是音乐评论家,擅长用诗意的语言描述音乐。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.8
        )
        
        return response.choices[0].message.content
    
    def _assign_participant_tracks(
        self,
        participants: List[Dict],
        mix_plan: Dict
    ) -> Dict:
        """为每个参与者分配个性化音轨"""
        
        participant_tracks = {}
        personal_tracks = mix_plan.get("personalTracks", {})
        
        for participant in participants:
            participant_tracks[participant["id"]] = {
                "name": participant["name"],
                "track": personal_tracks.get(
                    participant["name"],
                    "主旋律"
                ),
                "volume": 1.0,
                "pan": 0.0  # -1(左) 到 1(右)
            }
        
        return participant_tracks