import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Col, Container, Button, ButtonGroup, ListGroup, Row, Table } from 'react-bootstrap';
import { format } from 'date-fns';
import {
    FaClipboardList,
    FaDonate,
    FaFileAlt,
    FaFileExport,
    FaHistory,
    FaPencilAlt,
    FaPrint,
    FaSolarPanel,
    FaStickyNote,
    FaUserTag,
} from 'react-icons/fa';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import { Project } from '../../../components/Projects';
import Incomings from '../../../components/Incomings';
import { EventProject } from '../../../components/EventsProject';
import ProjectEvents from '../../../components/ProjectEvents';
import { AttachmentRequired } from '../../../components/AttachmentsRequiredProject';
import ProjectAttachmentsRequired from '../../../components/ProjectAttachmentsRequired';
import ProjectAttachments from '../../../components/ProjectAttachments';

import Members from '../../../components/ProjectMembers';
import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { AlertMessage } from '../../../components/Interfaces/AlertMessage';
import { prettifyCurrency } from '../../../components/InputMask/masks';

const ProjectDetails: NextPage = () => {
    const router = useRouter();
    const { project } = router.query;

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [data, setData] = useState<Project>();
    const [documentType, setDocumentType] = useState("CPF");

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    useEffect(() => {
        if (user) {
            handleItemSideBar('projects');
            handleSelectedMenu('projects-index');

            if (can(user, "projects", "read:any") || can(user, "projects", "read:own")) {
                if (project) {
                    api.get(`projects/${project}`).then(res => {
                        let projectRes: Project = res.data;

                        if (projectRes.document.length > 14)
                            setDocumentType("CNPJ");

                        api.get('events/project').then(res => {
                            let eventsProject: EventProject[] = res.data;

                            eventsProject = eventsProject.filter(eventProject => { return eventProject.active });

                            projectRes = {
                                ...projectRes, events: eventsProject.map(eventProject => {
                                    const projectEvent = projectRes.events.find(projectEvent => { return projectEvent.event.id === eventProject.id });

                                    if (projectEvent)
                                        return { ...projectEvent, project: projectRes };

                                    return {
                                        id: '0',
                                        notes: '',
                                        done: false,
                                        done_at: new Date(),
                                        event: eventProject,
                                        project: projectRes,
                                    };
                                })
                            }
                        }).catch(err => {
                            console.log('Error to get events project to edit, ', err);

                            setTypeLoadingMessage("error");
                            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                            setHasErrors(true);
                        });

                        api.get('attachments-required/project').then(res => {
                            let attachmentsRequiredProject: AttachmentRequired[] = res.data;

                            attachmentsRequiredProject = attachmentsRequiredProject.filter(attachmentRequired => { return attachmentRequired.active });

                            projectRes = {
                                ...projectRes, attachmentsRequired: attachmentsRequiredProject.map(attachmentRequired => {
                                    const projectAttachmentRequired = projectRes.attachmentsRequired.find(projectAttachmentRequired => {
                                        return projectAttachmentRequired.attachmentRequired.id === attachmentRequired.id
                                    });

                                    if (projectAttachmentRequired)
                                        return { ...projectAttachmentRequired, project: projectRes };

                                    return {
                                        id: '0',
                                        path: null,
                                        received_at: new Date(),
                                        attachmentRequired: attachmentRequired,
                                        project: projectRes,
                                    };
                                })
                            }

                            setData(projectRes);
                            setLoadingData(false);
                        }).catch(err => {
                            console.log('Error to get attachments required project to edit, ', err);

                            setTypeLoadingMessage("error");
                            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                            setHasErrors(true);
                        });
                    }).catch(err => {
                        console.log('Error to get project: ', err);

                        setTypeLoadingMessage("error");
                        setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                        setHasErrors(true);
                    });
                }
            }
        }
    }, [user, project]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <>
            <NextSeo
                title="Editar projeto"
                description="Editar projeto da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Editar projeto',
                    description: 'Editar projeto da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Editar projeto | Plataforma Lógica Solar',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "projects", "read:any") || can(user, "projects", "read:own") ? <>
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
                                                                        <PageBack href="/projects" subTitle="Voltar para a lista de projetos" />
                                                                    </Col>

                                                                    <Col className="col-row">
                                                                        <ButtonGroup className="col-12">
                                                                            {
                                                                                can(user, "projects", "update:any") && <Button
                                                                                    title="Editar projeto."
                                                                                    variant="success"
                                                                                    onClick={() => handleRoute(`/projects/edit/${data.id}`)}
                                                                                >
                                                                                    <FaPencilAlt />
                                                                                </Button>
                                                                            }

                                                                            {
                                                                                can(user, "services", "create") && <Button
                                                                                    title="Criar ordem de serviço."
                                                                                    variant="success"
                                                                                    onClick={() => handleRoute(`/service-orders/new?from=${data.id}`)}
                                                                                >
                                                                                    <FaFileExport />
                                                                                </Button>
                                                                            }

                                                                            <Button
                                                                                title="Imprimir contrato."
                                                                                variant="success"
                                                                                onClick={() => handleRoute(`/projects/print/${data.id}`)}
                                                                            >
                                                                                <FaPrint />
                                                                            </Button>
                                                                        </ButtonGroup>
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
                                                                            <Members name={data.seller ? data.seller.name : data.created_by} />
                                                                        </Row>
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

                                                                <Row className="mb-3">
                                                                    <Col sm={4} >
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

                                                                    <Col sm={4} >
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

                                                                    <Col sm={2}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Média mensal</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`${prettifyCurrency(Number(data.months_average).toFixed(2))} kWh`} </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={2}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Previsão de aumento</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`${prettifyCurrency(Number(data.average_increase).toFixed(2))} kWh`} </h6>
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

                                                                    <Col sm={3}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Capacidade Total do Sistema Fotovoltaico</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{`${prettifyCurrency(Number(data.capacity).toFixed(2))} kWp`} </h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={5} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Inversor</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.inversor}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Orientação do telhado</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.roof_orientation}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={3} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Tipo do telhado</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.roof_type}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Painel</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.panel}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={2} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Quantidade</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.panel_amount}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                {
                                                                    can(user, "finances", "read:any") && <Row className="mb-3">
                                                                        <Col sm={3}>
                                                                            <Row>
                                                                                <Col>
                                                                                    <span className="text-success">Valor</span>
                                                                                </Col>
                                                                            </Row>

                                                                            <Row>
                                                                                <Col>
                                                                                    <h6
                                                                                        className="text-secondary"
                                                                                    >
                                                                                        {`R$ ${Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(data.price)}`}
                                                                                    </h6>
                                                                                </Col>
                                                                            </Row>
                                                                        </Col>
                                                                    </Row>
                                                                }

                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Itens <FaClipboardList /></h6>
                                                                    </Col>
                                                                </Row>

                                                                <Table striped hover size="sm" responsive>
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Quantidade</th>
                                                                            <th>Produto</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {
                                                                            data.items.map((item, index) => {
                                                                                return <tr key={index}>
                                                                                    <td>{prettifyCurrency(Number(item.amount).toFixed(2))}</td>
                                                                                    <td>{item.name}</td>
                                                                                </tr>
                                                                            })
                                                                        }
                                                                    </tbody>
                                                                </Table>

                                                                <Col className="border-top mt-3 mb-3"></Col>

                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Financiador <FaUserTag /></h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={6}>
                                                                        <h6 className="form-control-plaintext text-success">{data.financier}</h6>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">{documentType}</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.financier_document}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={4}>
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">RG</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.financier_rg}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Celular</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.financier_cellphone}</h6>
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
                                                                                <h6 className="text-secondary">{data.financier_email}</h6>
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
                                                                                <h6 className="text-secondary">{data.financier_zip_code}</h6>
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
                                                                                <h6 className="text-secondary">{data.financier_street}</h6>
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
                                                                                <h6 className="text-secondary">{data.financier_number}</h6>
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
                                                                                <h6 className="text-secondary">{data.financier_complement}</h6>
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
                                                                                <h6 className="text-secondary">{data.financier_neighborhood}</h6>
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
                                                                                <h6 className="text-secondary">{data.financier_city}</h6>
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
                                                                                <h6 className="text-secondary">{data.financier_state}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col >
                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-success">Observação <FaStickyNote /></h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-secondary text-wrap">{data.notes}</span>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={6} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Situação do projeto</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.status.name}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    {
                                                                        !user.store_only && <Col sm={6}>
                                                                            <Row>
                                                                                <Col>
                                                                                    <span className="text-success">Loja</span>
                                                                                </Col>
                                                                            </Row>

                                                                            <Row>
                                                                                <Col>
                                                                                    <h6 className="text-secondary">{data.store.name}</h6>
                                                                                </Col>
                                                                            </Row>
                                                                        </Col>
                                                                    }
                                                                </Row>

                                                                <Col className="border-top mt-3 mb-3"></Col>

                                                                <Row className="mb-3">
                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Criado em</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{format(new Date(data.created_at), 'dd/MM/yyyy')}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Usuário</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.created_by}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-3">
                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Última atualização</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{format(new Date(data.updated_at), 'dd/MM/yyyy')}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>

                                                                    <Col sm={4} >
                                                                        <Row>
                                                                            <Col>
                                                                                <span className="text-success">Usuário</span>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-secondary">{data.updated_by}</h6>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>

                                                                <Col className="border-top mt-3 mb-3"></Col>

                                                                {
                                                                    can(user, "finances", "read:any") && <Row className="mt-5 mb-3">
                                                                        <Col>
                                                                            <Row>
                                                                                <Col>
                                                                                    <h6 className="text-success">Receitas <FaDonate /></h6>
                                                                                </Col>
                                                                            </Row>

                                                                            <Row>
                                                                                {
                                                                                    !!data.incomings.length ? <Col>
                                                                                        <ListGroup>
                                                                                            {
                                                                                                data.incomings.map((income, index) => {
                                                                                                    return <Incomings
                                                                                                        key={index}
                                                                                                        income={income}
                                                                                                        canEdit={false}
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
                                                                        </Col>
                                                                    </Row>
                                                                }

                                                                <Row className="mb-5">
                                                                    <Col>
                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-success">Histórico <FaHistory /></h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row className="mt-2">
                                                                            {
                                                                                !!data.events.length ? <Col>
                                                                                    <Row className="mb-2" style={{ padding: '0 1rem' }}>
                                                                                        <Col sm={10}>
                                                                                            <h6>Descrição</h6>
                                                                                        </Col>

                                                                                        <Col className="text-center">
                                                                                            <h6>Data de registro</h6>
                                                                                        </Col>
                                                                                    </Row>

                                                                                    <Row>
                                                                                        <Col>
                                                                                            <ListGroup>
                                                                                                {
                                                                                                    data.events.map((event, index) => {
                                                                                                        return <ProjectEvents
                                                                                                            key={index}
                                                                                                            projectEvent={event}
                                                                                                            listEvents={data.events}
                                                                                                            canEdit={false}
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
                                                                            <Col>
                                                                                <h6 className="text-success">Anexos obrigatórios <FaFileAlt /></h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            {
                                                                                !!data.attachmentsRequired.length ? <Col>
                                                                                    <ListGroup>
                                                                                        {
                                                                                            data.attachmentsRequired.map((attachmentRequired, index) => {
                                                                                                return <ProjectAttachmentsRequired
                                                                                                    key={index}
                                                                                                    attachment={attachmentRequired}
                                                                                                    canEdit={false}
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
                                                                    </Col>
                                                                </Row>

                                                                <Row className="mb-5">
                                                                    <Col>
                                                                        <Row>
                                                                            <Col>
                                                                                <h6 className="text-success">Outros anexos <FaFileAlt /></h6>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            {
                                                                                !!data.attachments.length ? <Col>
                                                                                    <ListGroup>
                                                                                        {
                                                                                            data.attachments.map((attachment, index) => {
                                                                                                return <ProjectAttachments
                                                                                                    key={index}
                                                                                                    attachment={attachment}
                                                                                                    canEdit={false}
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

export default ProjectDetails;

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