import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Row, Toast } from 'react-bootstrap';
import { FaFilter, FaSearch } from 'react-icons/fa';
import { endOfToday, format, subDays } from 'date-fns';

import { SideBarContext } from '../../contexts/SideBarContext';
import { StoresContext } from '../../contexts/StoresContext';
import { AuthContext } from '../../contexts/AuthContext';
import { can } from '../../components/Users';
import { Project } from '../../components/Projects';
import ProjectItem from '../../components/ProjectListItem';
import { CardItemShimmer } from '../../components/Interfaces/CardItemShimmer';
import { PageWaiting, PageType } from '../../components/PageWaiting';
import { Paginations } from '../../components/Interfaces/Pagination';
import SearchProjects from '../../components/Interfaces/SearchProjects';
import SearchFilters, { SearchParams, StatusItems } from '../../components/Interfaces/SearchFilters';

import api from '../../api/api';
import { TokenVerify } from '../../utils/tokenVerify';

const limit = 15;

const ProjectsPages: NextPage = () => {
    const router = useRouter();

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);
    const { stores } = useContext(StoresContext);

    const [projects, setProjects] = useState<Project[]>([]);
    const [statusItems, setStatusItems] = useState<StatusItems[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [activePage, setActivePage] = useState(1);

    const [searchParams, setSearchParams] = useState<SearchParams>({
        store: "all",
        status: "all",
        range: "unlimited",
        start: subDays(endOfToday(), 30),
        end: endOfToday(),
    });
    const [queryFilters, setQueryFilters] = useState<String[]>([]);

    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');
    const [loadingData, setLoadingData] = useState(true);

    const [showSearchModal, setShowSearchModal] = useState(false);

    const handleCloseSearchModal = () => setShowSearchModal(false);
    const handleShowSearchModal = () => setShowSearchModal(true);

    const [showSearchFiltersModal, setShowSearchFiltersModal] = useState(false);

    const handleCloseSearchFiltersModal = () => setShowSearchFiltersModal(false);
    const handleShowSearchFiltersModal = () => setShowSearchFiltersModal(true);

    useEffect(() => {
        handleItemSideBar('projects');
        handleSelectedMenu('projects-index');

        if (user) {
            if (can(user, "projects", "read:any") || can(user, "projects", "read:own")) {
                api.get('projects/status').then(res => {
                    const statusRes: StatusItems[] = res.data;
                    setStatusItems(statusRes);

                    let findConditions = `?limit=${limit}&page=${activePage}`;

                    const firstStatus = !!statusRes.length ? statusRes[0] : undefined;

                    if (firstStatus) {
                        setQueryFilters([firstStatus.name]);

                        findConditions += `&status=${firstStatus.id}`;

                        setSearchParams({
                            ...searchParams,
                            status: firstStatus.id
                        });
                    }

                    const requestUrl = `projects${findConditions}`;

                    api.get(requestUrl).then(res => {
                        setProjects(res.data);

                        try {
                            setTotalPages(Number(res.headers['x-total-pages']));
                        }
                        catch { }

                        setLoadingData(false);
                    }).catch(err => {
                        console.log('Error to get projects, ', err);

                        setTypeLoadingMessage("error");
                        setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    });
                }).catch(err => {
                    console.log('Error to get projects status, ', err);

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
                query += `&start=${format(searchParams.start, 'yyyy-MM-dd')}&end=${format(searchParams.end, 'yyyy-MM-dd')}`;

            if (searchParams.status !== "all")
                query += `&status=${searchParams.status}`;

            if (searchParams.store !== "all")
                query += `&store=${searchParams.store}`;

            let requestUrl = `projects${query}`;

            const res = await api.get(requestUrl);

            setProjects(res.data);

            setTotalPages(Number(res.headers['x-total-pages']));
        }
        catch (err) {
            setTypeLoadingMessage("error");
            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
        }

        setLoadingData(false);
    }

    function handleSearchTo(project: Project) {
        handleRoute(`/projects/details/${project.id}`);
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

            if (newSearchParams.status !== "all") {
                query += `&status=${newSearchParams.status}`;

                const statusItem = statusItems.find(item => { return item.id === newSearchParams.status });

                if (statusItem) {
                    newQueryFilters.push(statusItem.name);
                }
            }

            if (newSearchParams.store !== "all") {
                query += `&store=${newSearchParams.store}`;

                const store = stores.find(item => { return item.id === newSearchParams.store });

                if (store) {
                    newQueryFilters.push(store.name.slice(0, 30));
                }
            }

            const requestUrl = `projects${query}`;

            const res = await api.get(requestUrl);

            setQueryFilters(newQueryFilters);

            setSearchParams(newSearchParams);

            setProjects(res.data);

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
                title="Lista de projetos"
                description="Lista de projetos da plataforma de gerenciamento da Bioma consultoria."
                openGraph={{
                    url: 'https://app.biomaconsultoria.com',
                    title: 'Lista de projetos',
                    description: 'Lista de projetos da plataforma de gerenciamento da Bioma consultoria.',
                    images: [
                        {
                            url: 'https://app.biomaconsultoria.com/assets/images/logo-bioma.jpg',
                            alt: 'Lista de projetos | Plataforma Bioma',
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
                                                    <Row className="mt-3">
                                                        <Col className="col-row">
                                                            <Button
                                                                variant="success"
                                                                title="Procurar um projeto."
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
                                                            !!projects.length ? projects.map((project, index) => {
                                                                return <ProjectItem key={index} project={project} />
                                                            }) :
                                                                <PageWaiting status="empty" message="Nenhum projeto registrado." />
                                                        }
                                                    </Row>
                                                </Col>
                                        }
                                    </Row>

                                    <Row className="row-grow align-items-end">
                                        <Col>
                                            {
                                                !!projects.length && <Row className="justify-content-center align-items-center">
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

                                    <SearchProjects
                                        show={showSearchModal}
                                        handleSearchTo={handleSearchTo}
                                        handleCloseSearchModal={handleCloseSearchModal}
                                    />

                                    <SearchFilters
                                        searchParams={searchParams}
                                        show={showSearchFiltersModal}
                                        storeOnly={user.store_only}
                                        statusItems={statusItems}
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

export default ProjectsPages;

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