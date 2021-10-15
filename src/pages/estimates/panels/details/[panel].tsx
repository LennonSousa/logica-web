import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, ButtonGroup, Col, Container, ListGroup, Row } from 'react-bootstrap';
import { FaKey, FaPencilAlt, FaMoneyBillWave } from 'react-icons/fa';

import api from '../../../../api/api';
import { TokenVerify } from '../../../../utils/tokenVerify';
import { SideBarContext } from '../../../../contexts/SideBarContext';
import { AuthContext } from '../../../../contexts/AuthContext';
import { can } from '../../../../components/Users';
import { Panel } from '../../../../components/Panels';
import PanelPrices from '../../../../components/PanelPrices';
import PageBack from '../../../../components/PageBack';
import { PageWaiting, PageType } from '../../../../components/PageWaiting';
import { prettifyCurrency } from '../../../../components/InputMask/masks';

const PanelDetails: NextPage = () => {
    const router = useRouter();
    const { panel } = router.query;

    const { loading, user } = useContext(AuthContext);

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [data, setData] = useState<Panel>();

    useEffect(() => {
        handleItemSideBar('estimates');
        handleSelectedMenu('estimates-panels');

        if (user) {
            if (can(user, "estimates", "read:any") || panel === user.id) {
                api.get(`panels/${panel}`).then(res => {
                    setData(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error get panels to edit, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                });
            }
        }
    }, [user, panel]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <>
            <NextSeo
                title="Detalhes do painel"
                description="Detalhes do painel da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Detalhes do painel',
                    description: 'Detalhes do painel da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Detalhes do painel | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "estimates", "read:any") || panel === user.id ? <>
                                {
                                    loadingData ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <>
                                            {
                                                !data ? <PageWaiting status="waiting" /> :
                                                    <Container className="content-page">
                                                        <Row>
                                                            <Col>
                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <PageBack href="/estimates/panels" subTitle="Voltar para a lista de painéis" />
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={6}>
                                                                        <Row className="align-items-center">
                                                                            <Col className="col-row">
                                                                                <h3 className="form-control-plaintext text-success">{data.name}</h3>
                                                                            </Col>

                                                                            {
                                                                                can(user, "estimates", "update:any") && <Col className="col-row">
                                                                                    <ButtonGroup size="sm" className="col-12">
                                                                                        <Button
                                                                                            title="Editar painel."
                                                                                            variant="success"
                                                                                            onClick={() => handleRoute(`/estimates/panels/edit/${data.id}`)}
                                                                                        >
                                                                                            <FaPencilAlt />
                                                                                        </Button>
                                                                                    </ButtonGroup>
                                                                                </Col>
                                                                            }
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Capacidade</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`${prettifyCurrency(String(data.capacity))} kWp`}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mb-3"></Col>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-success">Preços <FaMoneyBillWave /></h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <ListGroup className="mb-3">
                                                                                    {
                                                                                        data.prices.map(panelPrice => {
                                                                                            return <PanelPrices
                                                                                                key={panelPrice.id}
                                                                                                panelPrice={panelPrice}
                                                                                                canEdit={false}
                                                                                            />
                                                                                        })
                                                                                    }
                                                                                </ListGroup>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                    </Container>
                                            }
                                        </>
                                }
                            </> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default PanelDetails;

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