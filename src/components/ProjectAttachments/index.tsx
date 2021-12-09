import { useState } from 'react';
import { Row, Col, ListGroup, Modal, Form, Button, Spinner } from 'react-bootstrap';
import { FaPencilAlt, FaCloudDownloadAlt } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import FileSaver from 'file-saver';

import api from '../../api/api';
import { Project } from '../Projects';
import { AlertMessage, statusModal } from '../Interfaces/AlertMessage';

export interface ProjectAttachment {
    id: string;
    name: string;
    path: string;
    received_at: Date;
    project: Project;
}

interface ProjectAttachmentsProps {
    attachment: ProjectAttachment;
    canEdit?: boolean;
    handleListAttachments?: () => Promise<void>;
}

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    received_at: Yup.date().required('Obrigatório!'),
});

const ProjectAttachments: React.FC<ProjectAttachmentsProps> = ({ attachment, canEdit = true, handleListAttachments }) => {
    const [showModalEditDoc, setShowModalEditDoc] = useState(false);

    const handleCloseModalEditDoc = () => { setShowModalEditDoc(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditDoc = () => setShowModalEditDoc(true);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");
    const [downloadingAttachment, setDownloadingAttachment] = useState(false);

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    async function handleDownloadAttachment() {
        setDownloadingAttachment(true);

        try {
            const res = await api.get(`projects/attachments/${attachment.id}`,
                { responseType: "blob" }
            );

            const fileName = `${attachment.project.customer.replaceAll('.', '')} - ${attachment.name.replaceAll('.', '')}`;

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
            await api.delete(`projects/attachments/${attachment.id}`);

            handleCloseModalEditDoc();

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
                <Row className="align-items-center">
                    <Col><span>{attachment.name}</span></Col>

                    <Col className="col-row"><span>{`Recebido em ${format(new Date(attachment.received_at), 'dd/MM/yyyy')}`}</span></Col>

                    <Col className="col-row text-right">
                        <Button
                            variant="outline-success"
                            className="button-link"
                            onClick={handleDownloadAttachment}
                            title="Baixar o anexo."
                        >
                            {downloadingAttachment ? <Spinner animation="border" variant="success" size="sm" /> : <FaCloudDownloadAlt />}
                        </Button>
                    </Col>

                    {
                        canEdit && <Col className="col-row text-right">
                            <Button
                                variant="outline-success"
                                className="button-link"
                                onClick={handleShowModalEditDoc}
                                title="Editar o anexo."
                            >
                                <FaPencilAlt /> Editar
                            </Button>
                        </Col>
                    }
                </Row>
            </ListGroup.Item>

            <Modal show={showModalEditDoc} onHide={handleCloseModalEditDoc}>
                <Modal.Header closeButton>
                    <Modal.Title>Edtiar anexo</Modal.Title>
                </Modal.Header>
                <Formik
                    initialValues={
                        {
                            name: attachment.name,
                            received_at: format(new Date(attachment.received_at), 'yyyy-MM-dd'),
                        }
                    }
                    onSubmit={async values => {
                        setTypeMessage("waiting");
                        setMessageShow(true);

                        try {
                            await api.put(`projects/attachments/${attachment.id}`, {
                                name: values.name,
                                received_at: `${values.received_at} 12:00:00`,
                            });

                            if (handleListAttachments) await handleListAttachments();

                            setTypeMessage("success");

                            setTimeout(() => {
                                setMessageShow(false);
                                handleCloseModalEditDoc();
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
                    }}
                    validationSchema={validationSchema}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                        <Form onSubmit={handleSubmit}>
                            <Modal.Body>
                                <Row className="align-items-end mb-3">
                                    <Form.Group as={Col} sm={10} controlId="formGridName">
                                        <Form.Label>Nome do anexo</Form.Label>
                                        <Form.Control type="text"
                                            placeholder="Nome"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.name}
                                            name="name"
                                            isInvalid={!!errors.name && touched.name}
                                        />
                                        <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Group as={Col} sm={2} controlId="formGridReceivedAt">
                                        <Button
                                            variant="outline-success"
                                            className="button-link"
                                            onClick={handleDownloadAttachment}
                                            title="Baixar o anexo."
                                        >
                                            {
                                                downloadingAttachment ? <Spinner animation="border" variant="success" size="sm" /> :
                                                    <FaCloudDownloadAlt />
                                            }
                                        </Button>
                                    </Form.Group>
                                </Row>

                                <Form.Group as={Row} controlId="formGridReceivedAt">
                                    <Form.Label column sm={7}>Data do recebimento</Form.Label>
                                    <Col sm={5}>
                                        <Form.Control
                                            type="date"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.received_at}
                                            name="received_at"
                                            isInvalid={!!errors.received_at && touched.received_at}
                                        />
                                        <Form.Control.Feedback type="invalid">{touched.received_at && errors.received_at}</Form.Control.Feedback>
                                    </Col>
                                </Form.Group>

                            </Modal.Body>
                            <Modal.Footer>
                                {
                                    messageShow ? <AlertMessage status={typeMessage} /> :
                                        <>
                                            <Button variant="secondary" onClick={handleCloseModalEditDoc}>Cancelar</Button>
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
                            </Modal.Footer>
                        </Form>
                    )}
                </Formik>
            </Modal>
        </>
    )
}

export default ProjectAttachments;