import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, ListGroup, Modal, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaFileAlt, FaPlus } from 'react-icons/fa';
import filesize from "filesize";
import { format } from 'date-fns';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { StoresContext } from '../../../contexts/StoresContext';
import { Note } from '../../../components/Notes';
import { can, User } from '../../../components/Users';
import NoteShareItem, { NoteShare } from '../../../components/NoteShares';
import { NoteAttachmentItem, NoteAttachment } from '../../../components/NoteAttachments';

import styles from './styles.module.css';

const TextEditor = dynamic(
    () => {
        return import("../../../components/TextEditor");
    },
    { ssr: false }
);

import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const validationSchema = Yup.object().shape({
    title: Yup.string().required('Obrigatório!'),
    text: Yup.string().notRequired(),
    note_only: Yup.string().notRequired(),
    note: Yup.string().notRequired().nullable(),
});

const shareValidationSchema = Yup.object().shape({
    store: Yup.string().required('Obrigatório!'),
    can_edit: Yup.boolean().notRequired(),
    user: Yup.string().required('Obrigatório!'),
});

const attachmentValidationSchema = Yup.object().shape({
    title: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    path: Yup.string().required('Obrigatório!'),
    size: Yup.number().lessThan(200 * 1024 * 1024, 'O arquivo não pode ultrapassar 200MB.').notRequired().nullable(),
});

const EditNote: NextPage = () => {
    const router = useRouter();
    const { note } = router.query;

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);
    const { stores } = useContext(StoresContext);

    const [data, setData] = useState<Note>();

    const [noteShares, setNoteShares] = useState<NoteShare[]>([]);
    const [userNoteShare, setUserNoteShare] = useState<NoteShare>();

    const [users, setUsers] = useState<User[]>([]);

    const [noteSharesToDelete, setNoteSharesToDelete] = useState<String[]>([]);

    const [noteAttachments, setNoteAttachments] = useState<NoteAttachment[]>([]);
    const [noteAttachmentsToUpdate, setNoteAttachmentsToUpdate] = useState<String[]>([]);
    const [noteAttachmentsToDelete, setNoteAttachmentsToDelete] = useState<String[]>([]);

    const [isAuthorized, setIsAuthorized] = useState(true);

    const [text, setText] = useState('');

    const [messageShow, setMessageShow] = useState(false);

    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");
    const [textMessage, setTextMessage] = useState("aguarde...");
    const [messageShowNewShare, setMessageShowNewShare] = useState(false);

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [showModalNewAttachment, setShowModalNewAttachment] = useState(false);

    const handleCloseModalNewAttachment = () => setShowModalNewAttachment(false);
    const handleShowModalNewAttachment = () => {
        setFileToSave(undefined);
        setFilePreview('');
        setShowModalNewAttachment(true);
    }

    const [fileToSave, setFileToSave] = useState<File>();
    const [filePreview, setFilePreview] = useState('');

    const [showModalNewShare, setShowModalNewShare] = useState(false);

    const handleCloseModalNewShare = () => setShowModalNewShare(false);
    const handleShowModalNewShare = () => setShowModalNewShare(true);

    const [deletingMessageShow, setDeletingMessageShow] = useState(false);

    const [showItemDelete, setShowItemDelete] = useState(false);

    const handleCloseItemDelete = () => setShowItemDelete(false);
    const handelShowItemDelete = () => setShowItemDelete(true);

    useEffect(() => {
        handleItemSideBar('notes');
        handleSelectedMenu('notes-index');

        if (user && note) {
            api.get(`notes/${note}`, {
                validateStatus: function (status) {
                    return status < 500; // Resolve only if the status code is less than 500
                }
            }).then(res => {
                switch (res.status) {
                    case 200:
                        const noteRes: Note = res.data;

                        const foundUserNoteShare = noteRes.shares.find(item => { return item.user.id === user.id });

                        if (!foundUserNoteShare) {
                            setIsAuthorized(false);

                            return;
                        }

                        setUserNoteShare(foundUserNoteShare);

                        setData(noteRes);
                        setText(noteRes.text);

                        setNoteShares(noteRes.shares);
                        setNoteAttachments(noteRes.attachments);

                        setLoadingData(false);
                        break;
                    case 403:
                        setIsAuthorized(false);
                        break;
                    default:
                        setTypeLoadingMessage("error");
                        setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                        setHasErrors(true);
                }
            }).catch(err => {
                console.log('Error to get note, ', err);

                setTypeLoadingMessage("error");
                setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                setHasErrors(true);
            });
        }


    }, [user, note]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleSaveText(textToSave: string) {
        setText(textToSave);
    }

    function handleNoteSharesList(share: NoteShare) {
        const updatedListItems = noteShares.filter(item => {
            return item.id !== share.id;
        });

        if (!share.id.startsWith('@')) {
            setNoteSharesToDelete([...noteSharesToDelete, share.id]);
        }

        setNoteShares(updatedListItems);
    }

    function handleDeleteAttachmentFromList(attachment: NoteAttachment) {
        const updatedListItems = noteAttachments.filter(item => {
            return item.id !== attachment.id;
        });

        if (!attachment.id.startsWith('@')) {
            const updatedListToUpdate = noteAttachmentsToUpdate.filter(item => { return item !== attachment.id });
            setNoteAttachmentsToUpdate(updatedListToUpdate);

            setNoteAttachmentsToDelete([...noteAttachmentsToDelete, attachment.id]);
        }

        setNoteAttachments(updatedListItems);
    }

    function handleListAttachments(attachment: NoteAttachment) {
        const updatedListItems = noteAttachments.map(item => {
            if (item.id === attachment.id) {
                return {
                    ...item,
                    title: attachment.title
                }
            }

            return item;
        });

        if (!attachment.id.startsWith('@') && !noteAttachmentsToUpdate.find(item => { return item === attachment.id })) {
            setNoteAttachmentsToUpdate([...noteAttachmentsToUpdate, attachment.id]);
        }

        setNoteAttachments(updatedListItems);
    }

    function handleImages(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files[0]) {
            const image = event.target.files[0];

            setFileToSave(image);

            const imagesToPreview = image.name;

            setFilePreview(imagesToPreview);
        }
    }

    async function handleItemDelete() {
        if (note) {
            setTypeMessage("waiting");
            setDeletingMessageShow(true);

            try {
                await api.delete(`notes/${note}`);

                setTypeMessage("success");

                setTimeout(() => {
                    router.push('/notes');
                }, 1000);
            }
            catch (err) {
                console.log('error deleting note');
                console.log(err);

                setTypeMessage("error");

                setTimeout(() => {
                    setDeletingMessageShow(false);
                }, 4000);
            }
        }
    }

    return (
        <>
            <NextSeo
                title="Anotação"
                description="Anotação da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Anotação',
                    description: 'Anotação da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Anotação | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            isAuthorized ? <>
                                {
                                    loadingData || hasErrors ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <>
                                            {
                                                !data || !userNoteShare ? <PageWaiting status="waiting" /> :
                                                    <Container className="content-page">
                                                        <Row className="mb-3">
                                                            <Col>
                                                                <PageBack href="/notes" subTitle="Voltar para a lista de anotaçãos" />
                                                            </Col>
                                                        </Row>

                                                        <Formik
                                                            initialValues={{
                                                                title: data.title,
                                                                text: data.text,
                                                                store_only: data.store_only,
                                                                store: data.store ? data.store.id : '',
                                                            }}
                                                            onSubmit={async values => {
                                                                setTypeMessage("waiting");
                                                                setTextMessage("aguarde...");

                                                                setMessageShow(true);

                                                                try {
                                                                    await api.put(`notes/${data.id}`, {
                                                                        title: values.title,
                                                                        text,
                                                                        store_only: values.store_only,
                                                                        store: values.store,
                                                                    });

                                                                    noteSharesToDelete.forEach(async item => {
                                                                        await api.delete(`notes/shares/${item}`);
                                                                    });

                                                                    noteShares.forEach(async item => {
                                                                        if (item.id.startsWith('@')) {
                                                                            await api.post('notes/shares', {
                                                                                can_edit: item.can_edit,
                                                                                note: data.id,
                                                                                user: item.user.id,
                                                                            });
                                                                        }
                                                                    });

                                                                    noteAttachmentsToDelete.forEach(async item => {
                                                                        await api.delete(`notes/attachments/${item}`);
                                                                    });

                                                                    noteAttachments.forEach(async item => {
                                                                        setTextMessage("enviando arquivos...");

                                                                        if (item.id.startsWith('@')) {
                                                                            if (item.fileToUpload) {
                                                                                const formData = new FormData();

                                                                                formData.append('title', item.title);

                                                                                formData.append('file', item.fileToUpload);

                                                                                formData.append('note', data.id);

                                                                                await api.post(`notes/${data.id}/attachments`, formData);
                                                                            }
                                                                        }
                                                                    });

                                                                    noteAttachmentsToUpdate.forEach(async item => {
                                                                        const itemToUpdate = noteAttachments.find(attachment => { return attachment.id === item });

                                                                        if (itemToUpdate) {
                                                                            await api.put(`notes/attachments/${item}`, {
                                                                                title: itemToUpdate.title,
                                                                            });
                                                                        }
                                                                    });

                                                                    setTextMessage("sucesso!");
                                                                    setTypeMessage("success");

                                                                    setTimeout(() => {
                                                                        router.push('/notes');
                                                                    }, 1000);
                                                                }
                                                                catch {
                                                                    setTextMessage("algo deu errado!");
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
                                                                    {
                                                                        userNoteShare.can_edit ? <Row className="mb-3">
                                                                            <Form.Group as={Col} sm={5} controlId="formGridTitle">
                                                                                <Form.Label>Título</Form.Label>
                                                                                <Form.Control
                                                                                    type="name"
                                                                                    onChange={handleChange}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.title}
                                                                                    name="title"
                                                                                    isInvalid={!!errors.title && touched.title}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.title && errors.title}</Form.Control.Feedback>
                                                                            </Form.Group>
                                                                        </Row> :
                                                                            <Row>
                                                                                <Col>
                                                                                    <h6 className="text-secondary">{data.title}</h6>
                                                                                </Col>
                                                                            </Row>
                                                                    }

                                                                    {
                                                                        typeof window !== undefined && <>
                                                                            <TextEditor
                                                                                title="Texto"
                                                                                canEdit={userNoteShare.can_edit}
                                                                                text={values.text}
                                                                                handleSaveText={handleSaveText}
                                                                            />
                                                                        </>
                                                                    }

                                                                    {
                                                                        !user.store_only && userNoteShare.can_edit && <Row className="mb-3">
                                                                            <Col sm={3}>
                                                                                <Form.Check
                                                                                    type="switch"
                                                                                    id="store_only"
                                                                                    label="Vincular a uma loja"
                                                                                    checked={values.store_only}
                                                                                    onChange={() => { setFieldValue('store_only', !values.store_only) }}
                                                                                />
                                                                            </Col>

                                                                            {
                                                                                values.store_only && <Form.Group as={Col} sm={4} controlId="formGridStore">
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
                                                                                    {
                                                                                        values.store_only && !!!values.store && <label className="invalid-feedback" style={{ display: 'block' }}>
                                                                                            Obrigatório escolher uma opção
                                                                                        </label>
                                                                                    }
                                                                                </Form.Group>
                                                                            }
                                                                        </Row>
                                                                    }

                                                                    {
                                                                        can(user, "users", "read:any") && userNoteShare.can_edit && <>
                                                                            <Col className="border-top mb-3"></Col>

                                                                            <Row>
                                                                                <Col className="col-row">
                                                                                    <Row>
                                                                                        <Col>
                                                                                            <h6 className="text-success">Compartilhamentos</h6>
                                                                                        </Col>
                                                                                    </Row>
                                                                                </Col>

                                                                                <Col sm={1}>
                                                                                    <Button
                                                                                        variant="outline-success"
                                                                                        size="sm"
                                                                                        title="Compartilhar essa anotação."
                                                                                        onClick={handleShowModalNewShare}
                                                                                    >
                                                                                        <FaPlus />
                                                                                    </Button>
                                                                                </Col>
                                                                            </Row>

                                                                            <Row>
                                                                                <Col>
                                                                                    <Row>
                                                                                        <Col>
                                                                                            <span className="text-secondary">Editores</span>
                                                                                        </Col>
                                                                                    </Row>
                                                                                </Col>
                                                                            </Row>

                                                                            <Row className="mb-4">
                                                                                {
                                                                                    noteShares.filter(noteShare => noteShare.can_edit).map((noteShare, index) => {
                                                                                        return <Col className="col-row me-2" key={index}>
                                                                                            <NoteShareItem
                                                                                                share={noteShare}
                                                                                                handleNoteSharesList={handleNoteSharesList}
                                                                                                canDelete={noteShare.user.id === user.id ? false : true}
                                                                                            />
                                                                                        </Col>
                                                                                    })
                                                                                }
                                                                            </Row>

                                                                            <Row>
                                                                                <Col>
                                                                                    <Row>
                                                                                        <Col>
                                                                                            <span className="text-secondary">Leitores</span>
                                                                                        </Col>
                                                                                    </Row>
                                                                                </Col>
                                                                            </Row>

                                                                            <Row className="mb-4">
                                                                                {
                                                                                    noteShares.filter(noteShare => !noteShare.can_edit).map((noteShare, index) => {
                                                                                        return <Col className="col-row me-2" key={index}>
                                                                                            <NoteShareItem
                                                                                                share={noteShare}
                                                                                                handleNoteSharesList={handleNoteSharesList}
                                                                                                canDelete={noteShare.user.id === user.id ? false : true}
                                                                                            />
                                                                                        </Col>
                                                                                    })
                                                                                }
                                                                            </Row>
                                                                        </>
                                                                    }

                                                                    <Col className="border-top mb-3"></Col>

                                                                    <Row className="justify-content-end">
                                                                        {
                                                                            messageShow ? <Col sm={3}>
                                                                                <AlertMessage
                                                                                    status={typeMessage}
                                                                                    message={textMessage}
                                                                                />
                                                                            </Col> :
                                                                                <>
                                                                                    {
                                                                                        userNoteShare.can_edit && <>
                                                                                            <Col className="col-row">
                                                                                                <Button
                                                                                                    variant="danger"
                                                                                                    title="Excluir anotação."
                                                                                                    onClick={handelShowItemDelete}
                                                                                                >
                                                                                                    Excluir
                                                                                                </Button>
                                                                                            </Col>

                                                                                            <Col className="col-row">
                                                                                                <Button
                                                                                                    variant="success"
                                                                                                    type="submit"
                                                                                                >
                                                                                                    Salvar
                                                                                                </Button>
                                                                                            </Col>
                                                                                        </>
                                                                                    }
                                                                                </>
                                                                        }
                                                                    </Row>
                                                                </Form>
                                                            )}
                                                        </Formik>

                                                        <Row className="mb-5">
                                                            <Form.Group as={Col} controlId="formGridAttachments">
                                                                <Row>
                                                                    <Col className="col-row">
                                                                        <h6 className="text-success">Anexos <FaFileAlt /></h6>
                                                                    </Col>

                                                                    {
                                                                        userNoteShare.can_edit && <Col sm={1}>
                                                                            <Button
                                                                                variant="outline-success"
                                                                                size="sm"
                                                                                onClick={handleShowModalNewAttachment}
                                                                                title="Criar um novo anexo para essa anotação."
                                                                            >
                                                                                <FaPlus />
                                                                            </Button>
                                                                        </Col>
                                                                    }
                                                                </Row>

                                                                <Row className="mt-2">
                                                                    {
                                                                        !!noteAttachments.length ? <Col>
                                                                            <ListGroup>
                                                                                {
                                                                                    noteAttachments.map(attachment => {
                                                                                        return <NoteAttachmentItem
                                                                                            key={attachment.id}
                                                                                            attachment={attachment}
                                                                                            canEdit={userNoteShare.can_edit}
                                                                                            isNew={attachment.id.startsWith('@')}
                                                                                            handleDeleteAttachmentFromList={handleDeleteAttachmentFromList}
                                                                                            handleListAttachments={handleListAttachments}
                                                                                        />
                                                                                    })
                                                                                }
                                                                            </ListGroup>
                                                                        </Col> :
                                                                            <Col>
                                                                                <AlertMessage
                                                                                    status="warning"
                                                                                    message="Nenhum anexo enviado para essa anotação."
                                                                                />
                                                                            </Col>
                                                                    }
                                                                </Row>
                                                            </Form.Group>
                                                        </Row>

                                                        <Col className="border-top mb-3"></Col>

                                                        <Row className="mb-3">
                                                            <Col sm={4} >
                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-success">Criado em</span>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-secondary">{format(new Date(data.created_at), 'dd/MM/yyyy')}</h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>

                                                            <Col sm={4} >
                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-success">Usuário</span>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-secondary">{data.created_by}</h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Col sm={4} >
                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-success">Última atualização</span>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-secondary">{format(new Date(data.updated_at), 'dd/MM/yyyy')}</h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>

                                                            <Col sm={4} >
                                                                <Row>
                                                                    <Col>
                                                                        <span className="text-success">Usuário</span>
                                                                    </Col>
                                                                </Row>

                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-secondary">{data.updated_by}</h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Modal show={showModalNewShare} onHide={handleCloseModalNewShare}>
                                                            <Modal.Header closeButton>
                                                                <Modal.Title>Compartilhar com alguém</Modal.Title>
                                                            </Modal.Header>
                                                            <Formik
                                                                initialValues={
                                                                    {
                                                                        store: '',
                                                                        can_edit: false,
                                                                        user: '',
                                                                    }
                                                                }
                                                                onSubmit={async values => {
                                                                    try {
                                                                        const storeFound = stores.find(item => { return item.id === values.store });

                                                                        if (!storeFound) return;

                                                                        const userFound = storeFound.users.find(item => { return item.id === values.user });

                                                                        if (!userFound) return;

                                                                        const share: NoteShare = {
                                                                            id: `@${noteShares.length}`,
                                                                            can_edit: values.can_edit,
                                                                            user: userFound,
                                                                        }

                                                                        setNoteShares([...noteShares, share]);

                                                                        handleCloseModalNewShare();
                                                                    }
                                                                    catch (err) {
                                                                        console.log('error create share.');
                                                                        console.log(err);

                                                                        setMessageShowNewShare(true);
                                                                        setTypeMessage("error");

                                                                        setTimeout(() => {
                                                                            setMessageShowNewShare(false);
                                                                        }, 4000);
                                                                    }
                                                                }}
                                                                validationSchema={shareValidationSchema}
                                                            >
                                                                {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
                                                                    <Form onSubmit={handleSubmit}>
                                                                        <Modal.Body>
                                                                            <Row className="mb-3">
                                                                                <Form.Group as={Col} controlId="formGridStore">
                                                                                    <Form.Label>Loja</Form.Label>
                                                                                    <Form.Control
                                                                                        as="select"
                                                                                        onChange={(e) => {
                                                                                            setFieldValue('store', e.target.value);

                                                                                            const store = stores.find(item => { return item.id === e.target.value });

                                                                                            if (store && store.users)
                                                                                                setUsers(store.users);
                                                                                        }}
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
                                                                            </Row>

                                                                            <Row className="mb-3">
                                                                                <Form.Group as={Col} controlId="formGridUser">
                                                                                    <Form.Label>Usuário</Form.Label>
                                                                                    <Form.Control
                                                                                        as="select"
                                                                                        onChange={handleChange}
                                                                                        onBlur={handleBlur}
                                                                                        value={values.user}
                                                                                        name="user"
                                                                                        isInvalid={!!errors.user && touched.user}
                                                                                        disabled={!!!values.store}
                                                                                    >
                                                                                        <option hidden>Escolha uma opção</option>
                                                                                        {
                                                                                            !!values.store && users.map((user, index) => {
                                                                                                return <option key={index} value={user.id}>{user.name}</option>
                                                                                            })
                                                                                        }
                                                                                    </Form.Control>
                                                                                    <Form.Control.Feedback type="invalid">{touched.user && errors.user}</Form.Control.Feedback>
                                                                                </Form.Group>
                                                                            </Row>

                                                                            <Row className="mb-3">
                                                                                <Col sm={3}>
                                                                                    <Form.Check
                                                                                        type="switch"
                                                                                        id="can_edit"
                                                                                        label="Editor"
                                                                                        checked={values.can_edit}
                                                                                        onChange={() => { setFieldValue('can_edit', !values.can_edit) }}
                                                                                    />
                                                                                </Col>
                                                                            </Row>
                                                                        </Modal.Body>
                                                                        <Modal.Footer>
                                                                            {
                                                                                messageShowNewShare ? <AlertMessage status={typeMessage} /> :
                                                                                    <>
                                                                                        <Button variant="secondary" onClick={handleCloseModalNewShare}>Cancelar</Button>
                                                                                        <Button variant="success" type="submit">Salvar</Button>
                                                                                    </>
                                                                            }
                                                                        </Modal.Footer>
                                                                    </Form>
                                                                )}
                                                            </Formik>
                                                        </Modal>

                                                        <Modal show={showModalNewAttachment} onHide={handleCloseModalNewAttachment}>
                                                            <Modal.Header closeButton>
                                                                <Modal.Title>Criar um anexo</Modal.Title>
                                                            </Modal.Header>
                                                            <Formik
                                                                initialValues={
                                                                    {
                                                                        title: '',
                                                                        path: '',
                                                                        size: 0,
                                                                    }
                                                                }
                                                                onSubmit={async values => {
                                                                    if (fileToSave) {
                                                                        const attachment: NoteAttachment = {
                                                                            id: `@${noteAttachments.length}`,
                                                                            title: values.title,
                                                                            path: values.path,
                                                                            fileToUpload: fileToSave,
                                                                        }

                                                                        setNoteAttachments([...noteAttachments, attachment]);

                                                                        handleCloseModalNewAttachment();
                                                                    }
                                                                }}
                                                                validationSchema={attachmentValidationSchema}
                                                            >
                                                                {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
                                                                    <Form onSubmit={handleSubmit}>
                                                                        <Modal.Body>
                                                                            <Form.Group controlId="attachmentFormGridName">
                                                                                <Form.Label>Nome do documento</Form.Label>
                                                                                <Form.Control type="text"
                                                                                    placeholder="Nome"
                                                                                    onChange={handleChange}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.title}
                                                                                    name="title"
                                                                                    isInvalid={!!errors.title && touched.title}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.title && errors.title}</Form.Control.Feedback>
                                                                                <Form.Text className="text-muted text-right">{`${values.title.length}/50 caracteres.`}</Form.Text>
                                                                            </Form.Group>

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
                                                                        </Modal.Body>
                                                                        <Modal.Footer>
                                                                            <Button variant="secondary" onClick={handleCloseModalNewAttachment}>Cancelar</Button>
                                                                            <Button variant="success" type="submit">Salvar</Button>
                                                                        </Modal.Footer>
                                                                    </Form>
                                                                )}
                                                            </Formik>
                                                        </Modal>

                                                        <Modal show={showItemDelete} onHide={handleCloseItemDelete}>
                                                            <Modal.Header closeButton>
                                                                <Modal.Title>Excluir anotação</Modal.Title>
                                                            </Modal.Header>
                                                            <Modal.Body>
                                                                Você tem certeza que deseja excluir esta anotação? Essa ação não poderá ser desfeita.
                                                            </Modal.Body>
                                                            <Modal.Footer>
                                                                <Row>
                                                                    {
                                                                        deletingMessageShow ? <Col><AlertMessage status={typeMessage} /></Col> :
                                                                            <>
                                                                                <Col className="col-row">
                                                                                    <Button
                                                                                        variant="danger"
                                                                                        type="button"
                                                                                        onClick={handleItemDelete}
                                                                                    >
                                                                                        Excluir
                                                                                    </Button>
                                                                                </Col>

                                                                                <Col className="col-row">
                                                                                    <Button
                                                                                        variant="outline-secondary"
                                                                                        onClick={handleCloseItemDelete}
                                                                                    >
                                                                                        Cancelar
                                                                                    </Button>
                                                                                </Col>
                                                                            </>
                                                                    }
                                                                </Row>
                                                            </Modal.Footer>
                                                        </Modal>
                                                    </Container>
                                            }
                                        </>
                                }
                            </> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default EditNote;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { token } = context.req.cookies;

    const tokenVerified = await TokenVerify(token);

    if (tokenVerified === "not-authorized") { // Not authenticated, token invalid!
        return {
            redirect: {
                destination: `/?returnto=${context.req.url}`,
                permanent: false,
            },
        }
    }

    if (tokenVerified === "error") { // Server error!
        return {
            redirect: {
                destination: '/500',
                permanent: false,
            },
        }
    }

    return {
        props: {},
    }
}