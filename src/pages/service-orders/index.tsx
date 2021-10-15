import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Col, Container, Row } from 'react-bootstrap';

import { SideBarContext } from '../../contexts/SideBarContext';
import { AuthContext } from '../../contexts/AuthContext';
import { can } from '../../components/Users';
import { Project } from '../../components/Projects';
import ProjectListItem from '../../components/ProjectListItem';
import { PageWaiting, PageType } from '../../components/PageWaiting';
import { Paginations } from '../../components/Interfaces/Pagination';

import api from '../../api/api';
import { TokenVerify } from '../../utils/tokenVerify';

const limit = 15;

const ProjectsPages: NextPage = () => {
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [projects, setProjects] = useState<Project[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [activePage, setActivePage] = useState(1);

    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');
    const [loadingData, setLoadingData] = useState(true);

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
                                            loadingData ? <PageWaiting
                                                status={typeLoadingMessage}
                                                message={textLoadingMessage}
                                            /> :
                                                <>
                                                    {
                                                        !!projects.length ? projects.map((project, index) => {
                                                            return <ProjectListItem key={index} project={project} />
                                                        }) :
                                                            <PageWaiting status="empty" message="Nenhum projeto registrado." />
                                                    }
                                                </>

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