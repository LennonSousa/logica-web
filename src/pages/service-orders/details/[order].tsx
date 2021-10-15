import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Col, Container, Button, ButtonGroup, Row } from 'react-bootstrap';
import { format } from 'date-fns';
import { FaTools, FaCheck, FaPencilAlt, FaPrint, FaTasks } from 'react-icons/fa';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import { ServiceOrder } from '../../../components/ServiceOrders';

import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { prettifyCurrency } from '../../../components/InputMask/masks';

const ServiceOrderDetails: NextPage = () => {
    const router = useRouter();
    const { order } = router.query;

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [data, setData] = useState<ServiceOrder>();
    const [documentType, setDocumentType] = useState("CPF");

    const [electricType, setElectricType] = useState("Monofásica");

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    useEffect(() => {
        if (user) {
            handleItemSideBar('service-orders');
            handleSelectedMenu('service-orders-index');

            if (can(user, "projects", "read:any")) {
                if (order) {
                    api.get(`services/orders/${order}`).then(res => {
                        let serviceOrderRes: ServiceOrder = res.data;

                        if (serviceOrderRes.document.length > 14)
                            setDocumentType("CNPJ");

                        if (serviceOrderRes.electric_type === "bi") setElectricType("Bifásica");
                        if (serviceOrderRes.electric_type === "tri") setElectricType("Trifásica");

                        setData(serviceOrderRes);
                        setLoadingData(false);
                    }).catch(err => {
                        console.log('Error to get service order: ', err);

                        setTypeLoadingMessage("error");
                        setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                        setHasErrors(true);
                    });
                }
            }
        }
    }, [user, order]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <>
            <NextSeo
                title="Editar ordem de serviço"
                description="Editar ordem de serviço da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Editar ordem de serviço',
                    description: 'Editar ordem de serviço da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Editar ordem de serviço | Plataforma Lógica Solar',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "services", "read:any") ? <>
                                {
                                    loadingData || hasErrors ? <PageWaiting
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
                                                                        <PageBack href="/service-orders" subTitle="Voltar para a lista de ordem de serviços" />
                                                                    </Col>

                                                                    <Col className="col-row">
                                                                        <ButtonGroup className="col-12">
                                                                            <Button
                                                                                title="Editar ordem de serviço."
                                                                                variant="success"
                                                                                onClick={() => handleRoute(`/service-orders/edit/${data.id}`)}
                                                                            >
                                                                                <FaPencilAlt />
                                                                            </Button>

                                                                            <Button
                                                                                title="Imprimir ordem de serviço."
                                                                                variant="success"
                                                                                onClick={() => handleRoute(`/service-orders/print/${data.id}`)}
                                                                            >
                                                                                <FaPrint />
                                                                            </Button>
                                                                        </ButtonGroup>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={6}>
                                                                        <h3 className="form-control-plaintext text-success">{data.customer}</h3>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">{documentType}</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.document}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={4}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Celular</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.phone}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Celular secundário</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.cellphone}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">E-mail</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.email}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={4}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Outros contatos</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.contacts}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={2}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">CEP</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.zip_code}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={8}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Rua</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.street}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={2} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Número</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.number}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={4}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Complemento</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.complement}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={6}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Bairro</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.neighborhood}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={2}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Cidade</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.city}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Estado</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.state}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Coordenadas</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.coordinates}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Nome do Wifi</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.wifi_name} </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Senha do Wifi</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.wifi_password}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-3 mb-3"></Col>

                                                                <Row className="mt-5 mb-3">
                                                                    <Col>
                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-success">Dados da instalação <FaTools /></h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Situação do telhado</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-secondary text-wrap">{data.roof_details}</span>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={5} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Tipo de rede</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{electricType}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={5} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Marca do Inversor</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.inversor_brand}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={2}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Potência do inversor</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`${prettifyCurrency(Number(data.inversor_potency).toFixed(2))} kWp`} </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={5} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Marca do módulo</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.module_brand}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={2}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Quantidade de módulos</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`${prettifyCurrency(Number(data.module_amount).toFixed(2))} un`} </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mt-5 mb-3">
                                                                    <Col>
                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-success">Check-list <FaTasks /></h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col >
                                                                        <Row>
                                                                            <Col sm={1} className="col-1 text-success text-end">
                                                                                {
                                                                                    data.test_leak && <FaCheck />
                                                                                }
                                                                            </Col>
                                                                            <Col className="col-11">
                                                                                <h6 className="text-secondary text-wrap">Teste de goteira realizado</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col >
                                                                        <Row>
                                                                            <Col sm={1} className="col-1 text-success text-end">
                                                                                {
                                                                                    data.test_meter && <FaCheck />
                                                                                }
                                                                            </Col>
                                                                            <Col className="col-11">
                                                                                <h6 className="text-secondary text-wrap">Medidor está adequado?</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col >
                                                                        <Row>
                                                                            <Col sm={1} className="col-1 text-success text-end">
                                                                                {
                                                                                    data.test_monitor && <FaCheck />
                                                                                }
                                                                            </Col>
                                                                            <Col className="col-11">
                                                                                <h6 className="text-secondary text-wrap">Monitoramento realizado</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col >
                                                                        <Row>
                                                                            <Col sm={1} className="col-1 text-success text-end">
                                                                                {
                                                                                    data.explanation && <FaCheck />
                                                                                }
                                                                            </Col>
                                                                            <Col className="col-11">
                                                                                <h6 className="text-secondary text-wrap">Explicação de funcionamento do sistema</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-3 mb-3"></Col>

                                                                <Row className="mb-3">
                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Início do serviço</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{format(new Date(data.start_at), 'dd/MM/yyyy')}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Previsão de entrega</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{format(new Date(data.finish_at), 'dd/MM/yyyy')}</h6>
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

export default ServiceOrderDetails;

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