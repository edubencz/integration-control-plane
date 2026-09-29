/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Box, Link, Stack, Typography } from '@wso2/oxygen-ui';
import { ArrowLeft } from '@wso2/oxygen-ui-icons-react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router';
import { Link as NavLink } from 'react-router';
import { cookiePolicyUrl, external, loginUrl } from '../paths';

export default function PrivacyPolicy(): JSX.Element {
  const navigate = useNavigate();
  const handleBack = () => (window.history.length > 1 ? navigate(-1) : navigate(loginUrl()));

  return (
    <Box sx={{ position: 'fixed', inset: 0, overflowY: 'auto', zIndex: 1 }}>
      <Link component="button" onClick={handleBack} sx={{ position: 'fixed', top: '5rem', left: '1.5rem', zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <ArrowLeft size={16} />
        Voltar
      </Link>
      <Box sx={{ maxWidth: 800, mx: 'auto', px: 4, py: 6 }}>
        <Typography variant="h1" gutterBottom>
          NEXDOM Integration Platform - Política de Privacidade
        </Typography>
        <Link href={external.wso2} target="_blank" rel="noopener noreferrer" color="primary" sx={{ textDecoration: 'underline' }}>
          NEXDOM Integration Platform
        </Link>
        <Typography variant="body1" sx={{ mt: 1, mb: 4 }}>
          O NEXDOM Integration Platform monitora instâncias do Micro Integrator em execução (modo individual ou cluster) e facilita a realização de tarefas de gerenciamento e administração relacionadas aos artefatos implantados.
        </Typography>

        <Stack spacing={3}>
          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              Política de Privacidade
            </Typography>
            <Typography variant="body1" paragraph>
              Esta política descreve como o NEXDOM Integration Platform coleta suas informações pessoais, as finalidades da coleta e as informações sobre a retenção dos seus dados pessoais.
            </Typography>
            <Typography variant="body1" paragraph>
              Observe que esta política serve apenas como referência e se aplica ao software como produto. A NEXDOM e seus desenvolvedores não têm acesso às informações mantidas no NEXDOM Integration Platform. Consulte a seção de Isenção de responsabilidade
              para obter mais informações.
            </Typography>
            <Typography variant="body1">
              As entidades, organizações ou pessoas que controlam o uso e a administração do NEXDOM Integration Platform devem criar suas próprias políticas de privacidade, estabelecendo a forma como os dados são controlados ou processados pela respectiva
              entidade, organização ou pessoa.
            </Typography>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              O que são informações pessoais?
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform considera informação pessoal tudo o que estiver relacionado a você e que possa identificá-lo. Isso inclui, entre outros:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '2rem' }}>
              <li>
                <Typography variant="body1">Seu nome de usuário (exceto quando o nome de usuário criado pelo seu empregador estiver sujeito a contrato)</Typography>
              </li>
              <li>
                <Typography variant="body1">Sua data de nascimento/idade</Typography>
              </li>
              <li>
                <Typography variant="body1">Endereço IP usado para entrar</Typography>
              </li>
              <li>
                <Typography variant="body1">O ID do seu dispositivo, caso você use um dispositivo (por exemplo, telefone ou tablet) para entrar</Typography>
              </li>
            </ul>
            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
              No entanto, o NEXDOM Integration Platform também coleta as informações a seguir, que não são consideradas informações pessoais e são usadas apenas para fins <strong>estatísticos</strong>. Isso ocorre porque essas informações não podem ser usadas
              para rastreá-lo.
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '2rem' }}>
              <li>
                <Typography variant="body1">Cidade/país de origem da conexão TCP/IP</Typography>
              </li>
              <li>
                <Typography variant="body1">Horário em que você entrou (ano, mês, semana, hora ou minuto)</Typography>
              </li>
              <li>
                <Typography variant="body1">Tipo de dispositivo usado para entrar (por exemplo, telefone ou tablet)</Typography>
              </li>
              <li>
                <Typography variant="body1">Sistema operacional e informações gerais do navegador</Typography>
              </li>
            </ul>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              Coleta de informações pessoais
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform coleta suas informações apenas para atender às suas necessidades de acesso. Por exemplo:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '2rem' }}>
              <li>
                <Typography variant="body1">O NEXDOM Integration Platform usa seu endereço IP para detectar tentativas suspeitas de acesso à sua conta.</Typography>
              </li>
              <li>
                <Typography variant="body1">O NEXDOM Integration Platform usa atributos como nome, sobrenome etc. para proporcionar uma experiência rica e personalizada.</Typography>
              </li>
              <li>
                <Typography variant="body1">O NEXDOM Integration Platform usa suas perguntas e respostas de segurança apenas para permitir a recuperação da conta.</Typography>
              </li>
            </ul>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              Tecnologias de rastreamento
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform coleta suas informações por meio de:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '2rem' }}>
              <li>
                <Typography variant="body1">Coleta de informações na página de perfil de usuário, onde você insere seus dados pessoais.</Typography>
              </li>
              <li>
                <Typography variant="body1">Rastreamento do seu endereço IP por meio de solicitações HTTP, cabeçalhos HTTP e TCP/IP.</Typography>
              </li>
              <li>
                <Typography variant="body1">Rastreamento das suas informações geográficas por meio do endereço IP.</Typography>
              </li>
              <li>
                <Typography variant="body1">
                  Rastreamento do seu histórico de acesso por meio de cookies do navegador. Consulte nossa{' '}
                  <Link component={NavLink} to={cookiePolicyUrl()} sx={{ textDecoration: 'underline' }}>
                    política de cookies
                  </Link>{' '}
                  para obter mais informações.
                </Typography>
              </li>
            </ul>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              Uso de informações pessoais
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform usará suas informações pessoais somente para as finalidades para as quais foram coletadas (ou para uma finalidade identificada como compatível com essa finalidade).
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform usa suas informações pessoais somente para as seguintes finalidades.
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '2rem' }}>
              <li>
                <Typography variant="body1">Para proporcionar uma experiência personalizada. O NEXDOM Integration Platform usa seu nome e as fotos de perfil enviadas para essa finalidade.</Typography>
              </li>
              <li>
                <Typography variant="body1" paragraph>
                  Para proteger sua conta contra acesso não autorizado ou possíveis tentativas de invasão. O NEXDOM Integration Platform usa cabeçalhos HTTP ou TCP/IP para essa finalidade.
                </Typography>
                <ul style={{ paddingLeft: '2rem' }}>
                  <li>
                    <Typography variant="body1">Isso inclui:</Typography>
                    <ul style={{ paddingLeft: '2rem' }}>
                      <li>
                        <Typography variant="body1">Endereço IP</Typography>
                      </li>
                      <li>
                        <Typography variant="body1">Identificação do navegador</Typography>
                      </li>
                      <li>
                        <Typography variant="body1">Cookies</Typography>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
              <li>
                <Typography variant="body1" paragraph>
                  Para obter dados estatísticos para fins analíticos e melhorias de desempenho do sistema. O NEXDOM Integration Platform não manterá informações pessoais após os cálculos estatísticos. Portanto, o relatório estatístico não permite identificar
                  uma pessoa.
                </Typography>
                <ul style={{ paddingLeft: '2rem' }}>
                  <li>
                    <Typography variant="body1">O NEXDOM Integration Platform pode usar:</Typography>
                    <ul style={{ paddingLeft: '2rem' }}>
                      <li>
                        <Typography variant="body1">Endereço IP para obter informações geográficas</Typography>
                      </li>
                      <li>
                        <Typography variant="body1">Identificação do navegador para determinar a tecnologia e/ou a versão do navegador</Typography>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              Divulgação de informações pessoais
            </Typography>
            <Typography variant="body1">
              O NEXDOM Integration Platform divulga informações pessoais somente aos aplicativos relevantes (também conhecidos como &quot;provedores de serviços&quot;) registrados no NEXDOM Integration Platform. Esses aplicativos são registrados pelo
              administrador de identidade da sua entidade ou organização. As informações pessoais são divulgadas somente para as finalidades para as quais foram coletadas (ou para uma finalidade identificada como compatível com essa finalidade), conforme
              controlado por esses provedores de serviços, salvo se você tiver consentido de outra forma ou quando exigido por lei.
            </Typography>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              Processo legal
            </Typography>
            <Typography variant="body1">
              Observe que a organização, entidade ou pessoa que administra o NEXDOM Integration Platform poderá ser obrigada a divulgar suas informações pessoais, com ou sem seu consentimento, quando isso for exigido por lei mediante o devido processo legal.
            </Typography>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              Armazenamento de informações pessoais
            </Typography>

            <Typography variant="h4" component="h3" gutterBottom>
              Onde suas informações pessoais são armazenadas
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform armazena suas informações pessoais em bancos de dados seguros. O NEXDOM Integration Platform aplica medidas de segurança adequadas e aceitas pelo setor para proteger o banco de dados onde suas informações pessoais
              são mantidas. Como produto, o NEXDOM Integration Platform não transfere nem compartilha seus dados com terceiros ou outras localidades.
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform pode usar criptografia para manter seus dados pessoais com um nível adicional de segurança.
            </Typography>

            <Typography variant="h4" component="h3" gutterBottom>
              Por quanto tempo suas informações pessoais são retidas
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform retém seus dados pessoais enquanto você for um usuário ativo do sistema. Você pode atualizar seus dados pessoais a qualquer momento usando os portais de autoatendimento disponíveis.
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform pode manter segredos com hash para oferecer um nível adicional de segurança. Isso inclui:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '2rem' }}>
              <li>
                <Typography variant="body1">Senha atual</Typography>
              </li>
              <li>
                <Typography variant="body1">Senhas usadas anteriormente</Typography>
              </li>
            </ul>

            <Typography variant="h4" component="h3" gutterBottom sx={{ mt: 2 }}>
              Como solicitar a remoção das suas informações pessoais
            </Typography>
            <Typography variant="body1" paragraph>
              Você pode solicitar ao administrador a exclusão da sua conta. O administrador é o responsável pela organização na qual você está registrado ou o superadministrador, caso o recurso de organização não seja usado.
            </Typography>
            <Typography variant="body1">Além disso, você pode solicitar a anonimização de todos os vestígios das suas atividades que o NEXDOM Integration Platform possa ter mantido em logs, bancos de dados ou armazenamento analítico.</Typography>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              Mais informações
            </Typography>

            <Typography variant="h4" component="h3" gutterBottom>
              Alterações nesta política
            </Typography>
            <Typography variant="body1" paragraph>
              As versões atualizadas do NEXDOM Integration Platform podem conter alterações nesta política, e as revisões serão incluídas nessas atualizações. Essas alterações se aplicarão somente aos usuários que optarem por usar versões atualizadas.
            </Typography>
            <Typography variant="body1" paragraph>
              A organização que administra o NEXDOM Integration Platform pode revisar a Política de Privacidade periodicamente. Você encontrará a versão vigente mais recente no respectivo link fornecido pela organização que administra o NEXDOM Integration
              Platform. A organização notificará quaisquer alterações na política de privacidade por seus canais públicos oficiais.
            </Typography>

            <Typography variant="h4" component="h3" gutterBottom>
              Suas escolhas
            </Typography>
            <Typography variant="body1" paragraph>
              Se você já tem uma conta de usuário no NEXDOM Integration Platform, tem o direito de desativá-la caso considere esta política de privacidade inaceitável.
            </Typography>
            <Typography variant="body1" paragraph>
              Se você não tem uma conta e não concorda com nossa política de privacidade, pode optar por não criar uma.
            </Typography>

            <Typography variant="h4" component="h3" gutterBottom>
              Fale conosco
            </Typography>
            <Typography variant="body1" paragraph>
              Entre em contato com o administrador do NEXDOM se tiver dúvidas ou preocupações relacionadas a esta política de privacidade.
            </Typography>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              Isenção de responsabilidade
            </Typography>
            <Typography variant="body1" paragraph>
              Esta aplicação é uma customização do WSO2 Integration Control Plane, licenciada sob a Apache License 2.0. O projeto original e esta customização são fornecidos sem garantias, conforme descrito na licença.
            </Typography>
            <Typography variant="body1">
              A aplicação é fornecida sem garantias ou responsabilidades além do que está estabelecido nos termos da licença aplicável. O projeto original e esta customização permanecem sujeitos à Apache License 2.0, disponível em{' '}
              <Link href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer" color="primary" sx={{ textDecoration: 'underline' }}>
                apache.org/licenses/LICENSE-2.0
              </Link>
              .
            </Typography>
          </section>
        </Stack>
      </Box>
    </Box>
  );
}
