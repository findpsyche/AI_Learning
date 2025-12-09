"""
单元测试 - 后端服务
使用 Pytest 框架
"""
import pytest
import json
from pathlib import Path
import sys

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app, get_db
from app.models.emotion import EmotionAnalyzer
from app.services.emotion_analyzer import analyze_emotion
from app.services.music_composer import MusicComposer
from app.services.story_generator import StoryGenerator


@pytest.fixture
def client():
    """创建测试客户端"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def sample_audio_data():
    """示例音频数据"""
    return b"fake_audio_data_bytes"


class TestEmotionAnalyzer:
    """情绪分析服务测试"""

    def test_analyze_text_emotion(self):
        """测试文本情绪分析"""
        text = "我今天很开心！"
        result = analyze_emotion(text=text)
        
        assert result is not None
        assert 'emotion' in result
        assert result['emotion'] in ['happy', 'sad', 'angry', 'calm', 'neutral']

    def test_analyze_empty_text(self):
        """测试空文本"""
        text = ""
        result = analyze_emotion(text=text)
        
        assert result is not None
        assert result['emotion'] in ['neutral', 'unknown']

    def test_emotion_confidence(self):
        """测试情绪置信度"""
        text = "我很伤心"
        result = analyze_emotion(text=text)
        
        assert 'confidence' in result
        assert 0 <= result['confidence'] <= 1

    def test_analyze_mixed_emotions(self):
        """测试混合情绪"""
        text = "我既开心又有点紧张"
        result = analyze_emotion(text=text)
        
        assert result is not None
        assert isinstance(result, dict)


class TestMusicComposer:
    """音乐创作服务测试"""

    @pytest.fixture
    def composer(self):
        return MusicComposer()

    def test_generate_humming_music(self, composer):
        """测试哼唱转歌曲"""
        audio_data = b"humming_audio"
        result = composer.compose_from_humming(audio_data)
        
        assert result is not None
        assert 'midi' in result or 'music' in result

    def test_adjust_tempo(self, composer):
        """测试调整节奏"""
        original_bpm = 120
        new_bpm = 140
        
        result = composer.adjust_tempo(original_bpm, new_bpm)
        
        assert result is not None
        assert result['bpm'] == new_bpm

    def test_adjust_key(self, composer):
        """测试调整调性"""
        original_key = 'C'
        new_key = 'G'
        
        result = composer.adjust_key(original_key, new_key)
        
        assert result is not None
        assert result['key'] == new_key

    def test_mixing_tracks(self, composer):
        """测试混音"""
        tracks = [
            {'name': 'Piano', 'volume': 0.8},
            {'name': 'Drums', 'volume': 0.7},
            {'name': 'Strings', 'volume': 0.6},
        ]
        
        result = composer.mix_tracks(tracks)
        
        assert result is not None
        assert 'mixed_audio' in result or 'result' in result


class TestStoryGenerator:
    """故事生成服务测试"""

    @pytest.fixture
    def generator(self):
        return StoryGenerator()

    def test_generate_story(self, generator):
        """测试故事生成"""
        prompt = "儿童冒险故事"
        result = generator.generate(prompt)
        
        assert result is not None
        assert isinstance(result, str)
        assert len(result) > 0

    def test_generate_story_with_emotion(self, generator):
        """测试情绪驱动的故事生成"""
        emotion = 'happy'
        scene = 'KTV'
        result = generator.generate_by_emotion(emotion, scene)
        
        assert result is not None
        assert isinstance(result, str)

    def test_story_branching(self, generator):
        """测试故事分支"""
        story_context = "开启了神奇的森林之旅"
        choices = ['向左走', '向右走', '爬上树']
        
        results = [generator.continue_story(story_context, choice) 
                   for choice in choices]
        
        assert len(results) == len(choices)
        assert all(r is not None for r in results)


class TestAPIEndpoints:
    """API端点测试"""

    def test_emotion_analyze_endpoint(self, client):
        """测试情绪分析端点"""
        response = client.post('/api/v1/emotion/analyze', 
            json={
                'text': '我很开心',
                'audio_data': None
            },
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201]
        data = json.loads(response.data)
        assert 'emotion' in data.get('data', {})

    def test_music_compose_endpoint(self, client):
        """测试音乐创作端点"""
        response = client.post('/api/v1/music/compose',
            json={
                'text': '快乐的音乐',
                'emotion': 'happy',
                'style': 'pop'
            },
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201]

    def test_story_generate_endpoint(self, client):
        """测试故事生成端点"""
        response = client.post('/api/v1/story/generate',
            json={
                'prompt': '冒险故事',
                'emotion': 'excited'
            },
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201]
        data = json.loads(response.data)
        assert 'story' in data.get('data', {})

    def test_health_check_endpoint(self, client):
        """测试健康检查端点"""
        response = client.get('/health')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data.get('status') == 'healthy'

    def test_recommendation_endpoint(self, client):
        """测试推荐端点"""
        response = client.post('/api/v1/recommendation',
            json={
                'emotion': 'sad',
                'user_id': 'test_user'
            },
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201]


class TestMemoryManagement:
    """记忆管理测试"""

    def test_save_memory(self, client):
        """测试保存记忆"""
        memory_data = {
            'user_id': 'test_user',
            'type': 'diary',
            'content': '今天很开心',
            'emotion': 'happy'
        }
        
        response = client.post('/api/v1/memory/save',
            json=memory_data,
            content_type='application/json'
        )
        
        assert response.status_code in [200, 201]

    def test_load_memories(self, client):
        """测试加载记忆"""
        response = client.get('/api/v1/memory?user_id=test_user')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data.get('data'), list)

    def test_memory_filtering(self, client):
        """测试记忆过滤"""
        response = client.get('/api/v1/memory?emotion=happy&user_id=test_user')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        memories = data.get('data', [])
        
        # 验证过滤结果
        for memory in memories:
            assert memory.get('emotion') == 'happy'


class TestErrorHandling:
    """错误处理测试"""

    def test_invalid_emotion_analysis(self, client):
        """测试无效的情绪分析"""
        response = client.post('/api/v1/emotion/analyze',
            json={},  # 缺少必要字段
            content_type='application/json'
        )
        
        assert response.status_code >= 400

    def test_missing_required_field(self, client):
        """测试缺少必需字段"""
        response = client.post('/api/v1/story/generate',
            json={'emotion': 'happy'},  # 缺少 prompt
            content_type='application/json'
        )
        
        assert response.status_code >= 400

    def test_invalid_json(self, client):
        """测试无效JSON"""
        response = client.post('/api/v1/emotion/analyze',
            data='invalid json',
            content_type='application/json'
        )
        
        assert response.status_code >= 400


class TestPerformance:
    """性能测试"""

    def test_emotion_analysis_performance(self):
        """测试情绪分析性能"""
        import time
        
        text = "这是一个测试文本" * 10
        start_time = time.time()
        result = analyze_emotion(text=text)
        elapsed = time.time() - start_time
        
        # 应该在1秒内完成
        assert elapsed < 1.0
        assert result is not None

    def test_concurrent_requests(self, client):
        """测试并发请求"""
        import concurrent.futures
        
        def make_request():
            return client.get('/health')
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        assert len(results) == 10
        assert all(r.status_code == 200 for r in results)


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
