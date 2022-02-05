import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import { Col, Container, Image, ListGroup, Row } from 'react-bootstrap';

import { TokenVerify } from '../../utils/tokenVerify';
import { SideBarContext } from '../../contexts/SideBarContext';
import { AuthContext } from '../../contexts/AuthContext';
import { StoresContext } from '../../contexts/StoresContext';
import { can } from '../../components/Users';
import { Stores } from '../../components/Stores';
import { PageWaiting } from '../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../components/Interfaces/AlertMessage';

const StoresPage: NextPage = () => {
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);
    const { stores } = useContext(StoresContext);

    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        handleItemSideBar('stores');
        handleSelectedMenu('stores-index');

        setLoadingData(false);
    }, []);

    return (
        <>
            <NextSeo
                title="Lojas"
                description="Lojas da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Lojas',
                    description: 'Lojas da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Lojas | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "store", "read:any") ? <Container className="content-page">
                                <article className="mt-3">
                                    <Row>
                                        {
                                            !!stores.length ? <Col>
                                                <ListGroup>
                                                    {
                                                        stores && stores.map(store => {
                                                            return <Stores
                                                                key={store.id}
                                                                store={store}
                                                                canEdit={can(user, "store", "update:any")}
                                                            />
                                                        })
                                                    }
                                                </ListGroup>
                                            </Col> :
                                                <Col>
                                                    <Row>
                                                        <Col className="text-center">
                                                            <p style={{ color: 'var(--gray)' }}>Nenhuma loja registrada.</p>
                                                        </Col>
                                                    </Row>

                                                    <Row className="justify-content-center mt-3 mb-3">
                                                        <Col sm={3}>
                                                            <Image src="/assets/images/undraw_not_found.svg" alt="Sem dados para mostrar." fluid />
                                                        </Col>
                                                    </Row>
                                                </Col>
                                        }
                                    </Row>
                                </article>
                            </Container> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default StoresPage;

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