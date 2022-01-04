import { useState } from 'react';
import { Row, Col, InputGroup, ListGroup, Form, Button, Spinner } from 'react-bootstrap';
import { FaCheck, FaSave, FaTrashAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { Income } from '../Incomings';
import { prettifyCurrency } from '../InputMask/masks';

export interface IncomeItem {
    id: string;
    description: string;
    value: number;
    is_paid: boolean;
    received_at: Date;
    income?: Income;
}

interface IncomeItemsProps {
    item: IncomeItem;
    isNewItem?: boolean;
    canEdit?: boolean;
    handleListItems: (updatedNewItem?: IncomeItem, toDelete?: boolean) => Promise<void>;
}

type savingStatus = "saved" | "touched" | "saving";

const validationSchema = Yup.object().shape({
    description: Yup.string().required('Obrigatório!').max(15, 'Deve conter no máximo 15 caracteres!'),
    value: Yup.string().required('Obrigatório'),
    is_paid: Yup.boolean().notRequired(),
    received_at: Yup.date().notRequired(),
});

const IncomeItems: React.FC<IncomeItemsProps> = ({ item, isNewItem = false, canEdit = true, handleListItems }) => {
    const [fieldsFormTouched, setFieldsFormTouched] = useState(false);
    const [savingItemStatus, setSavingItemStatus] = useState<savingStatus>("saved");
    const [waitingDelete, setWaitingDelete] = useState(false);

    async function deleteItem() {
        setWaitingDelete(true);

        try {
            if (isNewItem) {
                handleListItems(item, true);
            }
            else {
                await api.delete(`incomings/items/${item.id}`);

                handleListItems();
            }
        }
        catch (err) {
            console.log("Error to delete income item");
            console.log(err);

            setWaitingDelete(false);
        }
    }

    return (
        <ListGroup.Item variant="light">
            <Formik
                initialValues={{
                    description: item.description,
                    value: prettifyCurrency(String(item.value)),
                    is_paid: item.is_paid,
                    received_at: format(new Date(item.received_at), 'yyyy-MM-dd'),
                }}

                onSubmit={async values => {
                    if (canEdit) {
                        setFieldsFormTouched(false);

                        setSavingItemStatus("saving");

                        try {
                            if (isNewItem) {
                                const updatedNewItem: IncomeItem = {
                                    ...item,
                                    description: values.description,
                                    value: Number(values.value.replaceAll(".", "").replaceAll(",", ".")),
                                    is_paid: values.is_paid,
                                    received_at: new Date(`${values.received_at} 12:00:00`),
                                }

                                handleListItems(updatedNewItem);
                            }
                            else {
                                await api.put(`incomings/items/${item.id}`, {
                                    description: values.description,
                                    value: Number(values.value.replaceAll(".", "").replaceAll(",", ".")),
                                    is_paid: values.is_paid,
                                    received_at: `${values.received_at} 12:00:00`,
                                });

                                handleListItems();
                            }
                        }
                        catch (err) {
                            console.log('error to update items day');
                            console.log(err);
                        }

                        setSavingItemStatus("saved");
                    }
                }}
                validationSchema={validationSchema}
            >
                {({ handleBlur, handleSubmit, values, setFieldValue, touched, errors }) => (
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Form.Group as={Col} sm={4} controlId="incomeItemFormGridDescription">
                                <Form.Control
                                    placeholder="Descrição da despesa"
                                    onChange={(e) => {
                                        setFieldValue('description', e.target.value, true);
                                        setFieldsFormTouched(true);
                                        setSavingItemStatus("touched");
                                    }}
                                    value={values.description}
                                    name="description"
                                    disabled={!canEdit}
                                    isInvalid={!!errors.description && touched.description}
                                />
                                <Form.Control.Feedback type="invalid">{touched.description && errors.description}</Form.Control.Feedback>
                                <Form.Text className="text-muted text-right">{`${values.description.length}/15 caracteres.`}</Form.Text>
                            </Form.Group>

                            <Form.Group as={Col} sm={3} controlId="incomeItemFormGridValue">
                                <InputGroup>
                                    <InputGroup.Text id="btnGroupValue">R$</InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('value', prettifyCurrency(e.target.value));
                                            setFieldsFormTouched(true);
                                            setSavingItemStatus("touched");
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('value', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.value}
                                        name="value"
                                        disabled={!canEdit}
                                        isInvalid={!!errors.value && touched.value}
                                        aria-label="Valor do projeto"
                                        aria-describedby="btnGroupValue"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.value && errors.value}</Form.Control.Feedback>
                            </Form.Group>

                            <Col>
                                <Form.Check
                                    id="is_paid"
                                    type="switch"
                                    label="Pago?"
                                    checked={values.is_paid}
                                    onChange={() => {
                                        setFieldValue('is_paid', !values.is_paid);
                                        setFieldsFormTouched(true);
                                        setSavingItemStatus("touched");
                                    }}
                                    disabled={!canEdit}
                                />
                            </Col>

                            <Form.Group as={Col} sm={3} controlId="incomeItemFormGridReceivedAt">
                                <Form.Control
                                    type="date"
                                    onChange={(e) => {
                                        setFieldValue('received_at', e.target.value, true);
                                        setFieldsFormTouched(true);
                                        setSavingItemStatus("touched");
                                    }}
                                    onBlur={handleBlur}
                                    value={values.received_at}
                                    name="received_at"
                                    disabled={!canEdit}
                                    isInvalid={!!errors.received_at && touched.received_at}
                                />
                                <Form.Control.Feedback type="invalid">{touched.received_at && errors.received_at}</Form.Control.Feedback>
                            </Form.Group>
                        </Row>

                        {
                            canEdit && <>
                                <Row className="justify-content-end align-items-end">
                                    <Col className="col-row">
                                        <Button variant="outline-danger" onClick={deleteItem}>
                                            {
                                                waitingDelete ? <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                /> : <FaTrashAlt />
                                            }
                                        </Button>
                                    </Col>

                                    <Col className="col-row">
                                        <Button variant="outline-success" disabled={!fieldsFormTouched} type="submit" >
                                            {
                                                savingItemStatus === "saving" ? <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                /> : (
                                                    savingItemStatus === "saved" ? <FaCheck /> : savingItemStatus === "touched" && <FaSave />
                                                )
                                            }
                                        </Button>
                                    </Col>
                                </Row>
                            </>
                        }
                    </Form>
                )}
            </Formik>
        </ListGroup.Item>
    )
}

export default IncomeItems;
