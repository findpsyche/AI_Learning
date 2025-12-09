#!/usr/bin/env python3
"""
项目验证脚本
文件: backend-ai/verify_setup.py
功能: 验证所有依赖、配置、文件是否完整
"""

import sys
import os
import json
from pathlib import Path
from typing import List, Tuple

# 颜色输出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'


def print_status(status: bool, message: str):
    """打印状态信息"""
    symbol = f"{Colors.GREEN}✓{Colors.RESET}" if status else f"{Colors.RED}✗{Colors.RESET}"
    print(f"{symbol} {message}")
    return status


def check_python_version() -> bool:
    """检查Python版本"""
    version = sys.version_info
    required = (3, 9)
    status = (version.major, version.minor) >= required
    print_status(status, f"Python版本: {version.major}.{version.minor}.{version.micro} (需要 >= 3.9)")
    return status


def check_imports() -> bool:
    """检查关键库是否安装"""
    print(f"\n{Colors.BLUE}检查依赖库...{Colors.RESET}")
    
    required_modules = {
        'fastapi': 'FastAPI框架',
        'sqlalchemy': 'SQLAlchemy ORM',
        'openai': 'OpenAI Python客户端',
        'pydantic': 'Pydantic数据验证',
        'uvicorn': 'Uvicorn服务器',
        'librosa': '音频处理',
        'pytest': '测试框架'
    }
    
    all_ok = True
    for module, description in required_modules.items():
        try:
            __import__(module)
            print_status(True, f"{description} ({module})")
        except ImportError:
            print_status(False, f"{description} ({module}) - 需要安装")
            all_ok = False
    
    return all_ok


def check_files() -> bool:
    """检查关键文件是否存在"""
    print(f"\n{Colors.BLUE}检查文件结构...{Colors.RESET}")
    
    required_files = {
        'app/main.py': 'FastAPI主应用',
        'app/models/emotion.py': 'SQLAlchemy数据模型',
        'app/services/emotion_analyzer.py': '情绪分析服务',
        'app/services/dapp_recommender.py': 'DApp推荐引擎',
        'app/api/endpoints/emotion.py': '情绪API端点',
        'app/api/endpoints/recommend.py': '推荐API端点',
        'app/api/endpoints/memory.py': '记忆API端点',
        'requirements.txt': 'Python依赖列表',
        'init_db.py': '数据库初始化',
        'tests/test_services.py': '单元测试',
        'tests/test_integration.py': '集成测试'
    }
    
    all_ok = True
    for filepath, description in required_files.items():
        full_path = Path(__file__).parent / filepath
        exists = full_path.exists()
        status_text = f"{description}"
        if exists:
            size = full_path.stat().st_size
            status_text += f" ({size:,} bytes)"
        
        if not print_status(exists, status_text):
            all_ok = False
    
    return all_ok


def check_database() -> bool:
    """检查数据库"""
    print(f"\n{Colors.BLUE}检查数据库...{Colors.RESET}")
    
    db_path = Path(__file__).parent / 'soundscape.db'
    
    if db_path.exists():
        size = db_path.stat().st_size
        print_status(True, f"SQLite数据库存在 ({size:,} bytes)")
        
        # 尝试连接
        try:
            import sqlite3
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            conn.close()
            
            table_names = [t[0] for t in tables]
            print_status(len(tables) > 0, f"数据库表数: {len(tables)}")
            if tables:
                print(f"  表名: {', '.join(table_names[:5])}{'...' if len(table_names) > 5 else ''}")
            
            return True
        except Exception as e:
            print_status(False, f"数据库连接失败: {e}")
            return False
    else:
        print_status(False, "SQLite数据库不存在 - 运行 python init_db.py")
        return False


def check_environment() -> bool:
    """检查环境变量"""
    print(f"\n{Colors.BLUE}检查环境变量...{Colors.RESET}")
    
    openai_key = os.getenv('OPENAI_API_KEY')
    if openai_key:
        masked_key = openai_key[:10] + '...' + openai_key[-4:]
        print_status(True, f"OPENAI_API_KEY已设置 ({masked_key})")
    else:
        print_status(False, "OPENAI_API_KEY未设置 - 运行: export OPENAI_API_KEY=your_key")
    
    database_url = os.getenv('DATABASE_URL', 'sqlite:///soundscape.db')
    print_status(True, f"DATABASE_URL: {database_url}")
    
    return bool(openai_key)


def check_api_endpoints() -> bool:
    """检查API端点是否正常"""
    print(f"\n{Colors.BLUE}检查API端点...{Colors.RESET}")
    
    try:
        from fastapi import FastAPI
        from app.main import app
        
        # 获取所有路由
        routes = []
        for route in app.routes:
            if hasattr(route, 'path'):
                routes.append((route.path, route.methods if hasattr(route, 'methods') else []))
        
        important_endpoints = [
            '/api/v1/emotion/analyze',
            '/api/v1/recommend/apps',
            '/api/v1/memory/create',
            '/api/v1/emotion/history',
            '/api/v1/emotion/statistics'
        ]
        
        for endpoint in important_endpoints:
            found = any(endpoint in str(r[0]) for r in routes)
            print_status(found, f"端点: {endpoint}")
        
        return True
    except ImportError as e:
        print_status(False, f"无法加载FastAPI: {e}")
        return False
    except Exception as e:
        print_status(False, f"检查端点失败: {e}")
        return False


def main():
    """主检查函数"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}声景 SoundScape 项目验证{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")
    
    results = {
        'Python版本': check_python_version(),
        '依赖库': check_imports(),
        '文件结构': check_files(),
        '数据库': check_database(),
        '环境变量': check_environment(),
        'API端点': check_api_endpoints()
    }
    
    # 总结
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}验证总结{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for check_name, result in results.items():
        status_symbol = f"{Colors.GREEN}✓{Colors.RESET}" if result else f"{Colors.RED}✗{Colors.RESET}"
        print(f"{status_symbol} {check_name}")
    
    print(f"\n{Colors.BLUE}总体状态: {passed}/{total} 通过{Colors.RESET}")
    
    if passed == total:
        print(f"\n{Colors.GREEN}✓ 所有检查通过！项目已准备就绪{Colors.RESET}")
        print(f"\n{Colors.BLUE}后续步骤:{Colors.RESET}")
        print("1. 启动API服务: python -m uvicorn app.main:app --reload")
        print("2. 查看API文档: http://localhost:8000/docs")
        print("3. 运行测试: pytest tests/ -v")
        print("4. 启动前端: cd ../frontend-web && npm run dev")
        return 0
    else:
        print(f"\n{Colors.RED}✗ 部分检查未通过，请解决上述问题{Colors.RESET}\n")
        print(f"{Colors.YELLOW}常见解决方案:{Colors.RESET}")
        print("1. 安装依赖: pip install -r requirements.txt")
        print("2. 初始化数据库: python init_db.py")
        print("3. 设置环境变量: export OPENAI_API_KEY=your_key")
        return 1


if __name__ == '__main__':
    sys.exit(main())
