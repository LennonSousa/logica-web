import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

import api from '../../api/api';
import { TokenVerify } from '../../utils/tokenVerify';
import { AuthContext } from '../../contexts/AuthContext';
import { SideBarContext } from '../../contexts/SideBarContext';
import { can } from '../../components/Users';
import { Estimate } from '../../components/Estimates';
import EstimateItem from '../../components/EstimateListItem';
import { CardItemShimmer } from '../../components/Interfaces/CardItemShimmer';
import { PageWaiting, PageType } from '../../components/PageWaiting';
import { Paginations } from '../../components/Interfaces/Pagination';
import SearchEstimates from '../../components/Interfaces/SearchEstimates';

const limit = 15;

const Estimates: NextPage = () => {
    const router = useRouter();

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [activePage, setActivePage] = useState(1);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [showSearchModal, setShowSearchModal] = useState(false);

    const handleCloseSearchModal = () => setShowSearchModal(false);
    const handleShowSearchModal = () => setShowSearchModal(true);

    useEffect(() => {
        handleItemSideBar('estimates');
        handleSelectedMenu('estimates-index');

        if (user) {
            if (can(user, "estimates", "read:any")) {
                let requestUrl = `estimates?limit=${limit}&page=${activePage}`;

                api.get(requestUrl).then(res => {
                    setEstimates(res.data);

                    try {
                        setTotalPages(Number(res.headers['x-total-pages']));
                    }
                    catch { }

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get estimates, ', err);

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
            let requestUrl = `estimates?limit=${limit}&page=${activePage}`;

            const res = await api.get(requestUrl);

            setEstimates(res.data);

            setTotalPages(Number(res.headers['x-total-pages']));
        }
        catch (err) {
            setTypeLoadingMessage("error");
            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
        }

        setLoadingData(false);
    }

    function handleSearchTo(estimate: Estimate) {
        handleRoute(`/estimates/details/${estimate.id}`);
    }

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <>
            <NextSeo
                title="Lista de orçamentos"
                description="Lista de orçamentos da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Lista de orçamentos',
                    description: 'Lista de orçamentos da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Lista de orçamentos | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "estimates", "read:any") ? <>
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
                                                        !!estimates.length && <Row className="mt-3">
                                                            <Col className="col-row">
                                                                <Button
                                                                    variant="success"
                                                                    title="Procurar um orçamento."
                                                                    onClick={handleShowSearchModal}
                                                                >
                                                                    <FaSearch />
                                                                </Button>
                                                            </Col>
                                                        </Row>
                                                    }
                                                    <Row>
                                                        {
                                                            !!estimates.length ? estimates.map((estimate, index) => {
                                                                return <EstimateItem key={index} estimate={estimate} />
                                                            }) :
                                                                <PageWaiting status="empty" message="Nenhum orçamento registrado." />
                                                        }
                                                    </Row>
                                                </Col>
                                        }
                                    </Row>

                                    <Row className="row-grow align-items-end">
                                        <Col>
                                            {
                                                !!estimates.length && <Row className="justify-content-center align-items-center">
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

                                    <SearchEstimates
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

export default Estimates;

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