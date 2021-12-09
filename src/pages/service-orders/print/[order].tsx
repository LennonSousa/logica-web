import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Col, Container, Button, ButtonGroup, Image, Row } from 'react-bootstrap';
import { format } from 'date-fns';
import {
    FaPencilAlt,
    FaTools,
    FaTasks,
    FaCheck,
    FaStickyNote,
    FaRegSquare,
    FaUserTie,
    FaFileSignature,
} from 'react-icons/fa';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import { ServiceOrder } from '../../../components/ServiceOrders';
import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { prettifyCurrency } from '../../../components/InputMask/masks';
import { PrintButton } from '../../../components/Interfaces/PrintButton';

const ServiceOrderPrint: NextPage = () => {
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

            if (can(user, "services", "read:any") || can(user, "services", "read:own")) {
                if (order) {
                    api.get(`services/orders/${order}`).then(res => {
                        const serviceOrderRes: ServiceOrder = res.data;

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
                title="Imprimir ordem de serviço"
                description="Imprimir ordem de serviço da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Imprimir ordem de serviço',
                    description: 'Imprimir ordem de serviço da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Imprimir ordem de serviço | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "services", "read:any") || can(user, "services", "read:own") ? <>
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
                                                                <Row className="mb-3 d-print-none">
                                                                    <Col>
                                                                        <PageBack href={`/service-orders/details/${data.id}`} subTitle="Voltar para os detalhes da ordem de serviço" />
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
                                                                        </ButtonGroup>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="text-center">
                                                                    <Col>
                                                                        <h4 className="text-dark text-wrap">ORDEM DE SERVIÇO</h4>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="align-items-center">
                                                                    <Col sm={5}>
                                                                        <Row>
                                                                            <Col className="text-wrap">
                                                                                <h5 className="text-dark">{data.store.title}</h5>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col className="text-wrap">
                                                                                <h6 className="text-dark">{`${data.store.street}, ${data.store.number} - ${data.store.neighborhood}`}</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col className="text-wrap">
                                                                                <h6 className="text-dark">{data.store.complement}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={5}>
                                                                        <Row>
                                                                            <Col className="text-wrap">
                                                                                <h6 className="text-dark">{`${data.store.zip_code}, ${data.store.city} - ${data.store.state}`}</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col className="text-wrap">
                                                                                <h6 className="text-dark">{`${data.store.phone}, ${data.store.email}`}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col>
                                                                        <Image fluid src={data.store.avatar} alt={data.store.title} />
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaUserTie /> DADOS DO CLIENTE</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
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

                                                                <Row className="mb-1">
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

                                                                <Row className="mb-1">
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

                                                                <Row className="mb-1">
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

                                                                <Row className="mb-1">
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

                                                                <Row className="mb-1">
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
                                                                                <span className="text-success">Nome da rede sem fio</span>
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
                                                                                <span className="text-success">Senha da rede sem fio</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.wifi_password}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaTools /> Dados da instalação</h5>
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
                                                                    <Col>
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

                                                                    <Col>
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

                                                                    <Col>
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

                                                                    <Col>
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

                                                                    <Col>
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

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaTasks /> Check-list</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <Row>
                                                                            <Col className="col-11">
                                                                                <h6 className="text-secondary text-wrap">
                                                                                    {
                                                                                        data.test_leak ? <FaCheck className="text-success" /> :
                                                                                            <FaRegSquare className="text-secondary" />
                                                                                    } Teste de goteira realizado
                                                                                </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col>
                                                                        <Row>
                                                                            <Col className="col-11">
                                                                                <h6 className="text-secondary text-wrap">
                                                                                    {
                                                                                        data.test_meter ? <FaCheck className="text-success" /> :
                                                                                            <FaRegSquare className="text-secondary" />
                                                                                    } Medidor está adequado?
                                                                                </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col>
                                                                        <Row>
                                                                            <Col className="col-11">
                                                                                <h6 className="text-secondary text-wrap">
                                                                                    {
                                                                                        data.test_monitor ? <FaCheck className="text-success" /> :
                                                                                            <FaRegSquare className="text-secondary" />
                                                                                    } Monitoramento realizado
                                                                                </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col>
                                                                        <Row>
                                                                            <Col className="col-11">
                                                                                <h6 className="text-secondary text-wrap">
                                                                                    {
                                                                                        data.explanation ? <FaCheck className="text-success" /> :
                                                                                            <FaRegSquare className="text-secondary" />
                                                                                    } Explicação de funcionamento do sistema
                                                                                </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>


                                                                <Col className="border-top mt-1 mb-3"></Col>

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

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaStickyNote /> OBSERVAÇÕES AO CLIENTE PROPRIETÁRIO</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <span className="text-secondary text-wrap">
                                                                            A configuração do inversor com a internet é feito após a conclusão da instalação, com a configuração de login e senha,
                                                                            o inversor manda as informações de geração instantaneamente e se houver falhas envia alertas de possíveis erros que
                                                                            venham a acontecer com o equipamento,  a equipe técnica agenda uma visita  para o devido reparo, caso o cliente troque
                                                                            a senha ou login será necessário uma nova configuração com um custo de uma visita técnica de 10% do valor do salário
                                                                            mínimo no ano corrente acrescidos de R$ 4,00 o km quando fora da cidade de Imperatriz-ma.<br />
                                                                            O cliente tem 90 dias de garantia contra goteiras no perímetro da instalação, após 90 dias corridos sem sermos
                                                                            contactados a respeito de goteiras, caracteriza-se que a instalação ficou sem problemas no telhado. Caso necessário
                                                                            manutenção no telhado e o cliente precise dos nossos serviços será orçado o serviço de acordo com a necessidade.
                                                                        </span>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-4">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaFileSignature /> TERMO DE ACEITE</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-around text-center">
                                                                    <Col sm={4}>
                                                                        <Row className="justify-content-center">
                                                                            <Col sm={11} className="border-top mt-1 mb-1"></Col>
                                                                        </Row>

                                                                        <Row className="justify-content-center">
                                                                            <Col>
                                                                                <h6 className="text-dark">Assinatura do cliente</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row className="justify-content-center">
                                                                            <Col>
                                                                                <h6 className="text-dark">{data.customer}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4}>
                                                                        <Row className="justify-content-center">
                                                                            <Col sm={11} className="border-top mt-1 mb-1"></Col>
                                                                        </Row>

                                                                        <Row className="justify-content-center">
                                                                            <Col>
                                                                                <h6 className="text-dark">Conferente</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row className="justify-content-center">
                                                                            <Col>
                                                                                <h6 className="text-dark">{data.user ? data.user.name : data.created_by}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4}>
                                                                        <Row className="justify-content-center">
                                                                            <Col sm={11} className="border-top mt-1 mb-1"></Col>
                                                                        </Row>

                                                                        <Row className="justify-content-center">
                                                                            <Col>
                                                                                <h6 className="text-dark">Técnico responsável</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row className="justify-content-center">
                                                                            <Col>
                                                                                <h6 className="text-dark">{data.technical}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-secondary text-wrap">
                                                                            {`${data.store.city}, ${format(new Date(), 'dd/MM/yyyy')}`}
                                                                        </span>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <PrintButton title="Imprimir ordem de serviço." />
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

export default ServiceOrderPrint;

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