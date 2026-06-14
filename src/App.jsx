import React, { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { 
  Barcode, 
  Settings, 
  Eye, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Classic Monochrome', line: '#000000', bg: '#ffffff' },
  { name: 'Neon Cyber', line: '#39ff14', bg: '#0b0f19' },
  { name: 'Midnight Blue', line: '#0f172a', bg: '#eff6ff' },
  { name: 'Sunset Warmth', line: '#7c2d12', bg: '#ffedd5' },
  { name: 'Royal Gold', line: '#78350f', bg: '#fef3c7' }
];

export default function App() {
  // Barcode state
  const [text, setText] = useState('CODE128-DEMO');
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(80);
  const [margin, setMargin] = useState(20);
  const [displayValue, setDisplayValue] = useState(true);
  const [lineColor, setLineColor] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');
  
  // UI states
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  // Debounce state for text input to prevent mobile typing lag
  const [debouncedText, setDebouncedText] = useState(text);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedText(text);
    }, 150); // 150ms sweet spot for smooth typing feedback

    return () => {
      clearTimeout(handler);
    };
  }, [text]);

  const isPending = text !== debouncedText || isRendering;

  const svgRef = useRef(null);

  // Validation function: Code 128 supports standard ASCII (0 - 127)
  const validateInput = (input) => {
    if (!input) return null; // Empty input is treated as a clean blank state, not an error
    const isAsciiOnly = /^[\x00-\x7F]*$/.test(input);
    if (!isAsciiOnly) {
      return 'Contains unsupported characters. Code 128 only supports standard ASCII (0-127).';
    }
    return null;
  };

  const validationError = validateInput(text);

  // Generate barcode on state change
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    // Clear previous contents to prevent redraw issues and stacking elements
    svgElement.innerHTML = '';

    if (!debouncedText) {
      setError(null);
      return;
    }

    const currentValidationError = validateInput(debouncedText);
    if (currentValidationError) {
      setError(currentValidationError);
      return;
    }

    setIsRendering(true);
    try {
      JsBarcode(svgElement, debouncedText, {
        format: 'CODE128',
        width: Number(width),
        height: Number(height),
        margin: Number(margin),
        displayValue: displayValue,
        lineColor: lineColor,
        background: background,
        valid: (valid) => {
          if (!valid) {
            setError('Invalid format for Code 128');
            svgElement.innerHTML = '';
          } else {
            setError(null);
          }
        }
      });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to render barcode');
      svgElement.innerHTML = '';
    } finally {
      setIsRendering(false);
    }
  }, [debouncedText, width, height, margin, displayValue, lineColor, background]);

  // Export handlers
  const handleDownloadSvg = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    try {
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgElement);

      if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      if (!source.match(/^<svg[^>]+xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/)) {
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
      }

      source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `barcode-code128-${text || 'preview'}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Failed to export SVG:', err);
    }
  };

  const handleDownloadPng = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);
      
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Use 3x scale for crisp print-quality PNG
        const scale = 3;
        const svgAttrWidth = Number(svgElement.getAttribute('width')) || svgElement.getBoundingClientRect().width || 200;
        const svgAttrHeight = Number(svgElement.getAttribute('height')) || svgElement.getBoundingClientRect().height || 100;
        
        canvas.width = svgAttrWidth * scale;
        canvas.height = svgAttrHeight * scale;
        
        const context = canvas.getContext('2d');
        if (context) {
          context.fillStyle = background;
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          
          const pngURL = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngURL;
          downloadLink.download = `barcode-code128-${text || 'preview'}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
        URL.revokeObjectURL(blobURL);
      };
      image.src = blobURL;
    } catch (err) {
      console.error('Failed to export PNG:', err);
    }
  };

  const handleCopyText = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetControls = () => {
    setText('CODE128-DEMO');
    setWidth(2);
    setHeight(80);
    setMargin(20);
    setDisplayValue(true);
    setLineColor('#000000');
    setBackground('#ffffff');
  };

  const applyPresetColor = (line, bg) => {
    setLineColor(line);
    setBackground(bg);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-between py-4 px-4 sm:py-8 sm:px-6 lg:px-8">
      {/* Decorative background glows - hidden on mobile to optimize performance */}
      <div className="hidden lg:block absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="hidden lg:block absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-6xl w-full mx-auto mb-6 sm:mb-10 text-center z-10">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight bg-gradient-to-r from-indigo-200 via-indigo-400 to-violet-400 bg-clip-text text-transparent drop-shadow-lg px-2">
          Code 128 Barcode Generator
        </h1>
      </header>

      {/* Main App Workspace */}
      <main className="max-w-6xl w-full mx-auto flex-grow flex items-center justify-center z-10 mb-6 sm:mb-8">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Configuration Controls (lg:col-span-7) */}
          <section className="order-2 lg:order-1 lg:col-span-7 flex flex-col gap-6">
            <div className="glass-card rounded-2xl p-4 sm:p-6 flex flex-col gap-5 sm:gap-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-slate-100">Configuration</h2>
                </div>
                <button
                  onClick={resetControls}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-800/50 border border-transparent hover:border-slate-800"
                  title="Reset to defaults"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Data Input Section */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-300 flex justify-between items-center">
                  <span>Barcode Data</span>
                  <span className="text-xs text-slate-500 font-mono">CODE 128</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text/numbers to encode..."
                    className={`w-full bg-slate-900/80 border ${
                      validationError ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                    } rounded-xl px-4 py-3 text-slate-100 font-mono placeholder-slate-500 focus:ring-4 outline-none transition-all pr-12`}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={handleCopyText}
                      className="p-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
                      title="Copy barcode text"
                    >
                      {copied ? <Check className="w-4.5 h-4.5 text-emerald-400" /> : <Copy className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Validation & Error Warnings */}
                {validationError ? (
                  <div className="flex items-start gap-2 text-xs text-red-400 bg-red-950/40 border border-red-500/20 rounded-lg p-3 mt-1">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                ) : !text ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-1">
                    <span>Ready to encode characters (ASCII only)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400/90 pl-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Text is valid (ASCII Only)</span>
                  </div>
                )}
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Bar Width */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Bar Width</span>
                    <span className="text-indigo-400">{width}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Thin (1px)</span>
                    <span>Thick (4px)</span>
                  </div>
                </div>

                {/* Bar Height */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Bar Height</span>
                    <span className="text-indigo-400">{height}px</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="180"
                    step="5"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Short (30px)</span>
                    <span>Tall (180px)</span>
                  </div>
                </div>

                {/* Outer Margin */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Outer Margin</span>
                    <span className="text-indigo-400">{margin}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="2"
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>None (0px)</span>
                    <span>Large (60px)</span>
                  </div>
                </div>
              </div>

              {/* Color Customization & Display Toggle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-800/80 pt-6">
                
                {/* Colors section */}
                <div className="flex flex-col gap-3">
                  <span className="text-sm font-semibold text-slate-300">Color Palette</span>
                  <div className="flex gap-4">
                    {/* Bar Color */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10">
                        <input
                          type="color"
                          id="barColorPicker"
                          value={lineColor}
                          onChange={(e) => setLineColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent opacity-0 absolute inset-0 z-10"
                        />
                        <div 
                          className="w-10 h-10 rounded-lg border border-slate-700 shadow-inner absolute inset-0"
                          style={{ backgroundColor: lineColor }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label htmlFor="barColorPicker" className="text-[10px] text-slate-400 uppercase font-bold tracking-wider cursor-pointer">Bar Color</label>
                        <span className="text-xs font-mono text-slate-200">{lineColor}</span>
                      </div>
                    </div>

                    {/* Background Color */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10">
                        <input
                          type="color"
                          id="bgColorPicker"
                          value={background}
                          onChange={(e) => setBackground(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent opacity-0 absolute inset-0 z-10"
                        />
                        <div 
                          className="w-10 h-10 rounded-lg border border-slate-700 shadow-inner absolute inset-0"
                          style={{ backgroundColor: background }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <label htmlFor="bgColorPicker" className="text-[10px] text-slate-400 uppercase font-bold tracking-wider cursor-pointer">Background</label>
                        <span className="text-xs font-mono text-slate-200">{background}</span>
                      </div>
                    </div>
                  </div>

                  {/* Preset Colors */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PRESET_COLORS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => applyPresetColor(preset.line, preset.bg)}
                        title={preset.name}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border transition-all text-xs font-medium ${
                          lineColor === preset.line && background === preset.bg
                            ? 'border-indigo-500 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.25)] bg-slate-900/90'
                            : 'border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex w-3.5 h-3.5 rounded-full overflow-hidden border border-slate-700 shrink-0">
                          <div className="w-1/2 h-full" style={{ backgroundColor: preset.line }} />
                          <div className="w-1/2 h-full" style={{ backgroundColor: preset.bg }} />
                        </div>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display Value Text Toggle */}
                <div className="flex flex-col justify-between md:border-l md:border-slate-800/80 md:pl-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-slate-300">Teks yang Dapat Dibaca</span>
                    <p className="text-xs text-slate-500">Tampilkan atau sembunyikan karakter asli tepat di bawah batang barcode.</p>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      role="checkbox"
                      aria-checked={displayValue}
                      onClick={() => setDisplayValue(!displayValue)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        displayValue ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          displayValue ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-medium text-slate-300">
                      {displayValue ? 'Tampilkan di Bawah Barcode' : 'Sembunyikan Teks'}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Right Column: Live Preview & Downloads (lg:col-span-5) */}
          <section className="order-1 lg:order-2 lg:col-span-5 flex flex-col gap-6">
            <div className="glass-card rounded-2xl p-4 sm:p-6 flex flex-col justify-between gap-4 sm:gap-6 shadow-2xl relative overflow-hidden h-full min-h-[280px] sm:min-h-[360px]">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-slate-100">Live Preview</h2>
                </div>
                
                {/* Real-time indicator badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/20 text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                  <RefreshCw className={`w-3 h-3 ${isPending ? 'animate-spin' : ''}`} />
                  <span>Real-time</span>
                </div>
              </div>

              {/* Barcode Display Container */}
              <div 
                className="flex-grow flex items-center justify-center bg-slate-950/80 rounded-xl border p-6 overflow-auto min-h-[200px] relative shadow-inner transition-all duration-300"
                style={{
                  boxShadow: !error ? `inset 0 0 20px rgba(0,0,0,0.6), 0 0 15px ${lineColor}15` : 'none',
                  borderColor: !error ? `${lineColor}30` : 'rgba(30, 41, 59, 0.4)'
                }}
              >
                {/* Grid dots overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
                
                {error ? (
                  <div className="z-10 flex flex-col items-center gap-2.5 max-w-[80%] text-center">
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                    <h3 className="text-sm font-semibold text-slate-300">Cannot Render Barcode</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
                  </div>
                ) : !text ? (
                  <div className="z-10 flex flex-col items-center gap-3 max-w-[80%] text-center py-6">
                    <Barcode className="w-12 h-12 text-slate-600 animate-pulse" />
                    <h3 className="text-sm font-semibold text-slate-400">Waiting for Input</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Type some characters in the data box to generate and preview your barcode in real-time.
                    </p>
                  </div>
                ) : (
                  <div 
                    className="z-10 flex items-center justify-center p-4 sm:p-6 rounded-xl shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                    style={{ 
                      backgroundColor: background,
                      border: `1px solid ${lineColor}20`
                    }}
                  >
                    <svg ref={svgRef} className="max-w-full h-auto block" />
                  </div>
                )}
              </div>

              {/* Download & Export Panel */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Export Format Options</span>
                  <span className="text-[10px] text-slate-600 font-mono">Prints at 300 DPI</span>
                </div>

                <div className="grid grid-cols-1 min-[450px]:grid-cols-2 gap-3">
                  {/* Download PNG */}
                  <button
                    onClick={handleDownloadPng}
                    disabled={!!error || !text || isPending}
                    className={`flex items-center justify-center gap-2 font-semibold text-sm py-3 px-4 rounded-xl border transition-all ${
                      error || !text || isPending
                        ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PNG</span>
                  </button>

                  {/* Download SVG */}
                  <button
                    onClick={handleDownloadSvg}
                    disabled={!!error || !text || isPending}
                    className={`flex items-center justify-center gap-2 font-semibold text-sm py-3 px-4 rounded-xl border transition-all ${
                      error || !text || isPending
                        ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/80 hover:text-slate-100 hover:-translate-y-0.5 active:translate-y-0'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download SVG</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center pt-8 mt-4 z-10">
        <p className="text-xs text-slate-700 font-mono">
          Code 128 Generator &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
