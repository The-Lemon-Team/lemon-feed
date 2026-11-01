import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { DeleteTrackModal } from '../workspace/DeleteTrackModal';
import { DeleteWorkspaceModal } from '../workspace/DeleteWorkspaceModal';
import { LemonSeasonsModal } from '../LemonSeasonsModal';
import { FeedCategoriesSheet } from '../navigation/FeedCategoriesSheet';

/**
 * AGENTS.md §7 "Modal Windows & Keyboard UX Standards" as an executable contract.
 * Every modal below must: close on Escape, close on backdrop click, NOT close on
 * dialog-card click, and stop listening for Escape once closed/unmounted.
 */
type ModalCase = {
  name: string;
  renderModal: (props: { isOpen: boolean; onClose: () => void }) => React.ReactElement;
};

const track = { id: 't1', title: 'Track' } as any;
const workspace = { id: 'w1', title: 'My Space' } as any;

const modals: ModalCase[] = [
  {
    name: 'DeleteTrackModal',
    renderModal: (p) => <DeleteTrackModal {...p} track={track} onConfirm={async () => {}} />,
  },
  {
    name: 'DeleteWorkspaceModal',
    renderModal: (p) => <DeleteWorkspaceModal {...p} workspace={workspace} onConfirm={async () => {}} />,
  },
  { name: 'LemonSeasonsModal', renderModal: (p) => <LemonSeasonsModal {...p} /> },
  {
    name: 'FeedCategoriesSheet',
    renderModal: (p) => (
      <FeedCategoriesSheet {...p} activeTabs={[]} totalCount={0} onSelectFeed={() => {}} />
    ),
  },
];

const getBackdrop = () => document.body.querySelector('.fixed.inset-0') as HTMLElement;

describe.each(modals)('$name modal UX contract', ({ renderModal }) => {
  it('renders nothing when closed', () => {
    render(renderModal({ isOpen: false, onClose: vi.fn() }));
    expect(getBackdrop()).toBeNull();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(renderModal({ isOpen: true, onClose }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores other keys', () => {
    const onClose = vi.fn();
    render(renderModal({ isOpen: true, onClose }));
    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'a' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes when the backdrop is clicked', () => {
    const onClose = vi.fn();
    render(renderModal({ isOpen: true, onClose }));
    fireEvent.click(getBackdrop());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when the dialog card is clicked', () => {
    const onClose = vi.fn();
    render(renderModal({ isOpen: true, onClose }));
    fireEvent.click(getBackdrop().firstElementChild as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('removes the Escape listener on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(renderModal({ isOpen: true, onClose }));
    unmount();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not listen for Escape while closed', () => {
    const onClose = vi.fn();
    render(renderModal({ isOpen: false, onClose }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('stops listening after being closed via props', () => {
    const onClose = vi.fn();
    const { rerender } = render(renderModal({ isOpen: true, onClose }));
    rerender(renderModal({ isOpen: false, onClose }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
