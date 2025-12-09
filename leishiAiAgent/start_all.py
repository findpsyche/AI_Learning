#!/usr/bin/env python3
"""
项目启动脚本
文件: start_all.py
功能: 一键启动完整的声景项目（可选使用Docker）
"""

import subprocess
import sys
import os
import time
from pathlib import Path
from typing import List

class Colors:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    RESET = '\033[0m'


def print_header(message: str):
    """打印标题"""
    print(f"\n{Colors.BLUE}{'='*60}")
    print(f"{message}")
    print(f"{'='*60}{Colors.RESET}\n")


def run_command(cmd: List[str], cwd: str = None, shell: bool = False) -> bool:
    """运行命令"""
    try:
        print(f"{Colors.YELLOW}运行: {' '.join(cmd)}{Colors.RESET}")
        subprocess.Popen(
            cmd,
            cwd=cwd,
            shell=shell,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return True
    except Exception as e:
        print(f"{Colors.RED}命令执行失败: {e}{Colors.RESET}")
        return False


def start_with_docker():
    """使用Docker启动"""
    print_header("使用 Docker Compose 启动项目")
    
    docker_path = Path("deployment/docker")
    
    if not docker_path.exists():
        print(f"{Colors.RED}错误: 找不到 deployment/docker 目录{Colors.RESET}")
        return False
    
    print(f"{Colors.BLUE}启动 Docker Compose...{Colors.RESET}")
    
    result = subprocess.run(
        ["docker-compose", "up", "-d"],
        cwd=str(docker_path),
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print(f"{Colors.GREEN}✓ Docker容器已启动{Colors.RESET}")
        print(f"\n{Colors.BLUE}访问地址:{Colors.RESET}")
        print("  前端: http://localhost:80")
        print("  Python API: http://localhost:8000")
        print("  Python Docs: http://localhost:8000/docs")
        print("  Node API: http://localhost:3000")
        return True
    else:
        print(f"{Colors.RED}错误: {result.stderr}{Colors.RESET}")
        return False


def start_python_backend():
    """启动Python后端"""
    print_header("启动 Python FastAPI 后端")
    
    backend_path = Path("backend-ai")
    
    if not backend_path.exists():
        print(f"{Colors.RED}错误: 找不到 backend-ai 目录{Colors.RESET}")
        return False
    
    # 检查虚拟环境
    venv_path = backend_path / "venv"
    if not venv_path.exists():
        print(f"{Colors.YELLOW}创建虚拟环境...{Colors.RESET}")
        subprocess.run(
            [sys.executable, "-m", "venv", str(venv_path)],
            cwd=str(backend_path)
        )
        print(f"{Colors.GREEN}✓ 虚拟环境已创建{Colors.RESET}")
    
    # 激活虚拟环境并启动
    if sys.platform == "win32":
        activate_script = str(venv_path / "Scripts" / "activate.bat")
        cmd = f"{activate_script} && pip install -r requirements.txt && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
        subprocess.Popen(cmd, shell=True, cwd=str(backend_path))
    else:
        activate_script = str(venv_path / "bin" / "activate")
        cmd = f"source {activate_script} && pip install -r requirements.txt && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
        subprocess.Popen(cmd, shell=True, cwd=str(backend_path), executable="/bin/bash")
    
    print(f"{Colors.GREEN}✓ Python后端启动中...{Colors.RESET}")
    print(f"  地址: http://localhost:8000")
    print(f"  文档: http://localhost:8000/docs")
    
    return True


def start_nodejs_backend():
    """启动Node.js后端"""
    print_header("启动 Node.js Express 后端")
    
    backend_path = Path("backend-nodejs")
    
    if not backend_path.exists():
        print(f"{Colors.YELLOW}⚠ 找不到 backend-nodejs 目录（可选）{Colors.RESET}")
        return True
    
    # 检查node_modules
    if not (backend_path / "node_modules").exists():
        print(f"{Colors.YELLOW}安装npm依赖...{Colors.RESET}")
        subprocess.run(
            ["npm", "install"],
            cwd=str(backend_path)
        )
    
    subprocess.Popen(
        ["npm", "start"],
        cwd=str(backend_path),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    print(f"{Colors.GREEN}✓ Node.js后端启动中...{Colors.RESET}")
    print(f"  地址: http://localhost:3000")
    
    return True


def start_frontend():
    """启动前端"""
    print_header("启动 React 前端")
    
    frontend_path = Path("frontend-web")
    
    if not frontend_path.exists():
        print(f"{Colors.RED}错误: 找不到 frontend-web 目录{Colors.RESET}")
        return False
    
    # 检查node_modules
    if not (frontend_path / "node_modules").exists():
        print(f"{Colors.YELLOW}安装npm依赖...{Colors.RESET}")
        subprocess.run(
            ["npm", "install"],
            cwd=str(frontend_path)
        )
    
    subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=str(frontend_path),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    print(f"{Colors.GREEN}✓ React前端启动中...{Colors.RESET}")
    print(f"  地址: http://localhost:5173")
    
    return True


def main():
    """主函数"""
    print_header("声景 SoundScape - 项目启动工具")
    
    print(f"{Colors.BLUE}请选择启动方式:{Colors.RESET}\n")
    print("1. Docker Compose (推荐)")
    print("2. 本地启动 (Python + Node + React)")
    print("3. 仅启动Python后端")
    print("4. 仅启动前端")
    print("0. 退出")
    
    choice = input(f"\n{Colors.BLUE}请输入选项 (0-4): {Colors.RESET}").strip()
    
    if choice == "1":
        # Docker启动
        success = start_with_docker()
        if success:
            print(f"\n{Colors.GREEN}✓ 所有服务已启动{Colors.RESET}")
            print(f"{Colors.YELLOW}查看日志: docker-compose logs -f{Colors.RESET}")
            print(f"{Colors.YELLOW}停止服务: docker-compose down{Colors.RESET}")
    
    elif choice == "2":
        # 本地启动
        print_header("本地启动多个服务")
        
        success = True
        success = start_python_backend() and success
        success = start_nodejs_backend() and success
        success = start_frontend() and success
        
        if success:
            print(f"\n{Colors.GREEN}✓ 所有服务已启动{Colors.RESET}")
            print(f"\n{Colors.BLUE}访问地址:{Colors.RESET}")
            print("  前端: http://localhost:5173")
            print("  Python API: http://localhost:8000")
            print("  Python Docs: http://localhost:8000/docs")
            print("  Node API: http://localhost:3000")
            print(f"\n{Colors.YELLOW}为了保持窗口打开，请不要关闭此终端{Colors.RESET}")
    
    elif choice == "3":
        # 仅启动Python
        success = start_python_backend()
        if success:
            print(f"\n{Colors.YELLOW}运行测试: cd backend-ai && pytest tests/ -v{Colors.RESET}")
    
    elif choice == "4":
        # 仅启动前端
        success = start_frontend()
    
    elif choice == "0":
        print(f"{Colors.BLUE}再见！{Colors.RESET}")
        return 0
    
    else:
        print(f"{Colors.RED}无效选项{Colors.RESET}")
        return 1
    
    return 0


if __name__ == "__main__":
    try:
        # 检查当前目录
        if not Path("soundscape").exists() and not Path("backend-ai").exists():
            print(f"{Colors.RED}错误: 请在项目根目录运行此脚本{Colors.RESET}")
            sys.exit(1)
        
        sys.exit(main())
    
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}用户中断{Colors.RESET}")
        sys.exit(0)
