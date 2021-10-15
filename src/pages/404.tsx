import type { NextPage } from 'next';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { Col, Container, Image, Row } from 'react-bootstrap';
import { FaArrowRight } from 'react-icons/fa';

import { AlertMessage } from '../components/Interfaces/AlertMessage';

const Page404: NextPage = () => {
  return (
    <>
      <NextSeo
        title="Página não encontrada"
        description="Página não encontrada da plataforma de gerenciamento da Lógica Renováveis."
        openGraph={{
          url: 'https://app.logicarenovaveis.com',
          title: 'Página não encontrada',
          description: 'Página não encontrada da plataforma de gerenciamento da Lógica Renováveis.',
          images: [
            {
              url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
              alt: 'Página não encontrada | Plataforma Lógica Renováveis',
            },
            { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
          ],
        }}
      />

      <article>
        <Container className="content-page">
          <Row className="justify-content-center text-center mt-3">
            <Col>
              <h2 className="article-title">Página não encontrada!</h2>
            </Col>
          </Row>

          <Row className="justify-content-center mt-3">
            <Col sm={7} className="article-text">
              <AlertMessage status={"warning"} message="Você está tentando acessar uma página inexistente no sistema." />
            </Col>
          </Row>

          <Row className="justify-content-center text-center mt-3">
            <Col>
              <Link href='/'>
                <a>
                  Clique aqui para voltar à página inicial <FaArrowRight size={18} />
                </a>
              </Link>
            </Col>
          </Row>

          <Row className="justify-content-center mt-5 mb-5">
            <Col sm={5}>
              <Image fluid rounded src="/assets/images/undraw_not_found.svg" alt="Página não encontrada." />
            </Col>
          </Row>
        </Container>
      </article>
    </>
  )
}

export default Page404;