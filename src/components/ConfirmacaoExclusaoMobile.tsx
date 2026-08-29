import { Modal } from './Modal';
import './ConfirmacaoExclusaoMobile.css';

interface ConfirmacaoExclusaoMobileProps {
  aberto: boolean;
  tipo: 'item' | 'lista';
  nome: string;
  onCancelar: () => void;
  onConfirmar: () => void;
}

export function ConfirmacaoExclusaoMobile({
  aberto,
  tipo,
  nome,
  onCancelar,
  onConfirmar,
}: ConfirmacaoExclusaoMobileProps) {
  const rotulo = tipo === 'item' ? 'item' : 'lista';

  return (
    <Modal aberto={aberto} onFechar={onCancelar} zIndex={3600}>
      <div className="confirmacao-exclusao-mobile">
        <span className="confirmacao-exclusao-mobile__icone" aria-hidden="true">
          🗑️
        </span>
        <h2>Excluir {rotulo}?</h2>
        <p>
          Tem certeza de que deseja excluir {tipo === 'item' ? 'o item' : 'a lista'}{' '}
          <strong>“{nome}”</strong>?
        </p>
        <p className="confirmacao-exclusao-mobile__aviso">
          Esta ação não poderá ser desfeita.
        </p>
        <div className="confirmacao-exclusao-mobile__acoes">
          <button
            type="button"
            className="confirmacao-exclusao-mobile__confirmar"
            onClick={onConfirmar}
          >
            Excluir {rotulo}
          </button>
          <button
            type="button"
            className="confirmacao-exclusao-mobile__cancelar"
            onClick={onCancelar}
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
