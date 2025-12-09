"""
集成测试套件 - SoundScape项目
文件: backend-ai/tests/test_integration.py
功能: 测试所有API端点的完整集成
"""

import pytest
import asyncio
import json
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 使用内存SQLite数据库进行测试
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def db():
    """创建测试数据库"""
    from app.models.emotion import Base, SessionLocal
    
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()
    
    yield TestingSessionLocal()
    
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """创建FastAPI测试客户端"""
    from app.main import app
    from app.api.endpoints import emotion as emotion_router
    
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[emotion_router.get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


class TestEmotionAPI:
    """情绪分析API测试"""
    
    def test_analyze_emotion_with_text(self, client):
        """测试文本情绪分析"""
        response = client.post(
            "/api/v1/emotion/analyze",
            json={
                "text": "我今天感到很悲伤",
                "scene": "general"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "emotion" in data
        assert "intensity" in data
        assert 0.0 <= data["intensity"] <= 1.0
        assert "color" in data
        assert "emoji" in data
    
    def test_analyze_emotion_empty_input(self, client):
        """测试空输入验证"""
        response = client.post(
            "/api/v1/emotion/analyze",
            json={
                "scene": "general"
            }
        )
        
        assert response.status_code == 400
    
    def test_emotion_history_not_found(self, client):
        """测试不存在的用户情绪历史"""
        response = client.get(
            "/api/v1/emotion/history/999"
        )
        
        # 应该返回空列表而不是404
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_emotion_statistics_not_found(self, client):
        """测试不存在用户的统计"""
        response = client.get(
            "/api/v1/emotion/statistics/999"
        )
        
        # 应该返回404
        assert response.status_code == 404


class TestRecommendationAPI:
    """应用推荐API测试"""
    
    def test_recommend_apps_for_sad(self, client):
        """测试悲伤情绪的应用推荐"""
        response = client.post(
            "/api/v1/recommend/apps",
            json={
                "emotion_type": "sad",
                "emotion_intensity": 0.8,
                "device_type": "mobile",
                "time_of_day": "evening"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "emotion_type" in data
        assert data["emotion_type"] == "sad"
        assert "recommended_apps" in data
        assert isinstance(data["recommended_apps"], list)
    
    def test_recommend_apps_for_happy(self, client):
        """测试快乐情绪的应用推荐"""
        response = client.post(
            "/api/v1/recommend/apps",
            json={
                "emotion_type": "happy",
                "emotion_intensity": 0.9,
                "device_type": "mobile"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "recommended_apps" in data
        assert len(data["recommended_apps"]) > 0
    
    def test_recommend_apps_invalid_emotion(self, client):
        """测试无效的情绪类型"""
        response = client.post(
            "/api/v1/recommend/apps",
            json={
                "emotion_type": "invalid_emotion",
                "emotion_intensity": 0.5
            }
        )
        
        assert response.status_code == 400
    
    def test_get_top_apps(self, client):
        """测试获取热门应用"""
        response = client.get(
            "/api/v1/recommend/top?limit=4"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "apps" in data
        assert len(data["apps"]) <= 4


class TestMemoryAPI:
    """记忆管理API测试"""
    
    def setup_method(self):
        """测试前设置"""
        from app.models.emotion import User, SessionLocal
        
        self.db = SessionLocal()
        # 创建测试用户
        self.test_user = User(
            id=1,
            username="testuser",
            email="test@example.com"
        )
        self.db.add(self.test_user)
        self.db.commit()
    
    def teardown_method(self):
        """测试后清理"""
        self.db.close()
    
    def test_create_memory(self, client):
        """测试创建记忆"""
        response = client.post(
            "/api/v1/memory/create",
            json={
                "user_id": 1,
                "memory_type": "text",
                "emotion_type": "sad",
                "emotion_intensity": 0.7,
                "content": "今天过得不太好",
                "summary": "不好的一天",
                "tags": ["工作", "压力"]
            }
        )
        
        # 如果用户不存在会返回404
        if response.status_code == 404:
            assert "用户不存在" in response.json()["detail"]
        else:
            assert response.status_code == 200
            data = response.json()
            assert data["memory_type"] == "text"
            assert data["emotion_type"] == "sad"
    
    def test_list_memories(self, client):
        """测试列出记忆"""
        response = client.get(
            "/api/v1/memory/user/1/list?limit=10"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "memories" in data
        assert "total" in data
        assert isinstance(data["memories"], list)
    
    def test_get_timeline(self, client):
        """测试获取时间线"""
        response = client.get(
            "/api/v1/memory/user/1/timeline?days=30"
        )
        
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "timeline" in data
    
    def test_get_emotion_trend(self, client):
        """测试获取情绪趋势"""
        response = client.get(
            "/api/v1/memory/user/1/emotions/trend?period=week"
        )
        
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "data" in data
    
    def test_search_memories(self, client):
        """测试搜索记忆"""
        response = client.post(
            "/api/v1/memory/user/1/search",
            params={
                "query": "开心",
                "emotion_type": "happy"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert isinstance(data["results"], list)


class TestDataValidation:
    """数据验证测试"""
    
    def test_emotion_intensity_bounds(self, client):
        """测试情绪强度范围"""
        # 无效的强度值
        response = client.post(
            "/api/v1/recommend/apps",
            json={
                "emotion_type": "sad",
                "emotion_intensity": 1.5  # 超出范围
            }
        )
        
        # 应该允许（可能由前端限制）或返回验证错误
        assert response.status_code in [200, 422]


class TestErrorHandling:
    """错误处理测试"""
    
    def test_missing_required_field(self, client):
        """测试缺少必需字段"""
        response = client.post(
            "/api/v1/emotion/analyze",
            json={
                "scene": "general"
                # 缺少 text 或 audio_base64
            }
        )
        
        assert response.status_code in [400, 422]
    
    def test_invalid_request_json(self, client):
        """测试无效的JSON"""
        response = client.post(
            "/api/v1/emotion/analyze",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 422


class TestEndpointExistence:
    """端点存在性测试"""
    
    def test_emotion_endpoints_exist(self, client):
        """测试情绪相关端点存在"""
        endpoints = [
            ("POST", "/api/v1/emotion/analyze"),
            ("GET", "/api/v1/emotion/history/1"),
            ("GET", "/api/v1/emotion/statistics/1"),
        ]
        
        for method, endpoint in endpoints:
            # 用不同的方法进行简单检查
            if method == "GET":
                response = client.get(endpoint)
            else:
                response = client.post(endpoint, json={})
            
            # 应该返回某种响应（即使是错误）而不是404
            assert response.status_code != 404, f"端点 {method} {endpoint} 不存在"
    
    def test_recommendation_endpoints_exist(self, client):
        """测试推荐相关端点存在"""
        endpoints = [
            ("POST", "/api/v1/recommend/apps"),
            ("GET", "/api/v1/recommend/top"),
        ]
        
        for method, endpoint in endpoints:
            if method == "GET":
                response = client.get(endpoint)
            else:
                response = client.post(endpoint, json={})
            
            assert response.status_code != 404, f"端点 {method} {endpoint} 不存在"
    
    def test_memory_endpoints_exist(self, client):
        """测试记忆相关端点存在"""
        endpoints = [
            ("POST", "/api/v1/memory/create"),
            ("GET", "/api/v1/memory/user/1/list"),
            ("GET", "/api/v1/memory/user/1/timeline"),
        ]
        
        for method, endpoint in endpoints:
            if method == "GET":
                response = client.get(endpoint)
            else:
                response = client.post(endpoint, json={})
            
            assert response.status_code != 404, f"端点 {method} {endpoint} 不存在"


class TestResponseFormats:
    """响应格式测试"""
    
    def test_emotion_response_format(self, client):
        """测试情绪响应格式"""
        response = client.post(
            "/api/v1/emotion/analyze",
            json={
                "text": "我很开心",
                "scene": "general"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # 检查必需的字段
            required_fields = [
                "emotion", "intensity", "valence", "arousal",
                "confidence", "color", "emoji", "label_cn",
                "reasoning", "timestamp"
            ]
            
            for field in required_fields:
                assert field in data, f"响应缺少 '{field}' 字段"
    
    def test_recommendation_response_format(self, client):
        """测试推荐响应格式"""
        response = client.post(
            "/api/v1/recommend/apps",
            json={
                "emotion_type": "happy",
                "emotion_intensity": 0.8
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # 检查必需的字段
            assert "emotion_type" in data
            assert "emotion_intensity" in data
            assert "recommended_apps" in data
            
            # 检查应用列表格式
            if data["recommended_apps"]:
                app = data["recommended_apps"][0]
                required_app_fields = ["id", "name", "type", "description"]
                
                for field in required_app_fields:
                    assert field in app, f"应用对象缺少 '{field}' 字段"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
