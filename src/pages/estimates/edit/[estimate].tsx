import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, InputGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaCashRegister, FaClipboardList, FaCopy, FaMoneyBillWave, FaUserTie, FaPlug, FaSolarPanel } from 'react-icons/fa';
import cep, { CEP } from 'cep-promise';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import { Estimate } from '../../../components/Estimates';
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
import { calculate, CalcProps } from '../../../utils/calcEstimate';

const validationSchema = Yup.object().shape({
    customer: Yup.string().required('Obrigatório!'),
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
    kwh: Yup.string().required('Obrigatório!'),
    irradiation: Yup.string().required('Obrigatório!'),
    month_01: Yup.string().required('Obrigatório!'),
    month_02: Yup.string().required('Obrigatório!'),
    month_03: Yup.string().required('Obrigatório!'),
    month_04: Yup.string().required('Obrigatório!'),
    month_05: Yup.string().required('Obrigatório!'),
    month_06: Yup.string().required('Obrigatório!'),
    month_07: Yup.string().required('Obrigatório!'),
    month_08: Yup.string().required('Obrigatório!'),
    month_09: Yup.string().required('Obrigatório!'),
    month_10: Yup.string().required('Obrigatório!'),
    month_11: Yup.string().required('Obrigatório!'),
    month_12: Yup.string().required('Obrigatório!'),
    month_13: Yup.string().required('Obrigatório!'),
    average_increase: Yup.string().required('Obrigatório!'),
    discount: Yup.string().required('Obrigatório!'),
    increase: Yup.string().required('Obrigatório!'),
    percent: Yup.boolean().notRequired(),
    show_values: Yup.boolean().notRequired(),
    show_discount: Yup.boolean().notRequired(),
    notes: Yup.string().notRequired().nullable(),
    user: Yup.string().notRequired().nullable(),
    panel: Yup.string().required('Obrigatório!'),
    roof_orientation: Yup.string().required('Obrigatório!'),
    roof_type: Yup.string().required('Obrigatório!'),
    status: Yup.string().required('Obrigatório!'),
});

export default function EditEstimate() {
    const router = useRouter();
    const { estimate } = router.query;

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [data, setData] = useState<Estimate>();

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

    // Values calc result.
    const [resultMonthsAverageKwh, setResultMonthsAverageKwh] = useState(0);
    const [resultFinalAverageKwh, setResultFinalAverageKwh] = useState(0);
    const [resultMonthlyPaid, setResultMonthlyPaid] = useState(0);
    const [resultYearlyPaid, setResultYearlyPaid] = useState(0);

    const [resultPanelsAmount, setResultPanelsAmount] = useState(0);

    const [resultSystemCapacityKwp, setResultSystemCapacityKwp] = useState(0);

    const [resultMonthlyGeneratedEnergy, setResultMonthlyGeneratedEnergy] = useState(0);
    const [resultYearlyGeneratedEnergy, setResultYearlyGeneratedEnergy] = useState(0);
    const [resultCo2Reduction, setResultCo2Reduction] = useState(0);

    const [resultSystemArea, setResultSystemArea] = useState(0);
    const [resultFinalSystemCapacityKwp, setResultFinalSystemCapacityKwp] = useState(0);

    const [resultPreSystemPrice, setResultPreSystemPrice] = useState(0);

    const [resultFinalSystemPrice, setResultFinalSystemPrice] = useState(0);

    const [valuesCalc, setValuesCalc] = useState<CalcProps>();

    const [deletingMessageShow, setDeletingMessageShow] = useState(false);

    const [showItemDelete, setShowItemDelete] = useState(false);

    const handleCloseItemDelete = () => setShowItemDelete(false);
    const handelShowItemDelete = () => setShowItemDelete(true);

    useEffect(() => {
        handleItemSideBar('estimates');
        handleSelectedMenu('estimates-index');

        if (user) {
            if (can(user, "estimates", "update:any")) {
                api.get(`estimates/${estimate}`).then(res => {
                    let estimateRes: Estimate = res.data;

                    if (estimateRes.document.length > 14)
                        setDocumentType("CNPJ");

                    try {
                        const stateCities = statesCities.estados.find(item => { return item.sigla === res.data.state })

                        if (stateCities)
                            setCities(stateCities.cidades);
                    }
                    catch { }

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

                    setData(estimateRes);
                }).catch(err => {
                    console.log('Error to get estimate to edit, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });
            }
        }

    }, [user, estimate]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (data) {
            const values: CalcProps = {
                kwh: data.kwh,
                irradiation: data.irradiation,
                panel: data.panel,
                month_01: data.month_01,
                month_02: data.month_02,
                month_03: data.month_03,
                month_04: data.month_04,
                month_05: data.month_05,
                month_06: data.month_06,
                month_07: data.month_07,
                month_08: data.month_08,
                month_09: data.month_09,
                month_10: data.month_10,
                month_11: data.month_11,
                month_12: data.month_12,
                month_13: data.month_13,
                averageIncrease: data.average_increase,
                roofOrientation: data.roof_orientation,
                discount: data.discount,
                increase: data.increase,
                percent: data.percent,
                estimateItems: data.items,
            }

            setValuesCalc(values);

            handleCalcEstimate(values, false);
        }
    }, [data]);

    function handleCalcEstimate(values: CalcProps, updatedInversor: boolean) {
        const calcResults = calculate(values, updatedInversor);

        if (calcResults) {
            setResultMonthsAverageKwh(calcResults.monthsAverageKwh);
            setResultFinalAverageKwh(calcResults.finalAverageKwh);
            setResultMonthlyPaid(calcResults.monthlyPaid);
            setResultYearlyPaid(calcResults.yearlyPaid);

            setResultSystemCapacityKwp(calcResults.systemCapacityKwp);

            setResultMonthlyGeneratedEnergy(calcResults.monthlyGeneratedEnergy);
            setResultYearlyGeneratedEnergy(calcResults.yearlyGeneratedEnergy);
            setResultCo2Reduction(calcResults.co2Reduction);

            setResultSystemArea(calcResults.systemArea);
            setResultFinalSystemCapacityKwp(calcResults.finalSystemCapacityKwp);

            setResultPreSystemPrice(calcResults.systemInitialPrice);
            setResultFinalSystemPrice(calcResults.finalSystemPrice);

            calcResults.estimateItems.forEach(item => {
                if (item.order === 1) setResultPanelsAmount(item.amount);
            });

            setEstimateItemsList(calcResults.estimateItems);
        }
    }

    function handleFormValues(values: any) {
        try {
            const panel = panels.find(panel => { return panel.id === values['panel'] });
            const roofOrientation = roofOrientations.find(roofOrientation => { return roofOrientation.id === values['roof_orientation'] });

            if (!panel || !roofOrientation) return undefined;

            const valuesCalcItem: CalcProps = {
                kwh: values['kwh'].replaceAll('.', '').replaceAll(',', '.'),
                irradiation: values['irradiation'].replaceAll('.', '').replaceAll(',', '.'),
                panel,
                month_01: values['month_01'].replaceAll('.', '').replaceAll(',', '.'),
                month_02: values['month_02'].replaceAll('.', '').replaceAll(',', '.'),
                month_03: values['month_03'].replaceAll('.', '').replaceAll(',', '.'),
                month_04: values['month_04'].replaceAll('.', '').replaceAll(',', '.'),
                month_05: values['month_05'].replaceAll('.', '').replaceAll(',', '.'),
                month_06: values['month_06'].replaceAll('.', '').replaceAll(',', '.'),
                month_07: values['month_07'].replaceAll('.', '').replaceAll(',', '.'),
                month_08: values['month_08'].replaceAll('.', '').replaceAll(',', '.'),
                month_09: values['month_09'].replaceAll('.', '').replaceAll(',', '.'),
                month_10: values['month_10'].replaceAll('.', '').replaceAll(',', '.'),
                month_11: values['month_11'].replaceAll('.', '').replaceAll(',', '.'),
                month_12: values['month_12'].replaceAll('.', '').replaceAll(',', '.'),
                month_13: values['month_13'].replaceAll('.', '').replaceAll(',', '.'),
                averageIncrease: values['average_increase'].replaceAll('.', '').replaceAll(',', '.'),
                roofOrientation: roofOrientation,
                discount: values['discount'].replaceAll('.', '').replaceAll(',', '.'),
                increase: values['increase'].replaceAll('.', '').replaceAll(',', '.'),
                percent: values['percent'],
                estimateItems: estimateItemsList,
            }

            setValuesCalc(valuesCalcItem);

            return valuesCalcItem;
        }
        catch {
            return undefined;
        }
    }

    function handleListEstimateItems(estimateItemsList: EstimateItem[]) {
        setEstimateItemsList(estimateItemsList);

        if (valuesCalc) {
            const updatedValuesCalc = {
                ...valuesCalc,
                estimateItems: estimateItemsList,
            };

            setValuesCalc(updatedValuesCalc);

            handleCalcEstimate(updatedValuesCalc, false);
        }
    }

    async function handleItemDelete() {
        if (user && estimate) {
            setTypeMessage("waiting");
            setDeletingMessageShow(true);

            try {
                if (can(user, "estimates", "delete")) {
                    await api.delete(`estimates/${estimate}`);

                    setTypeMessage("success");

                    setTimeout(() => {
                        router.push('/estimates');
                    }, 1000);
                }
            }
            catch (err) {
                console.log('error deleting estimate');
                console.log(err);

                setTypeMessage("error");

                setTimeout(() => {
                    setDeletingMessageShow(false);
                }, 4000);
            }
        }
    }

    return (
        <>
            <NextSeo
                title="Editar orçamento"
                description="Editar orçamento da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Editar orçamento',
                    description: 'Editar orçamento da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Editar orçamento | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "estimates", "update:any") ? <>
                                {
                                    loadingData || hasErrors ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <>
                                            {
                                                !data ? <PageWaiting status="waiting" /> :
                                                    <Container className="content-page">
                                                        <Row className="mb-3">
                                                            <Col>
                                                                <PageBack href={`/estimates/details/${data.id}`} subTitle="Voltar para a lista de orçamentos" />
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
                                                                customer: data.customer,
                                                                document: data.document,
                                                                phone: data.phone,
                                                                cellphone: data.cellphone,
                                                                contacts: data.contacts,
                                                                email: data.email,
                                                                zip_code: data.zip_code,
                                                                street: data.street,
                                                                number: data.number,
                                                                neighborhood: data.neighborhood,
                                                                complement: data.complement,
                                                                city: data.city,
                                                                state: data.state,
                                                                energy_company: data.energy_company,
                                                                unity: data.unity,
                                                                kwh: prettifyCurrency(String(data.kwh)),
                                                                irradiation: prettifyCurrency(String(data.irradiation)),
                                                                month_01: prettifyCurrency(String(data.month_01)),
                                                                month_02: prettifyCurrency(String(data.month_02)),
                                                                month_03: prettifyCurrency(String(data.month_03)),
                                                                month_04: prettifyCurrency(String(data.month_04)),
                                                                month_05: prettifyCurrency(String(data.month_05)),
                                                                month_06: prettifyCurrency(String(data.month_06)),
                                                                month_07: prettifyCurrency(String(data.month_07)),
                                                                month_08: prettifyCurrency(String(data.month_08)),
                                                                month_09: prettifyCurrency(String(data.month_09)),
                                                                month_10: prettifyCurrency(String(data.month_10)),
                                                                month_11: prettifyCurrency(String(data.month_11)),
                                                                month_12: prettifyCurrency(String(data.month_12)),
                                                                month_13: prettifyCurrency(String(data.month_13)),
                                                                average_increase: prettifyCurrency(String(data.average_increase)),
                                                                discount: prettifyCurrency(String(data.discount)),
                                                                increase: prettifyCurrency(String(data.increase)),
                                                                percent: data.percent,
                                                                show_values: data.show_values,
                                                                show_discount: data.show_discount,
                                                                notes: data.notes,
                                                                user: user.id,
                                                                panel: data.panel.id,
                                                                roof_orientation: data.roof_orientation.id,
                                                                roof_type: data.roof_type.id,
                                                                status: data.status.id,
                                                            }}
                                                            onSubmit={async values => {
                                                                setTypeMessage("waiting");
                                                                setMessageShow(true);

                                                                const valuesCalcItem = handleFormValues(values);

                                                                try {
                                                                    if (valuesCalcItem) {
                                                                        await api.put(`estimates/${data.id}`, {
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
                                                                            energy_company: values.energy_company,
                                                                            unity: values.unity,
                                                                            kwh: valuesCalcItem.kwh,
                                                                            irradiation: valuesCalcItem.irradiation,
                                                                            month_01: valuesCalcItem.month_01,
                                                                            month_02: valuesCalcItem.month_02,
                                                                            month_03: valuesCalcItem.month_03,
                                                                            month_04: valuesCalcItem.month_04,
                                                                            month_05: valuesCalcItem.month_05,
                                                                            month_06: valuesCalcItem.month_06,
                                                                            month_07: valuesCalcItem.month_07,
                                                                            month_08: valuesCalcItem.month_08,
                                                                            month_09: valuesCalcItem.month_09,
                                                                            month_10: valuesCalcItem.month_10,
                                                                            month_11: valuesCalcItem.month_11,
                                                                            month_12: valuesCalcItem.month_12,
                                                                            month_13: valuesCalcItem.month_13,
                                                                            average_increase: valuesCalcItem.averageIncrease,
                                                                            discount: valuesCalcItem.discount,
                                                                            increase: valuesCalcItem.increase,
                                                                            percent: values.percent,
                                                                            show_values: values.show_values,
                                                                            show_discount: values.show_discount,
                                                                            notes: values.notes,
                                                                            panel: values.panel,
                                                                            roof_orientation: values.roof_orientation,
                                                                            roof_type: values.roof_type,
                                                                            status: values.status,
                                                                        });

                                                                        estimateItemsList.forEach(async item => {
                                                                            await api.put(`estimates/items/${item.id}`, {
                                                                                name: item.name,
                                                                                amount: item.amount,
                                                                                price: item.price,
                                                                                percent: item.percent,
                                                                                order: item.order,
                                                                            });
                                                                        });

                                                                        setTypeMessage("success");

                                                                        setTimeout(() => {
                                                                            router.push(`/estimates/details/${data.id}`)
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
                                                            {({ handleChange, handleBlur, handleSubmit, setFieldValue, setValues, values, errors, touched }) => (
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
                                                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
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
                                                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
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
                                                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
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

                                                                    <Row className="mb-3">
                                                                        <Form.Group as={Col} sm={3} controlId="formGridKwh">
                                                                            <Form.Label>Valor unitário do Quilowatts/Hora</Form.Label>
                                                                            <InputGroup className="mb-2">
                                                                                <InputGroup.Text id="btnGroupKwh">R$</InputGroup.Text>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('kwh', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('kwh', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.kwh}
                                                                                    name="kwh"
                                                                                    isInvalid={!!errors.kwh && touched.kwh}
                                                                                    aria-label="Valor unitário do Quilowatts/Hora."
                                                                                    aria-describedby="btnGroupKwh"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.kwh && errors.kwh}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridIrratiation">
                                                                            <Form.Label>Irradiação Local</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupIrradiation">kWh/m²</InputGroup.Text>


                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('irradiation', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('irradiation', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.irradiation}
                                                                                    name="irradiation"
                                                                                    isInvalid={!!errors.irradiation && touched.irradiation}
                                                                                    aria-label="Irradiação Local em [kWh/m².dia]."
                                                                                    aria-describedby="btnGroupIrradiation"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.irradiation && errors.irradiation}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridPanel">
                                                                            <Form.Label>Painél fotovoltaico (W)</Form.Label>
                                                                            <Form.Control
                                                                                as="select"
                                                                                onChange={(e) => {
                                                                                    setFieldValue('panel', e.target.value);

                                                                                    const calcValues = handleFormValues(values);

                                                                                    if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                }}
                                                                                onBlur={handleBlur}
                                                                                value={values.panel}
                                                                                name="panel"
                                                                                isInvalid={!!errors.panel && touched.panel}
                                                                            >
                                                                                <option hidden>Escolha uma opção</option>
                                                                                {
                                                                                    panels.map((panel, index) => {
                                                                                        return <option key={index} value={panel.id}>{
                                                                                            `${panel.name} - ${prettifyCurrency(String(panel.capacity))} W`
                                                                                        }</option>
                                                                                    })
                                                                                }
                                                                            </Form.Control>
                                                                            <Form.Control.Feedback type="invalid">{touched.panel && errors.panel}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridRoofOrientation">
                                                                            <Form.Label>Orientação do telhado</Form.Label>
                                                                            <Form.Control
                                                                                as="select"
                                                                                onChange={(e) => {
                                                                                    setFieldValue('roof_orientation', e.target.value);

                                                                                    const calcValues = handleFormValues(values);

                                                                                    if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                }}
                                                                                onBlur={handleBlur}
                                                                                value={values.roof_orientation}
                                                                                name="roof_orientation"
                                                                                isInvalid={!!errors.roof_orientation && touched.roof_orientation}
                                                                            >
                                                                                <option hidden>Escolha uma opção</option>
                                                                                {
                                                                                    roofOrientations.map((orientation, index) => {
                                                                                        return <option key={index} value={orientation.id}>{orientation.name}</option>
                                                                                    })
                                                                                }
                                                                            </Form.Control>
                                                                            <Form.Control.Feedback type="invalid">{touched.roof_orientation && errors.roof_orientation}</Form.Control.Feedback>
                                                                        </Form.Group>
                                                                    </Row>

                                                                    <Row className="mb-2">
                                                                        <Form.Group as={Col} sm={3} controlId="formGridMonth01">
                                                                            <Form.Label>Mês 01</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupMonth01">kWh</InputGroup.Text>


                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('month_01', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('month_01', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.month_01}
                                                                                    name="month_01"
                                                                                    isInvalid={!!errors.month_01 && touched.month_01}
                                                                                    aria-label="Consumo em kWh"
                                                                                    aria-describedby="btnGroupMonth01"
                                                                                />

                                                                                <Button
                                                                                    id="btnGroupMonth01"
                                                                                    variant="success"
                                                                                    title="Copiar valor para todos os outros meses."
                                                                                    onClick={() => {
                                                                                        const updatedValues = {
                                                                                            ...values,
                                                                                            month_02: values.month_01,
                                                                                            month_03: values.month_01,
                                                                                            month_04: values.month_01,
                                                                                            month_05: values.month_01,
                                                                                            month_06: values.month_01,
                                                                                            month_07: values.month_01,
                                                                                            month_08: values.month_01,
                                                                                            month_09: values.month_01,
                                                                                            month_10: values.month_01,
                                                                                            month_11: values.month_01,
                                                                                            month_12: values.month_01,
                                                                                            month_13: values.month_01,
                                                                                        };

                                                                                        setValues(updatedValues);

                                                                                        const calcValues = handleFormValues(updatedValues);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                >
                                                                                    <FaCopy />
                                                                                </Button>

                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.month_01 && errors.month_01}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridMonth02">
                                                                            <Form.Label>Mês 02</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupMonth02">kWh</InputGroup.Text>


                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('month_02', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('month_02', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.month_02}
                                                                                    name="month_02"
                                                                                    isInvalid={!!errors.month_02 && touched.month_02}
                                                                                    aria-label="Consumo em kWh"
                                                                                    aria-describedby="btnGroupMonth02"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.month_02 && errors.month_02}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridMonth03">
                                                                            <Form.Label>Mês 03</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupMonth03">kWh</InputGroup.Text>


                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('month_03', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('month_03', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.month_03}
                                                                                    name="month_03"
                                                                                    isInvalid={!!errors.month_03 && touched.month_03}
                                                                                    aria-label="Consumo em kWh"
                                                                                    aria-describedby="btnGroupMonth03"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.month_03 && errors.month_03}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridMonth04">
                                                                            <Form.Label>Mês 04</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupMonth04">kWh</InputGroup.Text>


                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('month_04', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('month_04', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.month_04}
                                                                                    name="month_04"
                                                                                    isInvalid={!!errors.month_04 && touched.month_04}
                                                                                    aria-label="Consumo em kWh"
                                                                                    aria-describedby="btnGroupMonth04"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.month_04 && errors.month_04}</Form.Control.Feedback>
                                                                        </Form.Group>
                                                                    </Row>

                                                                    <Row className="mb-2">
                                                                        <Form.Group as={Col} sm={3} controlId="formGridMonth05">
                                                                            <Form.Label>Mês 05</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupMonth05">kWh</InputGroup.Text>


                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('month_05', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('month_05', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.month_05}
                                                                                    name="month_05"
                                                                                    isInvalid={!!errors.month_05 && touched.month_05}
                                                                                    aria-label="Consumo em kWh"
                                                                                    aria-describedby="btnGroupMonth05"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.month_05 && errors.month_05}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridMonth06">
                                                                            <Form.Label>Mês 06</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupMonth06">kWh</InputGroup.Text>


                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('month_06', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('month_06', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.month_06}
                                                                                    name="month_06"
                                                                                    isInvalid={!!errors.month_06 && touched.month_06}
                                                                                    aria-label="Consumo em kWh"
                                                                                    aria-describedby="btnGroupMonth06"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.month_06 && errors.month_06}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridMonth07">
                                                                            <Form.Label>Mês 07</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupMonth07">kWh</InputGroup.Text>


                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('month_07', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('month_07', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.month_07}
                                                                                    name="month_07"
                                                                                    isInvalid={!!errors.month_07 && touched.month_07}
                                                                                    aria-label="Consumo em kWh"
                                                                                    aria-describedby="btnGroupMonth07"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.month_07 && errors.month_07}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridMonth08">
                                                                            <Form.Label>Mês 08</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupMonth08">kWh</InputGroup.Text>


                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('month_08', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('month_08', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.month_08}
                                                                                    name="month_08"
                                                                                    isInvalid={!!errors.month_08 && touched.month_08}
                                                                                    aria-label="Consumo em kWh"
                                                                                    aria-describedby="btnGroupMonth08"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.month_08 && errors.month_08}</Form.Control.Feedback>
                                                                        </Form.Group>
                                                                    </Row>

                                                                    <Row className="mb-2">
                                                                        <Form.Group as={Col} sm={3} controlId="formGridMonth09">
                                                                            <Form.Label>Mês 09</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupMonth09">kWh</InputGroup.Text>


                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('month_09', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('month_09', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.month_09}
                                                                                    name="month_09"
                                                                                    isInvalid={!!errors.month_09 && touched.month_09}
                                                                                    aria-label="Consumo em kWh"
                                                                                    aria-describedby="btnGroupMonth09"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.month_09 && errors.month_09}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridMonth10">
                                                                            <Form.Label>Mês 10</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupMonth10">kWh</InputGroup.Text>


                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('month_10', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('month_10', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.month_10}
                                                                                    name="month_10"
                                                                                    isInvalid={!!errors.month_10 && touched.month_10}
                                                                                    aria-label="Consumo em kWh"
                                                                                    aria-describedby="btnGroupMonth10"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.month_10 && errors.month_10}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridMonth11">
                                                                            <Form.Label>Mês 11</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupMonth11">kWh</InputGroup.Text>


                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('month_11', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('month_11', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.month_11}
                                                                                    name="month_11"
                                                                                    isInvalid={!!errors.month_11 && touched.month_11}
                                                                                    aria-label="Consumo em kWh"
                                                                                    aria-describedby="btnGroupMonth11"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.month_11 && errors.month_11}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridMonth12">
                                                                            <Form.Label>Mês 12</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupMonth12">kWh</InputGroup.Text>


                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('month_12', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('month_12', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.month_12}
                                                                                    name="month_12"
                                                                                    isInvalid={!!errors.month_12 && touched.month_12}
                                                                                    aria-label="Consumo em kWh"
                                                                                    aria-describedby="btnGroupMonth12"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.month_12 && errors.month_12}</Form.Control.Feedback>
                                                                        </Form.Group>
                                                                    </Row>

                                                                    <Row className="mb-2">
                                                                        <Form.Group as={Col} sm={3} controlId="formGridMonth13">
                                                                            <Form.Label>Mês 13</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupMonth13">kWh</InputGroup.Text>

                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('month_13', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('month_13', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.month_13}
                                                                                    name="month_13"
                                                                                    isInvalid={!!errors.month_13 && touched.month_13}
                                                                                    aria-label="Consumo em kWh"
                                                                                    aria-describedby="btnGroupMonth13"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.month_13 && errors.month_13}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridMonthsAverageKwh">
                                                                            <Form.Label>Média</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupMonthsAverageKwh">kWh</InputGroup.Text>

                                                                                <Form.Control
                                                                                    type="text"
                                                                                    value={prettifyCurrency(String(resultMonthsAverageKwh.toFixed(2)))}
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
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('average_increase', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('average_increase', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, true);
                                                                                    }}
                                                                                    value={values.average_increase}
                                                                                    name="average_increase"
                                                                                    isInvalid={!!errors.average_increase && touched.average_increase}
                                                                                    aria-label="Previsão de aumento"
                                                                                    aria-describedby="btnGroupAverageIncrease"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.average_increase && errors.average_increase}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridFinalAverageKwh">
                                                                            <Form.Label>Consumo final</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupFinalAverageKwh">kWh</InputGroup.Text>

                                                                                <Form.Control
                                                                                    type="text"
                                                                                    value={prettifyCurrency(String(resultFinalAverageKwh.toFixed(2)))}
                                                                                    name="final_average"
                                                                                    aria-label="Média final"
                                                                                    aria-describedby="btnGroupFinalAverageKwh"
                                                                                    readOnly
                                                                                />
                                                                            </InputGroup>
                                                                        </Form.Group>
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
                                                                                    value={prettifyCurrency(String(resultMonthlyPaid.toFixed(2)))}
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
                                                                                    value={prettifyCurrency(String(resultYearlyPaid.toFixed(2)))}
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
                                                                                    value={resultPanelsAmount}
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
                                                                                    value={prettifyCurrency(String(resultSystemCapacityKwp.toFixed(2)))}
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
                                                                                    value={prettifyCurrency(String(resultMonthlyGeneratedEnergy.toFixed(2)))}
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
                                                                                    value={prettifyCurrency(String(resultYearlyGeneratedEnergy.toFixed(2)))}
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
                                                                                    value={prettifyCurrency(String(resultCo2Reduction.toFixed(2)))}
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
                                                                                    value={prettifyCurrency(String(resultSystemArea.toFixed(2)))}
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
                                                                                    value={prettifyCurrency(String(resultFinalSystemCapacityKwp.toFixed(2)))}
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
                                                                        <Form.Check
                                                                            type="switch"
                                                                            id="show_values"
                                                                            label="Exibir valores dos itens no orçamento?"
                                                                            checked={values.show_values}
                                                                            onChange={() => { setFieldValue('show_values', !values.show_values) }}
                                                                        />
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
                                                                                canEdit={estimateItem.order === 0 ? true : false}
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
                                                                                    value={prettifyCurrency(String(resultPreSystemPrice.toFixed(2)))}
                                                                                    name="pre_system_value"
                                                                                    aria-label="Valor do sistema "
                                                                                    aria-describedby="btnGroupPreSystemPrice"
                                                                                    readOnly
                                                                                />
                                                                            </InputGroup>
                                                                        </Form.Group>

                                                                        <Col sm={3}>
                                                                            <Form.Check
                                                                                type="switch"
                                                                                id="percent"
                                                                                label="Valores em Reais (R$)"
                                                                                checked={!values.percent}
                                                                                onChange={() => {
                                                                                    setFieldValue('percent', !values.percent);

                                                                                    const calcValues = handleFormValues({ ...values, percent: !values.percent });

                                                                                    if (calcValues) handleCalcEstimate(calcValues, false);
                                                                                }}
                                                                            />
                                                                        </Col>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridDiscount">
                                                                            <Form.Label>Desconto</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupDiscount">{values.percent ? '%' : 'R$'}</InputGroup.Text>

                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('discount', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('discount', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, false);
                                                                                    }}
                                                                                    value={values.discount}
                                                                                    name="discount"
                                                                                    isInvalid={!!errors.discount && touched.discount}
                                                                                    aria-label="Valor"
                                                                                    aria-describedby="btnGroupDiscount"
                                                                                />
                                                                            </InputGroup>
                                                                            <Form.Control.Feedback type="invalid">{touched.discount && errors.discount}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Form.Group as={Col} sm={3} controlId="formGridDiscount">
                                                                            <Form.Label>Acréscimo</Form.Label>
                                                                            <InputGroup className="mb-2">

                                                                                <InputGroup.Text id="btnGroupDiscount">{values.percent ? '%' : 'R$'}</InputGroup.Text>

                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('increase', prettifyCurrency(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                                        setFieldValue('increase', prettifyCurrency(e.target.value));

                                                                                        const calcValues = handleFormValues(values);

                                                                                        if (calcValues) handleCalcEstimate(calcValues, false);
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
                                                                        <Form.Check
                                                                            type="switch"
                                                                            id="show_discount"
                                                                            label="Exibir descontos no orçamento?"
                                                                            checked={values.show_discount}
                                                                            onChange={() => { setFieldValue('show_discount', !values.show_discount) }}
                                                                        />
                                                                    </Row>

                                                                    <Row className="mb-3">
                                                                        <Col>
                                                                            <Row>
                                                                                <Col>
                                                                                    <h6 className="text-success">Valor final do sitema <FaMoneyBillWave /></h6>
                                                                                </Col>
                                                                            </Row>
                                                                        </Col>
                                                                    </Row>

                                                                    <Row className="align-items-end">
                                                                        <Form.Group as={Col} sm={3} controlId="formGridFinalSystemPrice">
                                                                            <InputGroup>
                                                                                <InputGroup.Text id="btnGroupFinalSystemPrice">R$</InputGroup.Text>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    value={prettifyCurrency(String(resultFinalSystemPrice.toFixed(2)))}
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
                                                                                <>
                                                                                    {
                                                                                        can(user, "estimates", "delete") && <Col className="col-row">
                                                                                            <Button
                                                                                                variant="danger"
                                                                                                title="Excluir orçamento."
                                                                                                onClick={handelShowItemDelete}
                                                                                            >
                                                                                                Excluir
                                                                                            </Button>
                                                                                        </Col>
                                                                                    }

                                                                                    <Col sm={1}>
                                                                                        <Button variant="success" type="submit">Salvar</Button>
                                                                                    </Col>
                                                                                </>

                                                                        }
                                                                    </Row>
                                                                </Form>
                                                            )}
                                                        </Formik>

                                                        <Modal show={showItemDelete} onHide={handleCloseItemDelete}>
                                                            <Modal.Header closeButton>
                                                                <Modal.Title>Excluir orçamento</Modal.Title>
                                                            </Modal.Header>
                                                            <Modal.Body>
                                                                Você tem certeza que deseja excluir este orçamento? Essa ação não poderá ser desfeita.
                                                            </Modal.Body>
                                                            <Modal.Footer>
                                                                <Row>
                                                                    {
                                                                        deletingMessageShow ? <Col><AlertMessage status={typeMessage} /></Col> :
                                                                            <>
                                                                                {
                                                                                    can(user, "estimates", "delete") && <Col className="col-row">
                                                                                        <Button
                                                                                            variant="danger"
                                                                                            type="button"
                                                                                            onClick={handleItemDelete}
                                                                                        >
                                                                                            Excluir
                                                                                        </Button>
                                                                                    </Col>
                                                                                }

                                                                                <Button
                                                                                    className="col-row"
                                                                                    variant="outline-secondary"
                                                                                    onClick={handleCloseItemDelete}
                                                                                >
                                                                                    Cancelar
                                                                                </Button>
                                                                            </>
                                                                    }
                                                                </Row>
                                                            </Modal.Footer>
                                                        </Modal>
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