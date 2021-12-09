import { useState } from 'react';
import { Row, Col, ListGroup, Modal, Form, Button, Spinner } from 'react-bootstrap';
import { FaPencilAlt, FaCloudDownloadAlt } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';
import FileSaver from 'file-saver';

import api from '../../api/api';
import { Note } from '../Notes';

export interface NoteAttachment {
    id: string;
    title: string;
    path: string;
    note?: Note;
    fileToUpload?: File;
}

interface NoteAttachmentsProps {
    attachment: NoteAttachment;
    canEdit?: boolean;
    isNew?: boolean;
    handleDeleteAttachmentFromList?: (attachment: NoteAttachment) => void;
    handleListAttachments?: (attachment: NoteAttachment) => void;
}

const validationSchema = Yup.object().shape({
    title: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
});

const NoteAttachmentItem: React.FC<NoteAttachmentsProps> = ({ attachment, canEdit = true, isNew = false, handleDeleteAttachmentFromList, handleListAttachments }) => {
    const [showModalEditItem, setShowModalEditItem] = useState(false);

    const handleCloseModalEditItem = () => { setShowModalEditItem(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditItem = () => setShowModalEditItem(true);

    const [downloadingAttachment, setDownloadingAttachment] = useState(false);

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    async function handleDownloadAttachment() {
        setDownloadingAttachment(true);

        try {
            const res = await api.get(`notes/attachments/${attachment.id}`,
                { responseType: "blob" }
            );

            const fileName = `${attachment.note ? attachment.note.title.replaceAll('.', '') : 'notes'} - ${attachment.title.replaceAll('.', '')}`;

            FileSaver.saveAs(res.data, fileName);
        }
        catch (err) {
            console.log("Error to get attachment");
            console.log(err);
        }

        setDownloadingAttachment(false);
    }

    async function handleDeleteAttachment() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        handleCloseModalEditItem();

        if (handleDeleteAttachmentFromList) handleDeleteAttachmentFromList(attachment);
    }

    return (
        <>
            <ListGroup.Item variant="light">
                <Row className="align-items-center">
                    <Col><span>{attachment.title}</span></Col>

                    {
                        !isNew && <Col className="col-row text-right">
                            <Button
                                variant="outline-success"
                                className="button-link"
                                onClick={handleDownloadAttachment}
                                title="Baixar o anexo."
                            >
                                {downloadingAttachment ? <Spinner animation="border" variant="success" size="sm" /> : <FaCloudDownloadAlt />}
                            </Button>
                        </Col>
                    }

                    {
                        canEdit && <Col className="col-row text-right">
                            <Button
                                variant="outline-success"
                                className="button-link"
                                onClick={handleShowModalEditItem}
                                title="Editar o anexo."
                            >
                                <FaPencilAlt /> Editar
                            </Button>
                        </Col>
                    }
                </Row>
            </ListGroup.Item>

            <Modal show={showModalEditItem} onHide={handleCloseModalEditItem}>
                <Modal.Header closeButton>
                    <Modal.Title>Edtiar anexo</Modal.Title>
                </Modal.Header>
                <Formik
                    initialValues={
                        {
                            title: attachment.title,
                        }
                    }
                    onSubmit={async values => {
                        if (handleListAttachments) handleListAttachments({
                            ...attachment,
                            title: values.title,
                        });

                        handleCloseModalEditItem();
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
                                            value={values.title}
                                            name="title"
                                            isInvalid={!!errors.title && touched.title}
                                        />
                                        <Form.Control.Feedback type="invalid">{touched.title && errors.title}</Form.Control.Feedback>
                                    </Form.Group>

                                    {
                                        !isNew && <Form.Group as={Col} sm={2} controlId="formGridReceivedAt">
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
                                    }
                                </Row>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={handleCloseModalEditItem}>Cancelar</Button>
                                <Button
                                    title="Delete product"
                                    variant={iconDelete ? "outline-danger" : "outline-warning"}
                                    onClick={handleDeleteAttachment}
                                >
                                    {
                                        iconDelete && "Excluir"
                                    }

                                    {
                                        iconDeleteConfirm && "Confirmar"
                                    }
                                </Button>
                                <Button variant="success" type="submit">Salvar</Button>
                            </Modal.Footer>
                        </Form>
                    )}
                </Formik>
            </Modal>
        </>
    )
}

export { NoteAttachmentItem };