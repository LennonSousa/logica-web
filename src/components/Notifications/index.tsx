import { useEffect, useState } from 'react';
import { Badge, CloseButton, Row, Col, ListGroup, Modal, Form, Button } from 'react-bootstrap';
import { FaPencilAlt } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { EstimateStatus } from '../EstimateStatus';
import { EventProject } from '../EventsProject';
import { AlertMessage, statusModal } from '../Interfaces/AlertMessage';

type Group = "estimates" | "projects";

export interface Notification {
    id: string;
    recipients: string[];
    group: Group;
    stageId: string;
}

interface NotificationsProps {
    notification: Notification;
    estimateStatusList: EstimateStatus[];
    eventsProjectList: EventProject[];
    handleList(): Promise<void>;
}

const validationSchema = Yup.object().shape({
    to: Yup.string().email('E-mail inválido!').notRequired(),
    recipients: Yup.number().min(1, 'Adicione pelo menos um destinatário.').required('Adicione pelo menos um destinatário.'),
    group: Yup.mixed().oneOf([
        'estimates', 'projects'
    ]).required('Obrigatório!'),
    stageId: Yup.string().required('Obrigatório!'),
});

const Notifications: React.FC<NotificationsProps> = ({ notification, estimateStatusList, eventsProjectList, handleList }) => {
    const [showModalEditType, setShowModalEditType] = useState(false);

    const [recipients, setRecipients] = useState<string[]>([]);
    const [stageName, setStageName] = useState("");
    const [recipientsLength, setRecipientsLength] = useState(0);

    const handleCloseModalEditType = () => { setShowModalEditType(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditType = () => setShowModalEditType(true);

    const [messageShow, setMessageShow] = useState(false);
    const [statusMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    useEffect(() => {
        setRecipients(notification.recipients);

        setRecipientsLength(notification.recipients.length);

        if (notification.group === "estimates") {
            const foundStatus = estimateStatusList.find(item => { return item.id === notification.stageId });

            if (!foundStatus) return;

            setStageName(foundStatus.name);
        }
        else {
            const foundStatus = eventsProjectList.find(item => { return item.id === notification.stageId });

            if (!foundStatus) return;

            setStageName(foundStatus.description);
        }
    }, [notification, estimateStatusList, eventsProjectList, showModalEditType]);

    async function deleteItem() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setTypeMessage("waiting");
        setMessageShow(true);

        try {
            await api.delete(`notifications/${notification.id}`);

            handleCloseModalEditType();

            handleList();
        }
        catch (err) {
            setIconDeleteConfirm(false);
            setIconDelete(true);

            setTypeMessage("error");

            setTimeout(() => {
                setMessageShow(false);
            }, 4000);

            console.log("Error to delete notification");
            console.log(err);
        }
    }

    function deleteRecipient(name: string) {
        setRecipients(recipients.filter(item => { return item !== name }));
    }

    return (
        <ListGroup.Item variant="light">
            <Row className="align-items-center">
                <Col><span>{notification.group === "estimates" ? "Orçamentos" : "Projetos"}</span></Col>

                <Col><span>{stageName}</span></Col>

                <Col>
                    <Badge className="me-2" bg="secondary">
                        {`${recipientsLength} ${recipientsLength === 1 ? 'destianatário' : 'destinatários'}`}
                    </Badge>
                </Col>

                <Col className="text-end">
                    <Button variant="outline-success" className="button-link" onClick={handleShowModalEditType}><FaPencilAlt /> Editar</Button>
                </Col>
            </Row>

            <Modal show={showModalEditType} onHide={handleCloseModalEditType}>
                <Modal.Header closeButton>
                    <Modal.Title>Edtiar notificação</Modal.Title>
                </Modal.Header>
                <Formik
                    initialValues={
                        {
                            to: '',
                            recipients: recipients.length,
                            group: notification.group,
                            stageId: notification.stageId
                        }
                    }
                    onSubmit={async values => {
                        setTypeMessage("waiting");
                        setMessageShow(true);

                        try {
                            await api.put(`notifications/${notification.id}`, {
                                recipients: JSON.stringify(recipients),
                                group: values.group,
                                stageId: values.stageId,
                            });

                            await handleList();

                            setTypeMessage("success");

                            setTimeout(() => {
                                setMessageShow(false);
                                handleCloseModalEditType();
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
                                            return <Col className="col-row mb-1 me-2" key={index}>
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
                                            <Button variant="secondary" onClick={handleCloseModalEditType}>Cancelar</Button>
                                            <Button
                                                title="Excluir item"
                                                variant={iconDelete ? "outline-danger" : "outline-warning"}
                                                onClick={deleteItem}
                                            >
                                                {
                                                    iconDelete && "Excluir"
                                                }

                                                {
                                                    iconDeleteConfirm && "Confirmar"
                                                }
                                            </Button>
                                            <Button variant="success" type="submit">Salvar</Button>
                                        </>

                                }
                            </Modal.Footer>
                        </Form>
                    )}
                </Formik>
            </Modal>
        </ListGroup.Item>
    )
}

export default Notifications;