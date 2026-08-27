import type { ReactNode, MouseEvent } from 'react';
import './Modal.css';

interface ModalProps {
  aberto: boolean;
  onFechar?: () => void;
  children: ReactNode;
  zIndex?: number;
}

export function Modal({
  aberto,
  onFechar,
  children,
  zIndex = 2500,
}: ModalProps) {
  if (!aberto) return null;

  function impedirFechamento(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  return (
    <div
      className="overlay-bloqueio"
      style={{ zIndex }}
      onMouseDown={onFechar}
      role="presentation"
    >
      <div
        className="card-bloqueio-home"
        onMouseDown={impedirFechamento}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}