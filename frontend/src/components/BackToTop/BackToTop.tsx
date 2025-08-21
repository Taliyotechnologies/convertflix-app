import { useEffect, useState, useCallback } from 'react';

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  const onScroll = useCallback(() => {
    try {
      setVisible((window.scrollY || document.documentElement.scrollTop) > 300);
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll as EventListener);
  }, [onScroll]);

  const handleClick = () => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // fallback
      window.scrollTo(0, 0);
    }
  };

  if (!visible) return null;

  return (
    <button
      aria-label="Back to top"
      onClick={handleClick}
      style={{
        position: 'fixed',
        right: '1rem',
        bottom: '1.25rem',
        zIndex: 1000,
        width: 48,
        height: 48,
        borderRadius: 9999,
        background: 'linear-gradient(90deg, var(--button-start), var(--button-end))',
        color: '#fff',
        boxShadow: 'var(--shadow-lg)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M12 4l-7 7h4v7h6v-7h4l-7-7z" fill="currentColor" />
      </svg>
    </button>
  );
};

export default BackToTop;
