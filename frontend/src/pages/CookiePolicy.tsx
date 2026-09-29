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

import { Box, Link, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@wso2/oxygen-ui';
import { ArrowLeft } from '@wso2/oxygen-ui-icons-react';
import type { JSX } from 'react';
import { Link as NavLink } from 'react-router';
import { useNavigate } from 'react-router';
import { external, loginUrl, privacyPolicyUrl } from '../paths';

export default function CookiePolicy(): JSX.Element {
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
          NEXDOM Integration Platform - Política de Cookies
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
              Política de Cookies
            </Typography>
            <Typography variant="body1">O NEXDOM Integration Platform usa cookies para oferecer a melhor experiência possível e identificá-lo para fins de segurança. Se você desabilitar os cookies, alguns serviços ficarão inacessíveis.</Typography>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              Como o NEXDOM Integration Platform processa cookies?
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform armazena e recupera informações no seu navegador usando cookies. Essas informações são usadas para proporcionar uma experiência melhor. Alguns cookies têm como finalidade principal permitir que o usuário entre no
              sistema, mantenha sessões e acompanhe as atividades realizadas durante a sessão.
            </Typography>
            <Typography variant="body1" paragraph>
              A finalidade principal de alguns cookies usados no NEXDOM Integration Platform é identificá-lo pessoalmente. No entanto, a duração do cookie termina quando sua sessão termina, ou seja, após você sair ou quando o tempo de expiração da sessão tiver
              decorrido.
            </Typography>
            <Typography variant="body1" paragraph>
              Alguns cookies são usados apenas para oferecer uma experiência web mais personalizada e não podem ser usados para identificar você ou suas atividades.
            </Typography>
            <Typography variant="body1">
              Esta política de cookies faz parte da{' '}
              <Link component={NavLink} to={privacyPolicyUrl()} sx={{ textDecoration: 'underline' }}>
                Política de Privacidade do NEXDOM Integration Platform.
              </Link>
            </Typography>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              O que é um cookie?
            </Typography>
            <Typography variant="body1">
              Um cookie de navegador é um pequeno conjunto de dados armazenado no seu dispositivo para ajudar sites e aplicativos móveis a lembrar informações sobre você. Outras tecnologias, incluindo armazenamento web e identificadores associados ao seu
              dispositivo, podem ser usadas para finalidades semelhantes. Nesta política, usamos o termo &quot;cookies&quot; para nos referirmos a todas essas tecnologias.
            </Typography>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              Para que o NEXDOM Integration Platform usa cookies?
            </Typography>
            <Typography variant="body1" paragraph>
              Os cookies são usados para duas finalidades no NEXDOM Integration Platform.
            </Typography>
            <ol style={{ margin: 0, paddingLeft: '2rem' }}>
              <li>
                <Typography variant="body1">Identificar você e oferecer segurança (essa é a principal função do NEXDOM Integration Platform).</Typography>
              </li>
              <li>
                <Typography variant="body1">Proporcionar uma experiência de uso satisfatória.</Typography>
              </li>
            </ol>
            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
              O NEXDOM Integration Platform usa cookies para as finalidades listadas abaixo.
            </Typography>
            <Typography variant="h4" component="h3" gutterBottom>
              Preferências
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform usa esses cookies para lembrar suas configurações e preferências e preencher automaticamente os campos do formulário, facilitando sua interação com o site.
            </Typography>
            <Typography variant="body1" paragraph>
              Esses cookies não podem ser usados para identificar você pessoalmente.
            </Typography>
            <Typography variant="h4" component="h3" gutterBottom>
              Segurança
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform usa determinados cookies para identificar e prevenir riscos de segurança. Por exemplo, o NEXDOM Integration Platform pode usar esses cookies para armazenar as informações da sua sessão e impedir que outras pessoas
              alterem sua senha sem seu usuário e senha.
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform usa cookies de sessão para manter sua sessão ativa.
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform pode usar cookies temporários durante a autenticação multifator e a autenticação federada.
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform pode usar cookies permanentes para detectar se você já usou o mesmo dispositivo para entrar. Isso serve para calcular o &quot;nível de risco&quot; associado à sua tentativa de acesso atual, principalmente para
              proteger você e sua conta contra possíveis ataques.
            </Typography>
            <Typography variant="h4" component="h3" gutterBottom>
              Desempenho
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform pode usar cookies para permitir a funcionalidade &quot;Lembrar de mim&quot;.
            </Typography>
            <Typography variant="h4" component="h3" gutterBottom>
              Análises
            </Typography>
            <Typography variant="body1">Como produto, o NEXDOM Integration Platform não usa cookies para fins analíticos.</Typography>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              Que tipos de cookies o NEXDOM Integration Platform usa?
            </Typography>
            <Typography variant="body1" paragraph>
              O NEXDOM Integration Platform usa cookies persistentes e cookies de sessão. Um cookie persistente ajuda o NEXDOM Integration Platform a reconhecer você como usuário existente, facilitando seu retorno ao NEXDOM ou sua interação com o NEXDOM
              Integration Platform sem precisar entrar novamente. Depois que você entra, um cookie persistente permanece no seu navegador e será lido pelo NEXDOM Integration Platform quando você retornar ao NEXDOM Integration Platform.
            </Typography>
            <Typography variant="body1">
              Um cookie de sessão é apagado quando o usuário fecha o navegador. Ele fica armazenado na memória temporária e não é mantido após o fechamento do navegador. Cookies de sessão não coletam informações do computador do usuário.
            </Typography>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              Como controlo meus cookies?
            </Typography>
            <Typography variant="body1" paragraph>
              A maioria dos navegadores permite controlar cookies nas configurações de preferências. No entanto, se você limitar a capacidade dos sites de definir cookies, sua experiência geral poderá ser prejudicada, pois deixará de ser personalizada. Isso
              também pode impedir que você salve configurações personalizadas, como informações de acesso.
            </Typography>
            <Typography variant="body1">É muito provável que desabilitar os cookies impeça o uso das funcionalidades de autenticação e autorização do NEXDOM Integration Platform.</Typography>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              Quais cookies são usados?
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nome do cookie</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Finalidade</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Retenção</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>SESSION_USER_COOKIE</TableCell>
                    <TableCell>Manter as informações do usuário conectado.</TableCell>
                    <TableCell>Sessão</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>JWT_TOKEN_COOKIE</TableCell>
                    <TableCell>Manter o token de segurança da sessão ativa.</TableCell>
                    <TableCell>Sessão</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </section>

          <section>
            <Typography variant="h3" component="h2" gutterBottom>
              Isenção de responsabilidade
            </Typography>
            <Typography variant="body1" paragraph>
              Esta aplicação é uma customização do WSO2 Integration Control Plane, um projeto de código aberto licenciado sob a Apache License 2.0. A NEXDOM mantém esta customização e é responsável pela sua operação e pelos dados processados nesta implantação.
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
