import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, InputGroup, ListGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaClipboardList, FaHistory, FaFileAlt, FaPlus, FaUserTie, FaUserTag, FaDonate, FaSolarPanel } from 'react-icons/fa';
import { format } from 'date-fns';
import cep, { CEP } from 'cep-promise';
import { CircularProgressbar } from 'react-circular-progressbar';
import filesize from "filesize";

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { StoresContext } from '../../../contexts/StoresContext';
import { can } from '../../../components/Users';
import { Project } from '../../../components/Projects';
import { ProjectStatus } from '../../../components/ProjectStatus';
import { EventProject } from '../../../components/EventsProject';
import { AttachmentRequired } from '../../../components/AttachmentsRequiredProject';
import Incomings, { Income } from '../../../components/Incomings';
import NewIncomeModal from '../../../components/Incomings/ModalNew';
import ProjectEvents, { ProjectEvent } from '../../../components/ProjectEvents';
import ProjectItems, { ProjectItem } from '../../../components/ProjectItems';
import ProjectAttachments, { ProjectAttachment } from '../../../components/ProjectAttachments';
import ProjectAttachmentsRequired, { ProjectAttachmentRequired } from '../../../components/ProjectAttachmentsRequired';

import Members from '../../../components/ProjectMembers';
import { statesCities } from '../../../components/StatesCities';
import { cpf, cnpj, cellphone } from '../../../components/InputMask/masks';
import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';
import { prettifyCurrency } from '../../../components/InputMask/masks';

import "react-circular-progressbar/dist/styles.css";
import styles from './styles.module.css';

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
    energy_company: Yup.string().notRequired().nullable(),
    unity: Yup.string().notRequired().nullable(),
    months_average: Yup.string().required('Obrigatório!'),
    average_increase: Yup.string().required('Obrigatório!'),
    coordinates: Yup.string().notRequired(),
    capacity: Yup.string().notRequired(),
    inversor: Yup.string().required('Obrigatório!'),
    roof_orientation: Yup.string().required('Obrigatório!'),
    roof_type: Yup.string().required('Obrigatório!'),
    panel: Yup.string().required('Obrigatório!'),
    panel_amount: Yup.number().required('Obrigatório!'),
    price: Yup.string().required('Obrigatório!'),
    notes: Yup.string().notRequired().nullable(),
    financier_same: Yup.boolean().notRequired(),
    financier: Yup.string().required('Obrigatório!'),
    financier_document: Yup.string().required('Obrigatório!'),
    financier_rg: Yup.string().notRequired().nullable(),
    financier_cellphone: Yup.string().notRequired().nullable(),
    financier_email: Yup.string().notRequired().nullable(),
    financier_zip_code: Yup.string().notRequired(),
    financier_street: Yup.string().notRequired(),
    financier_number: Yup.string().notRequired(),
    financier_neighborhood: Yup.string().notRequired(),
    financier_complement: Yup.string().notRequired().nullable(),
    financier_city: Yup.string().required('Obrigatório!'),
    financier_state: Yup.string().required('Obrigatório!'),
    store: Yup.string().required('Obrigatório!'),
    status: Yup.string().required('Obrigatório!'),
});

const attachmentValidationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    path: Yup.string().required('Obrigatório!'),
    size: Yup.number().lessThan(200 * 1024 * 1024, 'O arquivo não pode ultrapassar 200MB.').notRequired().nullable(),
    received_at: Yup.date().required('Obrigatório!'),
    project: Yup.string().required('Obrigatório!'),
});

const ProjectEdit: NextPage = () => {
    const router = useRouter();
    const { project } = router.query;
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);
    const { stores } = useContext(StoresContext);

    const [projectData, setProjectData] = useState<Project>();
    const [projectStatus, setProjectStatus] = useState<ProjectStatus[]>([]);
    const [projectEvents, setProjectEvents] = useState<ProjectEvent[]>([]);
    const [projectAttachments, setProjectAttachments] = useState<ProjectAttachment[]>([]);
    const [projectAttachmentsRequired, setProjectAttachmentsRequired] = useState<ProjectAttachmentRequired[]>([]);
    const [incomings, setIncomings] = useState<Income[]>([]);
    const [projectItemsList, setProjectItemsList] = useState<ProjectItem[]>([]);

    const [spinnerCep, setSpinnerCep] = useState(false);
    const [documentType, setDocumentType] = useState("CPF");
    const [cities, setCities] = useState<string[]>([]);
    const [financierDocumentType, setFinancierDocumentType] = useState("CPF");
    const [financierCities, setFinancierCities] = useState<string[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [isAuthorized, setIsAuthorized] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadingPercentage, setUploadingPercentage] = useState(0);
    const [messageShow, setMessageShow] = useState(false);
    const [messageShowNewAttachment, setMessageShowNewAttachment] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [showModalNewAttachment, setShowModalNewAttachment] = useState(false);

    const handleCloseModalNewAttachment = () => setShowModalNewAttachment(false);
    const handleShowModalNewAttachment = () => {
        setFileToSave(undefined);
        setFilePreview('');
        setShowModalNewAttachment(true);
    }

    const [fileToSave, setFileToSave] = useState<File>();
    const [filePreview, setFilePreview] = useState('');

    const [showModalNew, setShowModalNew] = useState(false);

    const handleCloseModalNew = () => setShowModalNew(false);
    const handleShowModalNew = () => setShowModalNew(true);

    const [deletingMessageShow, setDeletingMessageShow] = useState(false);

    const [showItemDelete, setShowItemDelete] = useState(false);

    const handleCloseItemDelete = () => setShowItemDelete(false);
    const handelShowItemDelete = () => setShowItemDelete(true);

    useEffect(() => {
        handleItemSideBar('projects');
        handleSelectedMenu('projects-index');

        if (!user || !can(user, "projects", "update:any")) {
            setIsAuthorized(false);
            return;
        } else if (project) {
            setIsAuthorized(true);

            api.get(`projects/${project}`, {
                validateStatus: function (status) {
                    return status < 500; // Resolve only if the status code is less than 500
                }
            }).then(res => {
                switch (res.status) {
                    case 200:
                        let projectRes: Project = res.data;

                        if (projectRes.document.length > 14)
                            setDocumentType("CNPJ");

                        try {
                            const stateCities = statesCities.estados.find(item => { return item.sigla === projectRes.state })

                            if (stateCities)
                                setCities(stateCities.cidades);
                        }
                        catch { }

                        try {
                            const stateCities = statesCities.estados.find(item => { return item.sigla === projectRes.financier_state })

                            if (stateCities)
                                setFinancierCities(stateCities.cidades);
                        }
                        catch { }

                        api.get('projects/status').then(res => {
                            setProjectStatus(res.data);
                        }).catch(err => {
                            console.log('Error to get project status, ', err);

                            setTypeLoadingMessage("error");
                            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                            setHasErrors(true);
                        });

                        handleEventsData(projectRes).then(eventsData => {
                            if (eventsData) setProjectEvents(eventsData);
                        }).catch(err => {
                            console.log('Error to get events to edit, ', err);

                            setTypeLoadingMessage("error");
                            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                            setHasErrors(true);
                        });

                        setProjectAttachments(projectRes.attachments);

                        setIncomings(projectRes.incomings);

                        handleAttachmentsRequiredData(projectRes).then(attachmentsRequiredData => {
                            if (attachmentsRequiredData) setProjectAttachmentsRequired(attachmentsRequiredData);

                            setProjectData(projectRes);
                            setProjectItemsList(projectRes.items);

                            setLoadingData(false);
                        }).catch(err => {
                            console.log('Error to get attachmentsRequired to edit, ', err);

                            setTypeLoadingMessage("error");
                            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                            setHasErrors(true);
                        });
                        break;
                    case 403:
                        setIsAuthorized(false);
                        break;
                    default:
                        setTypeLoadingMessage("error");
                        setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                        setHasErrors(true);
                }
            }).catch(err => {
                console.log('Error to get project, ', err);

                setTypeLoadingMessage("error");
                setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                setHasErrors(true);
            });
        }
    }, [user, project]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleListAttachments() {
        try {
            const res = await api.get(`projects/${project}`);

            const updatedProject: Project = res.data;

            setProjectAttachments(updatedProject.attachments);
        }
        catch (err) {
            console.log('Error to get attachments to edit, ', err);

            setTypeLoadingMessage("error");
            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
            setHasErrors(true);
        }
    }

    async function handleListIncomings() {
        try {
            const res = await api.get(`projects/${project}`);

            const updatedProject: Project = res.data;

            setIncomings(updatedProject.incomings);
        }
        catch (err) {
            console.log('Error to get attachments to edit, ', err);

            setTypeLoadingMessage("error");
            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
            setHasErrors(true);
        }
    }

    async function handleListEvents() {
        try {
            const res = await api.get(`projects/${project}`);

            const updatedEvents = await handleEventsData(res.data);

            if (updatedEvents) setProjectEvents(updatedEvents);
        }
        catch (err) {
            console.log('Error to get events to edit, ', err);

            setTypeLoadingMessage("error");
            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
            setHasErrors(true);
        }
    }

    async function handleListAttachmentsRequired() {
        try {
            const res = await api.get(`projects/${project}`);

            const updatedAttachmentsRequired = await handleAttachmentsRequiredData(res.data);

            if (updatedAttachmentsRequired) setProjectAttachmentsRequired(updatedAttachmentsRequired);
        }
        catch (err) {
            console.log('Error to get attachments required to edit, ', err);

            setTypeLoadingMessage("error");
            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
            setHasErrors(true);
        }
    }

    async function handleEventsData(projectResponse: Project) {
        // Events.
        try {
            const eventsRes = await api.get('events/project');

            let eventsProject: EventProject[] = eventsRes.data;

            eventsProject = eventsProject.filter(eventProject => { return eventProject.active });

            const updatedEvents = eventsProject.map(eventProject => {
                const projectEvent = projectResponse.events.find(projectEvent => { return projectEvent.event.id === eventProject.id });

                if (projectEvent)
                    return projectEvent;

                return {
                    id: '0',
                    notes: '',
                    done: false,
                    done_at: new Date(),
                    event: eventProject,
                    project: projectResponse,
                };
            });

            return updatedEvents;
        }
        catch {
            return undefined;
        }
    }

    async function handleAttachmentsRequiredData(projectResponse: Project) {
        try {
            // Required attachments.
            const attachementsRequiredRes = await api.get('attachments-required/project');

            let attachmentsRequiredProject: AttachmentRequired[] = attachementsRequiredRes.data;

            attachmentsRequiredProject = attachmentsRequiredProject.filter(attachmentRequired => { return attachmentRequired.active });

            const updatedAttachmentsRequired = attachmentsRequiredProject.map(attachmentRequired => {
                const projectAttachmentRequired = projectResponse.attachmentsRequired.find(projectAttachmentRequired => {
                    return projectAttachmentRequired.attachmentRequired.id === attachmentRequired.id
                });

                if (projectAttachmentRequired)
                    return projectAttachmentRequired;

                return {
                    id: '0',
                    name: '',
                    path: null,
                    received_at: new Date(),
                    attachmentRequired: attachmentRequired,
                    project: projectResponse,
                };
            });

            return updatedAttachmentsRequired;
        }
        catch {
            return undefined;
        }
    }

    function handleListProjectItems(projectItemsList: ProjectItem[]) {
        setProjectItemsList(projectItemsList);
    }

    function handleImages(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files[0]) {
            const image = event.target.files[0];

            setFileToSave(image);

            const imagesToPreview = image.name;

            setFilePreview(imagesToPreview);
        }
    }

    async function handleItemDelete() {
        if (user && project) {
            setTypeMessage("waiting");
            setDeletingMessageShow(true);

            try {
                if (can(user, "projects", "delete")) {
                    await api.delete(`projects/${project}`);

                    setTypeMessage("success");

                    setTimeout(() => {
                        router.push('/projects');
                    }, 1000);
                }
            }
            catch (err) {
                console.log('error deleting project');
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
                title="Editar projeto"
                description="Editar projeto da plataforma de gerenciamento da Bioma consultoria."
                openGraph={{
                    url: 'https://app.biomaconsultoria.com',
                    title: 'Editar projeto',
                    description: 'Editar projeto da plataforma de gerenciamento da Bioma consultoria.',
                    images: [
                        {
                            url: 'https://app.biomaconsultoria.com/assets/images/logo-bioma.jpg',
                            alt: 'Editar projeto | Plataforma Bioma',
                        },
                        { url: 'https://app.biomaconsultoria.com/assets/images/logo-bioma.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            isAuthorized ? <>
                                {
                                    loadingData || hasErrors ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <>
                                            {
                                                !projectData ? <PageWaiting status="waiting" /> :
                                                    <Container className="content-page">
                                                        <>
                                                            <Row className="mb-3">
                                                                <Col>
                                                                    <PageBack href={`/projects/details/${projectData.id}`} subTitle="Voltar para detalhes do projeto" />
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
                                                                        <Members name={projectData.seller ? projectData.seller.name : projectData.created_by} />
                                                                    </Row>
                                                                </Col>
                                                            </Row>

                                                            <Formik
                                                                initialValues={{
                                                                    customer: projectData.customer,
                                                                    document: projectData.document,
                                                                    phone: projectData.phone,
                                                                    cellphone: projectData.cellphone,
                                                                    contacts: projectData.contacts,
                                                                    email: projectData.email,
                                                                    zip_code: projectData.zip_code,
                                                                    street: projectData.street,
                                                                    number: projectData.number,
                                                                    neighborhood: projectData.neighborhood,
                                                                    complement: projectData.complement,
                                                                    city: projectData.city,
                                                                    state: projectData.state,
                                                                    energy_company: projectData.energy_company,
                                                                    unity: projectData.unity,
                                                                    months_average: prettifyCurrency(String(projectData.months_average)),
                                                                    average_increase: prettifyCurrency(String(projectData.average_increase)),
                                                                    coordinates: projectData.coordinates,
                                                                    capacity: prettifyCurrency(String(projectData.capacity)),
                                                                    inversor: projectData.inversor,
                                                                    roof_orientation: projectData.roof_orientation,
                                                                    roof_type: projectData.roof_type,
                                                                    panel: projectData.panel,
                                                                    panel_amount: projectData.panel_amount,
                                                                    price: prettifyCurrency(String(projectData.price)),
                                                                    notes: projectData.notes,
                                                                    financier_same: projectData.financier_same,
                                                                    financier: projectData.financier,
                                                                    financier_document: projectData.financier_document,
                                                                    financier_rg: projectData.financier_rg,
                                                                    financier_cellphone: projectData.financier_cellphone,
                                                                    financier_email: projectData.financier_email,
                                                                    financier_zip_code: projectData.financier_zip_code,
                                                                    financier_street: projectData.financier_street,
                                                                    financier_number: projectData.financier_number,
                                                                    financier_neighborhood: projectData.financier_neighborhood,
                                                                    financier_complement: projectData.financier_complement,
                                                                    financier_city: projectData.financier_city,
                                                                    financier_state: projectData.financier_state,
                                                                    store: projectData.store.id,
                                                                    status: projectData.status.id,
                                                                }}
                                                                onSubmit={async values => {
                                                                    setTypeMessage("waiting");
                                                                    setMessageShow(true);

                                                                    try {
                                                                        await api.put(`projects/${projectData.id}`, {
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
                                                                            months_average: Number(values.months_average.replaceAll(".", "").replaceAll(",", ".")),
                                                                            average_increase: Number(values.average_increase.replaceAll(".", "").replaceAll(",", ".")),
                                                                            coordinates: values.coordinates,
                                                                            capacity: Number(values.capacity.replaceAll(".", "").replaceAll(",", ".")),
                                                                            inversor: values.inversor,
                                                                            roof_orientation: values.roof_orientation,
                                                                            roof_type: values.roof_type,
                                                                            panel: values.panel,
                                                                            panel_amount: values.panel_amount,
                                                                            price: Number(values.price.replaceAll(".", "").replaceAll(",", ".")),
                                                                            seller: '',
                                                                            notes: values.notes,
                                                                            financier_same: values.financier_same,
                                                                            financier: values.financier,
                                                                            financier_document: values.financier_document,
                                                                            financier_rg: values.financier_rg,
                                                                            financier_cellphone: values.financier_cellphone,
                                                                            financier_email: values.financier_email,
                                                                            financier_zip_code: values.financier_zip_code,
                                                                            financier_street: values.financier_street,
                                                                            financier_number: values.financier_number,
                                                                            financier_neighborhood: values.financier_neighborhood,
                                                                            financier_complement: values.financier_complement,
                                                                            financier_city: values.financier_city,
                                                                            financier_state: values.financier_state,
                                                                            store: values.store,
                                                                            status: values.status,
                                                                        });

                                                                        projectItemsList.forEach(async item => {
                                                                            await api.put(`projects/items/${item.id}`, {
                                                                                name: item.name,
                                                                                amount: item.amount,
                                                                                price: item.price,
                                                                                percent: item.percent,
                                                                                order: item.order,
                                                                            });
                                                                        });

                                                                        setTypeMessage("success");

                                                                        setTimeout(() => {
                                                                            router.push(`/projects/details/${projectData.id}`);
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

                                                                        <Col className="border-top mt-3 mb-3"></Col>

                                                                        <Row className="mt-5 mb-3">
                                                                            <Col>
                                                                                <Row>
                                                                                    <Col>
                                                                                        <h6 className="text-success">Projeto <FaSolarPanel /></h6>
                                                                                    </Col>
                                                                                </Row>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row className="mb-2">
                                                                            <Form.Group as={Col} sm={4} controlId="formGridEnergyCompany">
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

                                                                            <Form.Group as={Col} sm={2} controlId="formGridMonthsAverage">
                                                                                <Form.Label>Média mensal</Form.Label>
                                                                                <InputGroup className="mb-2">
                                                                                    <InputGroup.Text id="btnGroupMonthsAverage">kWh</InputGroup.Text>
                                                                                    <Form.Control
                                                                                        type="text"
                                                                                        onChange={(e) => {
                                                                                            setFieldValue('months_average', prettifyCurrency(e.target.value));
                                                                                        }}
                                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                                            setFieldValue('months_average', prettifyCurrency(e.target.value));
                                                                                        }}
                                                                                        value={values.months_average}
                                                                                        name="months_average"
                                                                                        isInvalid={!!errors.months_average && touched.months_average}
                                                                                        aria-label="Média mensal"
                                                                                        aria-describedby="btnGroupMonthsAverage"
                                                                                    />
                                                                                </InputGroup>
                                                                                <Form.Control.Feedback type="invalid">{touched.months_average && errors.months_average}</Form.Control.Feedback>
                                                                            </Form.Group>

                                                                            <Form.Group as={Col} sm={2} controlId="formGridAverageIncrease">
                                                                                <Form.Label>Previsão de aumento</Form.Label>
                                                                                <InputGroup className="mb-2">
                                                                                    <InputGroup.Text id="btnGroupAverageIncrease">kWh</InputGroup.Text>
                                                                                    <Form.Control
                                                                                        type="text"
                                                                                        onChange={(e) => {
                                                                                            setFieldValue('average_increase', prettifyCurrency(e.target.value));
                                                                                        }}
                                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                                            setFieldValue('average_increase', prettifyCurrency(e.target.value));
                                                                                        }}
                                                                                        value={values.average_increase}
                                                                                        name="average_increase"
                                                                                        isInvalid={!!errors.average_increase && touched.average_increase}
                                                                                        aria-label="Média mensal"
                                                                                        aria-describedby="btnGroupAverageIncrease"
                                                                                    />
                                                                                </InputGroup>
                                                                                <Form.Control.Feedback type="invalid">{touched.average_increase && errors.average_increase}</Form.Control.Feedback>
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

                                                                            <Form.Group as={Col} sm={3} controlId="formGridCapacity">
                                                                                <Form.Label>Capacidade do projeto</Form.Label>
                                                                                <InputGroup className="mb-2">
                                                                                    <InputGroup.Text id="btnGroupCapacity">kWp</InputGroup.Text>
                                                                                    <Form.Control
                                                                                        type="text"
                                                                                        onChange={(e) => {
                                                                                            setFieldValue('capacity', prettifyCurrency(e.target.value));
                                                                                        }}
                                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                                            setFieldValue('capacity', prettifyCurrency(e.target.value));
                                                                                        }}
                                                                                        value={values.capacity}
                                                                                        name="capacity"
                                                                                        isInvalid={!!errors.capacity && touched.capacity}
                                                                                        aria-label="Capacidade do projeto"
                                                                                        aria-describedby="btnGroupCapacity"
                                                                                    />
                                                                                </InputGroup>
                                                                                <Form.Control.Feedback type="invalid">{touched.capacity && errors.capacity}</Form.Control.Feedback>
                                                                            </Form.Group>

                                                                            <Form.Group as={Col} sm={5} controlId="formGridInversor">
                                                                                <Form.Label>Inversor</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={handleChange}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.inversor}
                                                                                    name="inversor"
                                                                                    isInvalid={!!errors.inversor && touched.inversor}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.inversor && errors.inversor}</Form.Control.Feedback>
                                                                            </Form.Group>
                                                                        </Row>

                                                                        <Row className="mb-2">
                                                                            <Form.Group as={Col} sm={3} controlId="formGridRoofOrientation">
                                                                                <Form.Label>Orientação do telhado</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={handleChange}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.roof_orientation}
                                                                                    name="roof_orientation"
                                                                                    isInvalid={!!errors.roof_orientation && touched.roof_orientation}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.roof_orientation && errors.roof_orientation}</Form.Control.Feedback>
                                                                            </Form.Group>

                                                                            <Form.Group as={Col} sm={3} controlId="formGridRoofType">
                                                                                <Form.Label>Tipo do telhado</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={handleChange}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.roof_type}
                                                                                    name="roof_type"
                                                                                    isInvalid={!!errors.roof_type && touched.roof_type}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.roof_type && errors.roof_type}</Form.Control.Feedback>
                                                                            </Form.Group>

                                                                            <Form.Group as={Col} sm={4} controlId="formGridPanel">
                                                                                <Form.Label>Painel</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={handleChange}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.panel}
                                                                                    name="panel"
                                                                                    isInvalid={!!errors.panel && touched.panel}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.panel && errors.panel}</Form.Control.Feedback>
                                                                            </Form.Group>

                                                                            <Form.Group as={Col} sm={2} controlId="formGridPanelAmount">
                                                                                <Form.Label>Quantidade</Form.Label>
                                                                                <InputGroup className="mb-2">
                                                                                    <InputGroup.Text id="btnGroupPanelAmount">Un</InputGroup.Text>
                                                                                    <Form.Control
                                                                                        type="number"
                                                                                        onChange={handleChange}
                                                                                        onBlur={handleBlur}
                                                                                        value={values.panel_amount}
                                                                                        name="panel_amount"
                                                                                        isInvalid={!!errors.panel_amount && touched.panel_amount}
                                                                                        aria-label="Média mensal"
                                                                                        aria-describedby="btnGroupPanelAmount"
                                                                                    />
                                                                                </InputGroup>
                                                                                <Form.Control.Feedback type="invalid">{touched.panel_amount && errors.panel_amount}</Form.Control.Feedback>
                                                                            </Form.Group>
                                                                        </Row>

                                                                        {
                                                                            can(user, "finances", "read:any") && <Row className="mb-2">
                                                                                <Form.Group as={Col} sm={3} controlId="formGridPrice">
                                                                                    <Form.Label>Valor do sistema</Form.Label>
                                                                                    <InputGroup className="mb-2">
                                                                                        <InputGroup.Text id="btnGroupPrice">R$</InputGroup.Text>
                                                                                        <Form.Control
                                                                                            type="text"
                                                                                            onChange={(e) => {
                                                                                                setFieldValue('price', prettifyCurrency(e.target.value));
                                                                                            }}
                                                                                            onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                                                setFieldValue('price', prettifyCurrency(e.target.value));
                                                                                            }}
                                                                                            value={values.price}
                                                                                            name="price"
                                                                                            isInvalid={!!errors.price && touched.price}
                                                                                            aria-label="Valor do projeto"
                                                                                            aria-describedby="btnGroupPrice"
                                                                                        />
                                                                                    </InputGroup>
                                                                                    <Form.Control.Feedback type="invalid">{touched.price && errors.price}</Form.Control.Feedback>
                                                                                </Form.Group>
                                                                            </Row>
                                                                        }

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

                                                                        <Row>
                                                                            <Col sm={2}><h6 className="text-secondary">Quantidade</h6></Col>
                                                                            <Col sm={10}><h6 className="text-secondary">Produto</h6></Col>
                                                                        </Row>

                                                                        {
                                                                            projectItemsList && projectItemsList.map(projectItem => {
                                                                                return <ProjectItems
                                                                                    key={projectItem.id}
                                                                                    projectItem={projectItem}
                                                                                    projectItemsList={projectItemsList}
                                                                                    handleListProjectItems={handleListProjectItems}
                                                                                />
                                                                            })
                                                                        }

                                                                        <Col className="border-top mt-3 mb-3"></Col>

                                                                        <Row className="mt-5 mb-3">
                                                                            <Col>
                                                                                <Row>
                                                                                    <Col>
                                                                                        <h6 className="text-success">Financiador <FaUserTag /></h6>
                                                                                    </Col>
                                                                                </Row>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row className="mb-2">
                                                                            <Col>
                                                                                <Form.Check
                                                                                    id="financier_same"
                                                                                    type="switch"
                                                                                    label="Repetir informações do cliente"
                                                                                    checked={values.financier_same}
                                                                                    onChange={() => {
                                                                                        setFieldValue('financier_same', !values.financier_same);

                                                                                        if (!values.financier_same) {
                                                                                            setFieldValue('financier', values.customer);
                                                                                            setFieldValue('financier_document', values.document);
                                                                                            setFieldValue('financier_cellphone', values.cellphone);
                                                                                            setFieldValue('financier_email', values.email);
                                                                                            setFieldValue('financier_zip_code', values.zip_code);
                                                                                            setFieldValue('financier_street', values.street);
                                                                                            setFieldValue('financier_number', values.number);
                                                                                            setFieldValue('financier_neighborhood', values.neighborhood);
                                                                                            setFieldValue('financier_complement', values.complement);
                                                                                            setFieldValue('financier_city', values.city);
                                                                                            setFieldValue('financier_state', values.state);
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </Col>
                                                                        </Row>

                                                                        <Row className="mb-3">
                                                                            <Form.Group as={Col} sm={8} controlId="formGridFinancierName">
                                                                                <Form.Label>Nome*</Form.Label>
                                                                                <Form.Control
                                                                                    type="name"
                                                                                    onChange={handleChange}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.financier}
                                                                                    name="financier"
                                                                                    isInvalid={!!errors.financier && touched.financier}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.financier && errors.financier}</Form.Control.Feedback>
                                                                            </Form.Group>

                                                                            <Form.Group as={Col} sm={4} controlId="formGridFinancierDocument">
                                                                                <Form.Label>{financierDocumentType}</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    maxLength={18}
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('financier_document', e.target.value.length <= 14 ? cpf(e.target.value) : cnpj(e.target.value), false);
                                                                                        if (e.target.value.length > 14)
                                                                                            setFinancierDocumentType("CNPJ");
                                                                                        else
                                                                                            setFinancierDocumentType("CPF");
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                                        setFieldValue('financier_document', e.target.value.length <= 14 ? cpf(e.target.value) : cnpj(e.target.value));
                                                                                        if (e.target.value.length > 14)
                                                                                            setFinancierDocumentType("CNPJ");
                                                                                        else
                                                                                            setFinancierDocumentType("CPF");
                                                                                    }}
                                                                                    value={values.financier_document}
                                                                                    name="financier_document"
                                                                                    isInvalid={!!errors.financier_document && touched.financier_document}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.financier_document && errors.financier_document}</Form.Control.Feedback>
                                                                            </Form.Group>
                                                                        </Row>

                                                                        <Row className="mb-3">
                                                                            <Form.Group as={Col} sm={3} controlId="formGridFinancierRg">
                                                                                <Form.Label>RG</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={handleChange}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.financier_rg}
                                                                                    name="financier_rg"
                                                                                    isInvalid={!!errors.financier_rg && touched.financier_rg}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.financier_rg && errors.financier_rg}</Form.Control.Feedback>
                                                                            </Form.Group>

                                                                            <Form.Group as={Col} sm={3} controlId="formGridFinancierCellphone">
                                                                                <Form.Label>Celular</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    maxLength={15}
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('financier_cellphone', cellphone(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                                        setFieldValue('financier_cellphone', cellphone(e.target.value));
                                                                                    }}
                                                                                    value={values.cellphone}
                                                                                    name="financier_cellphone"
                                                                                    isInvalid={!!errors.financier_cellphone && touched.financier_cellphone}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.financier_cellphone && errors.financier_cellphone}</Form.Control.Feedback>
                                                                            </Form.Group>

                                                                            <Form.Group as={Col} sm={6} controlId="formGridFinancierEmail">
                                                                                <Form.Label>E-mail</Form.Label>
                                                                                <Form.Control
                                                                                    type="email"
                                                                                    onChange={handleChange}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.financier_email}
                                                                                    name="financier_email"
                                                                                    isInvalid={!!errors.financier_email && touched.financier_email}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.financier_email && errors.financier_email}</Form.Control.Feedback>
                                                                            </Form.Group>
                                                                        </Row>

                                                                        <Row className="mb-3">
                                                                            <Form.Group as={Col} lg={2} md={3} sm={5} controlId="formGridFinancierZipCode">
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
                                                                                                        setFinancierCities(stateCities.cidades);

                                                                                                    setFieldValue('financier_street', street);
                                                                                                    setFieldValue('financier_neighborhood', neighborhood);
                                                                                                    setFieldValue('financier_city', city);
                                                                                                    setFieldValue('financier_state', state);

                                                                                                    setSpinnerCep(false);
                                                                                                })
                                                                                                .catch(() => {
                                                                                                    setSpinnerCep(false);
                                                                                                });
                                                                                        }
                                                                                    }}
                                                                                    value={values.zip_code}
                                                                                    name="financier_zip_code"
                                                                                    isInvalid={!!errors.financier_zip_code && touched.financier_zip_code}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.financier_zip_code && errors.financier_zip_code}</Form.Control.Feedback>
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
                                                                            <Form.Group as={Col} sm={10} controlId="formGridFinancierStreet">
                                                                                <Form.Label>Rua</Form.Label>
                                                                                <Form.Control
                                                                                    type="address"
                                                                                    onChange={handleChange}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.financier_street}
                                                                                    name="financier_street"
                                                                                    isInvalid={!!errors.financier_street && touched.financier_street}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.financier_street && errors.financier_street}</Form.Control.Feedback>
                                                                            </Form.Group>

                                                                            <Form.Group as={Col} sm={2} controlId="formGridFinancierNumber">
                                                                                <Form.Label>Número</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={handleChange}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.financier_number}
                                                                                    name="financier_number"
                                                                                    isInvalid={!!errors.financier_number && touched.financier_number}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.financier_number && errors.financier_number}</Form.Control.Feedback>
                                                                            </Form.Group>
                                                                        </Row>

                                                                        <Row className="mb-3">
                                                                            <Form.Group as={Col} controlId="formGridFinancierComplement">
                                                                                <Form.Label>Complemento</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={handleChange}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.financier_complement}
                                                                                    name="financier_complement"
                                                                                    isInvalid={!!errors.financier_complement && touched.financier_complement}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.financier_complement && errors.financier_complement}</Form.Control.Feedback>
                                                                            </Form.Group>
                                                                        </Row>

                                                                        <Row className="mb-2">
                                                                            <Form.Group as={Col} sm={6} controlId="formGridFinancierNeighborhood">
                                                                                <Form.Label>Bairro</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    onChange={handleChange}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.financier_neighborhood}
                                                                                    name="financier_neighborhood"
                                                                                    isInvalid={!!errors.financier_neighborhood && touched.financier_neighborhood}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.financier_neighborhood && errors.financier_neighborhood}</Form.Control.Feedback>
                                                                            </Form.Group>

                                                                            <Form.Group as={Col} sm={2} controlId="formGridFinancierState">
                                                                                <Form.Label>Estado</Form.Label>
                                                                                <Form.Control
                                                                                    as="select"
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('financier_state', e.target.value);

                                                                                        const stateCities = statesCities.estados.find(item => { return item.sigla === e.target.value })

                                                                                        if (stateCities)
                                                                                            setFinancierCities(stateCities.cidades);
                                                                                    }}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.financier_state ? values.financier_state : '...'}
                                                                                    name="financier_state"
                                                                                    isInvalid={!!errors.financier_state && touched.financier_state}
                                                                                >
                                                                                    <option hidden>...</option>
                                                                                    {
                                                                                        statesCities.estados.map((estado, index) => {
                                                                                            return <option key={index} value={estado.sigla}>{estado.nome}</option>
                                                                                        })
                                                                                    }
                                                                                </Form.Control>
                                                                                <Form.Control.Feedback type="invalid">{touched.financier_state && errors.financier_state}</Form.Control.Feedback>
                                                                            </Form.Group>

                                                                            <Form.Group as={Col} sm={4} controlId="formGridFinancierCity">
                                                                                <Form.Label>Cidade</Form.Label>
                                                                                <Form.Control
                                                                                    as="select"
                                                                                    onChange={handleChange}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.financier_city ? values.financier_city : '...'}
                                                                                    name="financier_city"
                                                                                    isInvalid={!!errors.financier_city && touched.financier_city}
                                                                                    disabled={!!!values.state}
                                                                                >
                                                                                    <option hidden>...</option>
                                                                                    {
                                                                                        !!values.state && financierCities.map((financier_city, index) => {
                                                                                            return <option key={index} value={financier_city}>{financier_city}</option>
                                                                                        })
                                                                                    }
                                                                                </Form.Control>
                                                                                <Form.Control.Feedback type="invalid">{touched.financier_city && errors.financier_city}</Form.Control.Feedback>
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

                                                                        <Row className="mb-3">
                                                                            <Form.Group as={Col} sm={6} controlId="formGridStatus">
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
                                                                                        projectStatus.map((status, index) => {
                                                                                            return <option key={index} value={status.id}>{status.name}</option>
                                                                                        })
                                                                                    }
                                                                                </Form.Control>
                                                                                <Form.Control.Feedback type="invalid">{touched.status && errors.status}</Form.Control.Feedback>
                                                                            </Form.Group>

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
                                                                                    <>
                                                                                        {
                                                                                            can(user, "projects", "delete") && <Col className="col-row">
                                                                                                <Button
                                                                                                    variant="danger"
                                                                                                    title="Excluir projeto."
                                                                                                    onClick={handelShowItemDelete}
                                                                                                >
                                                                                                    Excluir
                                                                                                </Button>
                                                                                            </Col>
                                                                                        }

                                                                                        <Col className="col-row" sm={1}>
                                                                                            <Button variant="success" type="submit">Salvar</Button>
                                                                                        </Col>
                                                                                    </>
                                                                            }
                                                                        </Row>
                                                                    </Form>
                                                                )}
                                                            </Formik>

                                                            <Col className="border-top mt-3 mb-3"></Col>

                                                            {
                                                                can(user, "finances", "read:any") && <Row className="mb-5">
                                                                    <Form.Group as={Col} controlId="formGridAttachments">
                                                                        <Row>
                                                                            <Col className="col-row">
                                                                                <h6 className="text-success">Receitas <FaDonate /></h6>
                                                                            </Col>

                                                                            {
                                                                                can(user, "finances", "update:any") && <Col sm={1}>
                                                                                    <Button
                                                                                        variant="outline-success"
                                                                                        size="sm"
                                                                                        onClick={handleShowModalNew}
                                                                                        title="Criar uma nova receita para esse projeto."
                                                                                    >
                                                                                        <FaPlus />
                                                                                    </Button>
                                                                                </Col>
                                                                            }
                                                                        </Row>

                                                                        <Row className="mt-2">
                                                                            {
                                                                                !!incomings.length ? <Col>
                                                                                    <ListGroup>
                                                                                        {
                                                                                            incomings.map(income => {
                                                                                                return <Incomings
                                                                                                    key={income.id}
                                                                                                    income={income}
                                                                                                    handleListIncomings={handleListIncomings}
                                                                                                />
                                                                                            })
                                                                                        }
                                                                                    </ListGroup>
                                                                                </Col> :
                                                                                    <Col>
                                                                                        <AlertMessage
                                                                                            status="warning"
                                                                                            message="Nenhuma uma receita registrada para esse projeto."
                                                                                        />
                                                                                    </Col>
                                                                            }
                                                                        </Row>
                                                                    </Form.Group>
                                                                </Row>
                                                            }

                                                            <Row className="mb-5">
                                                                <Col>
                                                                    <Row>
                                                                        <div className="member-container">
                                                                            <h6 className="text-success">Histórico <FaHistory /></h6>
                                                                        </div>
                                                                    </Row>

                                                                    <Row className="mt-2">
                                                                        {
                                                                            !!projectEvents.length ? <Col>
                                                                                <Row className="mb-2" style={{ padding: '0 1rem' }}>
                                                                                    <Col sm={4}>
                                                                                        <h6>Evento</h6>
                                                                                    </Col>

                                                                                    <Col sm={5}>
                                                                                        <h6>Detalhes</h6>
                                                                                    </Col>

                                                                                    <Col className="text-center">
                                                                                        <h6>Concluído</h6>
                                                                                    </Col>
                                                                                </Row>

                                                                                <Row>
                                                                                    <Col>
                                                                                        <ListGroup>
                                                                                            {
                                                                                                projectEvents.map((event, index) => {
                                                                                                    return <ProjectEvents
                                                                                                        key={index}
                                                                                                        projectEvent={event}
                                                                                                        listEvents={projectData.events}
                                                                                                        handleListEvents={handleListEvents}
                                                                                                        isNewItem={event.id === '0' ? true : false}
                                                                                                    />
                                                                                                })
                                                                                            }
                                                                                        </ListGroup>
                                                                                    </Col>
                                                                                </Row>

                                                                            </Col> :
                                                                                <Col>
                                                                                    <AlertMessage
                                                                                        status="warning"
                                                                                        message="Nenhum evento registrado para esse projeto."
                                                                                    />
                                                                                </Col>
                                                                        }
                                                                    </Row>
                                                                </Col>
                                                            </Row>

                                                            <Row className="mb-5">
                                                                <Col>
                                                                    <Row>
                                                                        <div className="member-container">
                                                                            <h6 className="text-success">Anexos obrigatórios <FaFileAlt /></h6>
                                                                        </div>
                                                                    </Row>

                                                                    <Row className="mt-2">
                                                                        {
                                                                            !!projectAttachmentsRequired.length ? <Col>
                                                                                <Row>
                                                                                    <Col>
                                                                                        <ListGroup>
                                                                                            {
                                                                                                projectAttachmentsRequired.map((attachment, index) => {
                                                                                                    return <ProjectAttachmentsRequired
                                                                                                        key={index}
                                                                                                        attachment={attachment}
                                                                                                        handleListAttachmentsRequired={handleListAttachmentsRequired}
                                                                                                    />
                                                                                                })
                                                                                            }
                                                                                        </ListGroup>
                                                                                    </Col>
                                                                                </Row>

                                                                            </Col> :
                                                                                <Col>
                                                                                    <AlertMessage
                                                                                        status="warning"
                                                                                        message="Nenhum anexo obrigatório registrado para esse projeto."
                                                                                    />
                                                                                </Col>
                                                                        }
                                                                    </Row>
                                                                </Col>
                                                            </Row>

                                                            <Row className="mb-5">
                                                                <Form.Group as={Col} controlId="formGridAttachments">
                                                                    <Row>
                                                                        <Col className="col-row">
                                                                            <h6 className="text-success">Outros anexos <FaFileAlt /></h6>
                                                                        </Col>

                                                                        <Col sm={1}>
                                                                            <Button
                                                                                variant="outline-success"
                                                                                size="sm"
                                                                                onClick={handleShowModalNewAttachment}
                                                                                title="Criar um novo anexo para esse projeto."
                                                                            >
                                                                                <FaPlus />
                                                                            </Button>
                                                                        </Col>
                                                                    </Row>

                                                                    <Row className="mt-2">
                                                                        {
                                                                            !!projectAttachments.length ? <Col>
                                                                                <ListGroup>
                                                                                    {
                                                                                        projectAttachments.map(attachment => {
                                                                                            return <ProjectAttachments
                                                                                                key={attachment.id}
                                                                                                attachment={attachment}
                                                                                                handleListAttachments={handleListAttachments}
                                                                                            />
                                                                                        })
                                                                                    }
                                                                                </ListGroup>
                                                                            </Col> :
                                                                                <Col>
                                                                                    <AlertMessage
                                                                                        status="warning"
                                                                                        message="Nenhum anexo enviado para esse projeto."
                                                                                    />
                                                                                </Col>
                                                                        }
                                                                    </Row>
                                                                </Form.Group>
                                                            </Row>

                                                            <NewIncomeModal
                                                                project={projectData}
                                                                show={showModalNew}
                                                                handleListIncomings={handleListIncomings}
                                                                handleCloseModal={handleCloseModalNew}
                                                            />

                                                            <Modal show={showModalNewAttachment} onHide={handleCloseModalNewAttachment}>
                                                                <Modal.Header closeButton>
                                                                    <Modal.Title>Criar um anexo</Modal.Title>
                                                                </Modal.Header>
                                                                <Formik
                                                                    initialValues={
                                                                        {
                                                                            name: '',
                                                                            path: '',
                                                                            size: 0,
                                                                            received_at: format(new Date(), 'yyyy-MM-dd'),
                                                                            project: projectData.id,
                                                                        }
                                                                    }
                                                                    onSubmit={async values => {
                                                                        if (fileToSave) {
                                                                            setUploadingPercentage(0);
                                                                            setTypeMessage("success");
                                                                            setIsUploading(true);
                                                                            setMessageShowNewAttachment(true);

                                                                            try {
                                                                                const data = new FormData();

                                                                                data.append('name', values.name);

                                                                                data.append('file', fileToSave);

                                                                                data.append('received_at', `${values.received_at} 12:00:00`);
                                                                                data.append('project', values.project);

                                                                                await api.post(`projects/${values.project}/attachments`, data, {
                                                                                    onUploadProgress: e => {
                                                                                        const progress = Math.round((e.loaded * 100) / e.total);

                                                                                        setUploadingPercentage(progress);
                                                                                    },
                                                                                    timeout: 0,
                                                                                }).then(async () => {
                                                                                    await handleListAttachments();

                                                                                    setIsUploading(false);
                                                                                    setMessageShowNewAttachment(true);

                                                                                    setTimeout(() => {
                                                                                        setMessageShowNewAttachment(false);
                                                                                        handleCloseModalNewAttachment();
                                                                                    }, 1000);
                                                                                }).catch(err => {
                                                                                    console.log('error create attachment.');
                                                                                    console.log(err);

                                                                                    setIsUploading(false);
                                                                                    setMessageShowNewAttachment(true);
                                                                                    setTypeMessage("error");

                                                                                    setTimeout(() => {
                                                                                        setMessageShowNewAttachment(false);
                                                                                    }, 4000);
                                                                                });
                                                                            }
                                                                            catch (err) {
                                                                                console.log('error create attachment.');
                                                                                console.log(err);

                                                                                setIsUploading(false);
                                                                                setMessageShowNewAttachment(true);
                                                                                setTypeMessage("error");

                                                                                setTimeout(() => {
                                                                                    setMessageShowNewAttachment(false);
                                                                                }, 4000);
                                                                            }
                                                                        }
                                                                    }}
                                                                    validationSchema={attachmentValidationSchema}
                                                                >
                                                                    {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
                                                                        <Form onSubmit={handleSubmit}>
                                                                            <Modal.Body>
                                                                                <Form.Group controlId="attachmentFormGridName">
                                                                                    <Form.Label>Nome do documento</Form.Label>
                                                                                    <Form.Control type="text"
                                                                                        placeholder="Nome"
                                                                                        onChange={handleChange}
                                                                                        onBlur={handleBlur}
                                                                                        value={values.name}
                                                                                        name="name"
                                                                                        isInvalid={!!errors.name && touched.name}
                                                                                    />
                                                                                    <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                                                                    <Form.Text className="text-muted text-right">{`${values.name.length}/50 caracteres.`}</Form.Text>
                                                                                </Form.Group>

                                                                                <Row className="mb-3">
                                                                                    <Col sm={4}>
                                                                                        <label
                                                                                            title="Procurar um arquivo para anexar."
                                                                                            htmlFor="fileAttachement"
                                                                                            className={styles.productImageButton}
                                                                                        >
                                                                                            <Row>
                                                                                                <Col>
                                                                                                    <FaPlus />
                                                                                                </Col>
                                                                                            </Row>

                                                                                            <Row>
                                                                                                <Col>Anexo</Col>
                                                                                            </Row>
                                                                                            <input
                                                                                                type="file"
                                                                                                onChange={(e) => {
                                                                                                    handleImages(e);
                                                                                                    if (e.target.files && e.target.files[0]) {
                                                                                                        setFieldValue('path', e.target.files[0].name);
                                                                                                        setFieldValue('size', e.target.files[0].size);
                                                                                                    }
                                                                                                }}
                                                                                                id="fileAttachement"
                                                                                            />
                                                                                        </label>
                                                                                    </Col>

                                                                                    <Col sm={8}>
                                                                                        <Row>
                                                                                            <Col>
                                                                                                <h6 className="text-cut">{filePreview}</h6>
                                                                                            </Col>
                                                                                        </Row>

                                                                                        <Row>
                                                                                            <Col>
                                                                                                <label className="text-wrap">{fileToSave ? filesize(fileToSave.size) : ''}</label>
                                                                                            </Col>
                                                                                        </Row>
                                                                                    </Col>

                                                                                    <Col className="col-12">
                                                                                        <label className="invalid-feedback" style={{ display: 'block' }}>{errors.path}</label>
                                                                                        <label className="invalid-feedback" style={{ display: 'block' }}>{errors.size}</label>
                                                                                    </Col>
                                                                                </Row>

                                                                                <Form.Group as={Row} controlId="formGridReceivedAt">
                                                                                    <Form.Label column sm={7}>Data do recebimento</Form.Label>
                                                                                    <Col sm={5}>
                                                                                        <Form.Control
                                                                                            type="date"
                                                                                            onChange={handleChange}
                                                                                            onBlur={handleBlur}
                                                                                            value={values.received_at}
                                                                                            name="received_at"
                                                                                            isInvalid={!!errors.received_at && touched.received_at}
                                                                                        />
                                                                                        <Form.Control.Feedback type="invalid">{touched.received_at && errors.received_at}</Form.Control.Feedback>
                                                                                    </Col>
                                                                                </Form.Group>
                                                                            </Modal.Body>
                                                                            <Modal.Footer>
                                                                                {
                                                                                    messageShowNewAttachment ? (
                                                                                        isUploading ? <CircularProgressbar
                                                                                            styles={{
                                                                                                root: { width: 50 },
                                                                                                path: { stroke: "#069140" },
                                                                                                text: {
                                                                                                    fontSize: "30px",
                                                                                                    fill: "#069140"
                                                                                                },
                                                                                            }}
                                                                                            strokeWidth={12}
                                                                                            value={uploadingPercentage}
                                                                                            text={`${uploadingPercentage}%`}
                                                                                        /> :
                                                                                            <AlertMessage status={typeMessage} />
                                                                                    ) :
                                                                                        <>
                                                                                            <Button variant="secondary" onClick={handleCloseModalNewAttachment}>Cancelar</Button>
                                                                                            <Button variant="success" type="submit">Salvar</Button>
                                                                                        </>
                                                                                }
                                                                            </Modal.Footer>
                                                                        </Form>
                                                                    )}
                                                                </Formik>
                                                            </Modal>

                                                            <Modal show={showItemDelete} onHide={handleCloseItemDelete}>
                                                                <Modal.Header closeButton>
                                                                    <Modal.Title>Excluir projeto</Modal.Title>
                                                                </Modal.Header>
                                                                <Modal.Body>
                                                                    Você tem certeza que deseja excluir este projeto? Essa ação não poderá ser desfeita.
                                                                </Modal.Body>
                                                                <Modal.Footer>
                                                                    <Row>
                                                                        {
                                                                            deletingMessageShow ? <Col><AlertMessage status={typeMessage} /></Col> :
                                                                                <>
                                                                                    {
                                                                                        can(user, "projects", "delete") && <Col className="col-row">
                                                                                            <Button
                                                                                                variant="danger"
                                                                                                type="button"
                                                                                                onClick={handleItemDelete}
                                                                                            >
                                                                                                Excluir
                                                                                            </Button>
                                                                                        </Col>
                                                                                    }

                                                                                    <Col className="col-row">
                                                                                        <Button
                                                                                            variant="outline-secondary"
                                                                                            onClick={handleCloseItemDelete}
                                                                                        >
                                                                                            Cancelar
                                                                                        </Button>
                                                                                    </Col>
                                                                                </>
                                                                        }
                                                                    </Row>
                                                                </Modal.Footer>
                                                            </Modal>
                                                        </>
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

export default ProjectEdit;

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