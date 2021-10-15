import type { AppProps } from 'next/app';
import Head from 'next/head';
import { NextSeo } from 'next-seo';

import { SideBarProvider } from '../contexts/SideBarContext';
import { AuthProvider } from '../contexts/AuthContext';
import { Header } from '../components/PageHeader';
import Sidebar from '../components/Sidebar';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-print-css/css/bootstrap-print.min.css';
import '../styles/global.css';

import styles from '../styles/app.module.css';

function LogicaApp({ Component, pageProps }: AppProps) {
  return <>
    <NextSeo titleTemplate="%s | Plataforma Lógica Solar" defaultTitle="Plataforma de gerenciamento." />

    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>

    <AuthProvider>
      <SideBarProvider>
        <div className={styles.wrapper}>
          <Header />
          <div className={styles.main}>
            <Sidebar />

            <section className={styles.content}>
              <Component {...pageProps} />
            </section>
          </div>
        </div>
      </SideBarProvider>
    </AuthProvider>
  </>
}

export default LogicaApp
