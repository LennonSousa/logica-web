import { useState } from 'react';
import { Row, Col, InputGroup, ListGroup, Modal, Form, Button } from 'react-bootstrap';
import { FaPencilAlt } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { Panel } from '../Panels';
import { AlertMessage, statusModal } from '../Interfaces/AlertMessage';
import { prettifyCurrency } from '../InputMask/masks';

export interface PanelPrice {
    id: string;
    potency: number;
    price: number;
    inversor: string;
    panel: Panel;
}

interface PanelPricesProps {
    panelPrice: PanelPrice;
    canEdit?: boolean;
    handleListPanelPrices?: () => Promise<void>;
}

const validationSchema = Yup.object().shape({
    potency: Yup.string().notRequired(),
    price: Yup.string().notRequired(),
    inversor: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
});

const PanelPrices: React.FC<PanelPricesProps> = ({ panelPrice, canEdit = true, handleListPanelPrices }) => {
    const [showModalEditType, setShowModalEditType] = useState(false);

    const handleCloseModalEditType = () => { setShowModalEditType(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditType = () => setShowModalEditType(true);

    const [messageShow, setMessageShow] = useState(false);
    const [statusMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    async function deleteLine() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setTypeMessage("waiting");
        setMessageShow(true);

        try {
            await api.delete(`panels/prices/${panelPrice.id}`);

            handleCloseModalEditType();

            if (handleListPanelPrices) handleListPanelPrices();
        }
        catch (err) {
            setIconDeleteConfirm(false);
            setIconDelete(true);

            setTypeMessage("error");

            setTimeout(() => {
                setMessageShow(false);
            }, 4000);

            console.log("Error to delete panels prices");
            console.log(err);
        }
    }

    return (
        <ListGroup.Item variant="light">
            <Row className="align-items-center">
                <Col><span>{`${prettifyCurrency(String(panelPrice.potency))} kWp`}</span></Col>

                <Col><span>{panelPrice.inversor}</span></Col>

                <Col><span>{`R$ ${prettifyCurrency(String(panelPrice.price))}`}</span></Col>

                {
                    canEdit && <Col className="col-row text-end">
                        <Button variant="outline-success" className="button-link" onClick={handleShowModalEditType}><FaPencilAlt /> Editar</Button>
                    </Col>
                }
            </Row>

            <Modal show={showModalEditType} onHide={handleCloseModalEditType}>
                <Modal.Header closeButton>
                    <Modal.Title>Edtiar preço</Modal.Title>
                </Modal.Header>
                <Formik
                    initialValues={
                        {
                            potency: prettifyCurrency(String(panelPrice.potency)),
                            price: prettifyCurrency(String(panelPrice.price)),
                            inversor: panelPrice.inversor,
                        }
                    }
                    onSubmit={async values => {
                        setTypeMessage("waiting");
                        setMessageShow(true);

                        try {
                            await api.put(`panels/prices/${panelPrice.id}`, {
                                potency: values.potency.replaceAll('.', '').replaceAll(',', '.'),
                                price: values.price.replaceAll('.', '').replaceAll(',', '.'),
                                inversor: values.inversor,
                            });

                            if (handleListPanelPrices) await handleListPanelPrices();

                            setTypeMessage("success");

                            setTimeout(() => {
                                setMessageShow(false);
                                handleCloseModalEditType();
                            }, 1000);
                        }
                        catch (err) {
                            console.log('error edit panel price.');
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
                                <Row>
                                    <Form.Group as={Col} sm={6} controlId="formGridPotency">
                                        <Form.Label>Potência</Form.Label>
                                        <InputGroup className="mb-2">
                                            <InputGroup.Text id="btnGroupPotency">kWp</InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                onChange={(e) => {
                                                    setFieldValue('potency', prettifyCurrency(e.target.value));
                                                }}
                                                onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                    setFieldValue('potency', prettifyCurrency(e.target.value));
                                                }}
                                                value={values.potency}
                                                name="potency"
                                                isInvalid={!!errors.potency && touched.potency}
                                                aria-label="Potência"
                                                aria-describedby="btnGroupPotency"
                                            />
                                        </InputGroup>
                                        <Form.Control.Feedback type="invalid">{touched.potency && errors.potency}</Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Group as={Col} sm={6} controlId="formGridPrice">
                                        <Form.Label>Valor</Form.Label>
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
                                                aria-label="Valor"
                                                aria-describedby="btnGroupPrice"
                                            />
                                        </InputGroup>
                                        <Form.Control.Feedback type="invalid">{touched.price && errors.price}</Form.Control.Feedback>
                                    </Form.Group>
                                </Row>

                                <Form.Group controlId="statusFormGridInversor">
                                    <Form.Label>Inversor</Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Inversor"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.inversor}
                                        name="inversor"
                                        isInvalid={!!errors.inversor && touched.inversor}
                                    />
                                    <Form.Control.Feedback type="invalid">{touched.inversor && errors.inversor}</Form.Control.Feedback>
                                    <Form.Text className="text-muted text-right">{`${values.inversor.length}/50 caracteres.`}</Form.Text>
                                </Form.Group>
                            </Modal.Body>
                            <Modal.Footer>
                                {
                                    messageShow ? <AlertMessage status={statusMessage} /> :
                                        <>
                                            <Button variant="secondary" onClick={handleCloseModalEditType}>Cancelar</Button>
                                            <Button
                                                title="Excluir item"
                                                variant={iconDelete ? "outline-danger" : "outline-warning"}
                                                onClick={deleteLine}
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

export default PanelPrices;