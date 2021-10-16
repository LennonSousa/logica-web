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
import { Project } from '../../components/Projects';
import ProjectItem from '../../components/ProjectListItem';
import { CardItemShimmer } from '../../components/Interfaces/CardItemShimmer';
import { PageWaiting, PageType } from '../../components/PageWaiting';
import { Paginations } from '../../components/Interfaces/Pagination';
import SearchProjects from '../../components/Interfaces/SearchProjects';

import api from '../../api/api';
import { TokenVerify } from '../../utils/tokenVerify';

const limit = 15;

const ProjectsPages: NextPage = () => {
    const router = useRouter();

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [projects, setProjects] = useState<Project[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [activePage, setActivePage] = useState(1);

    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');
    const [loadingData, setLoadingData] = useState(true);

    const [showSearchModal, setShowSearchModal] = useState(false);

    const handleCloseSearchModal = () => setShowSearchModal(false);
    const handleShowSearchModal = () => setShowSearchModal(true);

    useEffect(() => {
        handleItemSideBar('projects');
        handleSelectedMenu('projects-index');

        if (user) {
            if (can(user, "projects", "read:any")) {
                let requestUrl = `projects?limit=${limit}&page=${activePage}`;

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
            }
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleActivePage(page: number) {
        setLoadingData(true);
        setActivePage(page);

        try {
            let requestUrl = `projects?limit=${limit}&page=${activePage}`;

            const res = await api.get(requestUrl)

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
                            can(user, "projects", "read:any") ? <>
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
                                                        !!projects.length && <Row className="mt-3">
                                                            <Col className="col-row">
                                                                <Button
                                                                    variant="success"
                                                                    title="Procurar um projeto."
                                                                    onClick={handleShowSearchModal}
                                                                >
                                                                    <FaSearch />
                                                                </Button>
                                                            </Col>
                                                        </Row>
                                                    }
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