"""
推荐API端点
文件: backend-ai/app/api/endpoints/recommend.py
功能: 提供应用推荐接口
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import logging

from app.services.dapp_recommender import recommender, AppMatcher

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/recommend", tags=["recommendation"])


# ==================== 数据模型 ====================

class RecommendRequest(BaseModel):
    """推荐请求"""
    emotion_type: str  # 'sad', 'calm', 'happy', 'neutral'
    emotion_intensity: float = 0.5  # 0-1
    user_id: Optional[str] = None
    device_type: Optional[str] = 'mobile'  # 'mobile', 'desktop', 'ktv'
    time_of_day: Optional[str] = 'afternoon'  # 'morning', 'afternoon', 'evening', 'night'


class UserPreference(BaseModel):
    """用户偏好"""
    excluded_types: List[str] = []
    preferred_features: List[str] = []
    devices: List[str] = []


class AppInfo(BaseModel):
    """应用信息"""
    id: int
    name: str
    type: str
    category: str
    description: str
    icon: str
    features: List[str]
    entry_point: str
    match_score: float
    reason: Optional[str] = None


class RecommendResponse(BaseModel):
    """推荐响应"""
    emotion_type: str
    emotion_intensity: float
    recommended_apps: List[AppInfo]
    primary_recommendation: Optional[AppInfo] = None


# ==================== 路由端点 ====================

@router.post("/apps", response_model=RecommendResponse)
async def recommend_apps(request: RecommendRequest):
    """
    根据情绪推荐应用

    Args:
        emotion_type: 情绪类型
        emotion_intensity: 情绪强度（0-1）
        user_id: 用户ID（可选，用于学习用户偏好）
        device_type: 设备类型（mobile/desktop/ktv）
        time_of_day: 一天中的时间

    Returns:
        推荐的应用列表
    """

    try:
        # 验证情绪类型
        valid_emotions = ['sad', 'calm', 'happy', 'neutral']
        if request.emotion_type not in valid_emotions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid emotion_type. Must be one of {valid_emotions}"
            )

        # 获取基础推荐
        recommendation = recommender.recommend(
            emotion_type=request.emotion_type,
            emotion_intensity=request.emotion_intensity,
            user_id=request.user_id,
            user_history=[]  # 实际应从数据库加载
        )

        # 个性化推荐
        user_context = {
            'device_type': request.device_type,
            'time_of_day': request.time_of_day
        }

        personalized_apps = AppMatcher.personalize_recommendation(
            recommendation['recommended_apps'],
            user_context
        )

        # 构建响应
        return RecommendResponse(
            emotion_type=request.emotion_type,
            emotion_intensity=request.emotion_intensity,
            recommended_apps=[
                AppInfo(
                    id=app['id'],
                    name=app['name'],
                    type=app['type'],
                    category=app['category'],
                    description=app['description'],
                    icon=app['icon'],
                    features=app['features'],
                    entry_point=app['entry_point'],
                    match_score=app.get('final_score', app.get('match_score', 0)),
                    reason=app.get('reason')
                )
                for app in personalized_apps
            ],
            primary_recommendation=AppInfo(
                id=personalized_apps[0]['id'],
                name=personalized_apps[0]['name'],
                type=personalized_apps[0]['type'],
                category=personalized_apps[0]['category'],
                description=personalized_apps[0]['description'],
                icon=personalized_apps[0]['icon'],
                features=personalized_apps[0]['features'],
                entry_point=personalized_apps[0]['entry_point'],
                match_score=personalized_apps[0].get('final_score', 0),
                reason=personalized_apps[0].get('reason')
            ) if personalized_apps else None
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"推荐失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"推荐失败: {str(e)}")


@router.post("/personalize")
async def personalize_recommendation(
    request: RecommendRequest,
    preferences: UserPreference
):
    """
    基于用户偏好的个性化推荐
    """

    try:
        # 获取基础推荐
        recommendation = recommender.recommend(
            emotion_type=request.emotion_type,
            emotion_intensity=request.emotion_intensity
        )

        # 应用用户偏好过滤
        filtered_apps = AppMatcher.match_by_preference(
            {
                'features': preferences.preferred_features,
                'excluded_types': preferences.excluded_types
            },
            recommendation['recommended_apps']
        )

        # 个性化调整
        user_context = {
            'device_type': request.device_type,
            'time_of_day': request.time_of_day
        }

        final_apps = AppMatcher.personalize_recommendation(
            filtered_apps,
            user_context
        )

        return {
            'emotion_type': request.emotion_type,
            'recommended_apps': final_apps,
            'personalized': True
        }

    except Exception as e:
        logger.error(f"个性化推荐失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"个性化推荐失败: {str(e)}")


@router.get("/top")
async def get_top_apps(limit: int = 4):
    """
    获取整体最受欢迎的应用
    """

    try:
        # 这里应该从数据库获取热度数据
        apps = [
            {
                'id': 1,
                'name': '声音疗愈站',
                'type': 'healing',
                'popularity': 950,
                'rating': 4.8
            },
            {
                'id': 3,
                'name': 'AI音乐工坊',
                'type': 'workshop',
                'popularity': 890,
                'rating': 4.7
            },
            {
                'id': 2,
                'name': '声音剧场',
                'type': 'theatre',
                'popularity': 820,
                'rating': 4.6
            },
            {
                'id': 4,
                'name': '个人声音助手',
                'type': 'assistant',
                'popularity': 750,
                'rating': 4.5
            }
        ]

        return {
            'apps': apps[:limit],
            'total': len(apps)
        }

    except Exception as e:
        logger.error(f"获取热门应用失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取失败")


@router.post("/feedback")
async def record_recommendation_feedback(
    user_id: str,
    recommended_app_id: int,
    selected_app_id: int,
    satisfaction: int  # 1-5
):
    """
    记录推荐反馈，用于优化推荐算法
    """

    try:
        # 这里应该保存到数据库用于改进推荐
        logger.info(
            f"推荐反馈: 用户{user_id} 被推荐{recommended_app_id} 选择{selected_app_id} 满意度{satisfaction}"
        )

        return {
            'success': True,
            'message': '反馈已记录，感谢您的反馈！'
        }

    except Exception as e:
        logger.error(f"记录反馈失败: {str(e)}")
        raise HTTPException(status_code=500, detail="记录失败")
