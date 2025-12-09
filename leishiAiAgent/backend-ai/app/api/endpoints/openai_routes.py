"""
OpenAI API 路由
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import io

from app.services.openai_service import get_openai_service
from app.models.emotion import Emotion

router = APIRouter(prefix="/api/v1/openai", tags=["openai"])

# ==================== 请求模型 ====================
class TranscribeRequest(BaseModel):
    """语音转文字请求"""
    language: str = "zh"
    prompt: Optional[str] = None

class GenerateTextRequest(BaseModel):
    """文本生成请求"""
    prompt: str
    system_message: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1000
    model: str = "gpt-4-turbo-preview"

class ChatRequest(BaseModel):
    """聊天请求"""
    messages: list
    emotion: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 500

class SynthesizeRequest(BaseModel):
    """语音合成请求"""
    text: str
    voice: str = "alloy"
    speed: float = 1.0
    model: str = "tts-1-hd"

class HealingContentRequest(BaseModel):
    """治愈内容生成请求"""
    emotion: str
    content_type: str = "story"  # story, poem, meditation, advice

class MusicRecommendationRequest(BaseModel):
    """音乐推荐请求"""
    emotion: str
    mood: str
    preferred_style: Optional[str] = None

# ==================== 端点 ====================

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = "zh"
):
    """
    语音转文字
    
    Args:
        file: 音频文件 (m4a, mp3, wav 等)
        language: 语言代码 (zh, en, etc.)
        
    Returns:
        {'text': '转录文本', 'language': '语言', 'success': True}
    """
    try:
        service = get_openai_service()
        audio_data = await file.read()
        
        result = await service.transcribe_audio(
            audio_data=audio_data,
            language=language
        )
        
        return {"data": result}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-text")
async def generate_text(request: GenerateTextRequest):
    """
    生成文本
    
    Args:
        request: 生成请求
        
    Returns:
        {'text': '生成的文本', 'tokens_used': 123, 'success': True}
    """
    try:
        service = get_openai_service()
        
        result = await service.generate_text(
            prompt=request.prompt,
            system_message=request.system_message,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            model=request.model
        )
        
        return {"data": result}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat(request: ChatRequest):
    """
    聊天对话
    
    Args:
        request: 聊天请求
        
    Returns:
        AI的回复
    """
    try:
        service = get_openai_service()
        
        result = await service.generate_chat_response(
            messages=request.messages,
            emotion=request.emotion,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        return {"data": result}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/synthesize-speech")
async def synthesize_speech(request: SynthesizeRequest):
    """
    文本转语音
    
    Args:
        request: 合成请求
        
    Returns:
        {'audio': base64_audio, 'format': 'mp3', 'success': True}
    """
    try:
        service = get_openai_service()
        
        result = await service.synthesize_speech(
            text=request.text,
            voice=request.voice,
            speed=request.speed,
            model=request.model
        )
        
        return {"data": result}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice-chat")
async def voice_chat(
    file: UploadFile = File(...),
    emotion: Optional[str] = None,
    context: Optional[str] = None
):
    """
    完整的语音聊天流程
    1. 转录音频
    2. 生成回复
    3. 合成语音
    
    Args:
        file: 音频文件
        emotion: 用户情绪 (可选)
        context: 对话上下文 (可选)
        
    Returns:
        {'user_text': '用户说的话', 'ai_response': '回复文本', 'audio': base64_audio}
    """
    try:
        service = get_openai_service()
        audio_data = await file.read()
        
        result = await service.transcribe_and_respond(
            audio_data=audio_data,
            context=context,
            emotion=emotion
        )
        
        return {"data": result}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/healing-content")
async def generate_healing_content(request: HealingContentRequest):
    """
    生成治愈内容
    
    Args:
        request: 包含情绪和内容类型
        
    Returns:
        生成的治愈内容
    """
    try:
        service = get_openai_service()
        
        result = await service.generate_healing_content(
            emotion=request.emotion,
            content_type=request.content_type
        )
        
        return {"data": result}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/music-recommendation")
async def recommend_music(request: MusicRecommendationRequest):
    """
    获取音乐推荐
    
    Args:
        request: 推荐请求
        
    Returns:
        {'recommendations': [{'title': '歌曲名', 'artist': '艺术家', 'reason': '推荐理由'}]}
    """
    try:
        service = get_openai_service()
        
        result = await service.generate_music_recommendation(
            emotion=request.emotion,
            mood=request.mood,
            preferred_style=request.preferred_style
        )
        
        return {"data": result}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": "OpenAI Integration",
        "features": [
            "Whisper (Speech-to-Text)",
            "GPT-4 (Text Generation)",
            "TTS (Text-to-Speech)",
            "Healing Content Generation",
            "Music Recommendations"
        ]
    }
