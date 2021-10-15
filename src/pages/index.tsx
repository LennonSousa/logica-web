import { useContext, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Image, Form, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaKey } from 'react-icons/fa';

import api from '../api/api';
import { AuthContext } from '../contexts/AuthContext';
import { AlertMessage, statusModal } from '../components/Interfaces/AlertMessage';

import packageJson from '../../package.json';

import styles from '../styles/index.module.css';

const validationSchema = Yup.object().shape({
  email: Yup.string().email('E-mail inválido').required('Obrigatório!'),
  password: Yup.string().required('Obrigatório!').min(8, 'Mínimo 8 caracteres.')
});

const Login: NextPage = () => {
  const router = useRouter();
  const { returnto } = router.query;

  const { handleLogin } = useContext(AuthContext);

  const [messageShow, setMessageShow] = useState(false);
  const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");
  const [textMessage, setTextMessage] = useState('entrando...');

  return (
    <>
      <NextSeo
        title="Bem-vindo(a)"
        description="Bem-vindo(a) a plataforma de gerenciamento da Lógica Renováveis."
        openGraph={{
          url: 'https://app.logicarenovaveis.com',
          title: 'Bem-vindo(a)',
          description: 'Bem-vindo(a) a plataforma de gerenciamento da Lógica Renováveis.',
          images: [
            {
              url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
              alt: 'Bem-vindo(a) | Plataforma Lógica Renováveis',
            },
            { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
          ],
        }}
      />

      <div className={styles.pageContainer}>
        <Container>
          <Row className="justify-content-center align-items-center">
            <Col sm={12} className={`${styles.formContainer} col-11`}>
              <Row className="justify-content-center align-items-center">
                <Col md={6} className="mt-1 mb-4">
                  <Row className="justify-content-center align-items-center">
                    <Col sm={8}>
                      <Image fluid src="/assets/images/logo-logica.svg" alt="Lógica Renováveis." />
                    </Col>
                  </Row>
                </Col>

                <Col md={4} className="mt-1 mb-1">
                  <Formik
                    initialValues={{
                      email: '',
                      password: '',
                    }}
                    onSubmit={async values => {
                      setTextMessage('autenticando...');
                      setTypeMessage("waiting");
                      setMessageShow(true);

                      try {
                        const resLogin = await handleLogin(values.email, values.password, returnto && String(returnto));

                        if (!resLogin) {
                          setTypeMessage("error");
                          setTextMessage("E-mail ou senha incorretos!");

                          setTimeout(() => {
                            setMessageShow(false);
                          }, 3000);

                          return;
                        }

                        if (resLogin === "error") {
                          setTypeMessage("error");
                          setTextMessage("Erro na conexão!");

                          setTimeout(() => {
                            setMessageShow(false);
                          }, 3000);

                          return;
                        }

                        setTextMessage('');
                        setTypeMessage("success");
                      }
                      catch {
                        setTypeMessage("error");
                        setTextMessage("Erro na conexão!");

                        setTimeout(() => {
                          setMessageShow(false);
                        }, 4000);
                      }
                    }}
                    validationSchema={validationSchema}
                    validateOnChange={false}
                  >
                    {({ handleBlur, handleChange, handleSubmit, values, errors, touched }) => (
                      <Form onSubmit={handleSubmit}>
                        <Row>
                          <Col>
                            <Form.Group className="mb-4" controlId="formLogintEmail">
                              <Form.Label>Seu e-mail</Form.Label>
                              <Form.Control type="email"
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.email}
                                name="email"
                                isInvalid={!!errors.email && touched.email}
                              />
                              <Form.Control.Feedback type="invalid">{touched.email && errors.email}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-4" controlId="formLoginPassword">
                              <Form.Label>Senha</Form.Label>
                              <Form.Control type="password"
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.password}
                                name="password"
                                isInvalid={!!errors.password && touched.password}
                              />
                              <Form.Control.Feedback type="invalid">{touched.password && errors.password}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row className="justify-content-end">
                          {
                            messageShow ? <Col sm={12}><AlertMessage status={typeMessage} message={textMessage} /></Col> :
                              <Col className="col-row">
                                <Button variant="success" type="submit">Entrar</Button>
                              </Col>

                          }
                        </Row>

                        <Row className="mt-4">
                          <Col>
                            <Link href="/users/reset">
                              <a title="Recuperar a sua senha." data-title="Recuperar a sua senha.">
                                <Row>
                                  <Col sm={1}>
                                    <FaKey size={14} /> <span>Esqueci a minha senha</span>
                                  </Col>
                                </Row>
                              </a>
                            </Link>
                          </Col>
                        </Row>

                        <Row className={styles.version}>
                          <Col>
                            <small>{`v. ${packageJson.version}`}</small>
                          </Col>
                        </Row>
                      </Form>
                    )}
                  </Formik>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}

export default Login;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { token } = context.req.cookies;

  if (token) {
    try {
      const res = await api.get('/users/authenticated',
        {
          validateStatus: function (status) {
            return status < 500; // Resolve only if the status code is less than 500.
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.status === 202) { // Alread authenticated!
        return {
          redirect: {
            destination: '/estimates/',
            permanent: false,
          },
        }
      }
    }
    catch { }
  }

  return {
    props: {},
  }
}