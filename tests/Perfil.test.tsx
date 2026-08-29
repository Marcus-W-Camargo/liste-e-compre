import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Perfil } from '../src/pages/Perfil';

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    id: 'usuario-teste',
    nome: 'Usuário Teste',
    email: 'usuario@teste.com',
  }),
}));

class ImagemSimulada {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 800;
  naturalHeight = 600;
  width = 800;
  height = 600;
  private valorSrc = '';

  set src(valor: string) {
    this.valorSrc = valor;
    queueMicrotask(() => this.onload?.());
  }

  get src() {
    return this.valorSrc;
  }
}

function inputDeFoto() {
  return document.querySelector<HTMLInputElement>('input[type="file"]')!;
}

async function selecionarFoto() {
  const arquivo = new File(['imagem'], 'perfil.png', { type: 'image/png' });
  fireEvent.change(inputDeFoto(), { target: { files: [arquivo] } });
  await screen.findByRole('heading', { name: 'Recortar foto' });
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('Image', ImagemSimulada);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('foto do perfil', () => {
  it('aceita somente os formatos de imagem pedidos e permite cancelar o recorte', async () => {
    render(<Perfil />);

    expect(inputDeFoto().accept).toBe('image/jpeg,image/png,.jpg,.jpeg,.png');
    const arquivoInvalido = new File(['texto'], 'arquivo.txt', { type: 'text/plain' });
    fireEvent.change(inputDeFoto(), { target: { files: [arquivoInvalido] } });
    expect(screen.getByRole('alert').textContent).toContain('JPG, JPEG ou PNG');

    await selecionarFoto();
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar adição da foto' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Abrir opções da foto do perfil' })).toBeTruthy();
  });

  it('a seta abre novamente os arquivos e salvar posiciona a foto no avatar', async () => {
    render(<Perfil />);
    const abrirArquivos = vi.spyOn(inputDeFoto(), 'click');
    await selecionarFoto();

    fireEvent.click(screen.getByRole('button', { name: 'Voltar à seleção de arquivos' }));
    expect(abrirArquivos).toHaveBeenCalledOnce();

    const contexto = {
      fillStyle: '',
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'low',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      contexto as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/jpeg;base64,foto-recortada',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Salvar foto' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const foto = screen.getByAltText('Foto de perfil de Usuário Teste');
    expect(foto.getAttribute('src')).toBe('data:image/jpeg;base64,foto-recortada');
    expect(screen.getByRole('button', { name: 'Abrir opções da foto do perfil' })).toBeTruthy();
    expect(localStorage.getItem('liste-e-compre:foto-perfil:v1:usuario-teste'))
      .toContain('foto-recortada');
  });

  it('abre as opções, fecha ao clicar fora e permite escolher outra foto', () => {
    render(<Perfil />);
    const abrirArquivos = vi.spyOn(inputDeFoto(), 'click');
    const camera = screen.getByRole('button', { name: 'Abrir opções da foto do perfil' });

    fireEvent.click(camera);
    expect(screen.getByRole('heading', { name: 'Foto do perfil' })).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Excluir foto' }) as HTMLButtonElement).disabled,
    ).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar opções da foto' }));
    expect(screen.queryByRole('heading', { name: 'Foto do perfil' })).toBeNull();

    fireEvent.click(camera);
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar foto' }));
    expect(abrirArquivos).toHaveBeenCalledOnce();
    expect(screen.queryByRole('heading', { name: 'Foto do perfil' })).toBeNull();
  });

  it('exclui a foto salva e restaura o ícone padrão', () => {
    localStorage.setItem(
      'liste-e-compre:foto-perfil:v1:usuario-teste',
      JSON.stringify({ versao: 1, imagem: 'data:image/jpeg;base64,foto-atual' }),
    );
    render(<Perfil />);

    expect(screen.getByAltText('Foto de perfil de Usuário Teste')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir opções da foto do perfil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir foto' }));

    expect(screen.queryByAltText('Foto de perfil de Usuário Teste')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Foto do perfil' })).toBeNull();
    expect(localStorage.getItem('liste-e-compre:foto-perfil:v1:usuario-teste')).toBeNull();
  });
});
