import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, ListGroup, Modal, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaSearch } from 'react-icons/fa';

import api from '../../api/api';
import { TokenVerify } from '../../utils/tokenVerify';
import { AuthContext } from '../../contexts/AuthContext';
import { SideBarContext } from '../../contexts/SideBarContext';
import { can } from '../../components/Users';
import { Estimate } from '../../components/Estimates';
import EstimateItem from '../../components/EstimateListItem';
import { PageWaiting, PageType } from '../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../components/Interfaces/AlertMessage';
import { Paginations } from '../../components/Interfaces/Pagination';

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!'),
});

const limit = 15;

export default function Estimates() {
    const router = useRouter();
    const userId = router.query['user'];

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [activePage, setActivePage] = useState(1);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [estimateResults, setEstimateResults] = useState<Estimate[]>([]);

    const [showSearchModal, setShowSearchModal] = useState(false);

    const handleCloseSearchModal = () => setShowSearchModal(false);
    const handleShowSearchModal = () => setShowSearchModal(true);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    useEffect(() => {
        handleItemSideBar('estimates');
        handleSelectedMenu('estimates-index');

        if (user) {
            if (can(user, "estimates", "read:any")) {
                let requestUrl = `estimates?limit=${limit}&page=${activePage}`;

                if (userId) requestUrl = `members/estimates/user/${userId}?limit=${limit}&page=${activePage}`;

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

            if (userId) requestUrl = `members/estimates/user/${userId}?limit=${limit}&page=${activePage}`;

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
                                            loadingData ? <PageWaiting
                                                status={typeLoadingMessage}
                                                message={textLoadingMessage}
                                            /> :
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

                                    <Modal show={showSearchModal} onHide={handleCloseSearchModal}>
                                        <Modal.Header closeButton>
                                            <Modal.Title>Lista de orçamentos</Modal.Title>
                                        </Modal.Header>

                                        <Formik
                                            initialValues={{
                                                name: '',
                                            }}
                                            onSubmit={async values => {
                                                setTypeMessage("waiting");
                                                setMessageShow(true);

                                                try {
                                                    const res = await api.get(`estimates?name=${values.name}`);

                                                    setEstimateResults(res.data);

                                                    setMessageShow(false);
                                                }
                                                catch {
                                                    setTypeMessage("error");

                                                    setTimeout(() => {
                                                        setMessageShow(false);
                                                    }, 4000);
                                                }
                                            }}
                                            validationSchema={validationSchema}
                                        >
                                            {({ handleSubmit, values, setFieldValue, errors, touched }) => (
                                                <>
                                                    <Modal.Body>
                                                        <Form onSubmit={handleSubmit}>
                                                            <Form.Group controlId="estimateFormGridName">
                                                                <Form.Label>Nome do orçamento</Form.Label>
                                                                <Form.Control type="search"
                                                                    placeholder="Digite para pesquisar"
                                                                    autoComplete="off"
                                                                    onChange={(e) => {
                                                                        setFieldValue('name', e.target.value);

                                                                        if (e.target.value.length > 1)
                                                                            handleSubmit();
                                                                    }}
                                                                    value={values.name}
                                                                    isInvalid={!!errors.name && touched.name}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Row style={{ minHeight: '40px' }}>
                                                                <Col>
                                                                    {messageShow && <AlertMessage status={typeMessage} />}
                                                                </Col>
                                                            </Row>
                                                        </Form>
                                                    </Modal.Body>

                                                    <Modal.Dialog scrollable style={{ marginTop: 0, width: '100%' }}>
                                                        <Modal.Body style={{ maxHeight: 'calc(100vh - 3.5rem)' }}>
                                                            <Row style={{ minHeight: '150px' }}>
                                                                {
                                                                    values.name.length > 1 && <Col>
                                                                        {
                                                                            !!estimateResults.length ? <ListGroup className="mt-3 mb-3">
                                                                                {
                                                                                    estimateResults.map((estimate, index) => {
                                                                                        return <ListGroup.Item
                                                                                            key={index}
                                                                                            action
                                                                                            variant="light"
                                                                                            onClick={() => handleRoute(`/estimates/details/${estimate.id}`)}
                                                                                        >
                                                                                            <Row>
                                                                                                <Col>
                                                                                                    <h6>{estimate.customer}</h6>
                                                                                                </Col>
                                                                                            </Row>
                                                                                            <Row>
                                                                                                <Col>
                                                                                                    <span className="text-italic">
                                                                                                        {`${estimate.document} - ${estimate.city}/${estimate.state}`}
                                                                                                    </span>
                                                                                                </Col>
                                                                                            </Row>
                                                                                        </ListGroup.Item>
                                                                                    })
                                                                                }
                                                                            </ListGroup> :
                                                                                <AlertMessage status="warning" message="Nenhum orçamento encontrado!" />
                                                                        }
                                                                    </Col>
                                                                }
                                                            </Row>
                                                        </Modal.Body>
                                                        <Modal.Footer>
                                                            <Button variant="secondary" onClick={handleCloseSearchModal}>Cancelar</Button>
                                                        </Modal.Footer>
                                                    </Modal.Dialog>
                                                </>
                                            )}
                                        </Formik>
                                    </Modal>
                                </Container>
                            </> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

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