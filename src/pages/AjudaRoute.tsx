import { Ajuda } from './Ajuda';
import { AjudaFeedback } from '../components/AjudaFeedback';
import './Ajuda.css';
import './AjudaAjustes.css';
import './AjudaFaqLeitura.css';
import './AjudaHierarquia.css';

export function PaginaAjuda() {
  return (
    <>
      <Ajuda />
      <AjudaFeedback />
    </>
  );
}
