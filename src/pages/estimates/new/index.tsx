import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaCashRegister, FaClipboardList, FaMoneyBillWave, FaUserTie, FaPlug, FaSolarPanel } from 'react-icons/fa';
import cep, { CEP } from 'cep-promise';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { StoresContext } from '../../../contexts/StoresContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import ConsumptionModal from '../../../components/Estimates/Consumption';
import { Panel } from '../../../components/Panels';
import { RoofOrientation } from '../../../components/RoofOrientations';
import { RoofType } from '../../../components/RoofTypes';
import { EstimateStatus } from '../../../components/EstimateStatus';
import EstimateItems, { EstimateItem } from '../../../components/EstimateItems';

import Members from '../../../components/EstimateMembers';
import { cpf, cnpj, cellphone } from '../../../components/InputMask/masks';
import { statesCities } from '../../../components/StatesCities';
import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';
import { prettifyCurrency } from '../../../components/InputMask/masks';
import {
    calculate,
    calcFinalTotal,
    ConsumptionCalcProps,
    CalcResultProps,
    handleFormValues,
    CalcProps,
    calcDiscountPercent
} from '../../../utils/calcEstimate';

const validationSchema = Yup.object().shape({
    customer: Yup.string().required('Obrigatório!'),
    customer_from: Yup.mixed().oneOf([
        'site', 'social', 'customer', 'internet', 'street'
    ]).required('Obrigatório!'),
    document: Yup.string().min(14, 'CPF inválido!').max(18, 'CNPJ inválido!').required('Obrigatório!'),
    phone: Yup.string().notRequired(),
    cellphone: Yup.string().notRequired().nullable(),
    contacts: Yup.string().notRequired().nullable(),
    email: Yup.string().email('E-mail inválido!').notRequired().nullable(),
    zip_code: Yup.string().notRequired().min(8, 'Deve conter no mínimo 8 caracteres!').max(8, 'Deve conter no máximo 8 caracteres!'),
    street: Yup.string().notRequired(),
    number: Yup.string().notRequired(),
    neighborhood: Yup.string().notRequired(),
    complement: Yup.string().notRequired().nullable(),
    city: Yup.string().required('Obrigatório!'),
    state: Yup.string().required('Obrigatório!'),
    energy_company: Yup.string().notRequired(),
    unity: Yup.string().notRequired(),
    discount: Yup.string().required('Obrigatório!'),
    increase: Yup.string().required('Obrigatório!'),
    percent: Yup.boolean().notRequired(),
    show_values: Yup.boolean().notRequired(),
    show_discount: Yup.boolean().notRequired(),
    store: Yup.string().required('Obrigatório!'),
    notes: Yup.string().notRequired().nullable(),
    user: Yup.string().notRequired().nullable(),
    roof_type: Yup.string().required('Obrigatório!'),
    status: Yup.string().required('Obrigatório!'),
});

const NewEstimate: NextPage = () => {
    const router = useRouter();

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);
    const { stores } = useContext(StoresContext);

    const [panels, setPanels] = useState<Panel[]>([]);
    const [roofOrientations, setRoofOrientations] = useState<RoofOrientation[]>([]);
    const [roofTypes, setRoofTypes] = useState<RoofType[]>([]);
    const [estimateStatusList, setEstimateStatusList] = useState<EstimateStatus[]>([]);
    const [estimateItemsList, setEstimateItemsList] = useState<EstimateItem[]>([]);

    const [spinnerCep, setSpinnerCep] = useState(false);
    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");
    const [documentType, setDocumentType] = useState("CPF");
    const [cities, setCities] = useState<string[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [errorNotFoundCapacity, setErrorNotFoundCapacity] = useState(false);
    const [errorDiscountLimit, setErrorDiscountLimit] = useState(false);

    // Values calc result.
    const [consumptionValuesToCalc, setConsumptionValuesToCalc] = useState<ConsumptionCalcProps>();
    const [calcResults, setCalcResults] = useState<CalcResultProps>();

    const [discountPercent, setDiscountPercent] = useState(true);
    const [discount, setDiscount] = useState(0);
    const [increasePercent, setIncreasePercent] = useState(true);
    const [increase, setIncrease] = useState(0);
    const [finalTotal, setFinalTotal] = useState(0);

    const [showConsumptionModal, setShowConsumptionModal] = useState(false);

    const handleCloseConsumptionModal = () => setShowConsumptionModal(false);
    const handelShowConsumptionModal = () => setShowConsumptionModal(true);

    useEffect(() => {
        handleItemSideBar('estimates');
        handleSelectedMenu('estimates-new');

        if (user) {
            if (can(user, "estimates", "create")) {
                api.get('panels').then(res => {
                    setPanels(res.data);
                }).catch(err => {
                    console.log('Error to get panels, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });

                api.get('roofs/orientations').then(res => {
                    setRoofOrientations(res.data);
                }).catch(err => {
                    console.log('Error to get roofs orientations, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });

                api.get('roofs/types').then(res => {
                    setRoofTypes(res.data);
                }).catch(err => {
                    console.log('Error to get roofs types, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });

                api.get('estimates/status').then(res => {
                    setEstimateStatusList(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get estimates status, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });

                setEstimateItemsList(
                    [
                        {
                            id: '0',
                            name: 'Inversor',
                            amount: 1,
                            price: 0,
                            percent: 20,
                            order: 0,
                        },
                        {
                            id: '1',
                            name: 'Painel',
                            amount: 1,
                            price: 0,
                            percent: 65,
                            order: 1,
                        },
                        {
                            id: '2',
                            name: 'ESTRUTURA METÁLICA PARA PAINEL SOLAR',
                            amount: 1,
                            price: 0,
                            percent: 10,
                            order: 2,
                        },
                        {
                            id: '3',
                            name: 'ENGENHARIA E INSTALAÇÃO',
                            amount: 1,
                            price: 0,
                            percent: 5,
                            order: 3,
                        }
                    ]
                );
            }
        }

    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleCalcEstimate(values: ConsumptionCalcProps, newCalcProps: CalcProps, updateInversor: boolean) {
        const newCalcResults = calculate(values, newCalcProps.estimateItems, updateInversor);

        if (!newCalcResults) {
            setErrorNotFoundCapacity(true);

            return;
        }

        setErrorNotFoundCapacity(false);

        setCalcResults(newCalcResults);

        setEstimateItemsList(newCalcResults.estimateItems);

        handleFinalTotal(
            newCalcResults.systemInitialPrice,
            newCalcProps.discount_percent,
            newCalcProps.discount,
            newCalcProps.increase_percent,
            newCalcProps.increase
        );
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

    function handleListEstimateItems(estimateItemsList: EstimateItem[]) {
        setEstimateItemsList(estimateItemsList);

        const newCalcProps = {
            discount_percent: discountPercent,
            discount: discount,
            increase_percent: increasePercent,
            increase: increase,
            estimateItems: estimateItemsList,
        }

        if (consumptionValuesToCalc) handleCalcEstimate(consumptionValuesToCalc, newCalcProps, false);
    }

    function handleConsumptionValuesToCalc(newValues: ConsumptionCalcProps) {
        setConsumptionValuesToCalc(newValues);

        const newCalcProps = {
            discount_percent: discountPercent,
            discount: discount,
            increase_percent: increasePercent,
            increase: increase,
            estimateItems: estimateItemsList,
        }

        handleCalcEstimate(newValues, newCalcProps, true);
    }

    return (
        <>
            <NextSeo
                title="Criar orçamento"
                description="Criar orçamento da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Criar orçamento',
                    description: 'Criar orçamento da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Criar orçamento | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "estimates", "create") ? <>
                                {
                                    loadingData || hasErrors ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <Container className="content-page">
                                            <Row className="mb-3">
                                                <Col>
                                                    <PageBack href="/estimates" subTitle="Voltar para a lista de orçamentos" />
                                                </Col>
                                            </Row>

                                            <Row className="mb-3">
                                                <Col>
                                                    <Row>
                                                        <Col>
                                                            <h6 className="text-success">Vendedor</h6>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Members user={user} />
                                                    </Row>
                                                </Col>
                                            </Row>

                                            <Formik
                                                initialValues={{
                                                    customer: '',
                                                    customer_from: '',
                                                    document: '',
                                                    phone: '',
                                                    cellphone: '',
                                                    contacts: '',
                                                    email: '',
                                                    zip_code: '',
                                                    street: '',
                                                    number: '',
                                                    neighborhood: '',
                                                    complement: '',
                                                    city: '',
                                                    state: '',
                                                    energy_company: '',
                                                    unity: '',
                                                    roof_type: '',
                                                    discount_percent: true,
                                                    discount: '0,00',
                                                    increase_percent: true,
                                                    increase: '0,00',
                                                    show_values: false,
                                                    show_discount: false,
                                                    notes: '',
                                                    store: user.store_only ? (user.store ? user.store.id : '') : '',
                                                    user: user.id,
                                                    status: '',
                                                }}
                                                onSubmit={async values => {
                                                    try {
                                                        const valuesCalcItem = handleFormValues(values, estimateItemsList);

                                                        if (!valuesCalcItem || !calcResults || errorNotFoundCapacity) return;

                                                        const discountPercent = values.discount_percent ?
                                                            valuesCalcItem.discount :
                                                            calcDiscountPercent(calcResults.systemInitialPrice, finalTotal);

                                                        if (discountPercent > Number(user.discountLimit)) {
                                                            setErrorDiscountLimit(true);

                                                            return;
                                                        }

                                                        if (consumptionValuesToCalc) {
                                                            setTypeMessage("waiting");
                                                            setMessageShow(true);

                                                            const items = estimateItemsList.map(item => {
                                                                return {
                                                                    name: item.name,
                                                                    amount: item.amount,
                                                                    price: item.price,
                                                                    percent: item.percent,
                                                                    order: item.order,
                                                                }
                                                            });

                                                            const res = await api.post('estimates', {
                                                                customer: values.customer,
                                                                customer_from: values.customer_from,
                                                                document: values.document,
                                                                phone: values.phone,
                                                                cellphone: values.cellphone,
                                                                contacts: values.contacts,
                                                                email: values.email,
                                                                zip_code: values.zip_code,
                                                                street: values.street,
                                                                number: values.number,
                                                                neighborhood: values.neighborhood,
                                                                complement: values.complement,
                                                                city: values.city,
                                                                state: values.state,
                                                                energy_company: values.energy_company,
                                                                unity: values.unity,
                                                                kwh: consumptionValuesToCalc.kwh,
                                                                irradiation: consumptionValuesToCalc.irradiation,
                                                                month_01: consumptionValuesToCalc.month_01,
                                                                month_02: consumptionValuesToCalc.month_02,
                                                                month_03: consumptionValuesToCalc.month_03,
                                                                month_04: consumptionValuesToCalc.month_04,
                                                                month_05: consumptionValuesToCalc.month_05,
                                                                month_06: consumptionValuesToCalc.month_06,
                                                                month_07: consumptionValuesToCalc.month_07,
                                                                month_08: consumptionValuesToCalc.month_08,
                                                                month_09: consumptionValuesToCalc.month_09,
                                                                month_10: consumptionValuesToCalc.month_10,
                                                                month_11: consumptionValuesToCalc.month_11,
                                                                month_12: consumptionValuesToCalc.month_12,
                                                                month_13: consumptionValuesToCalc.month_13,
                                                                average_increase: consumptionValuesToCalc.averageIncrease,
                                                                discount_percent: values.discount_percent,
                                                                discount: valuesCalcItem.discount,
                                                                increase_percent: values.increase_percent,
                                                                increase: valuesCalcItem.increase,
                                                                show_values: values.show_values,
                                                                show_discount: values.show_discount,
                                                                notes: values.notes,
                                                                store: values.store,
                                                                user: values.user,
                                                                panel: consumptionValuesToCalc.panel.id,
                                                                roof_orientation: consumptionValuesToCalc.roofOrientation.id,
                                                                roof_type: values.roof_type,
                                                                status: values.status,
                                                                items,
                                                            });

                                                            setTypeMessage("success");

                                                            setTimeout(() => {
                                                                router.push(`/estimates/details/${res.data.id}`)
                                                            }, 1000);
                                                        }
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
                                                {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
                                                    <Form onSubmit={handleSubmit}>
                                                        <Row className="mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Cliente <FaUserTie /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} sm={6} controlId="formGridName">
                                                                <Form.Label>Nome do cliente*</Form.Label>
                                                                <Form.Control
                                                                    type="name"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.customer}
                                                                    name="customer"
                                                                    isInvalid={!!errors.customer && touched.customer}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.customer && errors.customer}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridDocument">
                                                                <Form.Label>{documentType}</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    maxLength={18}
                                                                    onChange={(e) => {
                                                                        setFieldValue('document', e.target.value.length <= 14 ? cpf(e.target.value) : cnpj(e.target.value), false);
                                                                        if (e.target.value.length > 14)
                                                                            setDocumentType("CNPJ");
                                                                        else
                                                                            setDocumentType("CPF");
                                                                    }}
                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                        setFieldValue('document', e.target.value.length <= 14 ? cpf(e.target.value) : cnpj(e.target.value));
                                                                        if (e.target.value.length > 14)
                                                                            setDocumentType("CNPJ");
                                                                        else
                                                                            setDocumentType("CPF");
                                                                    }}
                                                                    value={values.document}
                                                                    name="document"
                                                                    isInvalid={!!errors.document && touched.document}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.document && errors.document}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridCustomerFrom">
                                                                <Form.Label>Como nos conheceu?</Form.Label>
                                                                <Form.Control
                                                                    as="select"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.customer_from}
                                                                    name="customer_from"
                                                                    isInvalid={!!errors.customer_from && touched.customer_from}
                                                                >
                                                                    <option hidden>Escolha uma opção</option>
                                                                    <option value="site">Nosso site</option>
                                                                    <option value="social">Redes sociais</option>
                                                                    <option value="customer">Outros clientes</option>
                                                                    <option value="internet">Buscas na internet</option>
                                                                    <option value="street">TV / Propaganda nas ruas</option>
                                                                </Form.Control>
                                                                <Form.Control.Feedback type="invalid">{touched.customer_from && errors.customer_from}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} sm={3} controlId="formGridPhone">
                                                                <Form.Label>Celular</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    maxLength={15}
                                                                    onChange={(e) => {
                                                                        setFieldValue('phone', cellphone(e.target.value));
                                                                    }}
                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                        setFieldValue('phone', cellphone(e.target.value));
                                                                    }}
                                                                    value={values.phone}
                                                                    name="phone"
                                                                    isInvalid={!!errors.phone && touched.phone}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.phone && errors.phone}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridCellphone">
                                                                <Form.Label>Celular secundáiro</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    maxLength={15}
                                                                    onChange={(e) => {
                                                                        setFieldValue('cellphone', cellphone(e.target.value));
                                                                    }}
                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                        setFieldValue('cellphone', cellphone(e.target.value));
                                                                    }}
                                                                    value={values.cellphone}
                                                                    name="cellphone"
                                                                    isInvalid={!!errors.cellphone && touched.cellphone}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.cellphone && errors.cellphone}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={6} controlId="formGridEmail">
                                                                <Form.Label>E-mail</Form.Label>
                                                                <Form.Control
                                                                    type="email"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.email}
                                                                    name="email"
                                                                    isInvalid={!!errors.email && touched.email}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.email && errors.email}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} controlId="formGridContacts">
                                                                <Form.Label>Outros contatos</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.contacts}
                                                                    name="contacts"
                                                                    isInvalid={!!errors.contacts && touched.contacts}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.contacts && errors.contacts}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} lg={2} md={3} sm={5} controlId="formGridZipCode">
                                                                <Form.Label>CEP</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    placeholder="00000000"
                                                                    autoComplete="off"
                                                                    onChange={(e) => {
                                                                        handleChange(e);

                                                                        if (e.target.value !== '' && e.target.value.length === 8) {
                                                                            setSpinnerCep(true);
                                                                            cep(e.target.value)
                                                                                .then((cep: CEP) => {
                                                                                    const { street, neighborhood, city, state } = cep;

                                                                                    const stateCities = statesCities.estados.find(item => { return item.sigla === state })

                                                                                    if (stateCities)
                                                                                        setCities(stateCities.cidades);

                                                                                    setFieldValue('street', street);
                                                                                    setFieldValue('neighborhood', neighborhood);
                                                                                    setFieldValue('city', city);
                                                                                    setFieldValue('state', state);

                                                                                    setSpinnerCep(false);
                                                                                })
                                                                                .catch(() => {
                                                                                    setSpinnerCep(false);
                                                                                });
                                                                        }
                                                                    }}
                                                                    value={values.zip_code}
                                                                    name="zip_code"
                                                                    isInvalid={!!errors.zip_code && touched.zip_code}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.zip_code && errors.zip_code}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Col style={{ display: 'flex', alignItems: 'center' }}>
                                                                {
                                                                    spinnerCep && <Spinner
                                                                        as="span"
                                                                        animation="border"
                                                                        variant="info"
                                                                        role="status"
                                                                        aria-hidden="true"
                                                                    />
                                                                }
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={10} controlId="formGridStreet">
                                                                <Form.Label>Rua</Form.Label>
                                                                <Form.Control
                                                                    type="address"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.street}
                                                                    name="street"
                                                                    isInvalid={!!errors.street && touched.street}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.street && errors.street}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={2} controlId="formGridNumber">
                                                                <Form.Label>Número</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.number}
                                                                    name="number"
                                                                    isInvalid={!!errors.number && touched.number}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.number && errors.number}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} controlId="formGridComplement">
                                                                <Form.Label>Complemento</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.complement}
                                                                    name="complement"
                                                                    isInvalid={!!errors.complement && touched.complement}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.complement && errors.complement}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={6} controlId="formGridNeighborhood">
                                                                <Form.Label>Bairro</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.neighborhood}
                                                                    name="neighborhood"
                                                                    isInvalid={!!errors.neighborhood && touched.neighborhood}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.neighborhood && errors.neighborhood}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={2} controlId="formGridState">
                                                                <Form.Label>Estado</Form.Label>
                                                                <Form.Control
                                                                    as="select"
                                                                    onChange={(e) => {
                                                                        setFieldValue('state', e.target.value);

                                                                        const stateCities = statesCities.estados.find(item => { return item.sigla === e.target.value })

                                                                        if (stateCities)
                                                                            setCities(stateCities.cidades);
                                                                    }}
                                                                    onBlur={handleBlur}
                                                                    value={values.state ? values.state : '...'}
                                                                    name="state"
                                                                    isInvalid={!!errors.state && touched.state}
                                                                >
                                                                    <option hidden>...</option>
                                                                    {
                                                                        statesCities.estados.map((estado, index) => {
                                                                            return <option key={index} value={estado.sigla}>{estado.nome}</option>
                                                                        })
                                                                    }
                                                                </Form.Control>
                                                                <Form.Control.Feedback type="invalid">{touched.state && errors.state}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridCity">
                                                                <Form.Label>Cidade</Form.Label>
                                                                <Form.Control
                                                                    as="select"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.city ? values.city : '...'}
                                                                    name="city"
                                                                    isInvalid={!!errors.city && touched.city}
                                                                    disabled={!!!values.state}
                                                                >
                                                                    <option hidden>...</option>
                                                                    {
                                                                        !!values.state && cities.map((city, index) => {
                                                                            return <option key={index} value={city}>{city}</option>
                                                                        })
                                                                    }
                                                                </Form.Control>
                                                                <Form.Control.Feedback type="invalid">{touched.city && errors.city}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Col className="border-top mt-3 mb-3"></Col>

                                                        <Row className="mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Consumo <FaPlug /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={4} controlId="formGridEngeryCompany">
                                                                <Form.Label>Concessionária de energia</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.energy_company}
                                                                    name="energy_company"
                                                                    isInvalid={!!errors.energy_company && touched.energy_company}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.energy_company && errors.energy_company}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridUnity">
                                                                <Form.Label>Unidade consumidora (UC)</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.unity}
                                                                    name="unity"
                                                                    isInvalid={!!errors.unity && touched.unity}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.unity && errors.unity}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridRoofType">
                                                                <Form.Label>Tipo de telhado</Form.Label>
                                                                <Form.Control
                                                                    as="select"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.roof_type}
                                                                    name="roof_type"
                                                                    isInvalid={!!errors.roof_type && touched.roof_type}
                                                                >
                                                                    <option hidden>Escolha uma opção</option>
                                                                    {
                                                                        roofTypes.map((roofType, index) => {
                                                                            return <option key={index} value={roofType.id}>{roofType.name}</option>
                                                                        })
                                                                    }
                                                                </Form.Control>
                                                                <Form.Control.Feedback type="invalid">{touched.roof_type && errors.roof_type}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="align-items-end mb-2">
                                                            <Form.Group as={Col} sm={3} controlId="formGridConsumptionData">
                                                                <Button
                                                                    variant="success"
                                                                    title="Dados de consumo."
                                                                    onClick={handelShowConsumptionModal}
                                                                    className="mb-2"
                                                                >
                                                                    Dados de consumo
                                                                </Button>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridMonthsAverageKwh">
                                                                <Form.Label>Média</Form.Label>
                                                                <InputGroup className="mb-2">

                                                                    <InputGroup.Text id="btnGroupMonthsAverageKwh">kWh</InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        value={calcResults ? prettifyCurrency(Number(calcResults.monthsAverageKwh).toFixed(2)) : '0,00'}
                                                                        name="months_average"
                                                                        aria-label="Média"
                                                                        aria-describedby="btnGroupMonthsAverageKwh"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridAverageIncrease">
                                                                <Form.Label>Previsão de aumento</Form.Label>
                                                                <InputGroup className="mb-2">

                                                                    <InputGroup.Text id="btnGroupAverageIncrease">kWh</InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        value={consumptionValuesToCalc ? prettifyCurrency(Number(consumptionValuesToCalc.averageIncrease).toFixed(2)) : '0,00'}
                                                                        name="average_increase"
                                                                        aria-label="Previsão de aumento"
                                                                        aria-describedby="btnGroupAverageIncrease"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridFinalAverageKwh">
                                                                <Form.Label>Consumo final</Form.Label>
                                                                <InputGroup className="mb-2">

                                                                    <InputGroup.Text id="btnGroupFinalAverageKwh">kWh</InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        value={calcResults ? prettifyCurrency(Number(calcResults.finalAverageKwh).toFixed(2)) : '0,00'}
                                                                        name="final_average"
                                                                        aria-label="Média final"
                                                                        aria-describedby="btnGroupFinalAverageKwh"
                                                                        isInvalid={errorNotFoundCapacity}
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row>
                                                            <Col>
                                                                <span
                                                                    className="invalid-feedback text-center"
                                                                    style={{ display: 'block' }}
                                                                >
                                                                    {errorNotFoundCapacity && 'O painel selecionado não fornece a capacidade para esse consumo!'}
                                                                </span>
                                                            </Col>
                                                        </Row>

                                                        <Col className="border-top mt-3 mb-3"></Col>

                                                        <Row className="mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Projeto <FaSolarPanel /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={4} controlId="formGridMonthlyPaid">
                                                                <Form.Label>Valor médio mensal da conta de energia</Form.Label>
                                                                <InputGroup className="mb-2">

                                                                    <InputGroup.Text id="btnGroupMonthlyPaid">R$</InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        value={prettifyCurrency(calcResults ? calcResults.monthlyPaid.toFixed(2) : '0.00')}
                                                                        name="monthly_paid"
                                                                        aria-label="Valor médio mensal da conta de energia"
                                                                        aria-describedby="btnGroupMonthlyPaid"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridYearlyPaid">
                                                                <Form.Label>Valor pago anualmente</Form.Label>
                                                                <InputGroup className="mb-2">

                                                                    <InputGroup.Text id="btnGroupYearlyPaid">R$</InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        value={prettifyCurrency(calcResults ? calcResults.yearlyPaid.toFixed(2) : '0.00')}
                                                                        name="yearly_paid"
                                                                        aria-label="Valor pago anualmente"
                                                                        aria-describedby="btnGroupYearlyPaid"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridPanelsAmount">
                                                                <Form.Label>Número total de Painéis Fotovoltaicos</Form.Label>
                                                                <InputGroup className="mb-2">

                                                                    <InputGroup.Text id="btnGroupPanelsAmount">Un</InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        value={prettifyCurrency(calcResults ? calcResults.panelsAmount.toFixed(2) : '0.00')}
                                                                        name="panels_amount"
                                                                        aria-label="Número total de Painéis Fotovoltaicos"
                                                                        aria-describedby="btnGroupPanelsAmount"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={4} controlId="formGridSystemCapacityKwp">
                                                                <Form.Label>Capacidade Total do Sistema Fotovoltaico</Form.Label>
                                                                <InputGroup className="mb-2">

                                                                    <InputGroup.Text id="btnGroupSystemCapacityKwp">kWp</InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        value={prettifyCurrency(calcResults ? calcResults.systemCapacityKwp.toFixed(2) : '0.00')}
                                                                        name="system_capacity"
                                                                        aria-label="Capacidade Total do Sistema"
                                                                        aria-describedby="btnGroupSystemCapacityKwp"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridMonthlyGeneratedEnergy">
                                                                <Form.Label>Total de energia gerada mensalmente</Form.Label>
                                                                <InputGroup className="mb-2">

                                                                    <InputGroup.Text id="btnGroupMonthlyGeneratedEnergy">Kwh</InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        value={prettifyCurrency(calcResults ? calcResults.monthlyGeneratedEnergy.toFixed(2) : '0.00')}
                                                                        name="monthly_generated"
                                                                        aria-label="Total de energia gerada mensalmente"
                                                                        aria-describedby="btnGroupMonthlyGeneratedEnergy"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridYearlyGeneratedEnergy">
                                                                <Form.Label>Total de energia gerada anualmente</Form.Label>
                                                                <InputGroup className="mb-2">

                                                                    <InputGroup.Text id="btnGroupYearlyGeneratedEnergy">Kwh</InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        value={prettifyCurrency(calcResults ? calcResults.yearlyGeneratedEnergy.toFixed(2) : '0.00')}
                                                                        name="yearly_generated"
                                                                        aria-label="Total de energia gerada anualmente"
                                                                        aria-describedby="btnGroupYearlyGeneratedEnergy"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={4} controlId="formGridCo2Reduction">
                                                                <Form.Label>Redução de emissão de gás CO² ao ano</Form.Label>
                                                                <InputGroup className="mb-2">

                                                                    <InputGroup.Text id="btnGroupCo2Reduction">Kg</InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        value={prettifyCurrency(calcResults ? calcResults.co2Reduction.toFixed(2) : '0.00')}
                                                                        name="co2_reduction"
                                                                        aria-label="Redução de emissão de gás CO² ao ano"
                                                                        aria-describedby="btnGroupCo2Reduction"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridSystemArea">
                                                                <Form.Label>Área ocupada pelo sistema</Form.Label>
                                                                <InputGroup className="mb-2">

                                                                    <InputGroup.Text id="btnGroupSystemArea">m²</InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        value={prettifyCurrency(calcResults ? calcResults.systemArea.toFixed(2) : '0.00')}
                                                                        name="system_area"
                                                                        aria-label="Área ocupada pelo sistema"
                                                                        aria-describedby="btnGroupSystemArea"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridFinalSystemCapacity">
                                                                <Form.Label>Capacidade arredondada do Sistema</Form.Label>
                                                                <InputGroup className="mb-2">

                                                                    <InputGroup.Text id="btnGroupFinalSystemCapacity">kWp</InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        value={prettifyCurrency(calcResults ? calcResults.finalSystemCapacityKwp.toFixed(2) : '0.00')}
                                                                        name="final_sistem_capacity"
                                                                        aria-label="Valor pago anualmente"
                                                                        aria-describedby="btnGroupFinalSystemCapacity"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>
                                                        </Row>

                                                        <Col className="border-top mt-3 mb-3"></Col>

                                                        <Row>
                                                            <Col>
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Itens <FaClipboardList /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Col>
                                                                <Form.Check
                                                                    type="switch"
                                                                    id="show_values"
                                                                    label="Exibir valores dos itens no orçamento?"
                                                                    checked={values.show_values}
                                                                    onChange={() => { setFieldValue('show_values', !values.show_values) }}
                                                                />
                                                            </Col>
                                                        </Row>

                                                        <Row>
                                                            <Col sm={2}><h6 className="text-secondary">Quantidade</h6></Col>
                                                            <Col sm={5}><h6 className="text-secondary">Produto</h6></Col>
                                                            <Col sm={2}><h6 className="text-secondary">Unitário</h6></Col>
                                                            <Col sm={2}><h6 className="text-secondary">Total</h6></Col>
                                                        </Row>

                                                        {
                                                            estimateItemsList && estimateItemsList.map(estimateItem => {
                                                                return <EstimateItems
                                                                    key={estimateItem.id}
                                                                    estimateItem={estimateItem}
                                                                    estimateItemsList={estimateItemsList}
                                                                    handleListEstimateItems={handleListEstimateItems}
                                                                />
                                                            })
                                                        }

                                                        <Col className="border-top mt-3 mb-3"></Col>

                                                        <Row className="mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Valores <FaCashRegister /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="align-items-center">
                                                            <Form.Group as={Col} sm={3} controlId="formGridPreSystemPrice">
                                                                <Form.Label>Subtotal</Form.Label>
                                                                <InputGroup className="mb-2">

                                                                    <InputGroup.Text id="btnGroupPreSystemPrice">R$</InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        value={prettifyCurrency(calcResults ? calcResults.systemInitialPrice.toFixed(2) : '0.00')}
                                                                        name="pre_system_value"
                                                                        aria-label="Valor do sistema "
                                                                        aria-describedby="btnGroupPreSystemPrice"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridDiscount">
                                                                <Form.Label>Desconto</Form.Label>
                                                                <InputGroup className="mb-2">
                                                                    <InputGroup.Text id="btnGroupDiscount">
                                                                        <Form.Control
                                                                            as="select"
                                                                            style={{ padding: '0 0.3rem', textAlign: 'center' }}
                                                                            onChange={() => {
                                                                                setDiscountPercent(!values.discount_percent)

                                                                                if (calcResults) {
                                                                                    const newFinalTotal = calcFinalTotal(
                                                                                        calcResults.systemInitialPrice,
                                                                                        !values.discount_percent,
                                                                                        discount,
                                                                                        increasePercent,
                                                                                        increase
                                                                                    );

                                                                                    setFinalTotal(newFinalTotal);
                                                                                }

                                                                                setFieldValue('discount_percent', !values.discount_percent);
                                                                            }}
                                                                            value={values.discount_percent ? 'percent' : 'money'}
                                                                            name="discount_percent"
                                                                            isInvalid={!!errors.discount_percent && touched.discount_percent}
                                                                        >
                                                                            <option value="percent">%</option>
                                                                            <option value="money">R$</option>
                                                                        </Form.Control>
                                                                    </InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        onChange={(e) => {
                                                                            setFieldValue('discount', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                            const newDiscount = Number(
                                                                                prettifyCurrency(e.target.value).replaceAll(".", "").replaceAll(",", ".")
                                                                            );

                                                                            setFieldValue('discount', prettifyCurrency(e.target.value));

                                                                            setDiscount(newDiscount);

                                                                            if (calcResults) {
                                                                                const newFinalTotal = calcFinalTotal(
                                                                                    calcResults.systemInitialPrice,
                                                                                    discountPercent,
                                                                                    newDiscount,
                                                                                    increasePercent,
                                                                                    increase
                                                                                );

                                                                                setFinalTotal(newFinalTotal);
                                                                            }
                                                                        }}
                                                                        value={values.discount}
                                                                        name="discount"
                                                                        isInvalid={!!errors.discount && touched.discount}
                                                                        aria-label="Valor"
                                                                        aria-describedby="btnGroupDiscount"
                                                                    />
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">{touched.discount && errors.discount}</Form.Control.Feedback>
                                                                <span
                                                                    className="invalid-feedback text-center"
                                                                    style={{ display: 'block' }}
                                                                >
                                                                    {
                                                                        errorDiscountLimit && 'O desconto é maior que o limite permitido!'
                                                                    }
                                                                </span>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridDiscount">
                                                                <Form.Label>Acréscimo</Form.Label>
                                                                <InputGroup className="mb-2">
                                                                    <InputGroup.Text id="btnGroupIncrease">
                                                                        <Form.Control
                                                                            as="select"
                                                                            style={{ padding: '0 0.3rem', textAlign: 'center' }}
                                                                            onChange={() => {
                                                                                setIncreasePercent(!values.increase_percent);

                                                                                if (calcResults) {
                                                                                    const newFinalTotal = calcFinalTotal(
                                                                                        calcResults.systemInitialPrice,
                                                                                        discountPercent,
                                                                                        discount,
                                                                                        !values.increase_percent,
                                                                                        increase
                                                                                    );

                                                                                    setFinalTotal(newFinalTotal);
                                                                                }

                                                                                setFieldValue('increase_percent', !values.increase_percent);
                                                                            }}
                                                                            value={values.increase_percent ? 'percent' : 'money'}
                                                                            name="increase_percent"
                                                                            isInvalid={!!errors.increase_percent && touched.increase_percent}
                                                                        >
                                                                            <option value="percent">%</option>
                                                                            <option value="money">R$</option>
                                                                        </Form.Control>
                                                                    </InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        onChange={(e) => {
                                                                            setFieldValue('increase', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                            const newIncrease = Number(
                                                                                prettifyCurrency(e.target.value).replaceAll(".", "").replaceAll(",", ".")
                                                                            );

                                                                            setFieldValue('increase', prettifyCurrency(e.target.value));

                                                                            setIncrease(newIncrease);

                                                                            if (calcResults) {
                                                                                const newFinalTotal = calcFinalTotal(
                                                                                    calcResults.systemInitialPrice,
                                                                                    discountPercent,
                                                                                    discount,
                                                                                    increasePercent,
                                                                                    newIncrease
                                                                                );

                                                                                setFinalTotal(newFinalTotal);
                                                                            }
                                                                        }}
                                                                        value={values.increase}
                                                                        name="increase"
                                                                        isInvalid={!!errors.increase && touched.increase}
                                                                        aria-label="Valor"
                                                                        aria-describedby="btnGroupDiscount"
                                                                    />
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">{touched.increase && errors.increase}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Col>
                                                                <Form.Check
                                                                    type="switch"
                                                                    id="show_discount"
                                                                    label="Exibir descontos no orçamento?"
                                                                    checked={values.show_discount}
                                                                    onChange={() => { setFieldValue('show_discount', !values.show_discount) }}
                                                                />
                                                            </Col>
                                                        </Row>

                                                        <Row className="align-items-end">
                                                            <Form.Group as={Col} sm={3} controlId="formGridFinalSystemPrice">
                                                                <h6 className="text-success">Valor final do sitema <FaMoneyBillWave /></h6>
                                                                <InputGroup>
                                                                    <InputGroup.Text id="btnGroupFinalSystemPrice">R$</InputGroup.Text>
                                                                    <Form.Control
                                                                        type="text"
                                                                        value={prettifyCurrency(String(finalTotal.toFixed(2)))}
                                                                        name="pre_system_value"
                                                                        aria-label="Valor do sistema "
                                                                        aria-describedby="btnGroupFinalSystemPrice"
                                                                        readOnly
                                                                    />
                                                                </InputGroup>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridStatus">
                                                                <Form.Label>Fase</Form.Label>
                                                                <Form.Control
                                                                    as="select"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.status}
                                                                    name="status"
                                                                    isInvalid={!!errors.status && touched.status}
                                                                >
                                                                    <option hidden>...</option>
                                                                    {
                                                                        estimateStatusList.map((status, index) => {
                                                                            return <option key={index} value={status.id}>{status.name}</option>
                                                                        })
                                                                    }
                                                                </Form.Control>
                                                                <Form.Control.Feedback type="invalid">{touched.status && errors.status}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            {
                                                                !user.store_only && <Form.Group as={Col} sm={5} controlId="formGridStore">
                                                                    <Form.Label>Loja</Form.Label>
                                                                    <Form.Control
                                                                        as="select"
                                                                        onChange={handleChange}
                                                                        onBlur={handleBlur}
                                                                        value={values.store}
                                                                        name="store"
                                                                        isInvalid={!!errors.store && touched.store}
                                                                    >
                                                                        <option hidden>Escolha uma opção</option>
                                                                        {
                                                                            stores.map((store, index) => {
                                                                                return <option key={index} value={store.id}>{store.name}</option>
                                                                            })
                                                                        }
                                                                    </Form.Control>
                                                                    <Form.Control.Feedback type="invalid">{touched.store && errors.store}</Form.Control.Feedback>
                                                                </Form.Group>
                                                            }
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} controlId="formGridNotes">
                                                                <Form.Label>Observações</Form.Label>
                                                                <Form.Control
                                                                    as="textarea"
                                                                    rows={4}
                                                                    style={{ resize: 'none' }}
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.notes}
                                                                    name="notes"
                                                                />
                                                            </Form.Group>
                                                        </Row>

                                                        <Col className="border-top mb-3"></Col>

                                                        <Row className="justify-content-end">
                                                            {
                                                                messageShow ? <Col sm={3}><AlertMessage status={typeMessage} /></Col> :
                                                                    <Col sm={1}>
                                                                        <Button variant="success" type="submit">Salvar</Button>
                                                                    </Col>
                                                            }
                                                        </Row>
                                                    </Form>
                                                )
                                                }
                                            </Formik >

                                            <ConsumptionModal
                                                consumptionValuesToCalc={consumptionValuesToCalc}
                                                panels={panels}
                                                roofOrientations={roofOrientations}
                                                show={showConsumptionModal}
                                                handleConsumptionValuesToCalc={handleConsumptionValuesToCalc}
                                                handleCloseConsumptionModal={handleCloseConsumptionModal}
                                            />
                                        </Container >
                                }
                            </> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default NewEstimate;

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