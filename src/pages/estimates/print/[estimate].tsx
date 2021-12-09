import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Col, Container, Button, ButtonGroup, Image, Table, Row } from 'react-bootstrap';
import { format } from 'date-fns';
import br from 'date-fns/locale/pt-BR';
import {
    FaPencilAlt,
    FaPlug,
    FaStickyNote,
    FaSolarPanel,
    FaCashRegister,
    FaClipboardList,
    FaPrint,
    FaUserTie,
    FaBoxOpen,
    FaFileSignature,
    FaShieldAlt,
    FaSun,
} from 'react-icons/fa';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import { Estimate } from '../../../components/Estimates';
import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { prettifyCurrency } from '../../../components/InputMask/masks';
import {
    calculate,
    calcFinalTotal,
    ConsumptionCalcProps,
    CalcResultProps,
    CalcProps
} from '../../../utils/calcEstimate';
import { getHtml } from '../../../utils/textEditor';

import styles from './styles.module.css'

const EstimatePrint: NextPage = () => {
    const router = useRouter();
    const { estimate } = router.query;

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [data, setData] = useState<Estimate>();
    const [documentType, setDocumentType] = useState("CPF");
    const [userDocumentType, setUserDocumentType] = useState("CPF");
    const [calcResults, setCalcResults] = useState<CalcResultProps>();

    const [finalTotal, setFinalTotal] = useState(0);

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    useEffect(() => {
        if (user) {
            handleItemSideBar('estimates');
            handleSelectedMenu('estimates-index');

            if (can(user, "estimates", "read:any") || can(user, "estimates", "read:own")) {
                if (estimate) {
                    api.get(`estimates/${estimate}`).then(res => {
                        const estimateRes: Estimate = res.data;

                        if (estimateRes.document.length > 14)
                            setDocumentType("CNPJ");

                        if (estimateRes.store.document.length > 14)
                            setUserDocumentType("CNPJ");

                        setData(estimateRes);

                        const values: ConsumptionCalcProps = {
                            kwh: Number(estimateRes.kwh),
                            irradiation: Number(estimateRes.irradiation),
                            panel: estimateRes.panel,
                            month_01: Number(estimateRes.month_01),
                            month_02: Number(estimateRes.month_02),
                            month_03: Number(estimateRes.month_03),
                            month_04: Number(estimateRes.month_04),
                            month_05: Number(estimateRes.month_05),
                            month_06: Number(estimateRes.month_06),
                            month_07: Number(estimateRes.month_07),
                            month_08: Number(estimateRes.month_08),
                            month_09: Number(estimateRes.month_09),
                            month_10: Number(estimateRes.month_10),
                            month_11: Number(estimateRes.month_11),
                            month_12: Number(estimateRes.month_12),
                            month_13: Number(estimateRes.month_13),
                            averageIncrease: Number(estimateRes.average_increase),
                            roofOrientation: estimateRes.roof_orientation,
                        }

                        const newCalcProps = {
                            discount_percent: estimateRes.discount_percent,
                            discount: estimateRes.discount,
                            increase_percent: estimateRes.increase_percent,
                            increase: estimateRes.increase,
                            estimateItems: estimateRes.items,
                        }

                        handleCalcEstimate(values, newCalcProps, false);
                        setLoadingData(false);
                    }).catch(err => {
                        console.log('Error to get estimate: ', err);

                        setTypeLoadingMessage("error");
                        setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                        setHasErrors(true);
                    });
                }
            }
        }
    }, [user, estimate]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleCalcEstimate(values: ConsumptionCalcProps, newCalcProps: CalcProps, updateInversor: boolean) {
        const newCalcResults = calculate(values, newCalcProps.estimateItems, updateInversor);

        if (newCalcResults) {
            setCalcResults(newCalcResults);

            handleFinalTotal(
                newCalcResults.systemInitialPrice,
                newCalcProps.discount_percent,
                newCalcProps.discount,
                newCalcProps.increase_percent,
                newCalcProps.increase
            );
        }
    }

    function handleFinalTotal(subTotal: number, newDiscountPercent: boolean, newDiscount: number, newIncreasePercent: boolean, newIncrease: number) {
        const newFinalTotal = calcFinalTotal(
            subTotal,
            newDiscountPercent,
            newDiscount,
            newIncreasePercent,
            newIncrease
        );

        setFinalTotal(newFinalTotal);
    }

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <>
            <NextSeo
                title="Imprimir orçamento"
                description="Imprimir orçamento da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Imprimir orçamento',
                    description: 'Imprimir orçamento da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Imprimir orçamento | Plataforma Lógica Renováveis',
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
                                                                        <PageBack href={`/estimates/details/${data.id}`} subTitle="Voltar para os detalhes do orçamento" />
                                                                    </Col>

                                                                    <Col className="col-row">
                                                                        <ButtonGroup className="col-12">
                                                                            <Button
                                                                                title="Editar orçamento."
                                                                                variant="success"
                                                                                onClick={() => handleRoute(`/estimates/edit/${data.id}`)}
                                                                            >
                                                                                <FaPencilAlt />
                                                                            </Button>
                                                                        </ButtonGroup>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-5 text-center">
                                                                    <Col>
                                                                        <h4 className="text-dark text-wrap">PROPOSTA TÉCNICA E COMERCIAL<br></br>
                                                                            PARA FORNECIMENTO DE SISTEMA SOLAR FOTOVOLTAICO</h4>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mt-5 mb-5 text-center">
                                                                    <Col className="mt-5 mb-5">
                                                                        <h3 className="form-control-plaintext text-success">{data.customer}</h3>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center align-items-center text-center mt-5 mb-5">
                                                                    <Col className="mt-5 mb-5">
                                                                        <Image fluid src="/assets/images/estimate-img-01.jpeg" alt="Painéis solares" />
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col>
                                                                        <h3 className="form-control-plaintext text-center text-success">
                                                                            POR QUE ESCOLHER A LOGICA SOLUÇÕES RENOVÁVEIS?
                                                                        </h3>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-5">
                                                                    <Col>
                                                                        <span className="text-secondary text-wrap" >
                                                                            <p>
                                                                                A Lógica está no mercado há dez anos, oferecendo serviços e atendimento de qualidade,
                                                                                nossos profissionais são qualificados e passam por constantes reciclagens para atender melhor nossos
                                                                                clientes.
                                                                            </p>

                                                                            <p>
                                                                                Nossa empresa está devidamente registrada nos órgãos competentes do setor, nosso corpo
                                                                                técnico consta com engenheiro eletricista, técnicos e instaladores registrados e certificados para
                                                                                dar mais segurança técnica, física e jurídica aos nossos clientes.
                                                                            </p>

                                                                            <p>
                                                                                Somos registrados no CREA-MA (CONSELHO REGIONAL DE ENEGENHARIA E AGRONOMIA DO MARANHÃO),
                                                                                ABGD (ASSOCIAÇÃO BRASILEIRA DE GERAÇÃO DISTRIBUIDA) e PORTAL SOLAR. Consideramos ser de suma importância
                                                                                para nossos clientes estar devidamente credenciados no maior número de órgãos possíveis do setor, para
                                                                                que sempre, possamos estar atualizados, bem informados e respaldados para assessorar da melhor maneira
                                                                                nossos clientes.
                                                                            </p>
                                                                        </span>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center align-items-center text-center mt-5 mb-5">
                                                                    <Col sm={3}>
                                                                        <Image fluid src="/assets/images/estimate-img-02.png" alt="CREA" />
                                                                    </Col>

                                                                    <Col sm={3}>
                                                                        <Image fluid src="/assets/images/estimate-img-03.jpeg" alt="Portal solar" />
                                                                    </Col>

                                                                    <Col sm={3}>
                                                                        <Image fluid src="/assets/images/estimate-img-04.png" alt="ABGD" />
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mt-5 mb-3">
                                                                    <Col>
                                                                        <span className="text-secondary text-wrap">{format(new Date(), 'PPPP', { locale: br })}</span>
                                                                    </Col>
                                                                </Row>

                                                                <Col style={{ pageBreakBefore: 'always' }} className="border-top mt-1 mb-3"></Col>

                                                                <Row className="align-items-center mb-3">
                                                                    <Col sm={9}>
                                                                        <Row>
                                                                            <Col>
                                                                                <h5 className="text-dark">{data.store.title}</h5>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-dark">{`${data.store.street}, ${data.store.number} - ${data.store.neighborhood}`}</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-dark">{data.store.complement}</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-dark">{`${data.store.zip_code}, ${data.store.city} - ${data.store.state}`}</h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-dark">{`${data.store.phone}, ${data.store.email}`}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col>
                                                                        <Image fluid src={data.store.avatar} alt={data.store.title} />
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

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

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaPlug /> CONSUMO</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col sm={4}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Concessionária de energia</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.energy_company}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Unidade consumidora (UC)</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.unity}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Tipo de telhado</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.roof_type.name}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col sm={3}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Valor unitário do Quilowatts/Hora</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6
                                                                                    className="text-secondary"
                                                                                >
                                                                                    {`R$ ${Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(data.kwh)}`}
                                                                                </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Irradiação Local em [Kwh/m².dia]</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(String(data.irradiation))}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Painel</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`${data.panel.name} - ${prettifyCurrency(String(data.panel.capacity))} W`}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Orientação do telhado</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.roof_orientation.name}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col sm={3}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Mês 01</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(String(data.month_01))} </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Mês 02</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(String(data.month_02))}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Mês 03</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(String(data.month_03))}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Mês 04</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(String(data.month_04))}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col sm={3}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Mês 05</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(String(data.month_05))} </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Mês 06</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(String(data.month_06))}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Mês 07</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(String(data.month_07))}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Mês 08</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(String(data.month_08))}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col sm={3}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Mês 09</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(String(data.month_09))} </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Mês 10</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(String(data.month_10))}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Mês 11</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(String(data.month_11))}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Mês 12</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(String(data.month_12))}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col sm={3}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Mês 13</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(String(data.month_13))} </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Média</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(calcResults ? calcResults.monthsAverageKwh.toFixed(2) : '0.00')}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Previsão de aumento</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(String(data.average_increase))}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Consumo final</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{prettifyCurrency(calcResults ? calcResults.finalAverageKwh.toFixed(2) : '0.00')}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaSolarPanel /> PROJETO</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col sm={4}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Valor médio mensal da conta de energia</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`R$ ${prettifyCurrency(calcResults ? calcResults.monthlyPaid.toFixed(2) : '0.00')}`} </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Valor pago anualmente</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`R$ ${prettifyCurrency(calcResults ? calcResults.yearlyPaid.toFixed(2) : '0.00')}`}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Número total de Painéis Fotovoltaicos</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`${prettifyCurrency(calcResults ? calcResults.panelsAmount.toFixed(2) : '0.00')} Un`}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Total de energia gerada mensalmente</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`${prettifyCurrency(calcResults ? calcResults.monthlyGeneratedEnergy.toFixed(2) : '0.00')} Kwh`}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Total de energia gerada anualmente</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`${prettifyCurrency(calcResults ? calcResults.yearlyGeneratedEnergy.toFixed(2) : '0.00')} Kwh`}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Redução de emissão de gás CO² ao ano</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`${prettifyCurrency(calcResults ? calcResults.co2Reduction.toFixed(2) : '0.00')} Kg`} </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-1">
                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Área ocupada pelo sistema</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`${prettifyCurrency(calcResults ? calcResults.systemArea.toFixed(2) : '0.00')} m²`}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Capacidade de geração do Sistema</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`${prettifyCurrency(calcResults ? calcResults.finalSystemCapacityKwp.toFixed(2) : '0.00')} kWp`}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaCashRegister /> VALORES</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={3}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Subtotal</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`R$ ${prettifyCurrency(calcResults ? calcResults.systemInitialPrice.toFixed(2) : '0.00')}`} </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    {
                                                                        data.show_discount && <>
                                                                            <Col sm={3} >
                                                                                <Row>
                                                                                    <Col>
                                                                                        <span className="text-success">Desconto</span>
                                                                                    </Col>
                                                                                </Row>

                                                                                <Row>
                                                                                    <Col>
                                                                                        <h6 className="text-secondary">{
                                                                                            `${data.discount_percent ? '' : 'R$ '}${prettifyCurrency(String(data.discount))} ${data.discount_percent ? '%' : ''}`
                                                                                        }</h6>
                                                                                    </Col>
                                                                                </Row>
                                                                            </Col>

                                                                            <Col sm={3} >
                                                                                <Row>
                                                                                    <Col>
                                                                                        <span className="text-success">Acréscimo</span>
                                                                                    </Col>
                                                                                </Row>

                                                                                <Row>
                                                                                    <Col>
                                                                                        <h6 className="text-secondary">{
                                                                                            `${data.increase_percent ? '' : 'R$ '}${prettifyCurrency(String(data.increase))} ${data.increase_percent ? '%' : ''}`
                                                                                        }</h6>
                                                                                    </Col>
                                                                                </Row>
                                                                            </Col>
                                                                        </>
                                                                    }
                                                                </Row>

                                                                <Col style={{ pageBreakBefore: 'always' }} className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaClipboardList /> ITENS</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Table striped hover size="sm" responsive>
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Quantidade</th>
                                                                            <th>Produto</th>
                                                                            {
                                                                                data.show_values && <>
                                                                                    <th>Unitário</th>
                                                                                    <th>Total</th>
                                                                                </>
                                                                            }
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {
                                                                            data.items.map((item, index) => {
                                                                                const total = item.amount * item.price;

                                                                                return <tr key={index}>
                                                                                    <td>{prettifyCurrency(Number(item.amount).toFixed(2))}</td>
                                                                                    <td>{item.name}</td>
                                                                                    {
                                                                                        data.show_values && <>
                                                                                            <td>{`R$ ${prettifyCurrency(Number(item.price).toFixed(2))}`}</td>
                                                                                            <td>{`R$ ${prettifyCurrency(total.toFixed(2))}`}</td>
                                                                                        </>
                                                                                    }
                                                                                </tr>
                                                                            })
                                                                        }
                                                                    </tbody>
                                                                </Table>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaSun /> VALOR FINAL DO SISTEMA</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <h5 className="text-success">{`R$ ${prettifyCurrency(finalTotal.toFixed(2))}`} </h5>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaStickyNote /> OBSERVAÇÕES</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <span className="text-secondary text-wrap">{data.notes}</span>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaBoxOpen /> SERVIÇOS INCLUSOS</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <span
                                                                            className="text-secondary text-wrap"
                                                                            dangerouslySetInnerHTML={{ __html: getHtml(data.store.services_in) }}
                                                                        ></span>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaShieldAlt /> GARANTIAS</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <span
                                                                            className="text-secondary text-wrap"
                                                                            dangerouslySetInnerHTML={{ __html: getHtml(data.store.warranty) }}
                                                                        ></span>
                                                                    </Col>
                                                                </Row>

                                                                <Col style={{ pageBreakBefore: 'always' }} className="border-top mt-1 mb-3"></Col>

                                                                <Row className="mb-2">
                                                                    <Col>
                                                                        <h5 className="text-dark"><FaFileSignature /> TERMO DE ACEITE DA PROPOSTA</h5>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <span className="text-secondary text-wrap">
                                                                            Li e estou de acordo com os termos e condições propostas neste orçamento, com
                                                                            validade de 10 (dez) dias:
                                                                        </span>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col>
                                                                        <span className="text-secondary text-wrap">{format(new Date(), 'PPPPp', { locale: br })}</span>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8} className="border-top mt-5 mb-1"></Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6
                                                                            className="text-secondary text-wrap"
                                                                            dangerouslySetInnerHTML={{ __html: getHtml(data.store.engineer) }}
                                                                        ></h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8} className="border-top mt-5 mb-1"></Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">Assinatura do responsável</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">{data.customer}</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">{`${documentType}: ${data.document}`}</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8} className="border-top mt-5 mb-1"></Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">Vendedor</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">{data.user ? data.user.name : data.created_by}</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">{`${userDocumentType}: ${data.user.document}`}</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8} className="border-top mt-5 mb-1"></Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">{data.store.name}</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">{`CNPJ: ${data.store.document}`}</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="justify-content-center">
                                                                    <Col sm={8}>
                                                                        <h6 className="text-dark">Diretor executivo</h6>
                                                                    </Col>
                                                                </Row>


                                                            </Col>
                                                        </Row>

                                                        <div className={`d-print-none ${styles.buttonPrintContainer}`}>
                                                            <Button
                                                                className={styles.buttonPrint}
                                                                variant="success"
                                                                onClick={() => window.print()}
                                                                title="Imprimir orçamento."
                                                            >
                                                                <FaPrint />
                                                            </Button>
                                                        </div>
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

export default EstimatePrint;

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