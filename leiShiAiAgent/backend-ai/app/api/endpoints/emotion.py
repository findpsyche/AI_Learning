"""
情绪分析API端点
文件: backend-ai/app/api/endpoints/emotion.py
功能: 提供情绪识别接口 - 支持文本和音频输入
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, List
import logging
import io
import base64
from datetime import datetime

from app.models.emotion import Session as SessionModel, Memory, User, engine, SessionLocal
from app.services.emotion_analyzer import EmotionAnalyzer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/emotion", tags=["emotion"])

# ==================== 数据模型 ====================

class EmotionAnalyzeRequest(BaseModel):
    """情绪分析请求"""
    text: Optional[str] = None
    audio_base64: Optional[str] = None
    user_id: Optional[int] = None
    session_id: Optional[int] = None
    scene: str = "general"  # 使用场景: general, car, ktv, therapy
    metadata: Optional[Dict] = None


class EmotionResponse(BaseModel):
    """情绪响应"""
    emotion: str  # sad, calm, happy, neutral, angry, anxious, excited
    intensity: float  # 0.0-1.0
    valence: float  # 正负向: 0.0-1.0
    arousal: float  # 激活度: 0.0-1.0
    confidence: float
    color: str  # HEX颜色
    emoji: str
    label_cn: str
    reasoning: str
    timestamp: str
    recommendations: List[str] = []


class EmotionHistoryResponse(BaseModel):
    """情绪历史响应"""
    emotion_id: int
    emotion: str
    intensity: float
    created_at: str
    content_summary: str


class EmotionStatisticsResponse(BaseModel):
    """情绪统计响应"""
    total_records: int
    primary_emotion: str
    emotion_distribution: Dict[str, int]
    average_intensity: float
    trend: str  # "improving", "declining", "stable"


# ==================== 初始化 ====================

emotion_analyzer = EmotionAnalyzer()


def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================== API端点 ====================

@router.post("/analyze", response_model=EmotionResponse)
async def analyze_emotion(
    request: EmotionAnalyzeRequest,
    db: SessionLocal = Depends(get_db)
):
    """
    分析情绪 - 支持文本和音频输入
    
    参数:
    - text: 输入文本（可选）
    - audio_base64: Base64编码的音频文件（可选）
    - user_id: 用户ID（可选）
    - session_id: 会话ID（可选）
    - scene: 使用场景
    - metadata: 额外元数据
    
    返回:
    - 情绪分析结果（包含情绪类型、强度、色彩等信息）
    """
    try:
        # 输入验证
        if not request.text and not request.audio_base64:
            raise HTTPException(
                status_code=400,
                detail="必须提供文本或音频输入"
            )
        
        # 调用情绪分析器
        analysis_result = await emotion_analyzer.analyze(
            text=request.text,
            audio_data=request.audio_base64,
            scene=request.scene,
            metadata=request.metadata
        )
        
        # 保存到数据库（如果提供了user_id）
        if request.user_id:
            try:
                # 创建或更新会话
                if not request.session_id:
                    session_record = SessionModel(
                        user_id=request.user_id,
                        current_emotion=analysis_result["emotion"],
                        emotion_intensity=analysis_result["intensity"],
                        current_dapp=None,
                        started_at=datetime.utcnow()
                    )
                    db.add(session_record)
                    db.commit()
                    db.refresh(session_record)
                    session_id = session_record.id
                else:
                    session_id = request.session_id
                    session_record = db.query(SessionModel).filter(
                        SessionModel.id == session_id
                    ).first()
                    if session_record:
                        session_record.current_emotion = analysis_result["emotion"]
                        session_record.emotion_intensity = analysis_result["intensity"]
                        db.commit()
                
                # 创建记忆记录
                if session_id:
                    memory = Memory(
                        user_id=request.user_id,
                        session_id=session_id,
                        memory_type="text" if request.text else "audio",
                        emotion_type=analysis_result["emotion"],
                        emotion_intensity=analysis_result["intensity"],
                        content=request.text or "Audio message",
                        summary=analysis_result["reasoning"][:200],
                        tags=[request.scene, analysis_result["emotion"]],
                        created_at=datetime.utcnow()
                    )
                    db.add(memory)
                    db.commit()
                
            except Exception as e:
                logger.warning(f"数据库保存失败: {e}")
                # 继续返回分析结果，不影响主要功能
        
        return EmotionResponse(
            emotion=analysis_result["emotion"],
            intensity=analysis_result["intensity"],
            valence=analysis_result["valence"],
            arousal=analysis_result["arousal"],
            confidence=analysis_result["confidence"],
            color=analysis_result["color"],
            emoji=analysis_result["emoji"],
            label_cn=analysis_result["label_cn"],
            reasoning=analysis_result["reasoning"],
            timestamp=datetime.utcnow().isoformat(),
            recommendations=analysis_result.get("recommendations", [])
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"情绪分析错误: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"情绪分析失败: {str(e)}"
        )


@router.get("/history/{user_id}", response_model=List[EmotionHistoryResponse])
async def get_emotion_history(
    user_id: int,
    limit: int = 50,
    db: SessionLocal = Depends(get_db)
):
    """
    获取用户情绪历史
    
    参数:
    - user_id: 用户ID
    - limit: 返回记录数（最多50条）
    
    返回:
    - 情绪历史列表（按时间倒序）
    """
    try:
        memories = db.query(Memory).filter(
            Memory.user_id == user_id
        ).order_by(Memory.created_at.desc()).limit(limit).all()
        
        return [
            EmotionHistoryResponse(
                emotion_id=m.id,
                emotion=m.emotion_type,
                intensity=m.emotion_intensity,
                created_at=m.created_at.isoformat(),
                content_summary=m.summary or m.content[:100]
            )
            for m in memories
        ]
    except Exception as e:
        logger.error(f"获取历史失败: {e}")
        raise HTTPException(status_code=500, detail="获取历史失败")


@router.get("/statistics/{user_id}", response_model=EmotionStatisticsResponse)
async def get_emotion_statistics(
    user_id: int,
    days: int = 7,
    db: SessionLocal = Depends(get_db)
):
    """
    获取用户情绪统计
    
    参数:
    - user_id: 用户ID
    - days: 统计天数（默认7天）
    
    返回:
    - 情绪分布、趋势等统计数据
    """
    try:
        from datetime import timedelta
        
        start_date = datetime.utcnow() - timedelta(days=days)
        memories = db.query(Memory).filter(
            Memory.user_id == user_id,
            Memory.created_at >= start_date
        ).all()
        
        if not memories:
            raise HTTPException(status_code=404, detail="没有数据记录")
        
        # 计算情绪分布
        emotion_counts = {}
        total_intensity = 0
        
        for m in memories:
            emotion = m.emotion_type
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
            total_intensity += m.emotion_intensity
        
        # 确定主要情绪
        primary_emotion = max(emotion_counts, key=emotion_counts.get)
        
        # 简单趋势分析（前半段 vs 后半段）
        mid_point = len(memories) // 2
        first_half_intensity = sum(m.emotion_intensity for m in memories[:mid_point]) / len(memories[:mid_point])
        second_half_intensity = sum(m.emotion_intensity for m in memories[mid_point:]) / len(memories[mid_point:])
        
        if second_half_intensity > first_half_intensity:
            trend = "improving"
        elif second_half_intensity < first_half_intensity:
            trend = "declining"
        else:
            trend = "stable"
        
        return EmotionStatisticsResponse(
            total_records=len(memories),
            primary_emotion=primary_emotion,
            emotion_distribution=emotion_counts,
            average_intensity=total_intensity / len(memories),
            trend=trend
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"统计计算失败: {e}")
        raise HTTPException(status_code=500, detail="统计失败")


@router.post("/batch-analyze")
async def batch_analyze_emotions(
    requests_list: List[EmotionAnalyzeRequest],
    db: SessionLocal = Depends(get_db)
):
    """
    批量分析多个情绪请求
    
    参数:
    - requests_list: 多个分析请求列表
    
    返回:
    - 多个分析结果
    """
    try:
        results = []
        for req in requests_list:
            try:
                analysis_result = await emotion_analyzer.analyze(
                    text=req.text,
                    audio_data=req.audio_base64,
                    scene=req.scene,
                    metadata=req.metadata
                )
                results.append({
                    "success": True,
                    "data": analysis_result
                })
            except Exception as e:
                results.append({
                    "success": False,
                    "error": str(e)
                })
        
        return {"results": results}
    
    except Exception as e:
        logger.error(f"批量分析失败: {e}")
        raise HTTPException(status_code=500, detail="批量分析失败")


@router.delete("/memory/{memory_id}")
async def delete_memory(
    memory_id: int,
    user_id: int,
    db: SessionLocal = Depends(get_db)
):
    """
    删除特定的记忆记录（用户本人确认）
    """
    try:
        memory = db.query(Memory).filter(
            Memory.id == memory_id,
            Memory.user_id == user_id
        ).first()
        
        if not memory:
            raise HTTPException(status_code=404, detail="记录不存在")
        
        db.delete(memory)
        db.commit()
        
        return {"message": "记录已删除"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除失败: {e}")
        raise HTTPException(status_code=500, detail="删除失败")
