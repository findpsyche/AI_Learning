"""
OpenAI API 集成服务
支持:
- Whisper: 语音转文字
- GPT-4: 文本生成
- TTS: 文本转语音
"""

import os
import asyncio
import httpx
from typing import Optional, Dict, Any
import json

class OpenAIService:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.api_base = 'https://api.openai.com/v1'
        self.client = httpx.AsyncClient(
            headers={
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            },
            timeout=30.0
        )
        
        if not self.api_key:
            raise ValueError('OPENAI_API_KEY environment variable not set')

    async def close(self):
        """关闭HTTP客户端"""
        await self.client.aclose()

    # ==================== Whisper 语音转文字 ====================
    async def transcribe_audio(
        self,
        audio_data: bytes,
        language: Optional[str] = 'zh',
        prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        使用Whisper将音频转换为文字
        
        Args:
            audio_data: 音频字节数据
            language: 语言代码 (e.g., 'zh', 'en')
            prompt: 可选的提示文本以改进识别
            
        Returns:
            {'text': '转录文本', 'language': '语言代码', 'confidence': 0.95}
        """
        try:
            files = {
                'file': ('audio.m4a', audio_data, 'audio/mp4'),
                'model': (None, 'whisper-1'),
                'language': (None, language),
            }
            
            if prompt:
                files['prompt'] = (None, prompt)

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f'{self.api_base}/audio/transcriptions',
                    files=files,
                    headers={'Authorization': f'Bearer {self.api_key}'}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        'text': result.get('text', ''),
                        'language': language,
                        'confidence': 0.95,  # Whisper 不直接提供置信度
                        'success': True
                    }
                else:
                    return {
                        'error': f'Whisper API error: {response.status_code}',
                        'success': False
                    }

        except Exception as e:
            return {
                'error': str(e),
                'success': False
            }

    # ==================== GPT-4 文本生成 ====================
    async def generate_text(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        model: str = 'gpt-4-turbo-preview'
    ) -> Dict[str, Any]:
        """
        使用GPT-4生成文本
        
        Args:
            prompt: 用户提示
            system_message: 系统消息
            temperature: 创意程度 (0-2)
            max_tokens: 最大输出tokens
            model: 模型名称
            
        Returns:
            {'text': '生成的文本', 'tokens_used': 123, 'success': True}
        """
        try:
            messages = []
            
            if system_message:
                messages.append({
                    'role': 'system',
                    'content': system_message
                })
            
            messages.append({
                'role': 'user',
                'content': prompt
            })

            payload = {
                'model': model,
                'messages': messages,
                'temperature': temperature,
                'max_tokens': max_tokens
            }

            response = await self.client.post(
                f'{self.api_base}/chat/completions',
                json=payload
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    'text': result['choices'][0]['message']['content'],
                    'tokens_used': result['usage']['total_tokens'],
                    'finish_reason': result['choices'][0]['finish_reason'],
                    'success': True
                }
            else:
                return {
                    'error': f'GPT-4 API error: {response.status_code}',
                    'success': False
                }

        except Exception as e:
            return {
                'error': str(e),
                'success': False
            }

    async def generate_chat_response(
        self,
        messages: list,
        emotion: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        生成聊天回复
        
        Args:
            messages: 消息历史列表
            emotion: 当前用户情绪
            **kwargs: 其他参数传递给generate_text
            
        Returns:
            生成的回复
        """
        # 根据情绪调整系统消息
        emotion_prompts = {
            'happy': '你是一个快乐、鼓励的AI助手。用热情和积极的语气回应。',
            'sad': '你是一个同情、支持的AI顾问。用温柔和理解的语气回应。',
            'anxious': '你是一个镇定、放松的AI指导。用平静和舒缓的语气回应。',
            'angry': '你是一个冷静、理性的AI调解员。用平和的语气帮助用户平复情绪。',
            'neutral': '你是一个有帮助、友好的AI助手。'
        }

        system_message = emotion_prompts.get(
            emotion,
            emotion_prompts['neutral']
        )

        return await self.generate_text(
            prompt=messages[-1]['content'] if messages else '',
            system_message=system_message,
            **kwargs
        )

    # ==================== TTS 文本转语音 ====================
    async def synthesize_speech(
        self,
        text: str,
        voice: str = 'alloy',
        speed: float = 1.0,
        model: str = 'tts-1-hd'
    ) -> Dict[str, Any]:
        """
        使用TTS将文本转换为语音
        
        Args:
            text: 要转换的文本
            voice: 声音类型 ('alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer')
            speed: 语速 (0.25-4.0)
            model: 模型 ('tts-1' 或 'tts-1-hd')
            
        Returns:
            {'audio': base64_audio_data, 'format': 'mp3', 'success': True}
        """
        try:
            if len(text) > 4096:
                text = text[:4096]  # 限制文本长度

            payload = {
                'model': model,
                'input': text,
                'voice': voice,
                'speed': speed
            }

            response = await self.client.post(
                f'{self.api_base}/audio/speech',
                json=payload
            )

            if response.status_code == 200:
                import base64
                audio_data = base64.b64encode(response.content).decode('utf-8')
                
                return {
                    'audio': audio_data,
                    'format': 'mp3',
                    'voice': voice,
                    'duration_estimate': len(text) / 200,  # 粗略估计
                    'success': True
                }
            else:
                return {
                    'error': f'TTS API error: {response.status_code}',
                    'success': False
                }

        except Exception as e:
            return {
                'error': str(e),
                'success': False
            }

    # ==================== 组合功能 ====================
    async def transcribe_and_respond(
        self,
        audio_data: bytes,
        context: Optional[str] = None,
        emotion: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        完整的语音-文本-语音流程
        
        Args:
            audio_data: 音频数据
            context: 对话上下文
            emotion: 用户情绪
            
        Returns:
            {'text': '转录文本', 'response': '生成的回复', 'audio': '语音回复', 'success': True}
        """
        result = {
            'success': False,
            'steps': {}
        }

        # 步骤1: 转录音频
        transcription = await self.transcribe_audio(
            audio_data,
            language='zh'
        )
        result['steps']['transcription'] = transcription
        
        if not transcription['success']:
            return result

        user_text = transcription['text']

        # 步骤2: 生成回复
        system_prompt = f"用户说: {user_text}\n上下文: {context or ''}"
        
        response = await self.generate_chat_response(
            messages=[{'role': 'user', 'content': user_text}],
            emotion=emotion,
            max_tokens=200
        )
        result['steps']['generation'] = response
        
        if not response['success']:
            return result

        ai_response_text = response['text']

        # 步骤3: 生成语音
        speech = await self.synthesize_speech(
            ai_response_text,
            voice='nova',
            speed=1.0
        )
        result['steps']['speech'] = speech

        # 整合结果
        result['success'] = True
        result['user_text'] = user_text
        result['ai_response'] = ai_response_text
        result['audio'] = speech.get('audio', '')

        return result

    # ==================== 内容生成 ====================
    async def generate_healing_content(
        self,
        emotion: str,
        content_type: str = 'story'
    ) -> Dict[str, Any]:
        """
        生成治愈类内容
        
        Args:
            emotion: 用户情绪
            content_type: 内容类型 ('story', 'poem', 'meditation', 'advice')
            
        Returns:
            生成的内容
        """
        prompts = {
            'story': f'创作一个有治愈性的故事来应对{emotion}情绪。故事应该温暖、励志、大约200-300字。',
            'poem': f'创作一首诗歌来表达和缓解{emotion}情绪。押韵格式不限。',
            'meditation': f'创建一个冥想引导脚本来帮助处理{emotion}情绪。包括放松步骤。',
            'advice': f'提供处理{emotion}情绪的具体建议和技巧。'
        }

        prompt = prompts.get(
            content_type,
            prompts['story']
        )

        return await self.generate_text(
            prompt=prompt,
            system_message='你是一个富有同情心的治愈师和心理咨询师。',
            temperature=0.8,
            max_tokens=500
        )

    async def generate_music_recommendation(
        self,
        emotion: str,
        mood: str,
        preferred_style: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        生成音乐推荐
        
        Args:
            emotion: 情绪
            mood: 心情/场景
            preferred_style: 偏好的音乐风格
            
        Returns:
            音乐推荐列表
        """
        prompt = f"""
        基于以下信息推荐适合的音乐:
        - 情绪: {emotion}
        - 场景/心情: {mood}
        - 偏好风格: {preferred_style or '不限'}
        
        请推荐5首歌曲，格式为JSON:
        {{
            "recommendations": [
                {{"title": "歌曲名", "artist": "艺术家", "reason": "推荐理由"}},
                ...
            ]
        }}
        """

        response = await self.generate_text(
            prompt=prompt,
            system_message='你是一个音乐顾问，了解各种音乐风格和其治愈效果。',
            max_tokens=500
        )

        if response['success']:
            try:
                import json
                data = json.loads(response['text'])
                return {
                    'recommendations': data.get('recommendations', []),
                    'success': True
                }
            except json.JSONDecodeError:
                return {
                    'recommendations': [],
                    'raw_response': response['text'],
                    'success': True
                }

        return response

# 创建全局实例
_openai_service: Optional[OpenAIService] = None

def get_openai_service() -> OpenAIService:
    """获取OpenAI服务实例"""
    global _openai_service
    if _openai_service is None:
        _openai_service = OpenAIService()
    return _openai_service

async def close_openai_service():
    """关闭OpenAI服务"""
    global _openai_service
    if _openai_service:
        await _openai_service.close()
        _openai_service = None
