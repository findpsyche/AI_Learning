/**
 * AI音乐工坊页面
 * 文件: frontend-web/src/pages/MusicWorkshopPage.jsx
 * 功能: 哼唱转歌曲、自动编曲、混音创作、作品分享
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import '../styles/MusicWorkshopPage.css';

const MusicWorkshopPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('humming'); // humming, arrangement, mixer, share
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  // 初始化Web Audio API
  useEffect(() => {
    const initAudioContext = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        
        drawWaveform();
      } catch (error) {
        console.error('获取麦克风权限失败:', error);
      }
    };
    
    initAudioContext();
  }, []);

  // 绘制波形
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    analyserRef.current.getByteFrequencyData(dataArray);
    
    ctx.fillStyle = 'rgba(102, 126, 234, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const sliceWidth = canvas.width / dataArray.length;
    let x = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    requestAnimationFrame(drawWaveform);
  };

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await processHumming(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // 计时器
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (error) {
      console.error('录音失败:', error);
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // 处理哼唱
  const processHumming = async (blob) => {
    try {
      // 将音频发送到后端进行处理
      const reader = new FileReader();
      reader.onloadend = async () => {
        const audioData = reader.result.split(',')[1];
        
        // 调用API进行音乐转换
        const result = await apiService.analyzeEmotion({
          audio: audioData,
          type: 'audio',
          context: 'music_generation',
          userId: localStorage.getItem('userId')
        });
        
        // 模拟AI生成的歌曲
        const newSong = {
          id: songs.length + 1,
          title: `我的创作 #${songs.length + 1}`,
          artist: localStorage.getItem('username') || '音乐创作者',
          duration: recordingTime,
          tempo: Math.random() * 80 + 80, // 80-160 BPM
          key: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'][Math.floor(Math.random() * 8)],
          mood: ['欢快', '忧伤', '平和', '激情'][Math.floor(Math.random() * 4)],
          created: new Date(),
          tracks: [
            { name: '主旋律', volume: 100, instrument: 'Piano' },
            { name: '节奏', volume: 80, instrument: 'Drums' },
            { name: '和声', volume: 60, instrument: 'Strings' },
            { name: '贝司', volume: 70, instrument: 'Bass' }
          ]
        };
        
        setSongs(prev => [newSong, ...prev]);
        setCurrentSong(newSong);
        setMode('arrangement');
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('处理失败:', error);
    }
  };

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 哼唱模式
  const renderHummingMode = () => (
    <div className="humming-container">
      <div className="humming-header">
        <h2>🎤 哼唱转歌曲</h2>
        <p>哼唱一段旋律，AI帮你编曲</p>
      </div>

      <div className="waveform-section">
        <canvas 
          ref={canvasRef}
          width={400}
          height={200}
          className="waveform-canvas"
        />
      </div>

      <div className="recording-section">
        <div className={`recording-indicator ${isRecording ? 'active' : ''}`}>
          <div className="record-dot"></div>
          <span>{formatTime(recordingTime)}</span>
        </div>

        <div className="recording-controls">
          {!isRecording ? (
            <button 
              className="record-btn start"
              onClick={startRecording}
            >
              🎙️ 开始哼唱
            </button>
          ) : (
            <button 
              className="record-btn stop"
              onClick={stopRecording}
            >
              ⏹️ 停止
            </button>
          )}
        </div>

        <div className="humming-tips">
          <h3>💡 小贴士：</h3>
          <ul>
            <li>哼唱2-10秒的旋律</li>
            <li>保持稳定的音量</li>
            <li>可以是任何旋律或歌曲片段</li>
            <li>AI会根据你的哼唱生成完整歌曲</li>
          </ul>
        </div>
      </div>

      {songs.length > 0 && (
        <div className="recent-songs">
          <h3>最近创建的歌曲</h3>
          <div className="songs-list">
            {songs.map(song => (
              <div 
                key={song.id}
                className={`song-item ${currentSong?.id === song.id ? 'active' : ''}`}
                onClick={() => {
                  setCurrentSong(song);
                  setMode('arrangement');
                }}
              >
                <span className="song-number">#{song.id}</span>
                <div className="song-info">
                  <p className="song-title">{song.title}</p>
                  <p className="song-meta">{song.created.toLocaleDateString()}</p>
                </div>
                <span className="song-mood">{song.mood}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // 编曲模式
  const renderArrangementMode = () => (
    <div className="arrangement-container">
      <div className="arrangement-header">
        <h2>🎼 自动编曲</h2>
        <p>调整节拍、调式和乐器</p>
      </div>

      {currentSong && (
        <div className="arrangement-editor">
          <div className="song-info-panel">
            <h3>{currentSong.title}</h3>
            <div className="song-properties">
              <div className="property">
                <label>节奏 (BPM)</label>
                <input 
                  type="range"
                  min="60"
                  max="180"
                  defaultValue={currentSong.tempo}
                  className="property-slider"
                />
                <span>{Math.round(currentSong.tempo)}</span>
              </div>
              <div className="property">
                <label>调式</label>
                <select defaultValue={currentSong.key} className="property-select">
                  <option>C</option>
                  <option>G</option>
                  <option>D</option>
                  <option>A</option>
                  <option>E</option>
                  <option>B</option>
                  <option>F#</option>
                  <option>C#</option>
                </select>
              </div>
              <div className="property">
                <label>心情</label>
                <select defaultValue={currentSong.mood} className="property-select">
                  <option>欢快</option>
                  <option>忧伤</option>
                  <option>平和</option>
                  <option>激情</option>
                </select>
              </div>
            </div>
          </div>

          <div className="tracks-panel">
            <h3>🎵 音轨</h3>
            {currentSong.tracks.map((track, idx) => (
              <div key={idx} className="track-item">
                <span className="track-name">{track.name}</span>
                <div className="track-controls">
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={track.volume}
                    className="volume-slider"
                  />
                  <span className="volume-label">{track.volume}%</span>
                </div>
                <select defaultValue={track.instrument} className="instrument-select">
                  <option>Piano</option>
                  <option>Guitar</option>
                  <option>Violin</option>
                  <option>Drums</option>
                  <option>Bass</option>
                  <option>Strings</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="arrangement-actions">
        <button className="action-btn primary">
          ▶️ 试听编排
        </button>
        <button className="action-btn secondary" onClick={() => setMode('mixer')}>
          🎚️ 进入混音间
        </button>
      </div>
    </div>
  );

  // 混音模式
  const renderMixerMode = () => (
    <div className="mixer-container">
      <div className="mixer-header">
        <h2>🎚️ 混音工坊</h2>
        <p>精细调整每个音轨</p>
      </div>

      {currentSong && (
        <div className="mixer-board">
          <div className="master-channel">
            <h4>主控</h4>
            <input 
              type="range"
              min="0"
              max="100"
              defaultValue="80"
              className="fader vertical"
            />
            <span>-6dB</span>
          </div>

          {currentSong.tracks.map((track, idx) => (
            <div key={idx} className="mixer-channel">
              <h4>{track.name}</h4>
              <input 
                type="range"
                min="0"
                max="100"
                defaultValue={track.volume}
                className="fader vertical"
              />
              <div className="equalizer">
                <label>E.Q.</label>
                <div className="eq-knobs">
                  <input type="range" min="0" max="100" defaultValue="50" title="Low" />
                  <input type="range" min="0" max="100" defaultValue="50" title="Mid" />
                  <input type="range" min="0" max="100" defaultValue="50" title="High" />
                </div>
              </div>
              <div className="effects">
                <input type="checkbox" id={`reverb-${idx}`} />
                <label htmlFor={`reverb-${idx}`}>混响</label>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mixer-actions">
        <button className="action-btn primary">
          ▶️ 播放混音
        </button>
        <button className="action-btn secondary" onClick={() => setMode('share')}>
          🎁 分享作品
        </button>
      </div>
    </div>
  );

  // 分享模式
  const renderShareMode = () => (
    <div className="share-container">
      <div className="share-header">
        <h2>🎁 作品分享</h2>
        <p>分享你的音乐创作</p>
      </div>

      {currentSong && (
        <div className="share-card">
          <div className="share-cover">🎵</div>
          <div className="share-info">
            <h3>{currentSong.title}</h3>
            <p className="artist">{currentSong.artist}</p>
            <p className="description">
              一首由 AI 和人类创意共同创作的音乐作品
            </p>
            <div className="song-stats">
              <span>⏱️ {currentSong.duration}秒</span>
              <span>🎵 {currentSong.tempo} BPM</span>
              <span>🎼 {currentSong.key}</span>
            </div>
          </div>

          <div className="share-options">
            <h3>分享到</h3>
            <div className="share-buttons">
              <button className="share-btn wechat">
                💬 微信
              </button>
              <button className="share-btn qq">
                🐧 QQ
              </button>
              <button className="share-btn weibo">
                📱 微博
              </button>
              <button className="share-btn copy">
                🔗 复制链接
              </button>
            </div>
          </div>

          <div className="download-section">
            <h3>下载</h3>
            <button className="download-btn mp3">
              💾 下载 MP3
            </button>
            <button className="download-btn flac">
              💾 下载 FLAC
            </button>
          </div>
        </div>
      )}

      <div className="my-creations">
        <h3>我的创作</h3>
        <div className="creations-grid">
          {songs.map(song => (
            <div key={song.id} className="creation-card">
              <div className="creation-cover">🎵</div>
              <p className="creation-title">{song.title}</p>
              <p className="creation-date">{song.created.toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="music-workshop-page">
      <header className="workshop-header">
        <button className="back-button" onClick={() => navigate('/home')}>
          ← 返回
        </button>
        <h1>🎵 AI音乐工坊</h1>
        <div className="mode-selector">
          <button 
            className={`mode-btn ${mode === 'humming' ? 'active' : ''}`}
            onClick={() => setMode('humming')}
          >
            🎤 哼唱
          </button>
          <button 
            className={`mode-btn ${mode === 'arrangement' ? 'active' : ''}`}
            onClick={() => setMode('arrangement')}
            disabled={!currentSong}
          >
            🎼 编曲
          </button>
          <button 
            className={`mode-btn ${mode === 'mixer' ? 'active' : ''}`}
            onClick={() => setMode('mixer')}
            disabled={!currentSong}
          >
            🎚️ 混音
          </button>
          <button 
            className={`mode-btn ${mode === 'share' ? 'active' : ''}`}
            onClick={() => setMode('share')}
            disabled={!currentSong}
          >
            🎁 分享
          </button>
        </div>
      </header>

      <main className="workshop-main">
        {mode === 'humming' && renderHummingMode()}
        {mode === 'arrangement' && renderArrangementMode()}
        {mode === 'mixer' && renderMixerMode()}
        {mode === 'share' && renderShareMode()}
      </main>
    </div>
  );
};

export default MusicWorkshopPage;
