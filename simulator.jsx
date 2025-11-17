import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

const LRULFUSimulator = () => {
  const [referenceString, setReferenceString] = useState('7 0 1 2 0 3 0 4 2 3 0 3 2');
  const [frameCount, setFrameCount] = useState(4);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [lruSimulation, setLruSimulation] = useState(null);
  const [lfuSimulation, setLfuSimulation] = useState(null);

  // Classe LRU
  const simulateLRU = (references, capacity) => {
    const steps = [];
    const frames = new Array(capacity).fill(null);
    const recentlyUsed = [];
    let pageFaults = 0;

    references.forEach((page, index) => {
      const frameIndex = frames.indexOf(page);
      let isHit = false;

      if (frameIndex !== -1) {
        // HIT
        isHit = true;
        const pos = recentlyUsed.indexOf(page);
        recentlyUsed.splice(pos, 1);
        recentlyUsed.push(page);
      } else {
        // FAULT
        pageFaults++;

        if (frames.includes(null)) {
          const emptyIndex = frames.indexOf(null);
          frames[emptyIndex] = page;
          recentlyUsed.push(page);
        } else {
          const lruPage = recentlyUsed.shift();
          const replaceIndex = frames.indexOf(lruPage);
          frames[replaceIndex] = page;
          recentlyUsed.push(page);
        }
      }

      steps.push({
        step: index,
        page,
        frames: [...frames],
        isHit,
        pageFaults,
        recentlyUsed: [...recentlyUsed]
      });
    });

    return { steps, finalFaults: pageFaults };
  };

  // Classe LFU
  const simulateLFU = (references, capacity) => {
    const steps = [];
    const frames = new Array(capacity).fill(null);
    const frequency = new Map();
    let pageFaults = 0;

    references.forEach((page, index) => {
      const frameIndex = frames.indexOf(page);
      let isHit = false;

      if (frameIndex !== -1) {
        // HIT
        isHit = true;
        frequency.set(page, (frequency.get(page) || 0) + 1);
      } else {
        // FAULT
        pageFaults++;
        frequency.set(page, 1);

        if (frames.includes(null)) {
          const emptyIndex = frames.indexOf(null);
          frames[emptyIndex] = page;
        } else {
          let minFreq = Infinity;
          let lfuIndex = -1;

          for (let j = 0; j < frames.length; j++) {
            const framePage = frames[j];
            const freq = frequency.get(framePage) || 0;
            if (freq < minFreq) {
              minFreq = freq;
              lfuIndex = j;
            }
          }

          const replacedPage = frames[lfuIndex];
          frequency.delete(replacedPage);
          frames[lfuIndex] = page;
        }
      }

      steps.push({
        step: index,
        page,
        frames: [...frames],
        isHit,
        pageFaults,
        frequency: new Map(frequency)
      });
    });

    return { steps, finalFaults: pageFaults };
  };

  const handleSimulate = () => {
    const references = referenceString.trim().split(/\s+/).map(Number);
    
    if (references.some(isNaN) || references.length === 0) {
      alert('Por favor, digite uma sequência válida de números!');
      return;
    }

    if (frameCount <= 0 || isNaN(frameCount)) {
      alert('Por favor, digite uma quantidade válida de frames!');
      return;
    }

    const lru = simulateLRU(references, frameCount);
    const lfu = simulateLFU(references, frameCount);

    setLruSimulation(lru);
    setLfuSimulation(lfu);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setLruSimulation(null);
    setLfuSimulation(null);
  };

  const handlePlayPause = () => {
    if (!lruSimulation) {
      handleSimulate();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying && lruSimulation && currentStep < lruSimulation.steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (currentStep >= lruSimulation?.steps.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStep, lruSimulation, speed]);

  const renderFrames = (frames, algorithm, step) => {
    const freq = step?.frequency;
    
    return (
      <div className="flex gap-2 justify-center mt-4">
        {frames.map((frame, idx) => (
          <div
            key={idx}
            className={`w-20 h-20 border-4 rounded-lg flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
              frame === null
                ? 'border-gray-300 bg-gray-50 text-gray-400'
                : frame === step?.page
                ? step.isHit
                  ? 'border-green-500 bg-green-50 text-green-700 scale-110 shadow-lg'
                  : 'border-red-500 bg-red-50 text-red-700 scale-110 shadow-lg'
                : 'border-blue-500 bg-blue-50 text-blue-700'
            }`}
          >
            <div className="text-center">
              <div>{frame ?? '−'}</div>
              {algorithm === 'lfu' && frame !== null && freq && (
                <div className="text-xs text-gray-500 mt-1">
                  f:{freq.get(frame) || 0}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const currentLruStep = lruSimulation?.steps[currentStep];
  const currentLfuStep = lfuSimulation?.steps[currentStep];
  const references = referenceString.trim().split(/\s+/).map(Number);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Simulador LRU vs LFU
          </h1>
          <p className="text-gray-600">
            Algoritmos de Substituição de Páginas
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sequência de Referência
              </label>
              <input
                type="text"
                value={referenceString}
                onChange={(e) => setReferenceString(e.target.value)}
                placeholder="Ex: 1 2 3 4 1 2 5"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantidade de Frames
              </label>
              <input
                type="number"
                value={frameCount}
                onChange={(e) => setFrameCount(parseInt(e.target.value))}
                min="1"
                max="10"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={handleSimulate}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Play size={20} />
              Simular
            </button>
            <button
              onClick={handlePlayPause}
              disabled={!lruSimulation}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400"
            >
              {isPlaying ? 'Pausar' : 'Auto Play'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              <RefreshCw size={20} />
              Resetar
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm font-semibold text-gray-700">
                Velocidade:
              </label>
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value={2000}>Lento</option>
                <option value={1000}>Normal</option>
                <option value={500}>Rápido</option>
              </select>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {lruSimulation && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-semibold text-gray-700">
                Passo {currentStep + 1} de {lruSimulation.steps.length}
              </span>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max={lruSimulation.steps.length - 1}
                  value={currentStep}
                  onChange={(e) => setCurrentStep(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="text-sm font-semibold text-gray-700">
                Página: <span className="text-blue-600 text-xl">{currentLruStep?.page}</span>
              </div>
            </div>

            {/* Reference String Visualization */}
            <div className="flex gap-2 justify-center flex-wrap">
              {references.map((ref, idx) => (
                <div
                  key={idx}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all ${
                    idx === currentStep
                      ? 'bg-blue-600 text-white scale-125 shadow-lg'
                      : idx < currentStep
                      ? 'bg-gray-300 text-gray-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {ref}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simulation Results */}
        {lruSimulation && lfuSimulation && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* LRU */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  LRU (Least Recently Used)
                </h2>
                {currentLruStep?.isHit ? (
                  <div className="flex items-center gap-2 text-green-600 font-bold">
                    <CheckCircle size={24} />
                    HIT
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 font-bold">
                    <XCircle size={24} />
                    FAULT
                  </div>
                )}
              </div>

              {renderFrames(currentLruStep?.frames, 'lru', currentLruStep)}

              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Page Faults:</span>
                  <span className="text-2xl font-bold text-red-600">
                    {currentLruStep?.pageFaults}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Taxa de Hit:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {((currentStep + 1 - currentLruStep?.pageFaults) / (currentStep + 1) * 100).toFixed(1)}%
                  </span>
                </div>
                {currentStep === lruSimulation.steps.length - 1 && (
                  <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="font-bold text-blue-800 mb-1">Resultado Final:</div>
                    <div className="text-sm text-blue-700">
                      Total de Page Faults: <span className="font-bold">{lruSimulation.finalFaults}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LFU */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  LFU (Least Frequently Used)
                </h2>
                {currentLfuStep?.isHit ? (
                  <div className="flex items-center gap-2 text-green-600 font-bold">
                    <CheckCircle size={24} />
                    HIT
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 font-bold">
                    <XCircle size={24} />
                    FAULT
                  </div>
                )}
              </div>

              {renderFrames(currentLfuStep?.frames, 'lfu', currentLfuStep)}

              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Page Faults:</span>
                  <span className="text-2xl font-bold text-red-600">
                    {currentLfuStep?.pageFaults}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-700">Taxa de Hit:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {((currentStep + 1 - currentLfuStep?.pageFaults) / (currentStep + 1) * 100).toFixed(1)}%
                  </span>
                </div>
                {currentStep === lfuSimulation.steps.length - 1 && (
                  <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="font-bold text-blue-800 mb-1">Resultado Final:</div>
                    <div className="text-sm text-blue-700">
                      Total de Page Faults: <span className="font-bold">{lfuSimulation.finalFaults}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comparison */}
        {lruSimulation && lfuSimulation && currentStep === lruSimulation.steps.length - 1 && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              🏆 Comparação Final
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">LRU</div>
                <div className="text-3xl font-bold text-blue-600">
                  {lruSimulation.finalFaults}
                </div>
                <div className="text-xs text-gray-500">page faults</div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  {lruSimulation.finalFaults < lfuSimulation.finalFaults ? (
                    <div className="text-2xl font-bold text-green-600">
                      LRU Venceu! 🎉
                    </div>
                  ) : lruSimulation.finalFaults > lfuSimulation.finalFaults ? (
                    <div className="text-2xl font-bold text-green-600">
                      LFU Venceu! 🎉
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-yellow-600">
                      Empate! 🤝
                    </div>
                  )}
                  <div className="text-sm text-gray-500 mt-2">
                    Diferença: {Math.abs(lruSimulation.finalFaults - lfuSimulation.finalFaults)} faults
                  </div>
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">LFU</div>
                <div className="text-3xl font-bold text-purple-600">
                  {lfuSimulation.finalFaults}
                </div>
                <div className="text-xs text-gray-500">page faults</div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold text-gray-800 mb-3">📖 Legenda:</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 border-4 border-green-500 bg-green-50 rounded"></div>
              <span><strong>Verde:</strong> Page HIT (página já na memória)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 border-4 border-red-500 bg-red-50 rounded"></div>
              <span><strong>Vermelho:</strong> Page FAULT (precisa carregar)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-500 bg-blue-50 rounded"></div>
              <span><strong>Azul:</strong> Página na memória</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 border-4 border-gray-300 bg-gray-50 rounded"></div>
              <span><strong>Cinza:</strong> Frame vazio</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <strong>Dica LFU:</strong> O número "f:X" abaixo de cada frame mostra a frequência de uso da página
          </div>
        </div>
      </div>
    </div>
  );
};

export default LRULFUSimulator;
