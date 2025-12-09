"""
应用推荐器 - 根据情绪推荐DApp
文件: backend-ai/app/services/dapp_recommender.py
功能: 根据情绪类型、强度和用户历史推荐应用
"""

from typing import List, Dict, Optional
from datetime import datetime
import json


class DAppRecommender:
    """应用推荐引擎"""

    def __init__(self):
        # 预定义的应用映射和匹配规则
        self.app_catalog = {
            'healing': {
                'id': 1,
                'name': '声音疗愈站',
                'type': 'healing',
                'category': '疗愈',
                'description': 'AI陪伴对话、治愈音乐、冥想引导、情绪日记，帮您在悲伤时找到心灵寄托',
                'icon': '🌙',
                'features': ['AI陪伴对话', '治愈音乐', '冥想引导', '情绪日记', 'TTS语音'],
                'entry_point': '/healing',
                'suitable_emotions': ['sad', 'anxious'],
                'base_score': 0.8
            },
            'theatre': {
                'id': 2,
                'name': '声音剧场',
                'type': 'theatre',
                'category': '娱乐',
                'description': 'AI播客、深夜电台、有声书、知识漫谈，在平静中享受高质量内容',
                'icon': '🎙️',
                'features': ['AI播客', '深夜电台', '有声书', '知识漫谈', 'WebSocket流式'],
                'entry_point': '/theatre',
                'suitable_emotions': ['calm', 'neutral'],
                'base_score': 0.75
            },
            'workshop': {
                'id': 3,
                'name': 'AI音乐工坊',
                'type': 'workshop',
                'category': '创意',
                'description': '哼唱转歌曲、自动编曲、智能混音、作品分享，快乐时最好的创意表达',
                'icon': '🎼',
                'features': ['哼唱转歌', '自动编曲', '智能混音', '歌词创作', '作品分享'],
                'entry_point': '/workshop',
                'suitable_emotions': ['happy', 'excited'],
                'base_score': 0.85
            },
            'assistant': {
                'id': 4,
                'name': '个人声音助手',
                'type': 'assistant',
                'category': '助手',
                'description': '语音对话、新闻播报、日程管理、灵感记录，您日常的声音伙伴',
                'icon': '🤖',
                'features': ['语音对话', '新闻播报', '日程提醒', '灵感记录', '任务管理'],
                'entry_point': '/assistant',
                'suitable_emotions': ['neutral', 'calm'],
                'base_score': 0.7
            }
        }

    def recommend(
        self,
        emotion_type: str,
        emotion_intensity: float = 0.5,
        user_id: Optional[str] = None,
        user_history: Optional[List[Dict]] = None
    ) -> Dict:
        """
        根据情绪推荐应用

        Args:
            emotion_type: 情绪类型 ('sad', 'calm', 'happy', 'neutral')
            emotion_intensity: 情绪强度 (0-1)
            user_id: 用户ID
            user_history: 用户历史记录

        Returns:
            {
                'emotion_type': str,
                'recommended_apps': List[Dict],
                'primary_recommendation': Dict
            }
        """

        # 计算应用匹配分数
        app_scores = self._calculate_scores(
            emotion_type,
            emotion_intensity,
            user_history or []
        )

        # 排序应用
        recommended_apps = sorted(
            app_scores,
            key=lambda x: x['match_score'],
            reverse=True
        )

        return {
            'emotion_type': emotion_type,
            'emotion_intensity': emotion_intensity,
            'recommended_apps': recommended_apps,
            'primary_recommendation': recommended_apps[0] if recommended_apps else None
        }

    def _calculate_scores(
        self,
        emotion_type: str,
        emotion_intensity: float,
        user_history: List[Dict]
    ) -> List[Dict]:
        """
        计算每个应用的匹配分数

        Args:
            emotion_type: 情绪类型
            emotion_intensity: 情绪强度
            user_history: 用户历史

        Returns:
            带分数的应用列表
        """

        scores = []

        for app_key, app_info in self.app_catalog.items():
            # 基础分数
            score = app_info['base_score']

            # 情绪匹配加分
            if emotion_type in app_info['suitable_emotions']:
                score += 0.15
            else:
                score -= 0.1

            # 强度调整
            if emotion_type == 'sad' and emotion_intensity > 0.6:
                # 悲伤且强度高，更推荐疗愈
                if app_key == 'healing':
                    score += 0.1
            elif emotion_type == 'happy' and emotion_intensity > 0.6:
                # 快乐且强度高，更推荐创意工坊
                if app_key == 'workshop':
                    score += 0.1

            # 用户历史加分（偏好学习）
            if user_history:
                app_usage_count = sum(
                    1 for h in user_history if h.get('app_used') == app_key
                )
                score += min(app_usage_count * 0.05, 0.2)  # 最多加0.2

            # 确保分数在0-1之间
            score = max(0, min(1, score))

            # 构建返回对象
            app_with_score = {
                **app_info,
                'match_score': round(score, 3),
                'reason': self._get_recommendation_reason(
                    emotion_type,
                    app_key,
                    score
                )
            }

            scores.append(app_with_score)

        return scores

    def _get_recommendation_reason(
        self,
        emotion_type: str,
        app_type: str,
        score: float
    ) -> str:
        """
        生成推荐理由
        """

        reasons = {
            'sad_healing': '根据您当前的悲伤情绪，疗愈站会用温暖的声音陪伴您',
            'sad_theatre': '舒缓的播客和有声书可能会转移您的注意力',
            'calm_theatre': '这是享受高质量内容的最好时刻',
            'calm_healing': '进一步放松身心的好选择',
            'happy_workshop': '快乐的时候最适合创意表达，一起创作音乐吧',
            'happy_theatre': '分享您的快乐，为播客创作贡献内容',
            'neutral_assistant': '让个人助手帮您管理日常任务',
            'neutral_theatre': '平衡的内容消费，丰富您的知识',
            'neutral_workshop': '稳定的创意输出环境'
        }

        key = f'{emotion_type}_{app_type}'
        return reasons.get(key, f'为您推荐的{app_type}应用')

    def batch_recommend(
        self,
        user_id: str,
        emotion_records: List[Dict]
    ) -> Dict:
        """
        基于用户历史进行批量推荐
        """

        if not emotion_records:
            return self.recommend('neutral')

        # 分析用户最近的情绪模式
        recent_emotions = emotion_records[-10:]  # 最近10条
        primary_emotion = max(
            set(e['emotion_type'] for e in recent_emotions),
            key=lambda x: sum(1 for e in recent_emotions if e['emotion_type'] == x)
        )
        avg_intensity = sum(e.get('intensity', 0.5) for e in recent_emotions) / len(recent_emotions)

        # 获取应用推荐
        return self.recommend(
            primary_emotion,
            avg_intensity,
            user_id,
            emotion_records
        )


class AppMatcher:
    """应用匹配和融合器"""

    @staticmethod
    def match_by_preference(
        user_preferences: Dict,
        available_apps: List[Dict]
    ) -> List[Dict]:
        """
        根据用户偏好匹配应用
        """

        matched = []

        for app in available_apps:
            score = 0

            # 检查用户偏好的特性
            app_features = set(app.get('features', []))
            preferred_features = set(user_preferences.get('features', []))

            if preferred_features:
                overlap = app_features & preferred_features
                score += len(overlap) / len(preferred_features) * 0.5

            # 检查用户不愿意的应用类型
            if app['type'] not in user_preferences.get('excluded_types', []):
                score += 0.3

            if score > 0:
                matched.append({
                    **app,
                    'preference_match_score': round(score, 3)
                })

        return sorted(matched, key=lambda x: x.get('preference_match_score', 0), reverse=True)

    @staticmethod
    def personalize_recommendation(
        base_recommendations: List[Dict],
        user_context: Dict
    ) -> List[Dict]:
        """
        个性化推荐结果
        """

        # 根据用户背景调整排名
        time_of_day = user_context.get('time_of_day')
        device_type = user_context.get('device_type')  # 'mobile', 'desktop', 'ktv'

        personalized = []

        for app in base_recommendations:
            adjusted_score = app.get('match_score', 0)

            # KTV场景的特殊处理
            if device_type == 'ktv':
                if app['type'] == 'workshop':  # 音乐工坊最适合KTV
                    adjusted_score += 0.15
                elif app['type'] == 'theatre':  # 剧场也不错
                    adjusted_score += 0.08

            # 夜间时间的调整
            if time_of_day == 'night':
                if app['type'] in ['theatre', 'healing']:
                    adjusted_score += 0.1

            personalized.append({
                **app,
                'final_score': round(min(1, adjusted_score), 3)
            })

        return sorted(personalized, key=lambda x: x.get('final_score', 0), reverse=True)


# 导出实例
recommender = DAppRecommender()
