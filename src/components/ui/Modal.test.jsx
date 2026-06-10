import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import Modal from './Modal';

function render(ui) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(ui);
  });

  return {
    container,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
      document.querySelectorAll('.ui-modal__overlay').forEach((node) => node.remove());
    },
  };
}

function mouseDown(node) {
  act(() => {
    node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  });
}

describe('Modal', () => {
  let originalActEnvironment;

  beforeEach(() => {
    originalActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    document.documentElement.style.overflow = '';
  });

  it('closes when clicking outside the sheet panel', () => {
    const onClose = vi.fn();
    const view = render(
      <Modal open onClose={onClose} placement="sheet" title="Условия возврата">
        <button type="button">Внутри окна</button>
      </Modal>
    );

    const panel = document.querySelector('.ui-modal__panel');
    const viewport = document.querySelector('.ui-modal__viewport');

    expect(panel).toBeTruthy();
    expect(viewport).toBeTruthy();

    mouseDown(panel);
    expect(onClose).not.toHaveBeenCalled();

    mouseDown(viewport);
    expect(onClose).toHaveBeenCalledTimes(1);

    view.unmount();
  });
});
