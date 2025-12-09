"""
数据库初始化脚本
文件: backend-ai/init_db.py
功能: 初始化SQLite数据库表结构和种子数据
"""

import sqlite3
import os
from datetime import datetime
import json


def init_database(db_path='soundscape.db'):
    """初始化数据库"""

    # 删除旧数据库（开发环境）
    if os.path.exists(db_path):
        os.remove(db_path)

    # 创建连接
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # ==================== 用户表 ====================
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                created_at TEXT NOT NULL,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                last_login TEXT,
                profile_data TEXT,
                preferences TEXT
            )
        ''')

        # ==================== 会话表 ====================
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token TEXT UNIQUE NOT NULL,
                created_at TEXT NOT NULL,
                last_activity TEXT NOT NULL,
                ended_at TEXT,
                device_info TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')

        # ==================== 情绪记录表 ====================
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS emotion_records (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                emotion_type TEXT NOT NULL,
                intensity REAL NOT NULL,
                confidence REAL NOT NULL,
                transcript TEXT,
                created_at TEXT NOT NULL,
                app_used TEXT,
                session_id TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')

        # 创建索引以加快查询
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_emotion_user ON emotion_records(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_emotion_date ON emotion_records(created_at)')

        # ==================== DApp应用表 ====================
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS dapps (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                icon TEXT,
                features TEXT,
                entry_point TEXT NOT NULL,
                usage_count INTEGER DEFAULT 0,
                popularity INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # ==================== 应用使用记录表 ====================
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS app_usage (
                id TEXT PRIMARY KEY,
                app_id INTEGER NOT NULL,
                user_id TEXT NOT NULL,
                session_id TEXT,
                used_at TEXT NOT NULL,
                duration INTEGER,
                feedback_score INTEGER,
                FOREIGN KEY (app_id) REFERENCES dapps(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')

        cursor.execute('CREATE INDEX IF NOT EXISTS idx_app_usage_user ON app_usage(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_app_usage_app ON app_usage(app_id)')

        # ==================== 记忆表 ====================
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                emotion_type TEXT,
                emotion_intensity REAL,
                app_used TEXT,
                duration INTEGER,
                content TEXT,
                summary TEXT,
                tags TEXT,
                notes TEXT,
                is_shared INTEGER DEFAULT 0,
                share_token TEXT UNIQUE,
                created_at TEXT NOT NULL,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')

        cursor.execute('CREATE INDEX IF NOT EXISTS idx_memory_user ON memories(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_memory_date ON memories(created_at)')

        # ==================== 推荐反馈表 ====================
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS recommendation_feedback (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                session_id TEXT,
                emotion_type TEXT,
                recommended_app_id INTEGER,
                selected_app_id INTEGER,
                satisfaction INTEGER,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (recommended_app_id) REFERENCES dapps(id),
                FOREIGN KEY (selected_app_id) REFERENCES dapps(id)
            )
        ''')

        cursor.execute('CREATE INDEX IF NOT EXISTS idx_feedback_user ON recommendation_feedback(user_id)')

        # ==================== 插入种子数据 ====================
        seed_data = [
            {
                'id': 1,
                'name': '声音疗愈站',
                'type': 'healing',
                'category': '疗愈',
                'description': 'AI陪伴对话、治愈音乐、冥想引导、情绪日记，帮您在悲伤时找到心灵寄托',
                'icon': '🌙',
                'features': json.dumps(['AI陪伴对话', '治愈音乐', '冥想引导', '情绪日记', 'TTS语音']),
                'entry_point': '/healing'
            },
            {
                'id': 2,
                'name': '声音剧场',
                'type': 'theatre',
                'category': '娱乐',
                'description': 'AI播客、深夜电台、有声书、知识漫谈，在平静中享受高质量内容',
                'icon': '🎙️',
                'features': json.dumps(['AI播客', '深夜电台', '有声书', '知识漫谈', 'WebSocket流式']),
                'entry_point': '/theatre'
            },
            {
                'id': 3,
                'name': 'AI音乐工坊',
                'type': 'workshop',
                'category': '创意',
                'description': '哼唱转歌曲、自动编曲、智能混音、作品分享，快乐时最好的创意表达',
                'icon': '🎼',
                'features': json.dumps(['哼唱转歌', '自动编曲', '智能混音', '歌词创作', '作品分享']),
                'entry_point': '/workshop'
            },
            {
                'id': 4,
                'name': '个人声音助手',
                'type': 'assistant',
                'category': '助手',
                'description': '语音对话、新闻播报、日程管理、灵感记录，您日常的声音伙伴',
                'icon': '🤖',
                'features': json.dumps(['语音对话', '新闻播报', '日程提醒', '灵感记录', '任务管理']),
                'entry_point': '/assistant'
            }
        ]

        now = datetime.now().isoformat()

        for app in seed_data:
            cursor.execute('''
                INSERT INTO dapps 
                (id, name, type, category, description, icon, features, entry_point, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                app['id'], app['name'], app['type'], app['category'],
                app['description'], app['icon'], app['features'],
                app['entry_point'], now
            ))

        # 提交变更
        conn.commit()
        print(f"✅ 数据库初始化成功: {db_path}")
        print(f"✅ 已创建以下表:")
        print("   - users (用户表)")
        print("   - sessions (会话表)")
        print("   - emotion_records (情绪记录表)")
        print("   - dapps (DApp应用表)")
        print("   - app_usage (应用使用记录表)")
        print("   - memories (记忆表)")
        print("   - recommendation_feedback (推荐反馈表)")
        print(f"✅ 已插入 {len(seed_data)} 个应用")

    except Exception as e:
        print(f"❌ 数据库初始化失败: {str(e)}")
        conn.rollback()
        raise

    finally:
        conn.close()


if __name__ == '__main__':
    # 初始化数据库
    db_path = os.path.join(os.path.dirname(__file__), 'soundscape.db')
    init_database(db_path)
    print("Database initialized successfully with DApps data.")

if __name__ == "__main__":
    init_db()