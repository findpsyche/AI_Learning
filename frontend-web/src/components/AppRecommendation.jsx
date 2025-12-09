/**
 * 应用推荐组件 - 展示和搜索推荐的DApp
 * 文件: frontend-web/src/components/AppRecommendation.jsx
 * 功能: 显示推荐应用卡片、支持手动搜索和选择
 */

import React, { useState, useMemo, useEffect } from 'react';
import DAppCard from './DAppCard';
import { searchApps, getAllApps } from '../services/apiService';
import '../styles/AppRecommendation.css';

const AppRecommendation = ({ emotion, apps = [], onSelectApp }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [allApps, setAllApps] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const categories = {
    'healing': '疗愈',
    'theatre': '剧场',
    'workshop': '工坊',
    'assistant': '助手',
    'all': '全部'
  };

  // 手动搜索应用
  const handleManualSearch = async (query) => {
    if (!query.trim()) {
      setAllApps([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await searchApps(query);
      setAllApps(searchResults);
    } catch (err) {
      console.error('搜索应用失败:', err);
      setAllApps([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 加载所有应用（用于浏览）
  const handleLoadAllApps = async () => {
    setIsSearching(true);
    try {
      const allAppsList = await getAllApps();
      setAllApps(allAppsList);
      setSearchQuery(''); // 清空搜索框
    } catch (err) {
      console.error('加载应用列表失败:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // 搜索框防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleManualSearch(searchQuery);
      } else {
        setAllApps([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 过滤应用
  const filteredApps = useMemo(() => {
    // 如果有手动搜索结果，优先显示搜索结果
    let result = allApps.length > 0 ? allApps : apps;

    // 按类别过滤
    if (selectedCategory !== 'all') {
      result = result.filter(app => app.type === selectedCategory);
    }

    // 如果是在推荐应用中搜索，也进行本地过滤
    if (allApps.length === 0 && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(app =>
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [apps, allApps, searchQuery, selectedCategory]);

  // 获取推荐理由
  const getRecommendReason = (app) => {
    const reasons = {
      'sad': {
        'healing': '根据您的悲伤情绪，疗愈站会帮助您放松心情',
        'theatre': '舒缓的声音剧场可以缓解您的情绪',
        'workshop': '音乐创作可以帮您表达内心',
        'assistant': '个人助手可以记录您的感受'
      },
      'calm': {
        'healing': '平静的环境很适合深度放松',
        'theatre': '这是享受高质量内容的最好时刻',
        'workshop': '创意在平静中更容易出现',
        'assistant': '整理思绪的好时机'
      },
      'happy': {
        'healing': '分享快乐，帮助他人放松',
        'theatre': '为剧场创作贡献您的快乐',
        'workshop': '创作最好的音乐，记录这一刻',
        'assistant': '记录下您的灵感和快乐'
      },
      'neutral': {
        'healing': '预防疲劳，提前放松',
        'theatre': '平衡的内容消费',
        'workshop': '稳定的创意输出',
        'assistant': '高效地完成任务'
      }
    };

    return reasons[emotion.type]?.[app.type] || '为您精选的应用';
  };

  return (
    <div className="app-recommendation">
      <div className="recommendation-header">
        <h2>为您推荐的应用</h2>
        <p>根据您的{emotion.name}情绪智能推荐</p>
      </div>

      {/* 搜索和过滤 */}
      <div className="search-filter">
        <div className="search-box">
          <input
            type="text"
            placeholder={allApps.length > 0 ? "搜索所有应用..." : "搜索推荐应用..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            disabled={isSearching}
          />
          <span className="search-icon">🔍</span>
          {isSearching && <span className="search-loading">搜索中...</span>}
        </div>
        
        <div className="search-actions">
          <button
            className="btn-browse-all"
            onClick={handleLoadAllApps}
            disabled={isSearching}
          >
            {allApps.length > 0 ? '显示推荐' : '浏览所有应用'}
          </button>
        </div>

        <div className="category-filter">
          {Object.entries(categories).map(([key, label]) => (
            <button
              key={key}
              className={`category-btn ${selectedCategory === key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 应用卡片列表 */}
      <div className="apps-grid">
        {filteredApps.length > 0 ? (
          filteredApps.map((app) => (
            <DAppCard
              key={app.id}
              app={app}
              recommendReason={getRecommendReason(app)}
              onSelect={() => onSelectApp(app)}
              isRecommended={app.rank === 1}
            />
          ))
        ) : (
          <div className="no-results">
            <p>{isSearching ? '搜索中...' : '没有找到匹配的应用'}</p>
            {!isSearching && (
              <button
                className="btn-reset"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setAllApps([]);
                }}
              >
                重置搜索
              </button>
            )}
          </div>
        )}
      </div>

      {/* 推荐说明 */}
      <div className="recommendation-info">
        <h3>💡 推荐说明</h3>
        <ul>
          <li>
            <strong>疗愈站</strong>：当您感到悲伤或需要陪伴时，选择这里获得AI的温暖支持
          </li>
          <li>
            <strong>声音剧场</strong>：想要放松和获取知识？试试播客、电台和有声书
          </li>
          <li>
            <strong>音乐工坊</strong>：快乐的时候最适合创意表达，一起创作音乐
          </li>
          <li>
            <strong>个人助手</strong>：需要帮助时，让AI助手协助您完成各种任务
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AppRecommendation;
