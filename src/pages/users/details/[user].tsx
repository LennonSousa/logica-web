import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, ButtonGroup, Col, Container, ListGroup, Row } from 'react-bootstrap';
import { FaKey, FaUserEdit } from 'react-icons/fa';
import { format } from 'date-fns';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { User, UserRole, can, translatedRoles } from '../../../components/Users';

import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';

const rolesToViewSelf = [
    'estimates',
    'projects',
    'services',
];

const rolesToEditSelf = [
    'users',
];

const UserDetails: NextPage = () => {
    const router = useRouter();
    const userId = router.query['user'];

    const { loading, user } = useContext(AuthContext);

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);

    const [loadingData, setLoadingData] = useState(true);
    const [documentType, setDocumentType] = useState("CPF");
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [userData, setUserData] = useState<User>();
    const [usersRoles, setUsersRoles] = useState<UserRole[]>([]);

    useEffect(() => {
        handleItemSideBar('users');
        handleSelectedMenu('users-index');

        if (user) {
            if (can(user, "users", "read:any") || userId === user.id) {
                api.get(`users/${userId}`).then(res => {
                    let userRes: User = res.data;

                    if (userRes.document.length > 14)
                        setDocumentType("CNPJ");

                    setUsersRoles(userRes.roles);

                    setUserData(userRes);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error get user to edit, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                });
            }
        }
    }, [user, userId]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <>
            <NextSeo
                title="Detalhes do usuário"
                description="Detalhes do usuário da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Detalhes do usuário',
                    description: 'Detalhes do usuário da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Detalhes do usuário | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "users", "read:any") || userId === user.id ? <>
                                {
                                    loadingData ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <>
                                            {
                                                !userData ? <PageWaiting status="waiting" /> :
                                                    <Container className="content-page">
                                                        <Row>
                                                            <Col>
                                                                {
                                                                    can(user, "users", "read:any") && <Row className="mb-3">
                                                                        <Col>
                                                                            <PageBack href="/users" subTitle="Voltar para a lista de usuários" />
                                                                        </Col>
                                                                    </Row>
                                                                }

                                                                <Row className="mb-3">
                                                                    <Col sm={6}>
                                                                        <Row className="align-items-center">
                                                                            <Col className="col-row">
                                                                                <h3 className="form-control-plaintext text-success">{userData.name}</h3>
                                                                            </Col>

                                                                            {
                                                                                can(user, "users", "update:any") ||
                                                                                    can(user, "users", "update:own") &&
                                                                                    userId === user.id ?
                                                                                    <Col className="col-row">
                                                                                        <ButtonGroup size="sm" className="col-12">
                                                                                            <Button
                                                                                                title="Editar usuário."
                                                                                                variant="success"
                                                                                                onClick={() => handleRoute(`/users/edit/${userData.id}`)}
                                                                                            >
                                                                                                <FaUserEdit />
                                                                                            </Button>
                                                                                        </ButtonGroup>
                                                                                    </Col> : <Col></Col>
                                                                            }
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">{documentType}</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{userData.document}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Celular</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{userData.phone}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={6} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">E-mail</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{userData.email}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mb-3"></Col>

                                                                <Row className="mb-3">
                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Criado em</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{format(new Date(userData.created_at), 'dd/MM/yyyy')}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    {
                                                                        userData.store_only && <Col sm={4} >
                                                                            <Row>
                                                                                <Col>
                                                                                    <span className="text-success">Vinculado a loja</span>
                                                                                </Col>
                                                                            </Row>

                                                                            <Row>
                                                                                <Col>
                                                                                    <h6 className="text-secondary">
                                                                                        {userData.store ? userData.store.name : ''}
                                                                                    </h6>
                                                                                </Col>
                                                                            </Row>
                                                                        </Col>
                                                                    }
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-success">Permissões <FaKey /></h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <ListGroup className="mb-3">
                                                                                    {
                                                                                        usersRoles.map((role, index) => {
                                                                                            const translatedRole = translatedRoles.find(item => { return item.role === role.role });

                                                                                            return <ListGroup.Item key={index} as="div" variant="light">
                                                                                                <Row>
                                                                                                    <Col>
                                                                                                        <h6 className="text-success" >
                                                                                                            {
                                                                                                                translatedRole ? translatedRole.translated : role.role
                                                                                                            }
                                                                                                        </h6>
                                                                                                    </Col>

                                                                                                    {
                                                                                                        role.view && <Col className="col-row">
                                                                                                            <span>Visualizar</span>
                                                                                                        </Col>
                                                                                                    }

                                                                                                    {
                                                                                                        rolesToViewSelf.find(item => { return item === role.role }) && role.view_self &&
                                                                                                        <Col className="col-row">
                                                                                                            <span>Visualizar próprio</span>
                                                                                                        </Col>
                                                                                                    }

                                                                                                    {
                                                                                                        role.create && <Col className="col-row">
                                                                                                            <span>Criar</span>
                                                                                                        </Col>
                                                                                                    }

                                                                                                    {
                                                                                                        role.update && <Col className="col-row">
                                                                                                            <span>Editar</span>
                                                                                                        </Col>
                                                                                                    }

                                                                                                    {
                                                                                                        rolesToEditSelf.find(item => { return item === role.role }) && role.update_self &&
                                                                                                        <Col className="col-row">
                                                                                                            <span>Editar próprio</span>
                                                                                                        </Col>
                                                                                                    }

                                                                                                    {
                                                                                                        role.remove && <Col className="col-row">
                                                                                                            <span>Excluir</span>
                                                                                                        </Col>
                                                                                                    }
                                                                                                </Row>
                                                                                            </ListGroup.Item>
                                                                                        })
                                                                                    }
                                                                                </ListGroup>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                    </Container>
                                            }
                                        </>
                                }
                            </> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default UserDetails;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { token } = context.req.cookies;

    const tokenVerified = await TokenVerify(token);

    if (tokenVerified === "not-authorized") { // Not authenticated, token invalid!
        return {
            redirect: {
                destination: `/?returnto=${context.req.url}`,
                permanent: false,
            },
        }
    }

    if (tokenVerified === "error") { // Server error!
        return {
            redirect: {
                destination: '/500',
                permanent: false,
            },
        }
    }

    return {
        props: {},
    }
}