import { Link } from 'react-router-dom';
import './Privacidade.css';

export function Privacidade() {
  return (
    <main className="privacidade-pagina">
      <article className="privacidade-card">
        <span className="privacidade-kicker">Privacidade e LGPD</span>
        <h1>Política de Privacidade</h1>
        <p>
          Esta política explica, de forma simples, como o Liste & Compre trata
          dados necessários para oferecer contas, listas e o acompanhamento das
          compras.
        </p>

        <h2>Dados tratados e finalidades</h2>
        <p>
          Podemos tratar nome, e-mail e identificador interno da conta para
          cadastro, autenticação, identificação e sincronização. Quando você
          envia uma foto de perfil, ela é usada para personalizar sua conta.
          Listas de compras, itens, quantidades, valores e histórico são tratados
          para fornecer as funções de planejamento, compra e consulta do
          aplicativo.
        </p>
        <p>
          No formulário de feedback, tratamos a mensagem e, se você informar,
          seu e-mail para contato. Informações básicas do navegador são enviadas
          somente ao usar <strong>Reportar um bug</strong>, para auxiliar o
          diagnóstico; elogios e reclamações não enviam esse dado.
        </p>

        <h2>Serviços utilizados</h2>
        <p>
          O projeto utiliza Supabase para autenticação, banco de dados e
          armazenamento privado da foto de perfil; EmailJS nos fluxos de códigos
          necessários ao cadastro e recuperação; Resend para encaminhar mensagens
          do formulário de feedback e o link de confirmação da exclusão de conta;
          e Vercel para hospedagem da aplicação e das funções de backend. Esses
          serviços possuem suas próprias políticas e podem tratar dados conforme
          seus termos.
        </p>

        <h2>Armazenamento no navegador</h2>
        <p>
          O aplicativo usa armazenamento local necessário ao funcionamento. A
          compra em andamento pode permanecer no localStorage, separada pelo
          identificador da conta, para permitir continuidade no mesmo navegador.
          A sessão de autenticação também pode permanecer armazenada localmente
          conforme o funcionamento configurado do Supabase. URLs temporárias da
          foto podem ser mantidas durante a sessão do navegador. Para a confirmação
          de exclusão, um identificador aleatório do dispositivo pode ser mantido
          localmente e usado somente para validar que o link foi aberto no mesmo
          navegador utilizado na solicitação.
        </p>

        <h2>Segurança e prevenção de abuso</h2>
        <p>
          São utilizadas autenticação, regras de acesso por usuário, bucket
          privado para fotos, validações no backend, restrição de origem, limites
          de tentativas e de envios, códigos e tokens protegidos e credenciais
          administrativas mantidas somente no servidor. Para limitar abuso
          automatizado, a origem de requisições sensíveis pode ser transformada
          por HMAC antes do armazenamento temporário; o IP bruto não é salvo nessa
          proteção e os registros são mantidos em área privada pelo período
          necessário ao limite. A confirmação da exclusão também vincula o link
          à conta autenticada, ao dispositivo e ao IP utilizados na solicitação.
        </p>

        <h2>Seus direitos</h2>
        <p>
          Nos termos da LGPD, você pode solicitar confirmação do tratamento,
          acesso, correção, informações sobre o tratamento e exclusão quando
          aplicável. A opção <strong>Excluir conta</strong>, disponível em Minha
          Conta / Perfil, envia um link de confirmação ao e-mail da própria conta.
          A remoção automática só é concluída após a validação desse link no mesmo
          dispositivo e IP utilizados na solicitação.
        </p>

        <h2>Como falar sobre seus dados</h2>
        <p>
          Para solicitações de privacidade que não possam ser resolvidas
          diretamente no aplicativo, utilize o canal oficial já usado pelo
          projeto:{' '}
          <a href="mailto:listeecompre@gmail.com">listeecompre@gmail.com</a>.
          Informe apenas o necessário para identificarmos e atendermos a
          solicitação.
        </p>

        <p className="privacidade-atualizacao">
          Última atualização: 1 de setembro de 2026.
        </p>
        <Link className="privacidade-voltar" to="/">
          Voltar ao Liste & Compre
        </Link>
      </article>
    </main>
  );
}
