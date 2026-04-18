import { useState, useEffect, useRef } from 'react';

const useCountUp = (target, duration = 1200, enabled = true) => {
  const [count, setCount] = useState(0);
  const startTime = useRef(null);
  const rafId = useRef(null);

  useEffect(() => {
    if (!enabled || target === 0) {
      setCount(target);
      return;
    }

    setCount(0);
    startTime.current = null;

    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    };

    rafId.current = requestAnimationFrame(animate);
    return () => rafId.current && cancelAnimationFrame(rafId.current);
  }, [target, duration, enabled]);

  return count;
};

export default useCountUp;
