import { useContext, useState } from 'react';
import { Button, Col, Form, ListGroup, Modal, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';

import api from '../../../api/api';
import { StoresContext } from '../../../contexts/StoresContext';
import { Estimate } from '../../Estimates';
import { AlertMessage, statusModal } from '../AlertMessage';

interface SearchProps {
    show: boolean,
    storeOnly?: boolean,
    handleSearchTo: (estimate: Estimate) => void;
    handleCloseSearchModal: () => void;
}

const validationSchema = Yup.object().shape({
    customer: Yup.string().required('Obrigatório!'),
});

const SearchEstimates: React.FC<SearchProps> = ({ show, handleSearchTo, handleCloseSearchModal, storeOnly = false }) => {
    const { stores } = useContext(StoresContext);

    const [estimateResults, setEstimateResults] = useState<Estimate[]>([]);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    return (
        <Modal show={show} onHide={handleCloseSearchModal}>
            <Modal.Header closeButton>
                <Modal.Title>Lista de orçamentos</Modal.Title>
            </Modal.Header>

            <Formik
                initialValues={{
                    customer: '',
                    store: 'all',
                }}
                onSubmit={async values => {
                    setTypeMessage("waiting");
                    setMessageShow(true);

                    try {
                        const res = await api.get(
                            `estimates?customer=${values.customer}${!storeOnly && values.store !== "all" ? `&store=${values.store}` : ''}`
                        );

                        setEstimateResults(res.data);

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
                {({ handleBlur, handleChange, handleSubmit, values, errors, touched }) => (
                    <>
                        <Modal.Body>
                            <Form onSubmit={handleSubmit}>
                                {
                                    !storeOnly && <Form.Group className="mb-3" controlId="formGridStore">
                                        <Form.Label>Loja</Form.Label>
                                        <Form.Control
                                            as="select"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.store}
                                            name="store"
                                            isInvalid={!!errors.store && touched.store}
                                        >
                                            <option value="all">Todas as lojas</option>
                                            {
                                                stores.map((store, index) => {
                                                    return <option key={index} value={store.id}>{store.name}</option>
                                                })
                                            }
                                        </Form.Control>
                                        <Form.Control.Feedback type="invalid">{touched.store && errors.store}</Form.Control.Feedback>
                                    </Form.Group>
                                }

                                <Form.Group controlId="estimateFormGridName">
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
                                                !!estimateResults.length ? <ListGroup className="mt-3 mb-3">
                                                    {
                                                        estimateResults.map((estimate, index) => {
                                                            return <ListGroup.Item
                                                                key={index}
                                                                action
                                                                variant="light"
                                                                onClick={() => handleSearchTo(estimate)}
                                                            >
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-wrap">{estimate.customer}</h6>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-italic text-wrap">
                                                                            {`${estimate.document} - ${estimate.city}/${estimate.state}`}
                                                                        </span>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-italic text-wrap">
                                                                            {`${format(new Date(estimate.updated_at), 'dd/MM/yyy')} - ${estimate.created_by}`}
                                                                        </span>
                                                                    </Col>
                                                                </Row>
                                                            </ListGroup.Item>
                                                        })
                                                    }
                                                </ListGroup> :
                                                    <AlertMessage status="warning" message="Nenhum orçamento encontrado!" />
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

export default SearchEstimates;