import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getAvatarFallbackDataUrl } from '../utils/avatarFallback';

const getIsMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 768px)').matches;
};

export default function AvatarPickerShell({
  label,
  triggerText = 'Выбрать аватар',
  selectedAvatar,
  selectedAvatarId,
  children
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(getIsMobile());
  const [popoverStyle, setPopoverStyle] = useState({});
  const triggerRef = useRef(null);
  const surfaceRef = useRef(null);

  const closePicker = () => setIsOpen(false);

  const updatePopoverPosition = useCallback(() => {
    if (!triggerRef.current || !surfaceRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const surfaceRect = surfaceRef.current.getBoundingClientRect();
    const padding = 16;
    let left = rect.left;
    let top = rect.bottom + 8;

    if (left + surfaceRect.width > window.innerWidth - padding) {
      left = window.innerWidth - surfaceRect.width - padding;
    }
    if (left < padding) left = padding;

    if (top + surfaceRect.height > window.innerHeight - padding) {
      top = rect.top - surfaceRect.height - 8;
    }
    if (top < padding) top = padding;

    setPopoverStyle({ left: `${left}px`, top: `${top}px` });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || isMobile) return;
    requestAnimationFrame(updatePopoverPosition);
  }, [isOpen, isMobile, updatePopoverPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const focusFirstOption = () => {
      if (!surfaceRef.current) return;
      const firstOption = surfaceRef.current.querySelector('[data-avatar-option="true"]');
      if (firstOption) firstOption.focus();
    };
    requestAnimationFrame(focusFirstOption);
  }, [isOpen]);

  useEffect(() => {
    const handleResize = () => setIsMobile(getIsMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isOpen || isMobile) return;
    const handleScroll = () => updatePopoverPosition();
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isMobile, isOpen, updatePopoverPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event) => {
      if (event.key === 'Escape') closePicker();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const handleSurfaceKeyDown = (event) => {
    const target = event.target;
    const isOption = target?.dataset?.avatarOption === 'true';

    if (!isOption) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      target.click();
      return;
    }

    if (!surfaceRef.current) return;
    if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      return;
    }

    const options = Array.from(
      surfaceRef.current.querySelectorAll('[data-avatar-option="true"]')
    );
    if (!options.length) return;

    event.preventDefault();
    const currentIndex = options.indexOf(target);
    if (currentIndex === -1) {
      options[0].focus();
      return;
    }

    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = Math.min(options.length - 1, currentIndex + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = Math.max(0, currentIndex - 1);
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = options.length - 1;
    }

    options[nextIndex]?.focus();
  };

  const handleTriggerError = (event) => {
    const target = event.currentTarget;
    if (target.dataset.fallbackApplied) return;
    target.dataset.fallbackApplied = 'true';
    target.src = getAvatarFallbackDataUrl(selectedAvatarId);
  };

  return (
    <div className="avatar-picker-shell">
    <button
    ref={triggerRef}
    type="button"
    className="avatar-picker-trigger"
    onClick={() => setIsOpen((prev) => !prev)}
    aria-haspopup="dialog"
    aria-expanded={isOpen}
    >
    {selectedAvatar?.dataUrl ? (
      <img
      src={selectedAvatar.dataUrl}
      alt={label}
      onError={handleTriggerError}
      />
    ) : (
      <span className="avatar-picker-trigger-fallback">—</span>
    )}
    <span className="avatar-picker-trigger-text">{triggerText}</span>
    </button>

    {isOpen && (
      <div
      className={`avatar-picker-overlay ${isMobile ? 'is-mobile' : 'is-desktop'}`}
      onClick={closePicker}
      >
      <div
      className={`avatar-picker-surface ${isMobile ? 'sheet' : 'popover'}`}
      ref={surfaceRef}
      style={isMobile ? undefined : popoverStyle}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={handleSurfaceKeyDown}
      role="dialog"
      aria-label={label}
      >
      <div className="avatar-picker-header">
      <span>{label}</span>
      <button type="button" className="avatar-picker-close" onClick={closePicker}>
      ×
      </button>
      </div>
      <div className="avatar-picker-body">
      {children({ closePicker })}
      </div>
      </div>
      </div>
    )}
    </div>
  );
}
