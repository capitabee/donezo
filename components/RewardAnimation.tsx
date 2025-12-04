

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface RewardAnimationProps {
  onAnimationComplete: () => void;
}

const RewardAnimation = ({ onAnimationComplete }: RewardAnimationProps) => {
  const [coins, setCoins] = useState<any[]>([]);
  const animationFrameIds = useRef<number[]>([]);
  const animationStartTimeRef = useRef<number>(0);
  const targetRect = useRef<DOMRect | null>(null);

  const totalDuration = 1500; // ms for animation
  const numCoins = 10;
  const initialBurstRadius = 50; // Pixels for initial spread

  // Cubic Bezier easing function (easeOutExpo)
  const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

  const animateCoin = useCallback((
    coinId: number, 
    startBurstX: number, 
    startBurstY: number, 
    endTargetX: number, 
    endTargetY: number,
    initialDelay: number
  ) => {
    let frameId: number;
    let localStartTime: number | null = null;

    const animate = (currentTime: number) => {
      if (!localStartTime) localStartTime = currentTime;
      const elapsedTime = currentTime - localStartTime;
      
      if (elapsedTime < initialDelay) {
        frameId = requestAnimationFrame(animate);
        animationFrameIds.current.push(frameId);
        return;
      }

      const animationProgress = Math.min((elapsedTime - initialDelay) / totalDuration, 1);
      const easedProgress = easeOutExpo(animationProgress);

      // Current position interpolation
      // Starts at burst point, moves towards target
      const currentX = startBurstX + (endTargetX - startBurstX) * easedProgress;
      const currentY = startBurstY + (endTargetY - startBurstY) * easedProgress;

      // Slight arc upwards in the middle of the Y movement
      const arcHeight = 30; // Max arc height
      const curvedY = currentY - Math.sin(easedProgress * Math.PI) * arcHeight;

      const scale = 0.5 + 0.7 * easedProgress; // Start small, grow
      const rotate = easedProgress * 360 * (coinId % 2 === 0 ? 1 : -1); // Spin
      const opacity = Math.max(0, 1 - easedProgress * 1.5); // Fade out faster at the end

      setCoins(prevCoins => prevCoins.map(coin =>
        coin.id === coinId
          ? {
              ...coin,
              style: {
                ...coin.style, // Retain initial position for fixed placement
                transform: `translate(${currentX}px, ${curvedY}px) scale(${scale}) rotate(${rotate}deg)`,
                opacity: opacity,
              }
            }
          : coin
      ));

      if (animationProgress < 1) {
        frameId = requestAnimationFrame(animate);
        animationFrameIds.current.push(frameId);
      } else {
        // Remove coin after animation
        setCoins(prevCoins => prevCoins.filter(coin => coin.id !== coinId));
      }
    };
    frameId = requestAnimationFrame(animate);
    animationFrameIds.current.push(frameId);

  }, [totalDuration, easeOutExpo]);

  useEffect(() => {
    const targetElement = document.getElementById('sidebar-earnings-tab');
    if (!targetElement) {
      console.warn("Target element #sidebar-earnings-tab for reward animation not found.");
      onAnimationComplete();
      return;
    }
    targetRect.current = targetElement.getBoundingClientRect();

    // Center of the viewport as the starting burst point
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;

    // Target point is the center of the earnings tab
    const targetCoinX = targetRect.current.left + targetRect.current.width / 2;
    const targetCoinY = targetRect.current.top + targetRect.current.height / 2;

    const initialCoins = Array.from({ length: numCoins }).map((_, i) => {
      // Randomize initial burst position around the center
      const angle = Math.random() * 2 * Math.PI;
      const offset = Math.random() * initialBurstRadius;
      const burstX = viewportCenterX + Math.cos(angle) * offset;
      const burstY = viewportCenterY + Math.sin(angle) * offset;

      return {
        id: i,
        // Coins will be positioned absolutely, so their transform values will be relative to their fixed 'left'/'top'
        // For animation, we pass the absolute coordinates and calculate transform based on that.
        startAbsoluteX: burstX,
        startAbsoluteY: burstY,
        endAbsoluteX: targetCoinX,
        endAbsoluteY: targetCoinY,
        style: {
          position: 'fixed',
          left: `${burstX}px`, // Fixed initial position before transform
          top: `${burstY}px`,  // Fixed initial position before transform
          zIndex: 9999,
          pointerEvents: 'none',
          opacity: 0,
          transform: 'translate(-50%, -50%) scale(0)' // Center the coin on its fixed left/top
        }
      };
    });
    setCoins(initialCoins);

    initialCoins.forEach((coin, index) => {
      // Staggered animation start
      const staggerDelay = index * 50;
      animateCoin(
        coin.id, 
        coin.startAbsoluteX - viewportCenterX, // Transform X relative to viewport center
        coin.startAbsoluteY - viewportCenterY, // Transform Y relative to viewport center
        targetCoinX - viewportCenterX, // Transform X relative to viewport center
        targetCoinY - viewportCenterY, // Transform Y relative to viewport center
        staggerDelay
      );
    });

    // Determine when the animation is truly complete after all coins have faded
    const finalCompletionDelay = totalDuration + (numCoins * 50); 
    const timeout = setTimeout(() => {
      onAnimationComplete();
      animationStartTimeRef.current = 0; // Reset for next animation
    }, finalCompletionDelay);

    return () => {
      clearTimeout(timeout);
      animationFrameIds.current.forEach(cancelAnimationFrame);
      animationStartTimeRef.current = 0;
    };
  }, [onAnimationComplete, animateCoin]);

  return (
    <>
      {coins.map(coin => (
        <div
          key={coin.id}
          className="premium-coin w-8 h-8 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg absolute"
          style={coin.style}
        >
          £
        </div>
      ))}
    </>
  );
};

export default RewardAnimation;