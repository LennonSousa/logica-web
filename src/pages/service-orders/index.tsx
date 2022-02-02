import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

import { SideBarContext } from '../../contexts/SideBarContext';
import { AuthContext } from '../../contexts/AuthContext';
import { can } from '../../components/Users';
import { ServiceOrder } from '../../components/ServiceOrders';
import ServiceOrderItem from '../../components/ServiceOrderListItem';
import { CardItemShimmer } from '../../components/Interfaces/CardItemShimmer';
import { PageWaiting, PageType } from '../../components/PageWaiting';
import { Paginations } from '../../components/Interfaces/Pagination';
import SearchServiceOrders from '../../components/Interfaces/SearchServiceOrders';

import api from '../../api/api';
import { TokenVerify } from '../../utils/tokenVerify';

const limit = 15;

const ServiceOrdersPages: NextPage = () => {
    const router = useRouter();

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [activePage, setActivePage] = useState(1);

    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');
    const [loadingData, setLoadingData] = useState(true);

    const [showSearchModal, setShowSearchModal] = useState(false);

    const handleCloseSearchModal = () => setShowSearchModal(false);
    const handleShowSearchModal = () => setShowSearchModal(true);

    useEffect(() => {
        handleItemSideBar('service-orders');
        handleSelectedMenu('service-orders-index');

        if (user) {
            if (can(user, "services", "read:any") || can(user, "services", "read:own")) {
                let requestUrl = `services/orders?limit=${limit}&page=${activePage}`;

                api.get(requestUrl).then(res => {
                    setServiceOrders(res.data);

                    try {
                        setTotalPages(Number(res.headers['x-total-pages']));
                    }
                    catch { }

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get services orders, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                });
            }
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleActivePage(page: number) {
        setLoadingData(true);
        setActivePage(page);

        try {
            let requestUrl = `services/orders?limit=${limit}&page=${page}`;

            const res = await api.get(requestUrl)

            setServiceOrders(res.data);

            setTotalPages(Number(res.headers['x-total-pages']));
        }
        catch (err) {
            setTypeLoadingMessage("error");
            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
        }

        setLoadingData(false);
    }

    function handleSearchTo(serviceOrder: ServiceOrder) {
        handleRoute(`/service-orders/details/${serviceOrder.id}`);
    }

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <>
            <NextSeo
                title="Lista de ordens de serviço"
                description="Lista de ordens de serviço da plataforma de gerenciamento da Bioma consultoria."
                openGraph={{
                    url: 'https://app.biomaconsultoria.com',
                    title: 'Lista de ordens de serviço',
                    description: 'Lista de ordens de serviço da plataforma de gerenciamento da Bioma consultoria.',
                    images: [
                        {
                            url: 'https://app.biomaconsultoria.com/assets/images/logo-bioma.jpg',
                            alt: 'Lista de ordens de serviço | Plataforma Bioma',
                        },
                        { url: 'https://app.biomaconsultoria.com/assets/images/logo-bioma.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "projects", "read:any") || can(user, "projects", "read:own") ? <>
                                <Container className="page-container">
                                    <Row>
                                        {
                                            loadingData ? <>
                                                {
                                                    typeLoadingMessage === "error" ? <PageWaiting
                                                        status={typeLoadingMessage}
                                                        message={textLoadingMessage}
                                                    /> :
                                                        <CardItemShimmer />
                                                }
                                            </> :
                                                <Col>
                                                    {
                                                        !!serviceOrders.length && <Row className="mt-3">
                                                            <Col className="col-row">
                                                                <Button
                                                                    variant="success"
                                                                    title="Procurar uma ordem de serviço."
                                                                    onClick={handleShowSearchModal}
                                                                >
                                                                    <FaSearch />
                                                                </Button>
                                                            </Col>
                                                        </Row>
                                                    }
                                                    <Row>
                                                        {
                                                            !!serviceOrders.length ? serviceOrders.map((serviceOrder, index) => {
                                                                return <ServiceOrderItem key={index} serviceOrder={serviceOrder} />
                                                            }) :
                                                                <PageWaiting status="empty" message="Nenhuma ordem de serviço registrada." />
                                                        }
                                                    </Row>
                                                </Col>

                                        }
                                    </Row>

                                    <Row className="row-grow align-items-end">
                                        <Col>
                                            {
                                                !!serviceOrders.length && <Row className="justify-content-center align-items-center">
                                                    <Col className="col-row">
                                                        <Paginations
                                                            pages={totalPages}
                                                            active={activePage}
                                                            handleActivePage={handleActivePage}
                                                        />
                                                    </Col>
                                                </Row>
                                            }
                                        </Col>
                                    </Row>

                                    <SearchServiceOrders
                                        show={showSearchModal}
                                        handleSearchTo={handleSearchTo}
                                        handleCloseSearchModal={handleCloseSearchModal}
                                    />
                                </Container>
                            </> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default ServiceOrdersPages;

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