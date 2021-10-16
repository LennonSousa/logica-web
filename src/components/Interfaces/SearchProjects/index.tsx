import { useState } from 'react';
import { Button, Col, Form, ListGroup, Modal, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';

import api from '../../../api/api';

import { Project } from '../../Projects';
import { AlertMessage, statusModal } from '../AlertMessage';

interface SearchProps {
    show: boolean,
    handleSearchTo: (project: Project) => void;
    handleCloseSearchModal: () => void;
}

const validationSchema = Yup.object().shape({
    customer: Yup.string().required('Obrigatório!'),
});

const SearchProjects: React.FC<SearchProps> = ({ show, handleSearchTo, handleCloseSearchModal }) => {
    const [projectResults, setProjectResults] = useState<Project[]>([]);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    return (
        <Modal show={show} onHide={handleCloseSearchModal}>
            <Modal.Header closeButton>
                <Modal.Title>Lista de projetos</Modal.Title>
            </Modal.Header>

            <Formik
                initialValues={{
                    customer: '',
                }}
                onSubmit={async values => {
                    setTypeMessage("waiting");
                    setMessageShow(true);

                    try {
                        const res = await api.get(`projects?customer=${values.customer}`);

                        setProjectResults(res.data);

                        setMessageShow(false);
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
                {({ handleSubmit, values, errors, touched }) => (
                    <>
                        <Modal.Body>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group controlId="projectFormGridName">
                                    <Form.Label>Nome do cliente</Form.Label>
                                    <Form.Control type="search"
                                        placeholder="Digite para pesquisar"
                                        autoComplete="off"
                                        onChange={(e) => {
                                            values.customer = e.target.value;

                                            handleSubmit();
                                        }}
                                        value={values.customer}
                                        isInvalid={!!errors.customer && touched.customer}
                                    />
                                    <Form.Control.Feedback type="invalid">{touched.customer && errors.customer}</Form.Control.Feedback>
                                </Form.Group>

                                <Row style={{ minHeight: '40px' }}>
                                    <Col className="pt-2">
                                        {messageShow && <AlertMessage status={typeMessage} />}
                                    </Col>
                                </Row>
                            </Form>
                        </Modal.Body>

                        <Modal.Dialog scrollable style={{ marginTop: 0, width: '100%' }}>
                            <Modal.Body style={{ maxHeight: 'calc(100vh - 3.5rem)' }}>
                                <Row style={{ minHeight: '150px' }}>
                                    {
                                        !!values.customer.length && <Col>
                                            {
                                                !!projectResults.length ? <ListGroup className="mt-3 mb-3">
                                                    {
                                                        projectResults.map((project, index) => {
                                                            return <ListGroup.Item
                                                                key={index}
                                                                action
                                                                variant="light"
                                                                onClick={() => handleSearchTo(project)}
                                                            >
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-wrap">{project.customer}</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-italic text-wrap">
                                                                            {`${project.document} - ${project.city}/${project.state}`}
                                                                        </span>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-italic text-wrap">
                                                                            {`${format(new Date(project.updated_at), 'dd/MM/yyy')} - ${project.created_by}`}
                                                                        </span>
                                                                    </Col>
                                                                </Row>
                                                            </ListGroup.Item>
                                                        })
                                                    }
                                                </ListGroup> :
                                                    <AlertMessage status="warning" message="Nenhum projeto encontrado!" />
                                            }
                                        </Col>
                                    }
                                </Row>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={handleCloseSearchModal}>Cancelar</Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </>
                )}
            </Formik>
        </Modal>
    )
}

export default SearchProjects;