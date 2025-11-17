量化模型Daily
11.17前期：
确定基本类库，平台，基础策略编写  
类库：Python Pandas Numpy+SQL Matplotlib    
平台：WorldQuant Brain JoinQaunt  
量化基本流程：数据获取->数据清洗->策略->策略回测->策略优化->模拟盘交易->实盘交易  
数据获取：Data：Tushare(免费A股数据): pip install tushare   AKShare(免费): pip install akshare  
数据清洗：通过pandas DataFrame 进行dropna or fill
量化回测框架：backtrader或vnpy
SQL：数据，表格视图查询

项目结构  
first_quant_project/  
├── data/              # 数据文件  
├── strategy/          # 策略代码  
├── backtest/          # 回测代码  
├── analysis/          # 分析代码  
├── results/           # 回测结果  
├── README.md          # 项目说明  
└── requirements.txt   # 依赖包  
