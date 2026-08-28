import React, { useEffect, useState, useRef } from 'react';

export const InteractiveMouseBackground: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });
  const [smoothPos, setSmoothPos] = useState({ x: -500, y: -500 });
  const [isHovering, setIsHovering] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!isHovering) setIsHovering(true);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isHovering]);

  // Smooth lerp follow effect
  useEffect(() => {
    let currentX = smoothPos.x;
    let currentY = smoothPos.y;

    const animate = () => {
      currentX += (mousePos.x - currentX) * 0.08;
      currentY += (mousePos.y - currentY) * 0.08;
      setSmoothPos({ x: currentX, y: currentY });
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mousePos]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Dynamic Cursor Spotlight Glowing Orb 1 (Orange Ember) */}
      <div
        className="absolute rounded-full blur-[100px] transition-opacity duration-700 will-change-transform"
        style={{
          width: '550px',
          height: '550px',
          background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, rgba(234,88,12,0.08) 45%, rgba(0,0,0,0) 70%)',
          left: `${smoothPos.x - 275}px`,
          top: `${smoothPos.y - 275}px`,
          opacity: isHovering ? 1 : 0,
        }}
      />

      {/* Dynamic Cursor Spotlight Glowing Orb 2 (Violet / Amber Aura) */}
      <div
        className="absolute rounded-full blur-[130px] transition-opacity duration-1000 will-change-transform"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, rgba(245,158,11,0.06) 50%, rgba(0,0,0,0) 70%)',
          left: `${mousePos.x - 200}px`,
          top: `${mousePos.y - 200}px`,
          opacity: isHovering ? 0.8 : 0,
        }}
      />

      {/* Interactive Cyber Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] will-change-transform"
        style={{
          backgroundImage: `
            linear-gradient(to right, #f97316 1px, transparent 1px),
            linear-gradient(to bottom, #f97316 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          transform: `translate3d(${(smoothPos.x - window.innerWidth / 2) * 0.015}px, ${(smoothPos.y - window.innerHeight / 2) * 0.015}px, 0)`,
        }}
      />

      {/* Radial Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#090710_80%)] opacity-80" />
    </div>
  );
};
