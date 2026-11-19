import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CoreChipBar } from '../components/CoreChipBar';

describe('CoreChipBar', () => {
  it('renders chips, supports endContent and renderEnd trailing slot with active selectedId', () => {
    const onSelect = vi.fn();
    const onGearClick = vi.fn();

    render(
      <CoreChipBar
        items={[
          { id: 'ai', label: 'AI & Нейросети', icon: '🤖' },
          { id: 'frontier', label: 'Фронтир & Tech', icon: '🚀' },
        ]}
        selectedId="frontier"
        onSelect={onSelect}
        allChip={{ id: '', label: 'Все темы' }}
        endContent={<span>custom-extra</span>}
        renderEnd={(activeId) => (
          <button type="button" onClick={() => onGearClick(activeId)} aria-label="Настроить">
            gear
          </button>
        )}
      />
    );

    expect(screen.getByText('Все темы')).toBeInTheDocument();
    expect(screen.getByText('Фронтир & Tech').closest('button')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByText('custom-extra')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Настроить' }));
    expect(onGearClick).toHaveBeenCalledWith('frontier');

    fireEvent.click(screen.getByText('AI & Нейросети'));
    expect(onSelect).toHaveBeenCalledWith('ai');
  });
});
