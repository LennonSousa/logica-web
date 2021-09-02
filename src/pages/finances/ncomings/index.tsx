import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Image, ListGroup, Row } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import Incomings, { Income } from '../../../components/Incomings';
import NewIncomeModal from '../../../components/Incomings/ModalNew';
import { PageWaiting } from '../../../components/PageWaiting';
import { statusModal } from '../../../components/Interfaces/AlertMessage';

export default function IncomingsPage() {
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [incomings, setIncomings] = useState<Income[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<statusModal>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [showModalNew, setShowModalNew] = useState(false);

    const handleCloseModalNew = () => setShowModalNew(false);
    const handleShowModalNew = () => setShowModalNew(true);

    useEffect(() => {
        handleItemSideBar('finances');
        handleSelectedMenu('finances-incomings');

        if (user && can(user, "finances", "read:any")) {
            api.get('incomings').then(res => {
                setIncomings(res.data);

                setLoadingData(false)
            }).catch(err => {
                console.log('Error to get attachmentsRequired to edit, ', err);

                setTypeLoadingMessage("error");
                setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
            });
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleListIncomings() {
        const res = await api.get('incomings');

        setIncomings(res.data);
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
                            can(user, "finances", "read:any") ? <Container className="content-page">
                                {
                                    can(user, "finances", "create") && <Row>
                                        <Col>
                                            <Button variant="outline-success" onClick={handleShowModalNew}>
                                                <FaPlus /> Criar um receita
                                            </Button>
                                        </Col>
                                    </Row>
                                }

                                <article className="mt-3">
                                    {
                                        loadingData ? <PageWaiting
                                            status={typeLoadingMessage}
                                            message={textLoadingMessage}
                                        /> :
                                            <Row>
                                                {
                                                    user && !!incomings.length ? <Col>
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
                                                        <Col>
                                                            <Row>
                                                                <Col className="text-center">
                                                                    <p style={{ color: 'var(--gray)' }}>Nenhum receita registrada.</p>
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
                                    }
                                </article>

                                <NewIncomeModal
                                    show={showModalNew}
                                    handleListIncomings={handleListIncomings}
                                    handleCloseModal={handleCloseModalNew}
                                />
                            </Container> :
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