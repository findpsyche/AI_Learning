"""
数据库模型 - SQLAlchemy ORM
优化为轻量级SQLite，1GB内存服务器
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timedelta
import os

# 数据库配置
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./soundscape.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    pool_pre_ping=True,
    echo=False  # 关闭SQL日志以节省内存
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ==================== 用户模型 ====================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # 用户偏好
    preferred_emotion_type = Column(String(20), default="neutral")  # 偏好的情绪类型
    prefer_audio_output = Column(Boolean, default=True)  # 是否偏好音频输出
    language = Column(String(10), default="zh")  # 语言偏好
    
    # 关系
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="user", cascade="all, delete-orphan")
    dapp_history = relationship("DAppHistory", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(username={self.username})>"


# ==================== 会话模型 ====================
class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    session_token = Column(String(255), unique=True, index=True)
    
    # 会话信息
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    
    # 当前状态
    current_emotion = Column(String(20), nullable=True)  # happy, sad, calm, neutral
    emotion_intensity = Column(Float, default=0.0)  # 0.0-1.0
    current_dapp = Column(String(50), nullable=True)  # HealingStation, SoundTheatre, etc.
    
    # 关系
    user = relationship("User", back_populates="sessions")
    memories = relationship("Memory", back_populates="session", cascade="all, delete-orphan")
    
    def is_active(self):
        """检查会话是否仍活跃"""
        if self.ended_at:
            return False
        # 24小时后自动过期
        return datetime.utcnow() - self.started_at < timedelta(hours=24)
    
    def __repr__(self):
        return f"<Session(user_id={self.user_id}, emotion={self.current_emotion})>"


# ==================== 记忆模型 ====================
class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    
    # 记忆内容
    memory_type = Column(String(30), index=True)  # diary, conversation, music, story
    emotion_type = Column(String(20), index=True)  # happy, sad, calm, neutral
    emotion_intensity = Column(Float, default=0.5)
    content = Column(Text)  # 主要内容
    summary = Column(String(500), nullable=True)  # AI生成摘要
    tags = Column(JSON, default=list)  # 标签列表，用于分类
    
    # 多媒体资源
    audio_path = Column(String(255), nullable=True)  # 音频文件路径
    image_path = Column(String(255), nullable=True)  # 图片/截图路径
    
    # 元数据
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_shared = Column(Boolean, default=False)  # 是否分享
    share_token = Column(String(100), unique=True, nullable=True)  # 分享令牌
    
    # 关系
    user = relationship("User", back_populates="memories")
    session = relationship("Session", back_populates="memories")
    
    def __repr__(self):
        return f"<Memory(type={self.memory_type}, emotion={self.emotion_type})>"


# ==================== DApp历史模型 ====================
class DAppHistory(Base):
    __tablename__ = "dapp_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    # DApp信息
    dapp_name = Column(String(50), index=True)  # HealingStation, SoundTheatre, MusicWorkshop, VoiceAssistant
    dapp_mode = Column(String(30), nullable=True)  # 子模式，如HealingStation的chat/music/meditation/diary
    
    # 使用统计
    open_count = Column(Integer, default=1)  # 打开次数
    total_duration_seconds = Column(Integer, default=0)  # 总使用时长
    last_accessed = Column(DateTime, default=datetime.utcnow)
    
    # 触发条件
    trigger_emotion = Column(String(20), nullable=True)  # 触发该DApp的情绪
    trigger_intensity = Column(Float, nullable=True)
    
    # 用户评分 (1-5)
    user_rating = Column(Integer, nullable=True)
    
    # 关系
    user = relationship("User", back_populates="dapp_history")
    
    def __repr__(self):
        return f"<DAppHistory(dapp={self.dapp_name}, user_id={self.user_id})>"


# ==================== DApp推荐映射 ====================
class DAppRecommendation(Base):
    __tablename__ = "dapp_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    
    # 情绪条件
    trigger_emotion = Column(String(20), index=True, nullable=False)  # happy, sad, calm, neutral
    min_intensity = Column(Float, default=0.0)  # 最小强度
    max_intensity = Column(Float, default=1.0)  # 最大强度
    
    # 推荐的DApp
    dapp_name = Column(String(50), index=True, nullable=False)
    recommended_modes = Column(JSON, default=list)  # 推荐的模式列表
    
    # 优先级（越高越先推荐）
    priority = Column(Integer, default=5)
    
    # 描述文本
    description = Column(String(500))
    icon_url = Column(String(255), nullable=True)
    
    def __repr__(self):
        return f"<DAppRecommendation(emotion={self.trigger_emotion}, dapp={self.dapp_name})>"


# ==================== 内容生成缓存（性能优化） ====================
class ContentCache(Base):
    __tablename__ = "content_cache"

    id = Column(Integer, primary_key=True, index=True)
    
    # 缓存键
    cache_key = Column(String(255), unique=True, index=True)  # 根据输入内容生成的哈希
    cache_type = Column(String(30))  # audio, text, image
    
    # 缓存内容
    content = Column(Text)  # Base64编码或文件路径
    
    # 元数据
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    expire_at = Column(DateTime)  # 过期时间，TTL
    hit_count = Column(Integer, default=0)  # 命中次数
    
    def is_expired(self):
        """检查缓存是否过期"""
        return datetime.utcnow() > self.expire_at if self.expire_at else False
    
    def __repr__(self):
        return f"<ContentCache(type={self.cache_type}, key={self.cache_key[:20]}...)>"


# ==================== API使用限额追踪（成本控制） ====================
class APIUsageLog(Base):
    __tablename__ = "api_usage_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # API信息
    api_name = Column(String(50), index=True)  # openai_whisper, openai_gpt4, etc.
    endpoint = Column(String(255))
    
    # 使用情况
    tokens_used = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)
    
    # 时间戳
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<APIUsageLog(api={self.api_name}, cost={self.cost_usd})>"


# ==================== 数据库初始化 ====================
def init_db():
    """初始化数据库表和推荐映射数据"""
    Base.metadata.create_all(bind=engine)
    
    # 插入默认DApp推荐规则
    session = SessionLocal()
    
    # 检查是否已经初始化
    if session.query(DAppRecommendation).count() == 0:
        recommendations = [
            # 悲伤情绪 -> 疗愈站
            DAppRecommendation(
                trigger_emotion="sad",
                min_intensity=0.5,
                max_intensity=1.0,
                dapp_name="HealingStation",
                recommended_modes=["chat", "music", "meditation", "diary"],
                priority=10,
                description="为您推荐疗愈站，通过AI陪伴、治愈音乐和冥想来平复心情"
            ),
            # 平静情绪 -> 声音剧场
            DAppRecommendation(
                trigger_emotion="calm",
                min_intensity=0.3,
                max_intensity=0.8,
                dapp_name="SoundTheatre",
                recommended_modes=["podcast", "radio", "audiobook", "talk"],
                priority=9,
                description="为您推荐声音剧场，享受AI播客、电台和有声书"
            ),
            # 快乐情绪 -> 音乐工坊
            DAppRecommendation(
                trigger_emotion="happy",
                min_intensity=0.6,
                max_intensity=1.0,
                dapp_name="MusicWorkshop",
                recommended_modes=["humming", "arrangement", "mixer", "share"],
                priority=10,
                description="为您推荐音乐工坊，让我们一起创作音乐！"
            ),
            # 中性情绪 -> 个人助手
            DAppRecommendation(
                trigger_emotion="neutral",
                min_intensity=0.0,
                max_intensity=0.5,
                dapp_name="VoiceAssistant",
                recommended_modes=["chat", "news", "schedule", "ideas"],
                priority=8,
                description="为您推荐个人助手，帮您管理日程和获取信息"
            ),
        ]
        session.add_all(recommendations)
        session.commit()
    
    session.close()
    print("✓ 数据库初始化完成")


def get_db():
    """依赖注入用的数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
