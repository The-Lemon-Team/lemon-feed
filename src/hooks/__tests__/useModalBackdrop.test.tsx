import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useModalBackdrop } from '../useModalBackdrop';

const TestModal: React.FC<{ onClose?: () => void; disabled?: boolean }> = ({ onClose, disabled }) => {
  const { backdropProps } = useModalBackdrop(onClose, disabled);

  return (
    <div data-testid="backdrop" {...backdropProps}>
      <div data-testid="card" onClick={(e) => e.stopPropagation()}>
        <p data-testid="text">Modal content text selection</p>
      </div>
    </div>
  );
};

describe('useModalBackdrop', () => {
  it('closes when clicking directly on the backdrop', () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);

    const backdrop = screen.getByTestId('backdrop');
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on realistic mouse click cycle (mousedown -> mouseup -> click) on backdrop', () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);

    const backdrop = screen.getByTestId('backdrop');
    fireEvent.mouseDown(backdrop);
    fireEvent.mouseUp(backdrop);
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside the card', () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);

    const card = screen.getByTestId('card');
    fireEvent.click(card);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('does NOT close when mousedown starts on text inside modal and mouseup releases on backdrop', () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);

    const backdrop = screen.getByTestId('backdrop');
    const text = screen.getByTestId('text');

    // Simulate selecting text and releasing outside
    fireEvent.mouseDown(text);
    fireEvent.mouseUp(backdrop);
    fireEvent.click(backdrop);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('does NOT close when mousedown starts on backdrop and mouseup releases inside card', () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);

    const backdrop = screen.getByTestId('backdrop');
    const card = screen.getByTestId('card');

    fireEvent.mouseDown(backdrop);
    fireEvent.mouseUp(card);
    fireEvent.click(backdrop);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes normally on subsequent backdrop click after text selection outside', () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);

    const backdrop = screen.getByTestId('backdrop');
    const text = screen.getByTestId('text');

    // Drag-release from text to backdrop: should not close
    fireEvent.mouseDown(text);
    fireEvent.mouseUp(backdrop);
    fireEvent.click(backdrop);
    expect(onClose).not.toHaveBeenCalled();

    // Genuine click on backdrop: should close
    fireEvent.mouseDown(backdrop);
    fireEvent.mouseUp(backdrop);
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when disabled', () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} disabled={true} />);

    const backdrop = screen.getByTestId('backdrop');
    fireEvent.click(backdrop);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles touch drag outside safely without closing', () => {
    const onClose = vi.fn();
    render(<TestModal onClose={onClose} />);

    const backdrop = screen.getByTestId('backdrop');
    const text = screen.getByTestId('text');

    fireEvent.touchStart(text);
    fireEvent.touchEnd(backdrop);
    fireEvent.click(backdrop);

    expect(onClose).not.toHaveBeenCalled();
  });
});
