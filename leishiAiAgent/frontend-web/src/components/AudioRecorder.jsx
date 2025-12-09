/**
 * 音频录制组件 - Web Audio API实现
 * 文件: frontend-web/src/components/AudioRecorder.jsx
 * 功能: 实时录音、可视化波形、上传处理
 */

import React, { useState, useRef, useEffect } from 'react';
import '../styles/AudioRecorder.css';

const AudioRecorder = ({ onRecordingComplete, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState('');
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const chunksRef = useRef([]);

  // 初始化音频
  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      // 设置音频可视化
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      dataArrayRef.current = dataArray;

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      // 检测浏览器支持的音频格式
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav'
      ];
      
      let selectedMimeType = 'audio/webm';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      mediaRecorderRef.current.mimeType = selectedMimeType;

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        onRecordingComplete?.(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      return true;
    } catch (err) {
      setError('无法访问麦克风: ' + err.message);
      return false;
    }
  };

  // 绘制波形
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;

    const canvasCtx = canvas.getContext('2d');
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = '#00d9ff';
    canvasCtx.beginPath();

    const sliceWidth = canvas.width / dataArrayRef.current.length;
    let x = 0;

    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const v = dataArrayRef.current[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  };

  // 开始录音
  const handleStartRecording = async () => {
    if (disabled) return;

    const initialized = await initAudio();
    if (!initialized) return;

    setRecordingTime(0);
    mediaRecorderRef.current.start();
    setIsRecording(true);
    setAudioURL('');
    setError('');

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    // 开始波形动画
    const animate = () => {
      if (!isRecording) return;
      drawWaveform();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  // 停止录音
  const handleStopRecording = () => {
    if (!isRecording) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);

    // 停止波形动画
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // 清理函数
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-recorder">
      {/* 波形显示 */}
      <div className="waveform-container">
        <canvas ref={canvasRef} width={400} height={100}></canvas>
      </div>

      {/* 控制按钮 */}
      <div className="recorder-controls">
        {!isRecording ? (
          <button
            className="btn-record"
            onClick={handleStartRecording}
            disabled={disabled}
          >
            <span className="record-indicator"></span>
            按住开始录音
          </button>
        ) : (
          <>
            <div className="recording-info">
              <span className="recording-time">{formatTime(recordingTime)}</span>
              <span className="recording-status">• 正在录音...</span>
            </div>
            <button
              className="btn-stop"
              onClick={handleStopRecording}
            >
              停止录音
            </button>
          </>
        )}
      </div>

      {/* 播放已录音频 */}
      {audioURL && (
        <div className="playback-section">
          <p>✓ 录音成功</p>
          <audio src={audioURL} controls style={{ width: '100%' }} />
        </div>
      )}

      {/* 错误提示 */}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default AudioRecorder;
