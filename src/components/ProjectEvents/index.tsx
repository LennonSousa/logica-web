import { useState } from 'react';
import { Button, Col, Form, ListGroup, Modal, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import { FaCheck, FaClock } from 'react-icons/fa';

import api from '../../api/api';
import { EventProject } from '../EventsProject';
import { Project } from '../Projects';
import { AlertMessage, statusModal } from '../Interfaces/AlertMessage'

export interface ProjectEvent {
    id: string;
    notes: string;
    done: boolean;
    done_at: Date;
    event: EventProject;
    project?: Project;
}

interface ProjectEventProps {
    projectEvent: ProjectEvent;
    listEvents: ProjectEvent[];
    handleListEvents?: (listEvents?: ProjectEvent[]) => Promise<void>;
    canEdit?: boolean;
    isNewItem?: boolean;
    isNewProject?: boolean;
}

const validationSchema = Yup.object().shape({
    notes: Yup.string().notRequired(),
});

const ProjectEvent: React.FC<ProjectEventProps> = ({
    projectEvent,
    handleListEvents,
    listEvents,
    canEdit = true,
    isNewItem = false,
    isNewProject = false
}) => {
    const [showModalEditEvent, setShowModalEditEvent] = useState(false);

    const handleCloseModalEditEvent = () => setShowModalEditEvent(false);

    const handleShowModalEditStatus = () => setShowModalEditEvent(true);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    function handleEdit() {
        canEdit && handleShowModalEditStatus();
    }

    return (
        <>
            <ListGroup.Item
                variant="light"
                action={canEdit}
                onClick={handleEdit}
            >
                <Row className="align-items-center">
                    <Col sm={4}>
                        <span className="text-wrap">{projectEvent.event.description}</span>
                    </Col>

                    <Col sm={5}>
                        <span className="text-wrap">{projectEvent.notes}</span>
                    </Col>

                    <Col className="text-center">
                        {
                            projectEvent.done && <>
                                <FaCheck />{` `}
                                <span>
                                    {format(new Date(projectEvent.done_at), 'dd/MM/yyyy')}
                                </span>
                            </>
                        }
                    </Col>
                </Row>
            </ListGroup.Item>

            <Modal show={showModalEditEvent} onHide={() => handleCloseModalEditEvent()}>
                <Modal.Header closeButton>
                    <Modal.Title>Edtiar evento</Modal.Title>
                </Modal.Header>
                <Formik
                    initialValues={
                        {
                            notes: projectEvent.notes,
                            done: projectEvent.done,
                            done_at: projectEvent.done_at,
                        }
                    }
                    onSubmit={async values => {
                        setTypeMessage("waiting");
                        setMessageShow(true);

                        try {
                            if (isNewItem && isNewProject) {
                                const newListItem: ProjectEvent[] = listEvents.map(event => {
                                    if (event.id === projectEvent.id) {
                                        return {
                                            ...event,
                                            notes: values.notes,
                                            done: values.done,
                                            done_at: values.done_at,
                                        }
                                    }
                                    return event;
                                });

                                if (handleListEvents) await handleListEvents(newListItem);
                            }
                            else {
                                if (projectEvent.id === '0') {
                                    await api.post('projects/events', {
                                        notes: values.notes,
                                        done: values.done,
                                        done_at: values.done_at,
                                        event: projectEvent.event.id,
                                        project: projectEvent.project?.id,
                                    });
                                }
                                else {
                                    await api.put(`projects/events/${projectEvent.id}`, {
                                        notes: values.notes,
                                        done: values.done,
                                        done_at: values.done_at,
                                    });
                                }

                                if (handleListEvents) await handleListEvents();
                            }

                            setTypeMessage("success");

                            setTimeout(() => {
                                setMessageShow(false);
                                handleCloseModalEditEvent();
                            }, 1000);
                        }
                        catch (err) {
                            console.log('error edit projectEvent.');
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
                                <Row className="mb-3">
                                    <Col>
                                        <h6 className="form-control-plaintext text-success text-wrap">{projectEvent.event.description}</h6>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3" controlId="projectEventFormGridDescription">
                                    <Form.Label>Descrição</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        style={{ resize: 'none' }}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.notes}
                                        name="notes"
                                        isInvalid={!!errors.notes && touched.notes}
                                    />
                                    <Form.Control.Feedback type="invalid">{touched.notes && errors.notes}</Form.Control.Feedback>
                                </Form.Group>

                                <Button
                                    variant={values.done ? 'success' : 'secondary'}
                                    type="button"
                                    onClick={() => {
                                        setFieldValue('done', !values.done);
                                        setFieldValue('finished_at', new Date());
                                    }}
                                    style={{ width: '100%' }}
                                >
                                    {
                                        values.done ? <span><FaCheck /> concluído</span> :
                                            <span><FaClock /> marcar como concluído</span>
                                    }
                                </Button>

                            </Modal.Body>
                            <Modal.Footer>
                                {
                                    messageShow ? <AlertMessage status={typeMessage} /> :
                                        <>
                                            <Button variant="secondary" onClick={() => handleCloseModalEditEvent()}>Cancelar</Button>
                                            <Button variant="success" type="submit">Salvar</Button>
                                        </>

                                }
                            </Modal.Footer>
                        </Form>
                    )}
                </Formik>
            </Modal>
        </>
    )
}

export default ProjectEvent;