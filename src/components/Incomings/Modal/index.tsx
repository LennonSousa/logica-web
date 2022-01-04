import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { Button, Col, Form, InputGroup, ListGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import { FaFileAlt, FaHistory, FaPlus, FaTimes } from 'react-icons/fa';
import { CircularProgressbar } from 'react-circular-progressbar';
import filesize from "filesize";

import api from '../../../api/api';
import { can } from '../../Users';
import { AuthContext } from '../../../contexts/AuthContext';
import { StoresContext } from '../../../contexts/StoresContext';
import { Income } from '../../Incomings';
import IncomeItems from '../../IncomeItems';
import IncomeAttachments, { IncomeAttachment } from '../../IncomeAttachments';
import { PayType } from '../../PayTypes';
import Shimmer from '../Shimmer';
import { prettifyCurrency } from '../../InputMask/masks';
import { PageWaiting } from '../../PageWaiting';
import { AlertMessage, statusModal } from '../../Interfaces/AlertMessage';

import "react-circular-progressbar/dist/styles.css";
import styles from './styles.module.css';

interface IncomeModalProps {
    incomeId: string;
    show: boolean;
    handleIncome?: () => Promise<void>;
    handleCloseModal: () => void;
}

const validationSchema = Yup.object().shape({
    description: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    value: Yup.string().required('Obrigatório!'),
    store: Yup.string().required('Obrigatório!'),
    project: Yup.string().notRequired().nullable(),
    payType: Yup.string().required('Obrigatório!'),
});

const attachmentValidationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    path: Yup.string().required('Obrigatório!'),
    size: Yup.number().lessThan(200 * 1024 * 1024, 'O arquivo não pode ultrapassar 200MB.').notRequired().nullable(),
    received_at: Yup.date().required('Obrigatório!'),
    income: Yup.string().required('Obrigatório!'),
});

const IncomeModal: React.FC<IncomeModalProps> = ({ incomeId, show = false, handleIncome, handleCloseModal }) => {
    const { user } = useContext(AuthContext);
    const { stores } = useContext(StoresContext);

    const [data, setData] = useState<Income>();
    const [payTypes, setPayTypes] = useState<PayType[]>([]);
    const [incomeAttachments, setProjectAttachments] = useState<IncomeAttachment[]>([]);
    const [userCanEdit, setUserCanEdit] = useState(false);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [hasErrors, setHasErrors] = useState(false);
    const [isCreatingItem, setIsCreatingItem] = useState(false);

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadingPercentage, setUploadingPercentage] = useState(0);
    const [messageShowNewAttachment, setMessageShowNewAttachment] = useState(false);

    const [showNewAttachment, setShowNewAttachment] = useState(false);

    const handleCloseNewAttachment = () => setShowNewAttachment(false);
    const handleShowNewAttachment = () => {
        setFileToSave(undefined);
        setFilePreview('');
        setShowNewAttachment(true);
    }

    const [fileToSave, setFileToSave] = useState<File>();
    const [filePreview, setFilePreview] = useState('');

    useEffect(() => {
        setHasErrors(false);

        if (user && can(user, "finances", "read:any") && show) {
            if (can(user, "finances", "update:any")) setUserCanEdit(true);

            api.get(`incomings/${incomeId}`).then(res => {
                const incomeRes: Income = res.data;

                setProjectAttachments(incomeRes.attachments);

                setData(incomeRes);

                api.get('payments/types').then(res => {
                    setPayTypes(res.data);
                }).catch(err => {
                    console.log('Error to get project status, ', err);

                    setHasErrors(true);
                });
            }).catch(err => {
                console.log('Error to get income to edit, ', err);

                setHasErrors(true);
            });
        }

    }, [user, show, incomeId]); // eslint-disable-line react-hooks/exhaustive-deps

    async function deleteItem() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setTypeMessage("waiting");
        setMessageShow(true);

        try {
            if (data) {
                await api.delete(`incomings/${data.id}`);

                handleCloseModal();

                if (handleIncome) handleIncome();
            }
        }
        catch (err) {
            setIconDeleteConfirm(false);
            setIconDelete(true);

            setTypeMessage("error");
            setMessageShow(true);

            setTimeout(() => {
                setMessageShow(false);
            }, 4000);

            console.log("Error to delete income");
            console.log(err);
        }
    }

    async function handleListItems() {
        try {
            if (user && can(user, "finances", "update:any") && data) {
                const res = await api.get(`incomings/${incomeId}`);

                const updatedIncome: Income = res.data;

                setData({ ...data, items: updatedIncome.items });

                if (handleIncome) await handleIncome();
            }
        }
        catch (err) {
            console.log("Error to update income");
            console.log(err);
        }
    }

    async function handleNewItem() {
        try {
            if (user && can(user, "finances", "update:any") && data) {
                setIsCreatingItem(true);

                await api.post('incomings/items', {
                    description: 'Novo pagamento',
                    value: 0,
                    income: data.id,
                });

                setIsCreatingItem(false);

                handleListItems();
            }
        }
        catch (err) {
            console.log("Error to create income");
            console.log(err);

            setIsCreatingItem(false);
        }
    }

    async function handleListAttachments() {
        try {
            const res = await api.get(`incomings/${incomeId}`);

            const updatedIncome: Income = res.data;

            setProjectAttachments(updatedIncome.attachments);
        }
        catch (err) {
            console.log('Error to get attachments to edit, ', err);

            setHasErrors(true);
        }
    }

    function handleImages(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files[0]) {
            const image = event.target.files[0];

            setFileToSave(image);

            const imagesToPreview = image.name;

            setFilePreview(imagesToPreview);
        }
    }

    return (
        <Modal size="lg" show={show} onHide={handleCloseModal}>
            <Modal.Header closeButton>
                <Modal.Title>Editar receita</Modal.Title>
            </Modal.Header>
            {
                user && can(user, "finances", "read:any") ? <>
                    {
                        data ? <>
                            <Formik
                                initialValues={
                                    {
                                        description: data.description,
                                        value: prettifyCurrency(String(data.value)),
                                        store: data.store.id,
                                        created_at: data.created_at,
                                        project: data.project ? data.project.id : '',
                                        payType: data.payType.id,
                                    }
                                }
                                onSubmit={async values => {
                                    if (userCanEdit) {
                                        setTypeMessage("waiting");
                                        setMessageShow(true);

                                        try {
                                            await api.put(`incomings/${data.id}`, {
                                                description: values.description,
                                                value: Number(values.value.replaceAll(".", "").replaceAll(",", ".")),
                                                store: values.store,
                                                project: values.project,
                                                payType: values.payType,
                                            });

                                            if (handleIncome) await handleIncome();

                                            setTypeMessage("success");

                                            setTimeout(() => {
                                                setMessageShow(false);
                                                handleCloseModal();
                                            }, 1000);
                                        }
                                        catch (err) {
                                            console.log('error edit data.');
                                            console.log(err);

                                            setTypeMessage("error");

                                            setTimeout(() => {
                                                setMessageShow(false);
                                            }, 4000);
                                        }
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
                                                    disabled={!userCanEdit}
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
                                                            disabled={!userCanEdit}
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
                                                        disabled={!userCanEdit}
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
                                                    !data.project && !user.store_only && <Form.Group as={Col} controlId="formGridStore">
                                                        <Form.Label>Loja</Form.Label>
                                                        <Form.Control
                                                            as="select"
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            value={values.store}
                                                            name="store"
                                                            disabled={!userCanEdit}
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
                                                        {
                                                            userCanEdit && <>
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

                                            {
                                                userCanEdit && <Col sm={1}>
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        onClick={handleNewItem}
                                                        title="Criar um novo pagamento para essa receita."
                                                    >
                                                        {
                                                            isCreatingItem ? <Spinner
                                                                as="span"
                                                                animation="border"
                                                                size="sm"
                                                                role="status"
                                                                aria-hidden="true"
                                                            /> :
                                                                <FaPlus />
                                                        }
                                                    </Button>
                                                </Col>
                                            }
                                        </Row>

                                        <Row className="mt-2">
                                            {
                                                !!data.items.length ? <Col>
                                                    <ListGroup className="mb-3">
                                                        {
                                                            data.items.map(item => {
                                                                return <IncomeItems
                                                                    key={item.id}
                                                                    item={item}
                                                                    handleListItems={handleListItems}
                                                                    canEdit={userCanEdit}
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

                                <Row className="mb-3">
                                    <Form.Group as={Col} controlId="formGridAttachments">
                                        <Row>
                                            <Col className="col-row">
                                                <h6 className="text-success">Anexos <FaFileAlt /></h6>
                                            </Col>

                                            {
                                                userCanEdit && <Col sm={1}>
                                                    <Button
                                                        variant={showNewAttachment ? "outline-danger" : "outline-success"}
                                                        size="sm"
                                                        onClick={() => {
                                                            showNewAttachment ? handleCloseNewAttachment() : handleShowNewAttachment();
                                                        }}
                                                        title={showNewAttachment ? "Fechar." : "Criar um novo anexo para essa receita."}
                                                    >
                                                        {showNewAttachment ? <FaTimes /> : <FaPlus />}
                                                    </Button>
                                                </Col>
                                            }
                                        </Row>

                                        {
                                            showNewAttachment && <Row className="border mb-4">
                                                <Col>
                                                    <Formik
                                                        initialValues={
                                                            {
                                                                name: '',
                                                                path: '',
                                                                size: 0,
                                                                received_at: format(new Date(), 'yyyy-MM-dd'),
                                                                income: data.id,
                                                            }
                                                        }
                                                        onSubmit={async values => {
                                                            if (userCanEdit && fileToSave) {
                                                                setUploadingPercentage(0);
                                                                setTypeMessage("success");
                                                                setIsUploading(true);
                                                                setMessageShowNewAttachment(true);

                                                                try {
                                                                    const data = new FormData();

                                                                    data.append('name', values.name);

                                                                    data.append('file', fileToSave);

                                                                    data.append('received_at', `${values.received_at} 12:00:00`);
                                                                    data.append('income', values.income);

                                                                    await api.post(`incomings/${values.income}/attachments`, data, {
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
                                                                            handleCloseNewAttachment();
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
                                                                <Row>
                                                                    <Form.Group as={Col} sm={8} controlId="attachmentFormGridName">
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

                                                                    <Form.Group as={Col} sm={4} controlId="formGridReceivedAt">
                                                                        <Form.Label>Data do recebimento</Form.Label>
                                                                        <Form.Control
                                                                            type="date"
                                                                            onChange={handleChange}
                                                                            onBlur={handleBlur}
                                                                            value={values.received_at}
                                                                            name="received_at"
                                                                            isInvalid={!!errors.received_at && touched.received_at}
                                                                        />
                                                                        <Form.Control.Feedback type="invalid">{touched.received_at && errors.received_at}</Form.Control.Feedback>
                                                                    </Form.Group>
                                                                </Row>


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
                                                                                <Button variant="secondary" onClick={handleCloseNewAttachment}>Cancelar</Button>
                                                                                <Button variant="success" type="submit">Salvar anexo</Button>
                                                                            </>
                                                                    }
                                                                </Modal.Footer>
                                                            </Form>
                                                        )}
                                                    </Formik>
                                                </Col>
                                            </Row>
                                        }

                                        <Row className="mt-2">
                                            {
                                                !!incomeAttachments.length ? <Col>
                                                    <ListGroup>
                                                        {
                                                            incomeAttachments.map(attachment => {
                                                                return <IncomeAttachments
                                                                    key={attachment.id}
                                                                    attachment={attachment}
                                                                    handleListAttachments={handleListAttachments}
                                                                    canEdit={userCanEdit}
                                                                />
                                                            })
                                                        }
                                                    </ListGroup>
                                                </Col> :
                                                    <Col>
                                                        <AlertMessage
                                                            status="warning"
                                                            message="Nenhum anexo enviado para essa receita."
                                                        />
                                                    </Col>
                                            }
                                        </Row>
                                    </Form.Group>
                                </Row>
                            </Modal.Body>
                        </> :
                            <>
                                {
                                    hasErrors ? <PageWaiting
                                        status="error"
                                        message="Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos."
                                    /> :
                                        <Shimmer />
                                }
                            </>

                    }
                </> :
                    <PageWaiting status="warning" message="Acesso negado!" />
            }
        </Modal>
    )
}

export default IncomeModal;