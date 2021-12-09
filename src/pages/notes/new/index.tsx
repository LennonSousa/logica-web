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

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import { Store } from '../../../components/Stores';
import { Note } from '../../../components/Notes';
import { User } from '../../../components/Users';
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

const NewNote: NextPage = () => {
    const router = useRouter();

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [stores, setStores] = useState<Store[]>([]);
    const [noteShares, setNoteShares] = useState<NoteShare[]>([]);
    const [noteAttachments, setNoteAttachments] = useState<NoteAttachment[]>([]);

    const [users, setUsers] = useState<User[]>([]);

    const [text, setText] = useState('');

    const [messageShow, setMessageShow] = useState(false);

    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");
    const [textMessage, setTextMessage] = useState("aguarde...");
    const [messageShowNewShare, setMessageShowNewShare] = useState(false);

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [showModalNewShare, setShowModalNewShare] = useState(false);

    const handleCloseModalNewShare = () => setShowModalNewShare(false);
    const handleShowModalNewShare = () => setShowModalNewShare(true);

    const [showModalNewAttachment, setShowModalNewAttachment] = useState(false);

    const handleCloseModalNewAttachment = () => setShowModalNewAttachment(false);
    const handleShowModalNewAttachment = () => {
        setFileToSave(undefined);
        setFilePreview('');
        setShowModalNewAttachment(true);
    }

    const [fileToSave, setFileToSave] = useState<File>();
    const [filePreview, setFilePreview] = useState('');

    useEffect(() => {
        handleItemSideBar('notes');
        handleSelectedMenu('notes-index');

        if (user) {
            const share: NoteShare = {
                id: '@0',
                can_edit: true,
                user: user,
            }

            setNoteShares([...noteShares, share]);

            api.get('stores').then(res => {
                setStores(res.data);
            }).catch(err => {
                console.log('Error to get stores, ', err);

                setTypeLoadingMessage("error");
                setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                setHasErrors(true);
            });

            setLoadingData(false);
        }


    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleSaveText(textToSave: string) {
        setText(textToSave);
    }

    function handleNoteSharesList(share: NoteShare) {
        const updatedListItems = noteShares.filter(item => {
            return item.id !== share.id;
        });

        setNoteShares(updatedListItems);
    }

    function handleDeleteAttachmentFromList(attachment: NoteAttachment) {
        const updatedListItems = noteAttachments.filter(item => {
            return item.id !== attachment.id;
        });

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

    return (
        <>
            <NextSeo
                title="Criar anotação"
                description="Criar anotação da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Criar anotação',
                    description: 'Criar anotação da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Criar anotação | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            loadingData || hasErrors ? <PageWaiting
                                status={typeLoadingMessage}
                                message={textLoadingMessage}
                            /> :
                                <Container className="content-page">
                                    <Row className="mb-3">
                                        <Col>
                                            <PageBack href="/notes" subTitle="Voltar para a lista de anotaçãos" />
                                        </Col>
                                    </Row>

                                    <Formik
                                        initialValues={{
                                            title: '',
                                            text: '',
                                            store_only: user.store_only,
                                            store: user.store_only ? user.store.id : '',
                                        }}
                                        onSubmit={async values => {
                                            setTypeMessage("waiting");
                                            setTextMessage("aguarde...");

                                            setMessageShow(true);

                                            try {
                                                const shares = noteShares.map(share => {
                                                    return {
                                                        can_edit: share.can_edit,
                                                        user: share.user.id,
                                                    }
                                                });

                                                const response = await api.post('notes', {
                                                    title: values.title,
                                                    text,
                                                    store_only: values.store_only,
                                                    store: values.store,
                                                    shares,
                                                });

                                                const newNote: Note = response.data;

                                                noteAttachments.forEach(async item => {
                                                    setTextMessage("enviando arquivos...");

                                                    if (item.id.startsWith('@')) {
                                                        if (item.fileToUpload) {
                                                            const formData = new FormData();

                                                            formData.append('title', item.title);

                                                            formData.append('file', item.fileToUpload);

                                                            formData.append('note', newNote.id);

                                                            await api.post(`notes/${newNote.id}/attachments`, formData);
                                                        }
                                                    }
                                                });

                                                setTextMessage("sucesso!");
                                                setTypeMessage("success");

                                                setTimeout(() => {
                                                    router.push(`/notes/edit/${newNote.id}`);
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
                                                <Row className="mb-3">
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
                                                </Row>

                                                {
                                                    typeof window !== undefined && <>
                                                        <TextEditor
                                                            title="Texto"
                                                            canEdit
                                                            text={values.text}
                                                            handleSaveText={handleSaveText}
                                                        />
                                                    </>
                                                }

                                                <Col className="border-top mb-3"></Col>

                                                {
                                                    !user.store_only && <Row className="mb-3">
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
                                                    can(user, "users", "read:any") && <>
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
                                                            <Col className="col-row">
                                                                <Button
                                                                    variant="success"
                                                                    type="submit"
                                                                >
                                                                    Salvar
                                                                </Button>
                                                            </Col>

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

                                                <Col sm={1}>
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        onClick={handleShowModalNewAttachment}
                                                        title="Criar um novo anexo para essa anotação."
                                                    >
                                                        <FaPlus />
                                                    </Button>
                                                </Col>
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
                                                                        isNew
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

                                                    setTypeMessage("waiting")
                                                    setMessageShowNewShare(true);

                                                    const share: NoteShare = {
                                                        id: `@${noteShares.length}`,
                                                        can_edit: values.can_edit,
                                                        user: userFound,
                                                    }

                                                    setNoteShares([...noteShares, share]);

                                                    setMessageShowNewShare(false);
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

                                                                        console.log(store);
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
                                </Container>
                        }
                    </>
            }
        </>
    )
}

export default NewNote;

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