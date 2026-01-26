import React, { useState, useRef, useCallback } from 'react';
import { Upload, PlayCircle, XCircle, CheckCircle, Loader2 } from 'lucide-react';

const EmotionAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [steps, setSteps] = useState([]);
  const [_, setCurrentStep] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [predictionType, setPredictionType] = useState('both');
  
  const wsRef = useRef(null);
  const fileInputRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    // Adjust URL to your backend
    const ws = new WebSocket('ws://localhost:8000/ws/analyze-emotion');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data);
      
      switch (data.type) {
        case 'connected':
          console.log('Session ID:', data.session_id);
          break;
          
        case 'step_started':
          setSteps(data.all_steps);
          setCurrentStep(data.step.id);
          setOverallProgress(data.overall_progress);
          break;
          
        case 'progress_update':
          setSteps(data.all_steps);
          setOverallProgress(data.overall_progress);
          break;
          
        case 'step_completed':
          setSteps(data.all_steps);
          setOverallProgress(data.overall_progress);
          break;
          
        case 'pipeline_completed':
          setSteps(data.all_steps);
          setOverallProgress(100);
          break;
          
        case 'analysis_complete':
          setResult(data.result);
          setIsAnalyzing(false);
          setOverallProgress(100);
          break;
          
        case 'error':
        case 'pipeline_failed':
          setError(data.error);
          setIsAnalyzing(false);
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error');
      setIsAnalyzing(false);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      wsRef.current = null;
    };
    
    wsRef.current = ws;
    return ws;
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      setSteps([]);
      setOverallProgress(0);
    }
  };

  const analyzeAudio = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setSteps([]);
    setOverallProgress(0);
    
    const ws = connectWebSocket();
    
    // Wait for connection
    await new Promise((resolve) => {
      const checkConnection = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          clearInterval(checkConnection);
          resolve();
        }
      }, 100);
    });
    
    // Convert file to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      
      ws.send(JSON.stringify({
        action: 'analyze',
        file_data: base64,
        filename: file.name,
        prediction_type: predictionType
      }));
    };
    reader.readAsDataURL(file);
  };

  const cancelAnalysis = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ action: 'cancel' }));
      wsRef.current.close();
    }
    setIsAnalyzing(false);
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🎵 Emotion Analyzer
            </h1>
            <p className="text-gray-600">
              Analyze emotions in audio using AI
            </p>
          </div>

          {/* File Upload */}
          <div className="mb-8">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-purple-400 transition-colors"
              disabled={isAnalyzing}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">
                {file ? file.name : 'Click to upload audio file'}
              </p>
            </button>
          </div>

          {/* Prediction Type */}
          {file && !isAnalyzing && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prediction Type
              </label>
              <select
                value={predictionType}
                onChange={(e) => setPredictionType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="static">Static (Overall)</option>
                <option value="dynamic">Dynamic (Time-series)</option>
                <option value="both">Both</option>
              </select>
            </div>
          )}

          {/* Analyze Button */}
          {file && !isAnalyzing && !result && (
            <button
              onClick={analyzeAudio}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Analyze Emotion
            </button>
          )}

          {/* Progress Section */}
          {isAnalyzing && (
            <div className="space-y-6">
              {/* Overall Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Overall Progress</span>
                  <span className="text-purple-600">{overallProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`border rounded-lg p-4 transition-all ${
                      step.status === 'in_progress'
                        ? 'border-blue-400 bg-blue-50'
                        : step.status === 'completed'
                        ? 'border-green-300 bg-green-50'
                        : step.status === 'failed'
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getStepIcon(step.status)}
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {step.name}
                        </div>
                        {step.message && (
                          <div className="text-sm text-gray-600 mt-1">
                            {step.message}
                          </div>
                        )}
                      </div>
                      {step.status === 'in_progress' && (
                        <div className="text-sm text-blue-600">
                          {step.progress.toFixed(0)}%
                        </div>
                      )}
                      {step.duration && (
                        <div className="text-xs text-gray-500">
                          {step.duration.toFixed(1)}s
                        </div>
                      )}
                    </div>
                    
                    {step.status === 'in_progress' && step.progress > 0 && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-500 h-full transition-all duration-300"
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Cancel Button */}
              <button
                onClick={cancelAnalysis}
                className="w-full border border-red-300 text-red-600 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Cancel Analysis
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Results</h2>
              
              {result.static && (
                <div className="bg-purple-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-3">Static Emotions</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(result.static.emotions).map(([emotion, value]) => (
                      <div key={emotion} className="bg-white rounded p-3">
                        <div className="text-sm text-gray-600 capitalize">{emotion}</div>
                        <div className="text-xl font-bold text-purple-600">
                          {(value * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.dynamic && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-3">Dynamic Emotions</h3>
                  <p className="text-sm text-gray-600">
                    {result.dynamic.timestamps?.length || 0} time segments analyzed
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setSteps([]);
                  setOverallProgress(0);
                }}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Analyze Another File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmotionAnalyzer;