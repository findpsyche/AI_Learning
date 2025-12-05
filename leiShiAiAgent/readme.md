这里是雷石2026开发比赛仓库  
项目名称：SceneHarmony-AI  
项目理念：专注于场景感知的车载AI娱乐Agent：无感场景感知 + 个性化娱乐推荐 + 车载硬件集成
sceneharmony-ai/  
├── backend/                    # AI Agent服务端  
│   ├── core/                   # 核心引擎  
│   │   ├── scene_perception.py # 多模态场景感知  
│   │   ├── user_profiler.py    # 用户画像构建  
│   │   └── entertainment_agent.py # 娱乐决策Agent  
│   ├── services/               # 外部服务集成  
│   │   ├── teslamicrophone.py  # TeslaMic硬件接口  
│   │   ├── vehicle_api.py      # 车型/驾驶数据获取  
│   │   └── leishi_music_api.py # 雷石音乐版权库对接  
│   ├── utils/                  # 工具类  
│   │   ├── audio_processor.py  # 音频处理  
│   │   └── multimodal_fusion.py # 多模态融合  
│   └── main.py                 # FastAPI入口  
├── frontend/                   # 客户端演示  
│   ├── web_demo/               # Web演示界面  
│   └── mock_vehicle/           # 模拟车载环境  
├── data/                       # 模拟数据（比赛用）  
│   ├── mock_vehicle_data.py    # 模拟车型/驾驶数据  
│   └── mock_user_scenarios.py  # 模拟用户场景  
├── config/                     # 配置文件  
│   ├── model_config.py         # AI模型配置  
│   └── scene_rules.py          # 场景规则引擎  
├── tests/                      # 测试用例  
├── requirements.txt            # 依赖  
├── Dockerfile                  # 容器化部署  
└── README.md                   # 详细文档  
