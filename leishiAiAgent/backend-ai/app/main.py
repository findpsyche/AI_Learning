"""
AI Emotion Companion - FastAPI AI Agent
文件: backend/ai-agent/app/main.py
功能: AI代理主服务,处理情感识别、故事生成、音乐混音
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import asyncio
import json
from datetime import datetime

from app.services.emotion_analyzer import EmotionAnalyzer
from app.services.story_generator import StoryGenerator
from app.services.music_mixer import MusicMixer
from app.services.voice_synthesizer import VoiceSynthesizer

app = FastAPI(
    title="AI Emotion Companion API",
    description="基于情感识别的AI交互系统",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化服务
emotion_analyzer = EmotionAnalyzer()
story_generator = StoryGenerator()
music_mixer = MusicMixer()
voice_synthesizer = VoiceSynthesizer()

# WebSocket连接管理
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
    
    async def send_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)

manager = ConnectionManager()

# 数据模型
class EmotionRequest(BaseModel):
    audio_data: Optional[str] = None
    text: Optional[str] = None
    scene: str  # "car", "ktv", "story"
    user_age: int
    group_size: int

class SceneConfig(BaseModel):
    scene_type: str
    participants: List[Dict]
    settings: Dict

class MusicMixRequest(BaseModel):
    emotions: List[str]
    participants: List[Dict]
    style: str

# API端点
@app.get("/")
async def root():
    return {
        "service": "AI Emotion Companion",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/v1/emotion/analyze")
async def analyze_emotion(request: EmotionRequest):
    """分析情绪 - 支持音频和文本输入"""
    try:
        result = await emotion_analyzer.analyze(
            audio_data=request.audio_data,
            text=request.text,
            scene=request.scene,
            user_age=request.user_age
        )
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "emotion": result["emotion"],
                "confidence": result["confidence"],
                "valence": result["valence"],  # 情感正负向
                "arousal": result["arousal"],  # 情感激活度
                "suggestions": result["suggestions"],
                "timestamp": datetime.now().isoformat()
            }
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "error": str(e)
        })

@app.post("/api/v1/story/generate")
async def generate_story(scene_config: SceneConfig):
    """生成AI互动故事"""
    try:
        story = await story_generator.create_story(
            scene_type=scene_config.scene_type,
            participants=scene_config.participants,
            settings=scene_config.settings
        )
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "story_id": story["id"],
                "title": story["title"],
                "intro": story["intro"],
                "characters": story["characters"],
                "first_scene": story["scenes"][0],
                "options": story["options"]
            }
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "error": str(e)
        })

@app.post("/api/v1/music/mix")
async def mix_music(request: MusicMixRequest):
    """AI音乐混音 - 根据多人情绪生成个性化音乐"""
    try:
        mix_result = await music_mixer.create_mix(
            emotions=request.emotions,
            participants=request.participants,
            style=request.style
        )
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "mix_id": mix_result["id"],
                "tracks": mix_result["tracks"],
                "bpm": mix_result["bpm"],
                "key": mix_result["key"],
                "audio_url": mix_result["audio_url"],
                "duration": mix_result["duration"]
            }
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "error": str(e)
        })

@app.post("/api/v1/voice/synthesize")
async def synthesize_voice(
    text: str,
    emotion: str,
    age_group: str,
    voice_style: str = "companion"
):
    """AI语音合成 - 带情感的语音输出"""
    try:
        audio = await voice_synthesizer.synthesize(
            text=text,
            emotion=emotion,
            age_group=age_group,
            voice_style=voice_style
        )
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "audio_url": audio["url"],
                "duration": audio["duration"],
                "format": audio["format"]
            }
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "error": str(e)
        })

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket实时通信 - 用于实时情感交互"""
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "emotion":
                # 实时情感分析
                emotion_result = await emotion_analyzer.analyze(
                    audio_data=data.get("audio"),
                    text=data.get("text"),
                    scene=data.get("scene"),
                    user_age=data.get("age", 25)
                )
                
                await manager.send_message({
                    "type": "emotion_result",
                    "data": emotion_result
                }, client_id)
                
            elif message_type == "story_action":
                # 故事互动
                story_response = await story_generator.process_action(
                    story_id=data.get("story_id"),
                    action=data.get("action"),
                    participant_id=data.get("participant_id")
                )
                
                # 广播给所有参与者
                await manager.broadcast({
                    "type": "story_update",
                    "data": story_response
                })
                
            elif message_type == "music_control":
                # 音乐控制
                music_response = await music_mixer.control(
                    mix_id=data.get("mix_id"),
                    action=data.get("action"),
                    params=data.get("params")
                )
                
                await manager.send_message({
                    "type": "music_update",
                    "data": music_response
                }, client_id)
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        print(f"Client {client_id} disconnected")

@app.post("/api/v1/scene/initialize")
async def initialize_scene(scene_config: SceneConfig):
    """初始化场景 - 根据场景类型和人群配置AI行为"""
    try:
        # 根据年龄和人数配置不同功能
        config = {
            "scene_type": scene_config.scene_type,
            "participants": scene_config.participants,
            "features": []
        }
        
        avg_age = sum(p["age"] for p in scene_config.participants) / len(scene_config.participants)
        
        # 儿童场景 (< 12岁)
        if avg_age < 12:
            config["features"] = ["story", "simple_music", "educational"]
            config["content_filter"] = "strict"
            
        # 青少年场景 (12-18岁)
        elif avg_age < 18:
            config["features"] = ["story", "music_mix", "game", "social"]
            config["content_filter"] = "moderate"
            
        # 成人场景 (18+)
        else:
            config["features"] = ["story", "music_mix", "karaoke", "emotion_support"]
            config["content_filter"] = "none"
        
        # 场景特定功能
        if scene_config.scene_type == "car":
            config["features"].extend(["driver_safety", "ambient_music"])
        elif scene_config.scene_type == "ktv":
            config["features"].extend(["karaoke", "group_harmony", "vocal_effects"])
        
        return JSONResponse(content={
            "success": True,
            "data": config
        })
        
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "success": False,
            "error": str(e)
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)