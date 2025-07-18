import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

export default function useSessionTimeout(logoutCallback) {
  const timer = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const resetTimer = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        logoutCallback();
        navigate("/login");
      }, INACTIVITY_LIMIT);
    };

    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach(event =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer(); // Start timer on mount

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach(event =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [logoutCallback, navigate]);
} 