import { useState } from 'react';
import { Row, Col, ListGroup, Modal, Form, Button, Spinner } from 'react-bootstrap';
import { FaPencilAlt, FaCloudDownloadAlt, FaTimes } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import FileSaver from 'file-saver';

import api from '../../api/api';
import { Income } from '../Incomings';
import { AlertMessage, statusModal } from '../Interfaces/AlertMessage'

export interface IncomeAttachment {
    id: string;
    name: string;
    path: string;
    received_at: Date;
    income: Income;
}

interface IncomeAttachmentsProps {
    attachment: IncomeAttachment;
    canEdit?: boolean;
    handleListAttachments?: () => Promise<void>;
}

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    received_at: Yup.date().required('Obrigatório!'),
});

const attachmentValidationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    received_at: Yup.date().required('Obrigatório!'),
});

const IncomeAttachments: React.FC<IncomeAttachmentsProps> = ({ attachment, canEdit = true, handleListAttachments }) => {
    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");
    const [downloadingAttachment, setDownloadingAttachment] = useState(false);

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    const [showEditAttachment, setShowEditAttachment] = useState(false);

    const handleCloseEditAttachment = () => setShowEditAttachment(false);
    const handleShowEditAttachment = () => setShowEditAttachment(true);

    async function handleDownloadAttachment() {
        setDownloadingAttachment(true);

        try {
            const res = await api.get(`incomings/attachments/${attachment.id}`,
                { responseType: "blob" }
            );

            const fileName = `${attachment.income.description.replaceAll('.', '')} - ${attachment.name.replaceAll('.', '')}`;

            FileSaver.saveAs(res.data, fileName);
        }
        catch (err) {
            console.log("Error to get attachment");
            console.log(err);
        }

        setDownloadingAttachment(false);
    }

    async function deleteProduct() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setTypeMessage("waiting");
        setMessageShow(true);

        try {
            await api.delete(`incomings/attachments/${attachment.id}`);

            handleCloseEditAttachment();

            if (handleListAttachments) handleListAttachments();
        }
        catch (err) {
            setIconDeleteConfirm(false);
            setIconDelete(true);

            setTypeMessage("error");
            setMessageShow(true);

            setTimeout(() => {
                setMessageShow(false);
            }, 4000);

            console.log("Error to delete product");
            console.log(err);
        }
    }

    return (
        <>
            <ListGroup.Item variant="light">
                <Formik
                    initialValues={
                        {
                            name: attachment.name,
                            received_at: format(new Date(attachment.received_at), 'yyyy-MM-dd'),
                        }
                    }
                    onSubmit={async values => {
                        if (canEdit) {
                            setTypeMessage("waiting");
                            setMessageShow(true);

                            try {
                                await api.put(`incomings/attachments/${attachment.id}`, {
                                    name: values.name,
                                    received_at: `${values.received_at} 12:00:00`,
                                });

                                if (handleListAttachments) await handleListAttachments();

                                setTypeMessage("success");

                                setTimeout(() => {
                                    setMessageShow(false);
                                    handleCloseEditAttachment();
                                }, 1000);
                            }
                            catch (err) {
                                console.log('error create category.');
                                console.log(err);

                                setTypeMessage("error");

                                setTimeout(() => {
                                    setMessageShow(false);
                                }, 4000);
                            }
                        }
                    }}
                    validationSchema={attachmentValidationSchema}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                        <Form onSubmit={handleSubmit}>
                            <Row className={showEditAttachment ? 'align-items-start' : 'align-items-center'}>
                                {
                                    showEditAttachment ? <Form.Group as={Col} sm={5} controlId="attachmentFormGridName">
                                        <Form.Label>Nome do documento</Form.Label>
                                        <Form.Control type="text"
                                            placeholder="Nome"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.name}
                                            name="name"
                                            disabled={!canEdit}
                                            isInvalid={!!errors.name && touched.name}
                                        />
                                        <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                        <Form.Text className="text-muted text-right">{`${values.name.length}/50 caracteres.`}</Form.Text>
                                    </Form.Group> :
                                        <Col sm={5}><span>{attachment.name}</span></Col>
                                }

                                {
                                    showEditAttachment ? <Form.Group as={Col} sm={4} controlId="formGridReceivedAt">
                                        <Form.Label>Data do recebimento</Form.Label>
                                        <Form.Control
                                            type="date"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.received_at}
                                            name="received_at"
                                            disabled={!canEdit}
                                            isInvalid={!!errors.received_at && touched.received_at}
                                        />
                                        <Form.Control.Feedback type="invalid">{touched.received_at && errors.received_at}</Form.Control.Feedback>
                                    </Form.Group> :
                                        <Col sm={4} className="col-row">
                                            <span>
                                                {`Recebido em ${format(new Date(attachment.received_at), 'dd/MM/yyyy')}`}
                                            </span>
                                        </Col>
                                }

                                <Col className="col-row text-right">
                                    <Button
                                        variant="outline-success"
                                        className="button-link"
                                        onClick={handleDownloadAttachment}
                                        title="Baixar o anexo."
                                    >
                                        {
                                            downloadingAttachment ? <Spinner animation="border" variant="success" size="sm" /> : <FaCloudDownloadAlt />
                                        }
                                    </Button>
                                </Col>

                                {
                                    canEdit && <Col className="col-row text-right">
                                        <Button
                                            variant={showEditAttachment ? "outline-danger" : "outline-success"}
                                            className="button-link"
                                            onClick={() => { showEditAttachment ? handleCloseEditAttachment() : handleShowEditAttachment(); }}
                                            title={showEditAttachment ? "Fechar." : "Editar o anexo."}
                                        >
                                            {showEditAttachment ? <FaTimes /> : <FaPencilAlt />}
                                        </Button>
                                    </Col>
                                }
                            </Row>

                            {
                                showEditAttachment && <Row className="align-items-center">
                                    <Modal.Footer>
                                        {
                                            messageShow ? <AlertMessage status={typeMessage} /> :
                                                <>
                                                    <Button variant="secondary" onClick={handleCloseEditAttachment}>Cancelar</Button>
                                                    {
                                                        canEdit && <>
                                                            <Button
                                                                title="Delete product"
                                                                variant={iconDelete ? "outline-danger" : "outline-warning"}
                                                                onClick={deleteProduct}
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
                                </Row>
                            }
                        </Form>
                    )}
                </Formik>
            </ListGroup.Item>
        </>
    )
}

export default IncomeAttachments;