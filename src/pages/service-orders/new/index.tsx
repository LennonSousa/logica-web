import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaTools, FaUserTie, FaTasks } from 'react-icons/fa';
import { format } from 'date-fns';
import cep, { CEP } from 'cep-promise';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { StoresContext } from '../../../contexts/StoresContext';
import { can } from '../../../components/Users';

import { Project } from '../../../components/Projects';
import Members from '../../../components/ServiceOrdersMembers';

import { statesCities } from '../../../components/StatesCities';
import { cpf, cnpj, cellphone } from '../../../components/InputMask/masks';
import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';
import { prettifyCurrency } from '../../../components/InputMask/masks';

const validationSchema = Yup.object().shape({
    customer: Yup.string().required('Obrigatório!'),
    document: Yup.string().min(14, 'CPF inválido!').max(18, 'CNPJ inválido!').required('Obrigatório!'),
    phone: Yup.string().notRequired().nullable(),
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
    coordinates: Yup.string().required('Obrigatório!'),
    wifi_name: Yup.string().required('Obrigatório!'),
    wifi_password: Yup.string().required('Obrigatório!'),
    roof_details: Yup.string().notRequired(),
    electric_type: Yup.string().required('Obrigatório!'),
    inversor_brand: Yup.string().required('Obrigatório!'),
    inversor_potency: Yup.string().required('Obrigatório!'),
    module_brand: Yup.string().required('Obrigatório!'),
    module_amount: Yup.string().required('Obrigatório!'),
    test_leak: Yup.boolean().notRequired(),
    test_meter: Yup.boolean().notRequired(),
    test_monitor: Yup.boolean().notRequired(),
    explanation: Yup.boolean().notRequired(),
    start_at: Yup.date().notRequired(),
    finish_at: Yup.date().notRequired(),
    technical: Yup.string().required('Obrigatório!'),
    project: Yup.string().notRequired(),
    store: Yup.string().required('Obrigatório!'),
});

const NewServiceOrder: NextPage = () => {
    const router = useRouter();
    const { from } = router.query;

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);
    const { stores } = useContext(StoresContext);

    const [projectFrom, setProjectFrom] = useState<Project>();

    const [spinnerCep, setSpinnerCep] = useState(false);
    const [documentType, setDocumentType] = useState("CPF");
    const [cities, setCities] = useState<string[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    useEffect(() => {
        handleItemSideBar('service-orders');
        handleSelectedMenu('service-orders-new');

        if (user) {
            if (can(user, "services", "create")) {
                if (from) {
                    api.get(`projects/${from}`).then(res => {
                        let projectRes: Project = res.data;

                        if (projectRes.document.length > 14)
                            setDocumentType("CNPJ");

                        try {
                            const stateCities = statesCities.estados.find(item => { return item.sigla === res.data.state })

                            if (stateCities)
                                setCities(stateCities.cidades);
                        }
                        catch { }

                        setProjectFrom(projectRes);

                        setLoadingData(false);
                    }).catch(err => {
                        console.log('Error to get from project, ', err);

                        setTypeLoadingMessage("error");
                        setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                        setHasErrors(true);
                    });
                }
                else
                    setLoadingData(false);
            }
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            <NextSeo
                title="Criar ordem de serviço"
                description="Criar ordem de serviço da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Criar ordem de serviço',
                    description: 'Criar ordem de serviço da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Criar ordem de serviço | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "services", "create") ? <>
                                {
                                    loadingData || hasErrors ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <Container className="content-page">
                                            <Row className="mb-3">
                                                <Col>
                                                    <PageBack href="/service-orders" subTitle="Voltar para a lista de ordens de serviço" />
                                                </Col>
                                            </Row>

                                            <Row className="mb-3">
                                                <Col>
                                                    <Row>
                                                        <Col>
                                                            <h6 className="text-success">Conferente</h6>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Members name={user.name} />
                                                    </Row>
                                                </Col>
                                            </Row>

                                            <Formik
                                                initialValues={{
                                                    customer: projectFrom ? projectFrom.customer : '',
                                                    document: projectFrom ? projectFrom.document : '',
                                                    phone: projectFrom ? projectFrom.phone : '',
                                                    cellphone: projectFrom ? projectFrom.cellphone : '',
                                                    contacts: projectFrom ? projectFrom.contacts : '',
                                                    email: projectFrom ? projectFrom.email : '',
                                                    zip_code: projectFrom ? projectFrom.zip_code : '',
                                                    street: projectFrom ? projectFrom.street : '',
                                                    number: projectFrom ? projectFrom.number : '',
                                                    neighborhood: projectFrom ? projectFrom.neighborhood : '',
                                                    complement: projectFrom ? projectFrom.complement : '',
                                                    city: projectFrom ? projectFrom.city : '',
                                                    state: projectFrom ? projectFrom.state : '',
                                                    coordinates: projectFrom ? projectFrom.coordinates : '',
                                                    wifi_name: '',
                                                    wifi_password: '',
                                                    roof_details: '',
                                                    electric_type: '',
                                                    inversor_brand: projectFrom ? projectFrom.inversor : '',
                                                    inversor_potency: '',
                                                    module_brand: projectFrom ? projectFrom.panel : '',
                                                    module_amount: prettifyCurrency(projectFrom ? projectFrom.panel_amount.toFixed(2) : '0.00'),
                                                    test_leak: false,
                                                    test_meter: false,
                                                    test_monitor: false,
                                                    explanation: false,
                                                    start_at: format(new Date(), 'yyyy-MM-dd'),
                                                    finish_at: format(new Date(), 'yyyy-MM-dd'),
                                                    technical: '',
                                                    project: projectFrom ? projectFrom.id : '',
                                                    store: user.store_only ? (user.store ? user.store.id : '') : projectFrom ? projectFrom.store.id : '',
                                                }}
                                                onSubmit={async values => {
                                                    setTypeMessage("waiting");
                                                    setMessageShow(true);

                                                    try {
                                                        const res = await api.post('services/orders', {
                                                            customer: values.customer,
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
                                                            coordinates: values.coordinates,
                                                            wifi_name: values.wifi_name,
                                                            wifi_password: values.wifi_password,
                                                            roof_details: values.roof_details,
                                                            electric_type: values.electric_type,
                                                            inversor_brand: values.inversor_brand,
                                                            inversor_potency: Number(values.inversor_potency.replaceAll(".", "").replaceAll(",", ".")),
                                                            module_brand: values.module_brand,
                                                            module_amount: Number(values.module_amount.replaceAll(".", "").replaceAll(",", ".")),
                                                            test_leak: values.test_leak,
                                                            test_meter: values.test_meter,
                                                            test_monitor: values.test_monitor,
                                                            explanation: values.explanation,
                                                            start_at: `${values.start_at} 12:00:00`,
                                                            finish_at: `${values.finish_at} 12:00:00`,
                                                            technical: values.technical,
                                                            project: values.project,
                                                            store: values.store,
                                                        });

                                                        setTypeMessage("success");

                                                        setTimeout(() => {
                                                            router.push(`/service-orders/details/${res.data.id}`);
                                                        }, 1000);
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
                                                {({ handleChange, handleBlur, handleSubmit, values, setFieldValue, errors, touched }) => (
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
                                                            <Form.Group as={Col} sm={8} controlId="formGridName">
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

                                                            <Form.Group as={Col} sm={4} controlId="formGridDocument">
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

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={4} controlId="formGridCoordinates">
                                                                <Form.Label>Coordenadas</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.coordinates}
                                                                    name="coordinates"
                                                                    isInvalid={!!errors.coordinates && touched.coordinates}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.coordinates && errors.coordinates}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridWifiName">
                                                                <Form.Label>Nome da rede sem fio</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.wifi_name}
                                                                    name="wifi_name"
                                                                    isInvalid={!!errors.wifi_name && touched.wifi_name}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.wifi_name && errors.wifi_name}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridWifiPassword">
                                                                <Form.Label>Senha da rede sem fio</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.wifi_password}
                                                                    name="wifi_password"
                                                                    isInvalid={!!errors.wifi_password && touched.wifi_password}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.wifi_password && errors.wifi_password}</Form.Control.Feedback>
                                                            </Form.Group>
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
                                                            <Form.Group as={Col} controlId="formGridRoofDetails">
                                                                <Form.Label>Situação do telhado</Form.Label>
                                                                <Form.Control
                                                                    as="textarea"
                                                                    rows={4}
                                                                    style={{ resize: 'none' }}
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.roof_details}
                                                                    name="roof_details"
                                                                />
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} sm={5} controlId="formGridElectricType">
                                                                <Form.Label>Tipo de rede</Form.Label>
                                                                <Form.Control
                                                                    as="select"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.electric_type}
                                                                    name="electric_type"
                                                                    isInvalid={!!errors.electric_type && touched.electric_type}
                                                                >
                                                                    <option hidden>...</option>
                                                                    <option value="mono">Monofásico</option>
                                                                    <option value="bi">Bifásico</option>
                                                                    <option value="tri">Trifásico</option>
                                                                </Form.Control>
                                                                <Form.Control.Feedback type="invalid">{touched.electric_type && errors.electric_type}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={5} controlId="formGridInversorBrand">
                                                                <Form.Label>Marca do Inversor</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.inversor_brand}
                                                                    name="inversor_brand"
                                                                    isInvalid={!!errors.inversor_brand && touched.inversor_brand}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.inversor_brand && errors.inversor_brand}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={2} controlId="formGridInversorPotency">
                                                                <Form.Label>Potência do inversor</Form.Label>
                                                                <InputGroup className="mb-2">
                                                                    <InputGroup.Text id="btnGroupInversorPotency">kWp</InputGroup.Text>
                                                                    <Form.Control
                                                                        type="text"
                                                                        onChange={(e) => {
                                                                            setFieldValue('inversor_potency', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                            setFieldValue('inversor_potency', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        value={values.inversor_potency}
                                                                        name="inversor_potency"
                                                                        isInvalid={!!errors.inversor_potency && touched.inversor_potency}
                                                                        aria-label="Potência do inversor"
                                                                        aria-describedby="btnGroupInversorPotency"
                                                                    />
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">{touched.inversor_potency && errors.inversor_potency}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} sm={5} controlId="formGridModuleBrand">
                                                                <Form.Label>Marca do módulo</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.module_brand}
                                                                    name="module_brand"
                                                                    isInvalid={!!errors.module_brand && touched.module_brand}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.module_brand && errors.module_brand}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={2} controlId="formGridModuleAmount">
                                                                <Form.Label>Quantidade de módulos</Form.Label>
                                                                <InputGroup className="mb-2">
                                                                    <InputGroup.Text id="btnGroupModuleAmount">Un</InputGroup.Text>
                                                                    <Form.Control
                                                                        type="text"
                                                                        onChange={(e) => {
                                                                            setFieldValue('module_amount', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                            setFieldValue('module_amount', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        value={values.module_amount}
                                                                        name="module_amount"
                                                                        isInvalid={!!errors.module_amount && touched.module_amount}
                                                                        aria-label="Quantidade de módulos"
                                                                        aria-describedby="btnGroupModuleAmount"
                                                                    />
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">{touched.module_amount && errors.module_amount}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Col className="border-top mb-3"></Col>

                                                        <Row className="mt-5 mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Check-list <FaTasks /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Col>
                                                                <Form.Check
                                                                    type="switch"
                                                                    id="test_leak"
                                                                    label="Teste de goteira realizado"
                                                                    checked={values.test_leak}
                                                                    onChange={handleChange}
                                                                />
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Col>
                                                                <Form.Check
                                                                    type="switch"
                                                                    id="test_meter"
                                                                    label="Medidor está adequado?"
                                                                    checked={values.test_meter}
                                                                    onChange={handleChange}
                                                                />
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Col>
                                                                <Form.Check
                                                                    type="switch"
                                                                    id="test_monitor"
                                                                    label="Monitoramento realizado"
                                                                    checked={values.test_monitor}
                                                                    onChange={handleChange}
                                                                />
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Col>
                                                                <Form.Check
                                                                    type="switch"
                                                                    id="explanation"
                                                                    label="Explicação de funcionamento do sistema"
                                                                    checked={values.explanation}
                                                                    onChange={handleChange}
                                                                />
                                                            </Col>
                                                        </Row>

                                                        <Col className="border-top mt-3 mb-3"></Col>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} sm={6} controlId="formGridEmail">
                                                                <Form.Label>Técnico responsável</Form.Label>
                                                                <Form.Control
                                                                    type="name"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.technical}
                                                                    name="technical"
                                                                    isInvalid={!!errors.technical && touched.technical}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.technical && errors.technical}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridExpireAt">
                                                                <Form.Label>Início do serviço</Form.Label>
                                                                <Form.Control
                                                                    type="date"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.start_at}
                                                                    name="start_at"
                                                                    isInvalid={!!errors.start_at && touched.start_at}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.start_at && errors.start_at}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridFinishAt">
                                                                <Form.Label>Previsão de entrega</Form.Label>
                                                                <Form.Control
                                                                    type="date"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.finish_at}
                                                                    name="finish_at"
                                                                    isInvalid={!!errors.finish_at && touched.finish_at}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.finish_at && errors.finish_at}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            {
                                                                !user.store_only && <Form.Group as={Col} sm={4} controlId="formGridStore">
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

                                                        <Row className="mb-3 justify-content-end">
                                                            {
                                                                messageShow ? <Col sm={3}><AlertMessage status={typeMessage} /></Col> :
                                                                    <Col sm={1}>
                                                                        <Button variant="success" type="submit">Salvar</Button>
                                                                    </Col>

                                                            }
                                                        </Row>
                                                    </Form>
                                                )}
                                            </Formik>
                                        </Container>
                                }
                            </> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default NewServiceOrder;

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