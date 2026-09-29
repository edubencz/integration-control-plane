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

import { Box, ColorSchemeImage, Divider, Grid, Link, Stack } from '@wso2/oxygen-ui';
import { type JSX } from 'react';
import { Link as NavLink } from 'react-router';
import LoginForm from '../components/LoginForm';
import { cookiePolicyUrl, privacyPolicyUrl } from '../paths';

const Footer = () => (
  <Box component="footer" sx={{ mt: 4 }}>
    <Stack direction="row" justifyContent="center" spacing={1}>
      <Link component={NavLink} to={privacyPolicyUrl()} underline="hover" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
        Política de Privacidade
      </Link>
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      <Link component={NavLink} to={cookiePolicyUrl()} underline="hover" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
        Política de Cookies
      </Link>
    </Stack>
  </Box>
);

export default function Login(): JSX.Element {
  const base = import.meta.env.BASE_URL;

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      <Grid container sx={{ flex: 1 }}>
        <Grid
          size={{ xs: 12, md: 8 }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: { xs: 4, md: 8 },
            position: 'relative',
            overflow: 'hidden',
          }}>
          <Stack direction="column" alignItems="center" gap={3} display={{ xs: 'none', md: 'flex' }} sx={{ width: 'min(100%, 860px)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', transform: { md: 'translate(-40px, -72px)', lg: 'translate(-72px, -72px)' } }}>
              <ColorSchemeImage
                src={{ light: `${base}assets/images/logo/WSO2-Integration-Platform-Black.svg`, dark: `${base}assets/images/logo/WSO2-Integration-Platform-White.svg` }}
                alt={{ light: 'NEXDOM Integration Platform Logo', dark: 'NEXDOM Integration Platform Logo' }}
                height={80}
                width="auto"
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', transform: { md: 'translateX(112px)', lg: 'translateX(144px)' } }}>
              <ColorSchemeImage
                src={{
                  light: `${base}assets/images/icp-login.svg`,
                  dark: `${base}assets/images/icp-login-dark.svg`,
                }}
                alt={{
                  light: 'ICP Login Illustration',
                  dark: 'ICP Login Illustration',
                }}
                height={360}
                width="auto"
                style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain' }}
              />
            </Box>
          </Stack>
        </Grid>

        <Grid
          size={{ xs: 12, md: 4 }}
          sx={{
            display: 'flex',
            padding: 4,
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
          <Box
            sx={{
              width: '100%',
              maxWidth: 400,
              margin: '0 auto',
            }}>
            <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
              <ColorSchemeImage
                src={{ light: `${base}assets/images/logo/WSO2-Integration-Platform-Black.svg`, dark: `${base}assets/images/logo/WSO2-Integration-Platform-White.svg` }}
                alt={{ light: 'NEXDOM Integration Platform Logo', dark: 'NEXDOM Integration Platform Logo' }}
                height={48}
                width="auto"
              />
            </Box>
            <LoginForm />
            <Footer />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
