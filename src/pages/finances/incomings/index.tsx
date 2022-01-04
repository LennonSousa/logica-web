import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Image, ListGroup, Row, Toast } from 'react-bootstrap';
import { FaFilter, FaPlus } from 'react-icons/fa';
import { endOfToday, format, subDays } from 'date-fns';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { StoresContext } from '../../../contexts/StoresContext';

import { can } from '../../../components/Users';
import Incomings, { Income } from '../../../components/Incomings';
import NewIncomeModal from '../../../components/Incomings/ModalNew';
import { CardItemShimmer } from '../../../components/Interfaces/CardItemShimmer';
import { Paginations } from '../../../components/Interfaces/Pagination';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import SearchFilters, { SearchParams } from '../../../components/Interfaces/SearchFilters';

const limit = 30;

const IncomingsPage: NextPage = () => {
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);
    const { stores } = useContext(StoresContext);

    const [incomings, setIncomings] = useState<Income[]>([]);
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

    const [showModalNew, setShowModalNew] = useState(false);

    const handleCloseModalNew = () => setShowModalNew(false);
    const handleShowModalNew = () => setShowModalNew(true);

    const [showSearchFiltersModal, setShowSearchFiltersModal] = useState(false);

    const handleCloseSearchFiltersModal = () => setShowSearchFiltersModal(false);
    const handleShowSearchFiltersModal = () => setShowSearchFiltersModal(true);

    useEffect(() => {
        handleItemSideBar('finances');
        handleSelectedMenu('finances-incomings');

        if (user && can(user, "finances", "read:any")) {
            let findConditions = `?limit=${limit}&page=${activePage}`;

            findConditions += `&start=${format(searchParams.start, 'yyyy-MM-dd')}&end=${format(searchParams.end, 'yyyy-MM-dd')}`;

            setQueryFilters(["Últimos 30 dias"]);

            const requestUrl = `incomings${findConditions}`;

            api.get(requestUrl).then(res => {
                setIncomings(res.data);

                try {
                    setTotalPages(Number(res.headers['x-total-pages']));
                }
                catch { }

                setLoadingData(false)
            }).catch(err => {
                console.log('Error to get finances incomings to edit, ', err);

                setTypeLoadingMessage("error");
                setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
            });
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleActivePage(page: number, keepPage?: boolean) {
        if (!keepPage) setLoadingData(true);

        setActivePage(page);

        try {
            let query = `?limit=${limit}&page=${activePage}`;

            if (searchParams.range !== "unlimited")
                query += `?start=${format(searchParams.start, 'yyyy-MM-dd')}&end=${format(searchParams.end, 'yyyy-MM-dd')}`;


            if (searchParams.store !== "all")
                query += `&store=${searchParams.store}`;

            let requestUrl = `incomings${query}`;

            const res = await api.get(requestUrl);

            setIncomings(res.data);

            setTotalPages(Number(res.headers['x-total-pages']));
        }
        catch (err) {
            setTypeLoadingMessage("error");
            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
        }

        if (!keepPage) setLoadingData(false);
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

            const requestUrl = `incomings${query}`;

            const res = await api.get(requestUrl);

            setQueryFilters(newQueryFilters);

            setSearchParams(newSearchParams);

            setIncomings(res.data);

            setTotalPages(Number(res.headers['x-total-pages']));
        }
        catch (err) {
            setTypeLoadingMessage("error");
            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
        }

        setLoadingData(false);
    }

    async function handleListIncomings() {
        handleActivePage(activePage, true);
    }

    return (
        <>
            <NextSeo
                title="Lista de receitas"
                description="Lista de receitas da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Lista de receitas',
                    description: 'Lista de receitas da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Lista de receitas | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "finances", "read:any") ? <>
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
                                                        {
                                                            can(user, "finances", "create") && <Col className="col-row">
                                                                <Button variant="success" onClick={handleShowModalNew}>
                                                                    <FaPlus /> Criar um receita
                                                                </Button>
                                                            </Col>
                                                        }

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

                                                    <Row className="mt-3">
                                                        {
                                                            !!incomings.length ? <Col>
                                                                <ListGroup>
                                                                    {
                                                                        incomings && incomings.map((income, index) => {
                                                                            return <Incomings
                                                                                key={index}
                                                                                income={income}
                                                                                handleListIncomings={handleListIncomings}
                                                                            />
                                                                        })
                                                                    }
                                                                </ListGroup>
                                                            </Col> :
                                                                <PageWaiting status="empty" message="Nenhuma receita registrada." />
                                                        }
                                                    </Row>
                                                </Col>
                                        }
                                    </Row>

                                    <Row className="row-grow align-items-end">
                                        <Col>
                                            {
                                                !!incomings.length && <Row className="justify-content-center align-items-center">
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

                                    <NewIncomeModal
                                        show={showModalNew}
                                        handleListIncomings={handleListIncomings}
                                        handleCloseModal={handleCloseModalNew}
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

export default IncomingsPage;

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