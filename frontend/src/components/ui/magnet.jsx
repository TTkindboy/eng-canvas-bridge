import { useEffect, useRef } from 'react';

// js file is so messed up because i needed to add drag support but on the lowks i dont really like the file drag ui atm anyway

const Magnet = ({
  children,
  padding = 100,
  disabled = false,
  magnetStrength = 2,
  activeTransition = 'transform 0.3s ease-out',
  inactiveTransition = 'transform 0.5s ease-in-out',
  wrapperClassName = '',
  innerClassName = '',
  wrapperStyle,
  innerStyle,
  ...props
}) => {
  const magnetRef = useRef(null);
  const innerRef = useRef(null);
  const frameRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const supportsMagnet =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const inner = innerRef.current;

    const applyPosition = (x, y, isActive) => {
      if (!inner) return;

      inner.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      inner.style.transition = isActive ? activeTransition : inactiveTransition;
    };

    const resetPosition = () => {
      applyPosition(0, 0, false);
    };

    if (disabled || !supportsMagnet) {
      resetPosition();
      return;
    }

    const flushPosition = () => {
      frameRef.current = null;

      if (!magnetRef.current) return;

      const { x: clientX, y: clientY } = pointerRef.current;
      const { left, top, width, height } = magnetRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      const distX = Math.abs(centerX - clientX);
      const distY = Math.abs(centerY - clientY);

      if (distX < width / 2 + padding && distY < height / 2 + padding) {
        const offsetX = (clientX - centerX) / magnetStrength;
        const offsetY = (clientY - centerY) / magnetStrength;
        applyPosition(offsetX, offsetY, true);
      } else {
        resetPosition();
      }
    };

    const scheduleUpdate = (clientX, clientY) => {
      pointerRef.current = { x: clientX, y: clientY };
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(flushPosition);
    };

    const handleMouseMove = e => {
      scheduleUpdate(e.clientX, e.clientY);
    };

    const handleDragOver = e => {
      scheduleUpdate(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', resetPosition);
    window.addEventListener('drop', resetPosition);
    window.addEventListener('dragend', resetPosition);
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', resetPosition);
      window.removeEventListener('drop', resetPosition);
      window.removeEventListener('dragend', resetPosition);
    };
  }, [padding, disabled, magnetStrength, activeTransition, inactiveTransition]);

  return (
    <div
      ref={magnetRef}
      className={wrapperClassName}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...wrapperStyle
      }}
      {...props}
    >
      <div
        ref={innerRef}
        className={innerClassName}
        style={{
          transform: 'translate3d(0, 0, 0)',
          transition: inactiveTransition,
          willChange: 'transform',
          ...innerStyle
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Magnet;
