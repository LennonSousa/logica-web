import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Row, Toast } from 'react-bootstrap';
import { FaFilter, FaSearch } from 'react-icons/fa';
import { endOfToday, format, subDays } from 'date-fns';

import api from '../../api/api';
import { TokenVerify } from '../../utils/tokenVerify';
import { AuthContext } from '../../contexts/AuthContext';
import { StoresContext } from '../../contexts/StoresContext';
import { SideBarContext } from '../../contexts/SideBarContext';
import { can } from '../../components/Users';
import { Estimate } from '../../components/Estimates';
import EstimateItem from '../../components/EstimateListItem';
import { CardItemShimmer } from '../../components/Interfaces/CardItemShimmer';
import { PageWaiting, PageType } from '../../components/PageWaiting';
import { Paginations } from '../../components/Interfaces/Pagination';
import SearchEstimates from '../../components/Interfaces/SearchEstimates';
import SearchFilters, { SearchParams } from '../../components/Interfaces/SearchFilters';

const limit = 15;

const Estimates: NextPage = () => {
    const router = useRouter();

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);
    const { stores } = useContext(StoresContext);

    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [activePage, setActivePage] = useState(1);

    const [searchParams, setSearchParams] = useState<SearchParams>({
        store: "all",
        status: "all",
        range: "30",
        start: subDays(endOfToday(), 30),
        end: endOfToday(),
    });
    const [queryFilters, setQueryFilters] = useState<String[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [showSearchModal, setShowSearchModal] = useState(false);

    const handleCloseSearchModal = () => setShowSearchModal(false);
    const handleShowSearchModal = () => setShowSearchModal(true);

    const [showSearchFiltersModal, setShowSearchFiltersModal] = useState(false);

    const handleCloseSearchFiltersModal = () => setShowSearchFiltersModal(false);
    const handleShowSearchFiltersModal = () => setShowSearchFiltersModal(true);

    useEffect(() => {
        handleItemSideBar('estimates');
        handleSelectedMenu('estimates-index');

        if (user) {
            if (can(user, "estimates", "read:any") || can(user, "estimates", "read:own")) {
                let findConditions = `?limit=${limit}&page=${activePage}`;

                findConditions += `&start=${format(searchParams.start, 'yyyy-MM-dd')}&end=${format(searchParams.end, 'yyyy-MM-dd')}`;

                setQueryFilters(["Últimos 30 dias"]);

                const requestUrl = `estimates${findConditions}`;

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
            let query = `?limit=${limit}&page=${page}`;

            if (searchParams.range !== "unlimited")
                query += `?start=${format(searchParams.start, 'yyyy-MM-dd')}&end=${format(searchParams.end, 'yyyy-MM-dd')}`;


            if (searchParams.store !== "all")
                query += `&store=${searchParams.store}`;

            let requestUrl = `estimates${query}`;

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

    async function handleSetFilters(newSearchParams: SearchParams) {
        setLoadingData(true);
        setActivePage(1);

        try {
            let newQueryFilters: String[] = [];
            let query = `?limit=${limit}&page=1`;

            if (newSearchParams.range === "custom") {
                query += `&start=${format(newSearchParams.start, 'yyyy-MM-dd')}&end=${format(newSearchParams.end, 'yyyy-MM-dd')}`;

                newQueryFilters.push(`De: ${format(newSearchParams.start, 'dd/MM/yyyy')}, até: ${format(newSearchParams.end, 'dd/MM/yyyy')}`);
            }
            else if (newSearchParams.range === "30") {
                query += `&start=${format(newSearchParams.start, 'yyyy-MM-dd')}&end=${format(newSearchParams.end, 'yyyy-MM-dd')}`;

                newQueryFilters.push("Últimos 30 dias");
            }

            if (newSearchParams.store !== "all") {
                query += `&store=${newSearchParams.store}`;

                const store = stores.find(item => { return item.id === newSearchParams.store });

                if (store) {
                    newQueryFilters.push(store.name.slice(0, 30));
                }
            }

            const requestUrl = `estimates${query}`;

            const res = await api.get(requestUrl);

            setQueryFilters(newQueryFilters);

            setSearchParams(newSearchParams);

            setEstimates(res.data);

            setTotalPages(Number(res.headers['x-total-pages']));
        }
        catch (err) {
            setTypeLoadingMessage("error");
            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
        }

        setLoadingData(false);
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
                            can(user, "estimates", "read:any") || can(user, "estimates", "read:own") ? <>
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
                                                    <Row className="mt-3">
                                                        <Col className="col-row">
                                                            <Button
                                                                variant="success"
                                                                title="Procurar um orçamento."
                                                                onClick={handleShowSearchModal}
                                                            >
                                                                <FaSearch />
                                                            </Button>
                                                        </Col>

                                                        <Col className="col-row">
                                                            <Button
                                                                variant="success"
                                                                title="Filtrar resultados."
                                                                onClick={handleShowSearchFiltersModal}
                                                            >
                                                                <FaFilter />
                                                            </Button>
                                                        </Col>

                                                        {
                                                            queryFilters.map((filter, index) => {
                                                                return <Toast
                                                                    key={index}
                                                                    style={{
                                                                        width: 'auto',
                                                                        maxWidth: 'fit-content',
                                                                        marginRight: '1rem',
                                                                        marginLeft: '1rem',
                                                                    }}
                                                                >
                                                                    <Toast.Header>
                                                                        <strong className="me-auto">{filter}</strong>
                                                                    </Toast.Header>
                                                                </Toast>
                                                            })
                                                        }
                                                    </Row>

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
                                        storeOnly={user.store_only}
                                        handleSearchTo={handleSearchTo}
                                        handleCloseSearchModal={handleCloseSearchModal}
                                    />

                                    <SearchFilters
                                        searchParams={searchParams}
                                        show={showSearchFiltersModal}
                                        storeOnly={user.store_only}
                                        handleSetFilters={handleSetFilters}
                                        handleCloseSearchFiltersModal={handleCloseSearchFiltersModal}
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