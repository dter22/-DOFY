import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pipette } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
}

// Convert HEX string to RGB object
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num) || cleanHex.length !== 6) {
    return { r: 249, g: 115, b: 22 }; // default orange
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert RGB to HEX string
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(Number(n) || 0)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// RGB to HSV conversion
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r = Math.max(0, Math.min(255, r)) / 255;
  g = Math.max(0, Math.min(255, g)) / 255;
  b = Math.max(0, Math.min(255, b)) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, v: v * 100 };
}

// HSV to RGB conversion
function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360 / 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  v = Math.max(0, Math.min(100, v)) / 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [hsv, setHsv] = useState(() => {
    const rgb = hexToRgb(color || '#F97316');
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  });

  const satValRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const isDraggingSatVal = useRef(false);
  const isDraggingHue = useRef(false);

  // Sync internal state when external color prop changes
  useEffect(() => {
    const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
    const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);
    if (color && color.toUpperCase() !== currentHex.toUpperCase()) {
      const rgb = hexToRgb(color);
      setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
    }
  }, [color]);

  const currentRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);

  // Handle Saturation and Value 2D dragging
  const updateSatVal = useCallback(
    (clientX: number, clientY: number) => {
      if (!satValRef.current) return;
      const rect = satValRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

      const s = (x / rect.width) * 100;
      const v = (1 - y / rect.height) * 100;

      setHsv((prev) => {
        const next = { ...prev, s, v };
        const rgb = hsvToRgb(next.h, next.s, next.v);
        onChange(rgbToHex(rgb.r, rgb.g, rgb.b));
        return next;
      });
    },
    [onChange]
  );

  // Handle Hue slider dragging
  const updateHue = useCallback(
    (clientX: number) => {
      if (!hueRef.current) return;
      const rect = hueRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const h = (x / rect.width) * 360;

      setHsv((prev) => {
        const next = { ...prev, h };
        const rgb = hsvToRgb(next.h, next.s, next.v);
        onChange(rgbToHex(rgb.r, rgb.g, rgb.b));
        return next;
      });
    },
    [onChange]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSatVal.current) {
        updateSatVal(e.clientX, e.clientY);
      } else if (isDraggingHue.current) {
        updateHue(e.clientX);
      }
    };

    const handleMouseUp = () => {
      isDraggingSatVal.current = false;
      isDraggingHue.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [updateSatVal, updateHue]);

  // Eyedropper API support
  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          const hex = result.sRGBHex;
          const rgb = hexToRgb(hex);
          setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
          onChange(hex.toUpperCase());
        }
      } catch (err) {
        // Cancelled or not supported
      }
    }
  };

  const handleHexInput = (val: string) => {
    let clean = val.trim();
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      const rgb = hexToRgb(clean);
      setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
      onChange(clean.toUpperCase());
    }
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', val: number) => {
    const clamped = Math.max(0, Math.min(255, val));
    const nextRgb = { ...currentRgb, [channel]: clamped };
    const nextHsv = rgbToHsv(nextRgb.r, nextRgb.g, nextRgb.b);
    setHsv(nextHsv);
    onChange(rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b));
  };

  // Pure hue RGB for the 2D gradient background
  const pureHueRgb = hsvToRgb(hsv.h, 100, 100);
  const pureHueHex = rgbToHex(pureHueRgb.r, pureHueRgb.g, pureHueRgb.b);

  return (
    <div className="w-full max-w-sm mx-auto p-4 rounded-2xl bg-[#0b0914] border border-orange-500/30 shadow-2xl space-y-4 select-none">
      
      {/* 2D Saturation / Value Gradient Box */}
      <div
        ref={satValRef}
        onMouseDown={(e) => {
          isDraggingSatVal.current = true;
          updateSatVal(e.clientX, e.clientY);
        }}
        className="relative w-full h-44 rounded-xl overflow-hidden cursor-crosshair shadow-inner border border-zinc-700/60"
        style={{
          backgroundColor: pureHueHex,
        }}
      >
        {/* White horizontal gradient (saturation) */}
        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
        {/* Black vertical gradient (value/brightness) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

        {/* Current position circular indicator */}
        <div
          className="absolute w-5 h-5 rounded-full border-2 border-white shadow-[0_0_6px_rgba(0,0,0,0.9)] -translate-x-1/2 -translate-y-1/2 pointer-events-none ring-1 ring-black/60"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            backgroundColor: currentHex,
          }}
        />
      </div>

      {/* Hue Spectrum Bar, Eyedropper & Color Preview */}
      <div className="flex items-center gap-3">
        {/* Hue Spectrum Bar */}
        <div
          ref={hueRef}
          onMouseDown={(e) => {
            isDraggingHue.current = true;
            updateHue(e.clientX);
          }}
          className="relative flex-1 h-5 rounded-full cursor-pointer shadow-inner border border-zinc-700/60"
          style={{
            background:
              'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
          }}
        >
          {/* Hue thumb circle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-md -translate-x-1/2 pointer-events-none"
            style={{
              left: `${(hsv.h / 360) * 100}%`,
              backgroundColor: pureHueHex,
            }}
          />
        </div>

        {/* Eyedropper button */}
        {'EyeDropper' in window && (
          <button
            type="button"
            onClick={handleEyeDropper}
            className="p-2 rounded-xl bg-[#181426] hover:bg-orange-500/20 text-zinc-300 hover:text-orange-400 border border-zinc-700 hover:border-orange-500/40 transition cursor-pointer shrink-0"
            title="التقاط لون من الشاشة (Eyedropper)"
          >
            <Pipette className="w-4 h-4" />
          </button>
        )}

        {/* Selected Color Circle Preview */}
        <div
          className="w-8 h-8 rounded-full border-2 border-white/90 shadow-lg shrink-0 ring-1 ring-zinc-700 transition-colors"
          style={{ backgroundColor: currentHex }}
          title={currentHex}
        />
      </div>

      {/* RGB and HEX Controls - Paired strictly in columns with clear color-coded indicators */}
      <div className="pt-2 border-t border-zinc-800/80">
        <div className="grid grid-cols-4 gap-2">
          
          {/* HEX Box */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-orange-400 mb-1">سداسي عشري</span>
            <input
              type="text"
              value={currentHex}
              onChange={(e) => handleHexInput(e.target.value)}
              placeholder="#202124"
              className="w-full h-9 text-center font-mono font-black text-xs rounded-xl bg-[#141122] border-2 border-orange-500/80 text-orange-300 focus:border-amber-400 outline-none shadow-sm"
            />
          </div>

          {/* Red (R) */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-red-400 mb-1">أحمر (R)</span>
            <input
              type="number"
              min={0}
              max={255}
              value={currentRgb.r}
              onChange={(e) => handleRgbChange('r', Number(e.target.value))}
              className="w-full h-9 text-center font-mono font-bold text-xs rounded-xl bg-[#141122] border border-red-500/30 focus:border-red-500 text-white outline-none"
            />
          </div>

          {/* Green (G) */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-green-400 mb-1">أخضر (G)</span>
            <input
              type="number"
              min={0}
              max={255}
              value={currentRgb.g}
              onChange={(e) => handleRgbChange('g', Number(e.target.value))}
              className="w-full h-9 text-center font-mono font-bold text-xs rounded-xl bg-[#141122] border border-green-500/30 focus:border-green-500 text-white outline-none"
            />
          </div>

          {/* Blue (B) */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-blue-400 mb-1">أزرق (B)</span>
            <input
              type="number"
              min={0}
              max={255}
              value={currentRgb.b}
              onChange={(e) => handleRgbChange('b', Number(e.target.value))}
              className="w-full h-9 text-center font-mono font-bold text-xs rounded-xl bg-[#141122] border border-blue-500/30 focus:border-blue-500 text-white outline-none"
            />
          </div>

        </div>
      </div>

    </div>
  );
};
