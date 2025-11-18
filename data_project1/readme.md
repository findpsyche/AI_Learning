项目名称：大规模电商用户行为数据清洗与实时处理平台  
项目目标：  
处理百万级用户行为数据（模拟美团外卖/团购场景）  
实现自动化数据清洗、质量监控和实时处理  
构建数据仓库，支持业务分析  
技术栈：  
大数据平台：Hadoop、Hive、Spark、Flink  
编程语言：Python + Scala + Java  
数据仓库：Hive + Spark SQL  
实时计算：Flink  
数据质量：自建监控工具  
项目结构  
meituan-data-platform/  
├── data_generator/          # 数据生成器  
│   └── data_generator.py  
├── spark_jobs/              # Spark清洗任务  
│   ├── spark_data_cleaning.py  
│   └── SparkDataCleanerScala.scala  
├── flink_jobs/              # Flink实时任务  
│   ├── FlinkRealtimeDataCleaning.java  
│   └── flink_realtime_cleaning.py  
├── hive_scripts/            # Hive SQL脚本  
│   ├── create_tables.sql  
│   ├── etl_ods_to_dwd.sql  
│   ├── etl_dwd_to_dws.sql  
│   └── etl_dws_to_ads.sql  
├── quality_monitor/         # 数据质量监控  
│   ├── data_quality_checker.py  
│   └── data_quality_monitor.py  
├── scheduler/               # 自动化调度  
│   └── automated_cleaning_pipeline.py  
├── docker-compose.yml       # Docker部署配置  
├── requirements.txt         # Python依赖  
└── README.md  
