
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  startTime: number;
  durationMinutes: number;
  onComplete: () => void;
}

const CountdownTimer = ({ startTime, durationMinutes, onComplete }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("30:00");
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const endTime = startTime + durationMinutes * 60 * 1000;
      const diff = endTime - now;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft("00:00");
        setProgress(0);
        onComplete();
        return;
      }

      const totalDuration = durationMinutes * 60 * 1000;
      const currentProgress = (diff / totalDuration) * 100;
      setProgress(currentProgress);

      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes, onComplete]);

  return (
    <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg border border-orange-100">
      <Clock size={14} className="animate-pulse" />
      <span className="font-mono text-sm font-bold">{timeLeft}</span>
    </div>
  );
};

export default CountdownTimer;
