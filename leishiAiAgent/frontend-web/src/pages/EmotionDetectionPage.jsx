/**
 * 情绪检测页面 - 支持语音和文本输入
 * 文件: frontend-web/src/pages/EmotionDetectionPage.jsx
 * 功能: 语音/文本输入 → 情绪识别 → 应用推荐
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AudioRecorder from '../components/AudioRecorder';
import EmotionDisplay from '../components/EmotionDisplay';
import AppRecommendation from '../components/AppRecommendation';
import '../styles/EmotionDetectionPage.css';
import { analyzeEmotion, getAppRecommendations } from '../services/apiService';

const EmotionDetectionPage = () => {
  const navigate = useNavigate();
  const [inputMode, setInputMode] = useState('voice'); // 'voice' or 'text'
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [emotion, setEmotion] = useState(null);
  const [recommendedApps, setRecommendedApps] = useState([]);
  const [error, setError] = useState('');
  const [detectionStep, setDetectionStep] = useState('input'); // 'input', 'analyzing', 'result'

  const userId = localStorage.getItem('userId');

  // 处理语音输入
  const handleAudioRecorded = async (audioBlob) => {
    await processInput(audioBlob, 'audio');
  };

  // 处理文本输入
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim()) {
      setError('请输入内容');
      return;
    }
    await processInput(textInput, 'text');
  };

  // 统一处理输入
  const processInput = async (inputData, type) => {
    try {
      setIsProcessing(true);
      setError('');
      setDetectionStep('analyzing');

      // 调用情绪分析API
      let emotionResult;
      if (type === 'audio') {
        // 音频输入：转换为base64
        const base64 = await blobToBase64(inputData);
        emotionResult = await analyzeEmotion({
          data: base64,
          type: 'audio',
          userId: userId
        });
      } else {
        // 文本输入
        emotionResult = await analyzeEmotion({
          data: inputData,
          type: 'text',
          userId: userId
        });
      }

      // 确保情绪类型映射正确
      const emotionType = mapEmotionType(emotionResult.type);
      emotionResult.type = emotionType;
      emotionResult.name = getEmotionName(emotionType);

      setEmotion(emotionResult);

      // 获取应用推荐
      const apps = await getAppRecommendations({
        emotionType: emotionType,
        emotionIntensity: emotionResult.intensity || 0.5,
        userId: userId
      });

      setRecommendedApps(apps);
      setDetectionStep('result');
    } catch (err) {
      console.error('情绪分析错误:', err);
      setError('处理失败: ' + (err.message || '未知错误'));
      setDetectionStep('input');
    } finally {
      setIsProcessing(false);
    }
  };

  // Blob转Base64辅助函数
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // 映射情绪类型
  const mapEmotionType = (type) => {
    const emotionMap = {
      'sad': 'sad',
      'sadness': 'sad',
      '悲伤': 'sad',
      'calm': 'calm',
      'calmness': 'calm',
      '平静': 'calm',
      'happy': 'happy',
      'happiness': 'happy',
      '快乐': 'happy',
      'joy': 'happy',
      'neutral': 'neutral',
      '中性': 'neutral',
      'angry': 'sad', // 愤怒归类为需要疗愈
      'anxious': 'sad', // 焦虑归类为需要疗愈
      'excited': 'happy' // 兴奋归类为快乐
    };
    return emotionMap[type?.toLowerCase()] || 'neutral';
  };

  // 获取情绪中文名称
  const getEmotionName = (type) => {
    const names = {
      'sad': '悲伤',
      'calm': '平静',
      'happy': '快乐',
      'neutral': '中性'
    };
    return names[type] || '中性';
  };

  const handleSelectApp = (app) => {
    // 保存选择到localStorage用于跳转
    localStorage.setItem('selectedApp', JSON.stringify(app));
    localStorage.setItem('lastEmotion', JSON.stringify(emotion));

    // 根据应用类型跳转
    const appRoutes = {
      'healing': '/healing',
      'theatre': '/theatre',
      'workshop': '/workshop',
      'assistant': '/assistant'
    };

    navigate(appRoutes[app.type] || '/home');
  };

  const handleReset = () => {
    setDetectionStep('input');
    setEmotion(null);
    setRecommendedApps([]);
    setTextInput('');
    setError('');
  };

  return (
    <div className="emotion-detection-container">
      <div className="detection-header">
        <button className="btn-back" onClick={() => navigate('/home')}>
          ← 返回
        </button>
        <h1>情绪识别</h1>
        <div className="placeholder"></div>
      </div>

      <div className="detection-content">
        {detectionStep === 'input' && (
          <div className="input-section">
            <h2>分享您的想法或感受</h2>
            <p>通过语音或文字与我交流，我会识别您的情绪</p>

            {/* 输入模式切换 */}
            <div className="mode-switch">
              <button
                className={`mode-btn ${inputMode === 'voice' ? 'active' : ''}`}
                onClick={() => setInputMode('voice')}
              >
                🎤 语音输入
              </button>
              <button
                className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
                onClick={() => setInputMode('text')}
              >
                ⌨️ 文字输入
              </button>
            </div>

            {/* 语音输入 */}
            {inputMode === 'voice' && (
              <AudioRecorder 
                onRecordingComplete={handleAudioRecorded}
                disabled={isProcessing}
              />
            )}

            {/* 文本输入 */}
            {inputMode === 'text' && (
              <form onSubmit={handleTextSubmit} className="text-input-form">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="输入您的想法或感受... (至少10个字符)"
                  rows={6}
                  disabled={isProcessing}
                  minLength={10}
                />
                <button
                  type="submit"
                  disabled={isProcessing || !textInput.trim()}
                  className="btn-submit"
                >
                  {isProcessing ? '分析中...' : '分析情绪'}
                </button>
              </form>
            )}

            {error && <div className="error-message">{error}</div>}
          </div>
        )}

        {detectionStep === 'analyzing' && (
          <div className="analyzing-section">
            <div className="analyzing-spinner">
              <div className="spinner"></div>
              <p>正在分析您的情绪...</p>
            </div>
          </div>
        )}

        {detectionStep === 'result' && emotion && (
          <div className="result-section">
            {/* 情绪展示 */}
            <EmotionDisplay emotion={emotion} />

            {/* 应用推荐 */}
            <AppRecommendation
              emotion={emotion}
              apps={recommendedApps}
              onSelectApp={handleSelectApp}
            />

            {/* 操作按钮 */}
            <div className="result-actions">
              <button
                className="btn-primary"
                onClick={() => handleSelectApp(recommendedApps[0])}
              >
                进入推荐应用
              </button>
              <button
                className="btn-secondary"
                onClick={handleReset}
              >
                重新识别
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionDetectionPage;
