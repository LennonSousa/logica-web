import { useEffect, useState } from 'react';
import Link from 'next/link';
import { InferGetServerSidePropsType, GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, Image, Modal, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaKey } from 'react-icons/fa';
import Cookies from 'js-cookie';

import api from '../../../../api/api';
import { User } from '../../../../components/Users';
import { AlertMessage, statusModal } from '../../../../components/Interfaces/AlertMessage';

import styles from '../../../../styles/index.module.css';

const validationSchema = Yup.object().shape({
    password: Yup.string().required('Obrigatório!').min(8, 'Mínimo 8 caracteres.'),
    repeat: Yup.string().required('Obrigatório!').min(8, 'Mínimo 8 caracteres.'),
});

const UserResetAuth: NextPage = ({ authenticated, user, token }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
    const router = useRouter();
    const authenticatedUser: User = user ? user : null;

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");
    const [isEqualPassword, setIsEqualPassword] = useState(false);

    const [showModal, setShowModal] = useState(false);

    const handleCloseModal = () => setShowModal(false);
    const handleShowModal = () => setShowModal(true);

    useEffect(() => {
        Cookies.remove('user');
        Cookies.remove('token');
    }, []);

    function handleToLogin() {
        router.push('/');
    }

    return (
        <>
            <NextSeo
                title="Criar nova senha"
                description="Criar nova senha da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Criar nova senha',
                    description: 'Criar nova senha da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Criar nova senha | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                <div className={styles.pageContainer}>
                    <Container>
                        <Row className="justify-content-center align-items-center">
                            <Col sm={12} className={`${styles.formContainer} col-11`}>
                                {
                                    authenticated && authenticatedUser ? <Row className="justify-content-center align-items-center">
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
                                                    password: '',
                                                    repeat: '',
                                                }}
                                                onSubmit={async values => {
                                                    if (isEqualPassword) {
                                                        setTypeMessage("waiting");
                                                        setMessageShow(true);

                                                        try {
                                                            const res = await api.put(`users/reset/${authenticatedUser.id}`, {
                                                                password: values.password,
                                                            }, {
                                                                headers: { 'Authorization': `Bearer ${token}` }
                                                            });

                                                            if (res.status === 204) {

                                                                setTypeMessage("success");
                                                                handleShowModal();
                                                                return;
                                                            }

                                                            setTypeMessage("error");
                                                        }
                                                        catch {
                                                            setTypeMessage("error");

                                                            setTimeout(() => {
                                                                setMessageShow(false);
                                                            }, 4000);
                                                        }
                                                    }
                                                }}
                                                validationSchema={validationSchema}
                                                validateOnChange={false}
                                            >
                                                {({ handleChange, handleSubmit, values, setFieldValue, errors, touched }) => (
                                                    <Form onSubmit={handleSubmit}>
                                                        <Row>
                                                            <Col>
                                                                <h3 className="text-success">{`Olá ${authenticatedUser.name}`}</h3>

                                                                <h5 className="text-secondary">Digite a sua nova senha.</h5>

                                                                <Form.Group className="mb-4" controlId="formLoginPassword">
                                                                    <Form.Label>Senha</Form.Label>
                                                                    <Form.Control type="password"
                                                                        onChange={handleChange}
                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                            if (values.password !== values.repeat || errors.repeat)
                                                                                setIsEqualPassword(false);
                                                                            else
                                                                                setIsEqualPassword(true);

                                                                            setFieldValue('password', e.target.value);
                                                                        }}
                                                                        value={values.password}
                                                                        name="password"
                                                                        isInvalid={!!errors.password && touched.password}
                                                                    />
                                                                    <Form.Control.Feedback type="invalid">{touched.password && errors.password}</Form.Control.Feedback>
                                                                </Form.Group>

                                                                <Form.Group className="mb-4" controlId="formLoginPassword02">
                                                                    <Form.Label>Repita a senha</Form.Label>
                                                                    <Form.Control type="password"
                                                                        onChange={handleChange}
                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                            if (values.password !== values.repeat || errors.repeat)
                                                                                setIsEqualPassword(false);
                                                                            else
                                                                                setIsEqualPassword(true);

                                                                            setFieldValue('repeat', e.target.value);
                                                                        }}
                                                                        value={values.repeat}
                                                                        name="repeat"
                                                                        isInvalid={!!errors.repeat && touched.repeat}
                                                                    />
                                                                    <Form.Control.Feedback type="invalid">{touched.repeat && errors.repeat}</Form.Control.Feedback>
                                                                </Form.Group>
                                                                {
                                                                    touched.repeat && !isEqualPassword &&
                                                                    <small className="text-danger">As senhas devem ser iguais.</small>
                                                                }
                                                            </Col>
                                                        </Row>

                                                        <Row className="justify-content-end">
                                                            {
                                                                messageShow ? <Col sm={12}><AlertMessage status={typeMessage} /></Col> :
                                                                    <Col style={{ flexGrow: 0 }}>
                                                                        <Button variant="success" type="submit">Salvar</Button>
                                                                    </Col>

                                                            }
                                                        </Row>

                                                        <Row className="mt-4">
                                                            <Col>
                                                                <Link href="/">
                                                                    <a
                                                                        title="Lembra da senha? Entrar no sistema."
                                                                        data-title="Lembra da senha? Entrar no sistema."
                                                                    >
                                                                        <Row>
                                                                            <Col sm={1}>
                                                                                <FaKey size={14} /> <span>Lembra da senha? Entrar no sistema.</span>
                                                                            </Col>
                                                                        </Row>
                                                                    </a>
                                                                </Link>
                                                            </Col>
                                                        </Row>
                                                    </Form>
                                                )}
                                            </Formik>
                                        </Col>
                                    </Row> :
                                        <Row className="justify-content-center align-items-center">
                                            <Col md={6} className="mt-1 mb-4">
                                                <Row className="justify-content-center align-items-center">
                                                    <Col sm={8}>
                                                        <Image fluid src="/assets/images/undraw_server_down_s4lk.svg" alt="Erro na autenticação." />
                                                    </Col>
                                                </Row>
                                            </Col>

                                            <Col md={4} className="mt-1 mb-1">
                                                <Row>
                                                    <Col>
                                                        <h5 className="text-danger">Código inválido!</h5>
                                                        <h6 className="text-secondary">Talvez o código já tenha expirado, solicite novamente.</h6>
                                                    </Col>
                                                </Row>

                                                <Row className="mt-4">
                                                    <Col>
                                                        <Link href="/">
                                                            <a
                                                                title="Clique aqui para voltar ao início."
                                                                data-title="Clique aqui para voltar ao início."
                                                            >
                                                                <Row>
                                                                    <Col sm={1}>
                                                                        <FaKey size={14} /> <span>Clique aqui para voltar ao início.</span>
                                                                    </Col>
                                                                </Row>
                                                            </a>
                                                        </Link>
                                                    </Col>
                                                </Row>
                                            </Col>
                                        </Row>
                                }
                            </Col>
                        </Row>

                        <Modal
                            show={showModal}
                            onHide={handleCloseModal}
                            backdrop="static"
                            keyboard={false}
                        >
                            <Modal.Header>
                                <Modal.Title>Cadastro concluído!</Modal.Title>
                            </Modal.Header>

                            <Modal.Body>
                                <Row className="justify-content-center align-items-center mb-3">
                                    <Col sm={8}>
                                        <Image fluid src="/assets/images/undraw_security_on_re_e491.svg" alt="Cadastro concluído!" />
                                    </Col>
                                </Row>
                                <Row className="justify-content-center align-items-center text-center">
                                    <Col>
                                        <h5 className="text-success">Senha alterada com sucesso!</h5>
                                        <h6 className="text-secondary">Clique no botão abaixo para entrar no sistema.</h6>
                                    </Col>
                                </Row>
                            </Modal.Body>

                            <Modal.Footer>
                                <Button variant="success" onClick={handleToLogin}>
                                    Entrar
                                </Button>
                            </Modal.Footer>
                        </Modal>
                    </Container>
                </div>
            }
        </>
    )
}

export default UserResetAuth;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { email, token } = context.query;

    let authenticated = false;
    let authenticatedUser = null;
    let authenticatedToken = null;

    if (!email || !token) { // No e-mail or token!
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    try {
        const res = await api.get('users/reset', {
            params: {
                email,
                token,
            }
        });

        if (res.status === 201) {
            const { user, token } = res.data;

            authenticatedUser = user;
            authenticatedToken = token;

            authenticated = true;
        }
    }
    catch (err) {
        console.log('Error to authenticate user reset password', err);
    }

    return {
        props: {
            authenticated,
            user: authenticatedUser,
            token: authenticatedToken,
        },
    }
}