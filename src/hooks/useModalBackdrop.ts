import { useRef, useCallback } from 'react';

export interface UseModalBackdropOptions {
  onClose?: () => void;
  disabled?: boolean;
}

/**
 * Standard modal backdrop interaction handler complying with AGENTS.md §7:
 * - Closes modal when user clicks directly on the backdrop overlay.
 * - Prevents unintentional closing when user selects/drags text from inside the modal
 *   and releases the mouse button outside on the backdrop.
 * - Prevents closing when user presses mouse down on the backdrop and releases inside the modal.
 * - Fully compatible with synthetic click events (e.g. testing-library fireEvent.click).
 */
export function useModalBackdrop(onClose?: () => void, disabled?: boolean) {
  const isTargetInsideRef = useRef(false);

  const handleMouseDownCapture = useCallback((e: React.MouseEvent) => {
    // When mousedown begins, mark whether the interaction originated inside modal content
    isTargetInsideRef.current = e.target !== e.currentTarget;
  }, []);

  const handleMouseUpCapture = useCallback((e: React.MouseEvent) => {
    // If mouseup occurred inside modal content, mark as inside
    if (e.target !== e.currentTarget) {
      isTargetInsideRef.current = true;
    }
  }, []);

  const handleTouchStartCapture = useCallback((e: React.TouchEvent) => {
    isTargetInsideRef.current = e.target !== e.currentTarget;
  }, []);

  const handleTouchEndCapture = useCallback((e: React.TouchEvent) => {
    if (e.target !== e.currentTarget) {
      isTargetInsideRef.current = true;
    }
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      // Close only if click target is directly the backdrop AND interaction did not involve modal content
      if (e.target === e.currentTarget && !isTargetInsideRef.current) {
        onClose?.();
      }
      isTargetInsideRef.current = false;
    },
    [onClose, disabled]
  );

  return {
    handleMouseDownCapture,
    handleMouseUpCapture,
    handleTouchStartCapture,
    handleTouchEndCapture,
    handleClick,
    backdropProps: {
      onMouseDownCapture: handleMouseDownCapture,
      onMouseUpCapture: handleMouseUpCapture,
      onTouchStartCapture: handleTouchStartCapture,
      onTouchEndCapture: handleTouchEndCapture,
      onClick: handleClick,
    },
  };
}
