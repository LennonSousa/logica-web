import { useContext, useEffect, useState } from 'react';
import { Button, Col, Form, InputGroup, ListGroup, Modal, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaHistory, FaPlus } from 'react-icons/fa';

import api from '../../../api/api';
import { can } from '../../Users';
import { AuthContext } from '../../../contexts/AuthContext';
import { StoresContext } from '../../../contexts/StoresContext';
import IncomeItems, { IncomeItem } from '../../IncomeItems';
import { PayType } from '../../PayTypes';
import { Project } from '../../Projects';
import { prettifyCurrency } from '../../InputMask/masks';
import { PageWaiting } from '../../PageWaiting';
import { AlertMessage, statusModal } from '../../Interfaces/AlertMessage';

export interface NewIncome {
    description: string;
    value: number;
    store: string;
    project: string;
    payType: string;
    items: IncomeItem[];
    created_by: string;
}

interface IncomeModalNewProps {
    project?: Project;
    projectIn?: boolean;
    show: boolean;
    customer?: string;
    value?: number;
    handleListIncomings(newIncome?: NewIncome): Promise<void>;
    handleCloseModal: () => void;
}

const validationSchema = Yup.object().shape({
    description: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    value: Yup.string().required('Obrigatório!'),
    store: Yup.string().required('Obrigatório!'),
    project: Yup.string().notRequired().nullable(),
    payType: Yup.string().required('Obrigatório!'),
});

const IncomeModalNew: React.FC<IncomeModalNewProps> = (
    {
        project,
        projectIn = false,
        show = false,
        customer,
        value,
        handleListIncomings,
        handleCloseModal
    }
) => {
    const { user } = useContext(AuthContext);
    const { stores } = useContext(StoresContext);

    const [payTypes, setPayTypes] = useState<PayType[]>([]);
    const [incomeItems, setIncomeItems] = useState<IncomeItem[]>([]);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [hasErrors, setHasErrors] = useState(false);

    useEffect(() => {
        setHasErrors(false);

        if (show) {
            setIncomeItems([]);

            api.get('payments/types').then(res => {
                setPayTypes(res.data);
            }).catch(err => {
                console.log('Error to get project status, ', err);

                setHasErrors(true);
            });
        }

    }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleNewItem() {
        setIncomeItems([...incomeItems, {
            id: String(incomeItems.length),
            description: 'Novo pagamento',
            value: 0,
            is_paid: false,
            received_at: new Date(),
        }]);
    }

    async function handleListItems(updatedNewItem?: IncomeItem, toDelete?: boolean) {
        if (updatedNewItem) {
            if (toDelete) {
                setIncomeItems(incomeItems.filter(item => {
                    return item.id !== updatedNewItem.id;
                }));

                return;
            }

            setIncomeItems(incomeItems.map(item => {
                if (item.id === updatedNewItem.id) return updatedNewItem;

                return item;
            }));
        }
    }

    return (
        <Modal size="lg" show={show} onHide={handleCloseModal}>
            <Modal.Header closeButton>
                <Modal.Title>Criar receita</Modal.Title>
            </Modal.Header>
            {
                user ? <>
                    {
                        !hasErrors ? <>
                            <Formik
                                initialValues={
                                    {
                                        description: customer ? `Projeto ${customer.substring(0, 49)}` : '',
                                        value: value ? prettifyCurrency(value.toFixed(2)) : '0,00',
                                        store: project ? project.store.id : user.store_only ? user.store.id : '',
                                        project: project ? project.id : '',
                                        payType: '',
                                    }
                                }
                                onSubmit={async values => {
                                    setTypeMessage("waiting");
                                    setMessageShow(true);

                                    try {
                                        if (projectIn) {
                                            const newIncome: NewIncome = {
                                                description: values.description,
                                                value: Number(values.value.replaceAll(".", "").replaceAll(",", ".")),
                                                store: values.store,
                                                project: values.project,
                                                payType: values.payType,
                                                items: incomeItems,
                                                created_by: user.id,
                                            }

                                            if (handleListIncomings) await handleListIncomings(newIncome);
                                        }
                                        else {
                                            await api.post('incomings', {
                                                description: values.description,
                                                value: Number(values.value.replaceAll(".", "").replaceAll(",", ".")),
                                                store: values.store,
                                                project: values.project,
                                                payType: values.payType,
                                                items: incomeItems,
                                            });

                                            if (handleListIncomings) await handleListIncomings();

                                            setTypeMessage("success");

                                            setTimeout(() => {
                                                setMessageShow(false);
                                                handleCloseModal();
                                            }, 1000);
                                        }
                                    }
                                    catch (err) {
                                        console.log('error edit data.');
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
                                            <Form.Group className="mb-3" controlId="incomeFormGridDescription">
                                                <Form.Label>Descrição</Form.Label>
                                                <Form.Control
                                                    placeholder="Descrição da despesa"
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    value={values.description}
                                                    name="description"
                                                    isInvalid={!!errors.description && touched.description}
                                                />
                                                <Form.Control.Feedback type="invalid">{touched.description && errors.description}</Form.Control.Feedback>
                                                <Form.Text className="text-muted text-right">{`${values.description.length}/50 caracteres.`}</Form.Text>
                                            </Form.Group>

                                            <Row className="mb-3">
                                                <Form.Group as={Col} sm={3} controlId="formGridValue">
                                                    <Form.Label>Valor</Form.Label>
                                                    <InputGroup className="mb-2">
                                                        <InputGroup.Text id="btnGroupValue">R$</InputGroup.Text>
                                                        <Form.Control
                                                            type="text"
                                                            onChange={(e) => {
                                                                setFieldValue('value', prettifyCurrency(e.target.value));
                                                            }}
                                                            onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                setFieldValue('value', prettifyCurrency(e.target.value));
                                                            }}
                                                            value={values.value}
                                                            name="value"
                                                            disabled={projectIn}
                                                            isInvalid={!!errors.value && touched.value}
                                                            aria-label="Valor do projeto"
                                                            aria-describedby="btnGroupValue"
                                                        />
                                                    </InputGroup>
                                                    <Form.Control.Feedback type="invalid">{touched.value && errors.value}</Form.Control.Feedback>
                                                </Form.Group>

                                                <Form.Group as={Col} sm={5} controlId="formGridPayType">
                                                    <Form.Label>Forma de pagamento</Form.Label>
                                                    <Form.Control
                                                        as="select"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.payType}
                                                        name="payType"
                                                        isInvalid={!!errors.payType && touched.payType}
                                                    >
                                                        <option hidden>...</option>
                                                        {
                                                            payTypes.map((payType, index) => {
                                                                return <option key={index} value={payType.id}>{payType.name}</option>
                                                            })
                                                        }
                                                    </Form.Control>
                                                    <Form.Control.Feedback type="invalid">{touched.payType && errors.payType}</Form.Control.Feedback>
                                                </Form.Group>
                                            </Row>

                                            <Row className="mb-3">
                                                {
                                                    !project && !user.store_only && <Form.Group as={Col} controlId="formGridStore">
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
                                        </Modal.Body>
                                        <Modal.Footer>
                                            {
                                                messageShow ? <AlertMessage status={typeMessage} /> :
                                                    <>
                                                        <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                                                        <Button variant="success" type="submit">Salvar</Button>
                                                    </>

                                            }
                                        </Modal.Footer>
                                    </Form>
                                )}
                            </Formik>

                            <Modal.Body>
                                <Row className="mb-3">
                                    <Col>
                                        <Row>
                                            <Col className="col-row">
                                                <h6 className="text-success">Pagamentos <FaHistory /></h6>
                                            </Col>

                                            <Col sm={1}>
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={handleNewItem}
                                                    title="Criar um novo pagamento para essa receita."
                                                >
                                                    <FaPlus />
                                                </Button>
                                            </Col>
                                        </Row>

                                        <Row className="mt-2">
                                            {
                                                !!incomeItems.length ? <Col>
                                                    <ListGroup className="mb-3">
                                                        {
                                                            incomeItems.map(item => {
                                                                return <IncomeItems
                                                                    key={item.id}
                                                                    item={item}
                                                                    isNewItem
                                                                    handleListItems={handleListItems}
                                                                />
                                                            })
                                                        }
                                                    </ListGroup>
                                                </Col> :
                                                    <Col>
                                                        <AlertMessage
                                                            status="warning"
                                                            message="Nenhum pagamento registrado para essa receita."
                                                        />
                                                    </Col>
                                            }
                                        </Row>
                                    </Col>
                                </Row>
                            </Modal.Body>
                        </> :
                            <PageWaiting
                                status="error"
                                message="Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos."
                            />

                    }
                </> :
                    <PageWaiting status="warning" message="Acesso negado!" />
            }
        </Modal>
    )
}

export default IncomeModalNew;