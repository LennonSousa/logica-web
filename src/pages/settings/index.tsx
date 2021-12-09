import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { NextSeo } from 'next-seo';
import { Badge, Button, CloseButton, Col, Container, Form, Image, ListGroup, Modal, Row } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { TokenVerify } from '../../utils/tokenVerify';
import { SideBarContext } from '../../contexts/SideBarContext';
import { AuthContext } from '../../contexts/AuthContext';
import { can } from '../../components/Users';
import Notifications, { Notification } from '../../components/Notifications';
import { EstimateStatus } from '../../components/EstimateStatus';
import { EventProject } from '../../components/EventsProject';
import { PageWaiting } from '../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../components/Interfaces/AlertMessage';

const validationSchema = Yup.object().shape({
    to: Yup.string().email('E-mail inválido!').notRequired(),
    recipients: Yup.number().min(1, 'Adicione pelo menos um destinatário.').required('Adicione pelo menos um destinatário.'),
    group: Yup.mixed().oneOf([
        'estimates', 'projects'
    ]).required('Obrigatório!'),
    stageId: Yup.string().required('Obrigatório!'),
});

const NotificationsPage: NextPage = () => {
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [recipients, setRecipients] = useState<string[]>([]);
    const [estimateStatusList, setEstimateStatusList] = useState<EstimateStatus[]>([]);
    const [eventsProjectList, setEventsProjectList] = useState<EventProject[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<statusModal>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Carregando...');

    const [messageShow, setMessageShow] = useState(false);
    const [statusMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [showModalNewType, setShowModalNewType] = useState(false);

    const handleCloseModalType = () => setShowModalNewType(false);
    const handleShowModalNewType = () => setShowModalNewType(true);

    useEffect(() => {
        handleItemSideBar('settings');
        handleSelectedMenu('settings-index');

        if (user) {
            if (can(user, "settings", "read:any")) {
                api.get('notifications').then(res => {
                    setNotifications(res.data);

                    api.get('estimates/status').then(res => {
                        setEstimateStatusList(res.data);

                        api.get('events/project').then(res => {
                            setEventsProjectList(res.data);

                            setLoadingData(false);
                        }).catch(err => {
                            console.log('Error to get projects status, ', err);

                            setTypeLoadingMessage("error");
                            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                        });
                    }).catch(err => {
                        console.log('Error to get estimates status, ', err);

                        setTypeLoadingMessage("error");
                        setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    });
                }).catch(err => {
                    console.log('Error to get notifications, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                });
            }
        }
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleList() {
        const res = await api.get('notifications');

        setNotifications(res.data);
    }

    function deleteRecipient(name: string) {
        setRecipients(recipients.filter(item => { return item !== name }));
    }

    return (
        <>
            <NextSeo
                title="Configurações"
                description="Configurações da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Configurações',
                    description: 'Configurações da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Configurações | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "settings", "read:any") ? <Container className="content-page">
                                <Row>
                                    <Col>
                                        {
                                            can(user, "settings", "create") && <Button variant="outline-success" onClick={handleShowModalNewType}>
                                                <FaPlus /> Criar uma notificação
                                            </Button>
                                        }
                                    </Col>
                                </Row>

                                <article className="mt-3">
                                    {
                                        loadingData ? <Col>
                                            <Row>
                                                <Col>
                                                    <AlertMessage status={typeLoadingMessage} message={textLoadingMessage} />
                                                </Col>
                                            </Row>

                                            {
                                                typeLoadingMessage === "error" && <Row className="justify-content-center mt-3 mb-3">
                                                    <Col sm={3}>
                                                        <Image src="/assets/images/undraw_server_down_s4lk.svg" alt="Erro de conexão." fluid />
                                                    </Col>
                                                </Row>
                                            }
                                        </Col> :
                                            <Row>
                                                {
                                                    !!notifications.length ? <Col>
                                                        <ListGroup>
                                                            {
                                                                notifications && notifications.map(notification => {
                                                                    return <Notifications
                                                                        key={notification.id}
                                                                        notification={notification}
                                                                        estimateStatusList={estimateStatusList}
                                                                        eventsProjectList={eventsProjectList}
                                                                        handleList={handleList}
                                                                    />
                                                                })
                                                            }
                                                        </ListGroup>
                                                    </Col> :
                                                        <Col>
                                                            <Row>
                                                                <Col className="text-center">
                                                                    <p style={{ color: 'var(--gray)' }}>Nenhuma notificação registrada.</p>
                                                                </Col>
                                                            </Row>

                                                            <Row className="justify-content-center mt-3 mb-3">
                                                                <Col sm={3}>
                                                                    <Image src="/assets/images/undraw_not_found.svg" alt="Sem dados para mostrar." fluid />
                                                                </Col>
                                                            </Row>
                                                        </Col>
                                                }

                                                <Modal show={showModalNewType} onHide={handleCloseModalType}>
                                                    <Modal.Header closeButton>
                                                        <Modal.Title>Criar uma notificação</Modal.Title>
                                                    </Modal.Header>
                                                    <Formik
                                                        initialValues={
                                                            {
                                                                to: '',
                                                                recipients: 0,
                                                                group: '',
                                                                stageId: '',
                                                            }
                                                        }
                                                        onSubmit={async values => {
                                                            setTypeMessage("waiting");
                                                            setMessageShow(true);

                                                            try {
                                                                await api.post('notifications', {
                                                                    recipients: JSON.stringify(recipients),
                                                                    group: values.group,
                                                                    stageId: values.stageId,
                                                                });

                                                                await handleList();

                                                                setTypeMessage("success");

                                                                setRecipients([]);

                                                                setTimeout(() => {
                                                                    setMessageShow(false);
                                                                    handleCloseModalType();
                                                                }, 1000);
                                                            }
                                                            catch (err) {
                                                                console.log('error edit notification.');
                                                                console.log(err);

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
                                                                <Modal.Body>
                                                                    <Row className="align-items-end mb-3">
                                                                        <Form.Group as={Col} sm={9} controlId="formGridTo">
                                                                            <Form.Label>Destinatário</Form.Label>
                                                                            <Form.Control
                                                                                type="email"
                                                                                onChange={handleChange}
                                                                                onBlur={handleBlur}
                                                                                value={values.to}
                                                                                name="to"
                                                                                isInvalid={!!errors.to && touched.to}
                                                                            />
                                                                            <Form.Control.Feedback type="invalid">{touched.to && errors.to}</Form.Control.Feedback>
                                                                        </Form.Group>

                                                                        <Col>
                                                                            <Button
                                                                                title="Adicionar destinatário"
                                                                                variant="success"
                                                                                onClick={() => {
                                                                                    const updatedRecipients = [...recipients, values.to];

                                                                                    setRecipients(updatedRecipients);

                                                                                    setFieldValue('to', '');
                                                                                    setFieldValue('recipients', updatedRecipients.length);
                                                                                }}
                                                                                disabled={!!!values.to}
                                                                            >Adicionar</Button>
                                                                        </Col>
                                                                    </Row>

                                                                    <Row className="mb-4">
                                                                        {
                                                                            recipients.map((recipient, index) => {
                                                                                return <Col className="col-row me-2" key={index}>
                                                                                    <Badge className="me-2" bg="success">
                                                                                        {recipient} <CloseButton onClick={() => {
                                                                                            deleteRecipient(recipient);

                                                                                            setFieldValue('recipients', (recipients.length - 1));
                                                                                        }} />
                                                                                    </Badge>
                                                                                </Col>
                                                                            })
                                                                        }

                                                                        <label className="invalid-feedback" style={{ display: 'block' }}>{errors.recipients}</label>
                                                                    </Row>

                                                                    <Form.Group as={Col} className="mb-3" controlId="formGridGroup">
                                                                        <Form.Label>Grupo</Form.Label>
                                                                        <Form.Control
                                                                            as="select"
                                                                            onChange={handleChange}
                                                                            onBlur={handleBlur}
                                                                            value={values.group}
                                                                            name="group"
                                                                            isInvalid={!!errors.group && touched.group}
                                                                        >
                                                                            <option hidden>Escolha uma opção</option>
                                                                            <option value="estimates">Orçamentos</option>
                                                                            <option value="projects">Projetos</option>
                                                                        </Form.Control>
                                                                        <Form.Control.Feedback type="invalid">{touched.group && errors.group}</Form.Control.Feedback>
                                                                    </Form.Group>

                                                                    {
                                                                        !!values.group && <Form.Group as={Col} className="mb-3" controlId="formGridGroup">
                                                                            <Form.Label>Fase para notificar</Form.Label>
                                                                            <Form.Control
                                                                                as="select"
                                                                                onChange={handleChange}
                                                                                onBlur={handleBlur}
                                                                                value={values.stageId}
                                                                                name="stageId"
                                                                                isInvalid={!!errors.stageId && touched.stageId}
                                                                            >
                                                                                <option hidden>Escolha uma opção</option>
                                                                                {
                                                                                    values.group === "estimates" ? estimateStatusList.map((estimateStatus, index) => {
                                                                                        return <option key={index} value={estimateStatus.id}>{estimateStatus.name}</option>
                                                                                    }) :
                                                                                        eventsProjectList.map((event, index) => {
                                                                                            return <option key={index} value={event.id}>{event.description}</option>
                                                                                        })
                                                                                }
                                                                            </Form.Control>
                                                                            <Form.Control.Feedback type="invalid">{touched.stageId && errors.stageId}</Form.Control.Feedback>
                                                                        </Form.Group>
                                                                    }

                                                                </Modal.Body>
                                                                <Modal.Footer>
                                                                    {
                                                                        messageShow ? <AlertMessage status={statusMessage} /> :
                                                                            <>
                                                                                <Button variant="secondary" onClick={handleCloseModalType}>Cancelar</Button>
                                                                                <Button variant="success" type="submit">Salvar</Button>
                                                                            </>

                                                                    }
                                                                </Modal.Footer>
                                                            </Form>
                                                        )}
                                                    </Formik>
                                                </Modal>
                                            </Row>
                                    }
                                </article>
                            </Container> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default NotificationsPage;

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