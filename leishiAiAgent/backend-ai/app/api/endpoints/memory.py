"""
记忆管理API端点
文件: backend-ai/app/api/endpoints/memory.py
功能: 提供记忆CRUD操作和情绪时间线可视化
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List, Dict
import logging
from datetime import datetime, timedelta
from sqlalchemy import func, desc

from app.models.emotion import Memory, Session as SessionModel, User, SessionLocal
from app.services.emotion_analyzer import EmotionAnalyzer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/memory", tags=["memory"])


# ==================== 数据模型 ====================

class MemoryCreateRequest(BaseModel):
    """创建记忆请求"""
    user_id: int
    session_id: Optional[int] = None
    memory_type: str  # "text", "audio", "image", "video"
    emotion_type: str  # 情绪类型
    emotion_intensity: float  # 0-1
    content: str
    summary: Optional[str] = None
    tags: Optional[List[str]] = []
    audio_path: Optional[str] = None
    image_path: Optional[str] = None


class MemoryUpdateRequest(BaseModel):
    """更新记忆请求"""
    content: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[List[str]] = None
    emotion_intensity: Optional[float] = None


class MemoryResponse(BaseModel):
    """记忆响应"""
    id: int
    memory_type: str
    emotion_type: str
    emotion_intensity: float
    content: str
    summary: Optional[str]
    tags: List[str]
    audio_path: Optional[str]
    image_path: Optional[str]
    created_at: str
    updated_at: Optional[str]


class MemoryTimelineResponse(BaseModel):
    """时间线响应"""
    date: str
    emotions: Dict[str, int]  # 情绪->计数
    memory_count: int
    primary_emotion: str


class MemoryTrendResponse(BaseModel):
    """趋势响应"""
    period: str  # "day", "week", "month"
    data: List[Dict]  # [{date, emotion, intensity, count}, ...]
    trend_analysis: str


class MemoryTagResponse(BaseModel):
    """标签响应"""
    tag: str
    count: int
    emotions: Dict[str, int]


# ==================== 初始化 ====================

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================== API端点 ====================

@router.post("/create", response_model=MemoryResponse)
async def create_memory(
    request: MemoryCreateRequest,
    db: SessionLocal = Depends(get_db)
):
    """
    创建新的记忆记录
    
    参数:
    - user_id: 用户ID
    - session_id: 会话ID（可选）
    - memory_type: 记忆类型（text/audio/image/video）
    - emotion_type: 情绪类型
    - emotion_intensity: 情绪强度（0-1）
    - content: 内容
    - summary: 摘要（可选）
    - tags: 标签列表
    - audio_path: 音频文件路径（可选）
    - image_path: 图像文件路径（可选）
    
    返回:
    - 创建的记忆记录
    """
    try:
        # 验证用户存在
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        # 创建记忆记录
        memory = Memory(
            user_id=request.user_id,
            session_id=request.session_id,
            memory_type=request.memory_type,
            emotion_type=request.emotion_type,
            emotion_intensity=request.emotion_intensity,
            content=request.content,
            summary=request.summary,
            tags=request.tags or [],
            audio_path=request.audio_path,
            image_path=request.image_path,
            created_at=datetime.utcnow()
        )
        
        db.add(memory)
        db.commit()
        db.refresh(memory)
        
        logger.info(f"用户{request.user_id}创建了记忆 {memory.id}")
        
        return MemoryResponse(
            id=memory.id,
            memory_type=memory.memory_type,
            emotion_type=memory.emotion_type,
            emotion_intensity=memory.emotion_intensity,
            content=memory.content,
            summary=memory.summary,
            tags=memory.tags or [],
            audio_path=memory.audio_path,
            image_path=memory.image_path,
            created_at=memory.created_at.isoformat(),
            updated_at=None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建记忆失败: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="创建记忆失败")


@router.get("/{memory_id}", response_model=MemoryResponse)
async def get_memory(
    memory_id: int,
    user_id: int,
    db: SessionLocal = Depends(get_db)
):
    """
    获取单个记忆记录（仅允许查看自己的记忆）
    """
    try:
        memory = db.query(Memory).filter(
            Memory.id == memory_id,
            Memory.user_id == user_id
        ).first()
        
        if not memory:
            raise HTTPException(status_code=404, detail="记忆不存在")
        
        return MemoryResponse(
            id=memory.id,
            memory_type=memory.memory_type,
            emotion_type=memory.emotion_type,
            emotion_intensity=memory.emotion_intensity,
            content=memory.content,
            summary=memory.summary,
            tags=memory.tags or [],
            audio_path=memory.audio_path,
            image_path=memory.image_path,
            created_at=memory.created_at.isoformat(),
            updated_at=memory.updated_at.isoformat() if memory.updated_at else None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取记忆失败: {e}")
        raise HTTPException(status_code=500, detail="获取记忆失败")


@router.get("/user/{user_id}/list")
async def list_user_memories(
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    emotion_filter: Optional[str] = None,
    db: SessionLocal = Depends(get_db)
):
    """
    列出用户的所有记忆（分页）
    
    参数:
    - user_id: 用户ID
    - limit: 返回数量（最多50）
    - offset: 偏移量
    - emotion_filter: 情绪过滤（可选）
    
    返回:
    - 记忆列表和总数
    """
    try:
        query = db.query(Memory).filter(Memory.user_id == user_id)
        
        # 应用情绪过滤
        if emotion_filter:
            query = query.filter(Memory.emotion_type == emotion_filter)
        
        # 获取总数
        total = query.count()
        
        # 分页查询
        memories = query.order_by(desc(Memory.created_at)).limit(limit).offset(offset).all()
        
        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "memories": [
                {
                    "id": m.id,
                    "memory_type": m.memory_type,
                    "emotion_type": m.emotion_type,
                    "emotion_intensity": m.emotion_intensity,
                    "content": m.content[:100] + ("..." if len(m.content) > 100 else ""),
                    "summary": m.summary,
                    "tags": m.tags or [],
                    "created_at": m.created_at.isoformat()
                }
                for m in memories
            ]
        }
    
    except Exception as e:
        logger.error(f"列出记忆失败: {e}")
        raise HTTPException(status_code=500, detail="列出记忆失败")


@router.put("/{memory_id}")
async def update_memory(
    memory_id: int,
    user_id: int,
    request: MemoryUpdateRequest,
    db: SessionLocal = Depends(get_db)
):
    """
    更新记忆记录
    """
    try:
        memory = db.query(Memory).filter(
            Memory.id == memory_id,
            Memory.user_id == user_id
        ).first()
        
        if not memory:
            raise HTTPException(status_code=404, detail="记忆不存在")
        
        # 更新字段
        if request.content is not None:
            memory.content = request.content
        if request.summary is not None:
            memory.summary = request.summary
        if request.tags is not None:
            memory.tags = request.tags
        if request.emotion_intensity is not None:
            memory.emotion_intensity = request.emotion_intensity
        
        memory.updated_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"用户{user_id}更新了记忆 {memory_id}")
        
        return {
            "success": True,
            "message": "记忆已更新",
            "memory_id": memory.id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新记忆失败: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="更新记忆失败")


@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: int,
    user_id: int,
    db: SessionLocal = Depends(get_db)
):
    """
    删除记忆记录
    """
    try:
        memory = db.query(Memory).filter(
            Memory.id == memory_id,
            Memory.user_id == user_id
        ).first()
        
        if not memory:
            raise HTTPException(status_code=404, detail="记忆不存在")
        
        db.delete(memory)
        db.commit()
        
        logger.info(f"用户{user_id}删除了记忆 {memory_id}")
        
        return {
            "success": True,
            "message": "记忆已删除"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除记忆失败: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="删除记忆失败")


@router.get("/user/{user_id}/timeline")
async def get_memory_timeline(
    user_id: int,
    days: int = 30,
    db: SessionLocal = Depends(get_db)
):
    """
    获取用户的记忆时间线
    
    返回按日期聚合的情绪数据
    """
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        memories = db.query(Memory).filter(
            Memory.user_id == user_id,
            Memory.created_at >= start_date
        ).all()
        
        # 按日期聚合
        timeline = {}
        for memory in memories:
            date_key = memory.created_at.date().isoformat()
            if date_key not in timeline:
                timeline[date_key] = {
                    "emotions": {},
                    "memory_count": 0,
                    "primary_emotion": None
                }
            
            emotion = memory.emotion_type
            timeline[date_key]["emotions"][emotion] = timeline[date_key]["emotions"].get(emotion, 0) + 1
            timeline[date_key]["memory_count"] += 1
        
        # 确定每天的主要情绪
        for date_key in timeline:
            emotions = timeline[date_key]["emotions"]
            timeline[date_key]["primary_emotion"] = max(emotions, key=emotions.get) if emotions else None
        
        return {
            "user_id": user_id,
            "period_days": days,
            "timeline": timeline
        }
    
    except Exception as e:
        logger.error(f"获取时间线失败: {e}")
        raise HTTPException(status_code=500, detail="获取时间线失败")


@router.get("/user/{user_id}/emotions/trend")
async def get_emotion_trend(
    user_id: int,
    period: str = "week",  # week, month, all
    db: SessionLocal = Depends(get_db)
):
    """
    获取情绪趋势分析
    
    返回一段时间内的情绪变化趋势
    """
    try:
        # 确定时间范围
        if period == "week":
            start_date = datetime.utcnow() - timedelta(days=7)
        elif period == "month":
            start_date = datetime.utcnow() - timedelta(days=30)
        else:
            start_date = None
        
        # 查询数据
        query = db.query(Memory).filter(Memory.user_id == user_id)
        if start_date:
            query = query.filter(Memory.created_at >= start_date)
        
        memories = query.order_by(Memory.created_at).all()
        
        if not memories:
            raise HTTPException(status_code=404, detail="没有数据")
        
        # 按日期和情绪聚合
        trend_data = {}
        for memory in memories:
            date_key = memory.created_at.date().isoformat()
            if date_key not in trend_data:
                trend_data[date_key] = {
                    "emotions": {},
                    "avg_intensity": 0,
                    "count": 0
                }
            
            emotion = memory.emotion_type
            trend_data[date_key]["emotions"][emotion] = trend_data[date_key]["emotions"].get(emotion, 0) + 1
            trend_data[date_key]["avg_intensity"] += memory.emotion_intensity
            trend_data[date_key]["count"] += 1
        
        # 计算平均强度
        for date_key in trend_data:
            if trend_data[date_key]["count"] > 0:
                trend_data[date_key]["avg_intensity"] /= trend_data[date_key]["count"]
        
        return {
            "user_id": user_id,
            "period": period,
            "data": [
                {
                    "date": date,
                    **trend_data[date]
                }
                for date in sorted(trend_data.keys())
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取趋势失败: {e}")
        raise HTTPException(status_code=500, detail="获取趋势失败")


@router.get("/user/{user_id}/tags")
async def get_memory_tags(
    user_id: int,
    db: SessionLocal = Depends(get_db)
):
    """
    获取用户的所有标签及其关联的情绪数据
    """
    try:
        memories = db.query(Memory).filter(Memory.user_id == user_id).all()
        
        # 统计标签
        tags_stats = {}
        for memory in memories:
            if memory.tags:
                for tag in memory.tags:
                    if tag not in tags_stats:
                        tags_stats[tag] = {
                            "count": 0,
                            "emotions": {}
                        }
                    tags_stats[tag]["count"] += 1
                    emotion = memory.emotion_type
                    tags_stats[tag]["emotions"][emotion] = tags_stats[tag]["emotions"].get(emotion, 0) + 1
        
        return {
            "user_id": user_id,
            "tags": [
                {
                    "tag": tag,
                    "count": stats["count"],
                    "emotions": stats["emotions"]
                }
                for tag, stats in sorted(tags_stats.items(), key=lambda x: x[1]["count"], reverse=True)
            ]
        }
    
    except Exception as e:
        logger.error(f"获取标签失败: {e}")
        raise HTTPException(status_code=500, detail="获取标签失败")


@router.post("/user/{user_id}/search")
async def search_memories(
    user_id: int,
    query: str,
    emotion_type: Optional[str] = None,
    db: SessionLocal = Depends(get_db)
):
    """
    搜索用户的记忆
    
    支持全文搜索和情绪过滤
    """
    try:
        # 构建查询
        search_query = db.query(Memory).filter(Memory.user_id == user_id)
        
        # 全文搜索
        if query:
            search_query = search_query.filter(
                (Memory.content.like(f"%{query}%")) |
                (Memory.summary.like(f"%{query}%")) |
                (Memory.tags.any(query))  # 标签中包含
            )
        
        # 情绪过滤
        if emotion_type:
            search_query = search_query.filter(Memory.emotion_type == emotion_type)
        
        results = search_query.order_by(desc(Memory.created_at)).limit(50).all()
        
        return {
            "query": query,
            "emotion_filter": emotion_type,
            "count": len(results),
            "results": [
                {
                    "id": m.id,
                    "memory_type": m.memory_type,
                    "emotion_type": m.emotion_type,
                    "emotion_intensity": m.emotion_intensity,
                    "content": m.content[:150],
                    "summary": m.summary,
                    "tags": m.tags or [],
                    "created_at": m.created_at.isoformat()
                }
                for m in results
            ]
        }
    
    except Exception as e:
        logger.error(f"搜索失败: {e}")
        raise HTTPException(status_code=500, detail="搜索失败")
