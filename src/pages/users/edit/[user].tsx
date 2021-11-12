import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, ListGroup, Modal, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaKey } from 'react-icons/fa';

import api from '../../../api/api';
import { cellphone } from '../../../components/InputMask/masks';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { User, UserRole, can, translatedRoles } from '../../../components/Users';
import { cpf, cnpj } from '../../../components/InputMask/masks';
import { Store } from '../../../components/Stores';
import PageBack from '../../../components/PageBack';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';
import { PageWaiting, PageType } from '../../../components/PageWaiting';

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!'),
    phone: Yup.string().notRequired(),
});

const rolesToEditSelf = [
    'estimates',
    'projects',
    'services',
    'users',
];

const UserEdit: NextPage = () => {
    const router = useRouter();
    const userId = router.query['user'];

    const { loading, user } = useContext(AuthContext);

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);

    const [userData, setUserData] = useState<User>();
    const [usersRoles, setUsersRoles] = useState<UserRole[]>([]);
    const [stores, setStores] = useState<Store[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');
    const [messageShow, setMessageShow] = useState(false);
    const [deletingMessageShow, setDeletingMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");
    const [documentType, setDocumentType] = useState("CPF");

    const [showUserDelete, setShowUserDelete] = useState(false);

    const handleCloseUsersDelete = () => setShowUserDelete(false);
    const handelShowUsersDelete = () => setShowUserDelete(true);

    useEffect(() => {
        handleItemSideBar('users');
        handleSelectedMenu('users-index');

        if (user) {
            if (can(user, "users", "update:any") || can(user, "users", "update:own") && userId === user.id) {
                api.get(`users/${userId}`).then(res => {
                    const userRes: User = res.data;

                    if (userRes.document.length > 14)
                        setDocumentType("CNPJ");

                    setUsersRoles(userRes.roles);

                    setUserData(userRes);
                }).catch(err => {
                    console.log('Error get user to edit, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });

                api.get('stores').then(res => {
                    setStores(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get panels, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });
            }
        }
    }, [user, userId]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleChecks(event: ChangeEvent<HTMLInputElement>) {
        const roleId = event.target.value.split("@", 1)[0];
        const grant = event.target.value.split("@", 2)[1];

        const updatedUsersRoles = usersRoles.map(role => {
            if (role.id === roleId) {
                if (grant === 'all') {
                    return {
                        ...role,
                        view: true,
                        view_self: true,
                        create: true,
                        update: true,
                        update_self: true,
                        remove: true,
                    }
                }

                if (grant === 'view') {
                    if (role.view) {
                        const updatedRole = handleRole(role, ['create', 'update', 'remove'], false);

                        return { ...updatedRole, view: !updatedRole.view };
                    }

                    return { ...role, view: !role.view };
                }
                if (grant === 'view_self') return { ...role, view_self: !role.view_self };
                if (grant === 'create') return { ...role, create: !role.create };
                if (grant === 'update') {
                    if (role.update) {
                        const updatedRole = handleRole(role, ['remove'], false);

                        return { ...updatedRole, update: !updatedRole.update };
                    }

                    return { ...role, update: !role.update };
                }
                if (grant === 'update_self') return { ...role, update_self: !role.update_self };
                if (grant === 'remove') return { ...role, remove: !role.remove };

                return { ...role, [grant]: true }
            }

            return role;
        });

        setUsersRoles(updatedUsersRoles);
    }

    function handleRole(role: UserRole, grants: string[], checked: boolean) {
        let updatedRole = role;

        grants.forEach(grant => {
            if (grant === 'view') updatedRole = { ...updatedRole, view: checked };
            if (grant === 'view_self') updatedRole = { ...updatedRole, view_self: checked };
            if (grant === 'create') updatedRole = { ...updatedRole, create: checked };
            if (grant === 'update') updatedRole = { ...updatedRole, update: checked };
            if (grant === 'update_self') updatedRole = { ...updatedRole, update_self: checked };
            if (grant === 'remove') updatedRole = { ...updatedRole, remove: checked };
        });

        return updatedRole;
    }

    async function handleUserDelete() {
        if (user && userData) {
            setTypeMessage("waiting");
            setDeletingMessageShow(true);

            try {
                if (can(user, "users", "delete") && !userData.root) {
                    await api.delete(`users/${userId}`);

                    setTypeMessage("success");

                    setTimeout(() => {
                        router.push('/users');
                    }, 1500);
                }
            }
            catch (err) {
                console.log('error deleting user');
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
                title="Editar usuário"
                description="Editar usuário da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Editar usuário',
                    description: 'Editar usuário da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Editar usuário | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "users", "update:any") || can(user, "users", "update:own") && userId === user.id ? <>
                                {
                                    loadingData || hasErrors ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <>
                                            {
                                                !userData ? <PageWaiting status="waiting" /> :
                                                    <Container className="content-page">
                                                        <>
                                                            <Formik
                                                                initialValues={{
                                                                    name: userData.name,
                                                                    document: userData.document,
                                                                    phone: userData.phone ? userData.phone : '',
                                                                    store_only: userData.store_only,
                                                                    store: userData.store ? userData.store.id : '',
                                                                }}
                                                                onSubmit={async values => {
                                                                    if (values.store_only && !!!values.store) return;

                                                                    setTypeMessage("waiting");
                                                                    setMessageShow(true);

                                                                    try {
                                                                        await api.put(`users/${userData.id}`, {
                                                                            name: values.name,
                                                                            document: values.document,
                                                                            phone: values.phone,
                                                                            store_only: values.store_only,
                                                                            store: values.store,
                                                                        });

                                                                        if (userId !== user.id && !userData.root) {
                                                                            usersRoles.forEach(async role => {
                                                                                await api.put(`users/roles/${role.id}`, {
                                                                                    role: role.role,
                                                                                    view: role.view,
                                                                                    view_self: role.view_self,
                                                                                    create: role.create,
                                                                                    update: role.update,
                                                                                    update_self: role.update_self,
                                                                                    remove: role.remove,
                                                                                });
                                                                            });
                                                                        }

                                                                        setTypeMessage("success");

                                                                        setTimeout(() => {
                                                                            router.push(`/users/details/${userData.id}`);
                                                                        }, 1500);
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
                                                                {({ handleChange, handleBlur, handleSubmit, values, setFieldValue, errors, touched }) => (
                                                                    <Form onSubmit={handleSubmit}>
                                                                        {
                                                                            can(user, "users", "read:any") ? <Row className="mb-3">
                                                                                <Col>
                                                                                    <PageBack href="/users" subTitle="Voltar para a lista usuários." />
                                                                                </Col>
                                                                            </Row> :
                                                                                <Row className="mb-3">
                                                                                    <Col>
                                                                                        <PageBack
                                                                                            href={`/users/details/${userData.id}`}
                                                                                            subTitle="Voltar para os detalhes do usuário."
                                                                                        />
                                                                                    </Col>
                                                                                </Row>
                                                                        }

                                                                        <Row className="mb-3">
                                                                            <Form.Group as={Col} sm={5} controlId="formGridName">
                                                                                <Form.Label>Nome</Form.Label>
                                                                                <Form.Control
                                                                                    type="name"
                                                                                    onChange={handleChange}
                                                                                    onBlur={handleBlur}
                                                                                    value={values.name}
                                                                                    name="name"
                                                                                    isInvalid={!!errors.name && touched.name}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.name && errors.name}</Form.Control.Feedback>
                                                                            </Form.Group>

                                                                            <Form.Group as={Col} sm={3} controlId="formGridDocument">
                                                                                <Form.Label>{documentType}</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    maxLength={18}
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('document', e.target.value.length <= 14 ? cpf(e.target.value) : cnpj(e.target.value), false);
                                                                                        if (e.target.value.length > 14)
                                                                                            setDocumentType("CNPJ");
                                                                                        else
                                                                                            setDocumentType("CPF");
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                                        setFieldValue('document', e.target.value.length <= 14 ? cpf(e.target.value) : cnpj(e.target.value));
                                                                                        if (e.target.value.length > 14)
                                                                                            setDocumentType("CNPJ");
                                                                                        else
                                                                                            setDocumentType("CPF");
                                                                                    }}
                                                                                    value={values.document}
                                                                                    name="document"
                                                                                    isInvalid={!!errors.document && touched.document}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.document && errors.document}</Form.Control.Feedback>
                                                                            </Form.Group>

                                                                            <Form.Group as={Col} sm={4} controlId="formLoginPhone">
                                                                                <Form.Label>Telefone</Form.Label>
                                                                                <Form.Control
                                                                                    type="text"
                                                                                    maxLength={15}
                                                                                    onChange={(e) => {
                                                                                        setFieldValue('phone', cellphone(e.target.value));
                                                                                    }}
                                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                                        setFieldValue('phone', cellphone(e.target.value));
                                                                                    }}
                                                                                    value={values.phone}
                                                                                    name="phone"
                                                                                    isInvalid={!!errors.phone && touched.phone}
                                                                                />
                                                                                <Form.Control.Feedback type="invalid">{touched.phone && errors.phone}</Form.Control.Feedback>
                                                                            </Form.Group>
                                                                        </Row>

                                                                        <Row className="mb-2 align-items-center">
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

                                                                        {
                                                                            userId !== user.id && !userData.root && <>
                                                                                <Row>
                                                                                    <Col>
                                                                                        <h6 className="text-success">Permissões <FaKey /></h6>
                                                                                    </Col>
                                                                                </Row>

                                                                                <Row>
                                                                                    <Col>
                                                                                        <ListGroup className="mb-3">
                                                                                            {
                                                                                                usersRoles.map((role, index) => {
                                                                                                    const translatedRole = translatedRoles.find(item => { return item.role === role.role });

                                                                                                    return <ListGroup.Item key={index} as="div" variant="light">
                                                                                                        <Row>
                                                                                                            <Col>
                                                                                                                <h6 className="text-success" >
                                                                                                                    {
                                                                                                                        translatedRole ? translatedRole.translated : role.role
                                                                                                                    }
                                                                                                                </h6>
                                                                                                            </Col>

                                                                                                            <Col>
                                                                                                                <Form.Check
                                                                                                                    checked={role.view}
                                                                                                                    type="checkbox"
                                                                                                                    label="Visualizar"
                                                                                                                    name="type"
                                                                                                                    id={`formUserRoles${role.id}View`}
                                                                                                                    value={`${role.id}@view`}
                                                                                                                    onChange={handleChecks}
                                                                                                                />
                                                                                                            </Col>

                                                                                                            <Col>
                                                                                                                <Form.Check
                                                                                                                    checked={role.create}
                                                                                                                    type="checkbox"
                                                                                                                    label="Criar"
                                                                                                                    name="type"
                                                                                                                    id={`formUserRoles${role.id}Create`}
                                                                                                                    value={`${role.id}@create`}
                                                                                                                    onChange={handleChecks}
                                                                                                                    disabled={!role.view}
                                                                                                                />
                                                                                                            </Col>

                                                                                                            <Col>
                                                                                                                <Form.Check
                                                                                                                    checked={role.update}
                                                                                                                    type="checkbox"
                                                                                                                    label="Editar"
                                                                                                                    name="type"
                                                                                                                    id={`formUserRoles${role.id}Update`}
                                                                                                                    value={`${role.id}@update`}
                                                                                                                    onChange={handleChecks}
                                                                                                                    disabled={!role.view}
                                                                                                                />
                                                                                                            </Col>

                                                                                                            {
                                                                                                                rolesToEditSelf.find(item => { return item === role.role }) && <Col>
                                                                                                                    <Form.Check
                                                                                                                        checked={role.update_self}
                                                                                                                        type="checkbox"
                                                                                                                        label="Editar próprio"
                                                                                                                        name="type"
                                                                                                                        id={`formUserRoles${role.id}UpdateSelf`}
                                                                                                                        value={`${role.id}@update_self`}
                                                                                                                        onChange={handleChecks}
                                                                                                                    />
                                                                                                                </Col>
                                                                                                            }

                                                                                                            <Col>
                                                                                                                <Form.Check
                                                                                                                    checked={role.remove}
                                                                                                                    type="checkbox"
                                                                                                                    label="Excluir"
                                                                                                                    name="type"
                                                                                                                    id={`formUserRoles${role.id}Remove`}
                                                                                                                    value={`${role.id}@remove`}
                                                                                                                    onChange={handleChecks}
                                                                                                                    disabled={!role.update}
                                                                                                                />
                                                                                                            </Col>

                                                                                                            <Col>
                                                                                                                <Form.Check
                                                                                                                    checked={
                                                                                                                        role.view &&
                                                                                                                            role.view_self &&
                                                                                                                            role.create &&
                                                                                                                            role.update &&
                                                                                                                            role.update_self &&
                                                                                                                            role.remove ? true : false
                                                                                                                    }
                                                                                                                    type="checkbox"
                                                                                                                    label="Tudo"
                                                                                                                    name="type"
                                                                                                                    id={`formUserRoles${role.id}All`}
                                                                                                                    value={`${role.id}@all`}
                                                                                                                    onChange={handleChecks}
                                                                                                                />
                                                                                                            </Col>
                                                                                                        </Row>
                                                                                                    </ListGroup.Item>
                                                                                                })
                                                                                            }
                                                                                        </ListGroup>
                                                                                    </Col>
                                                                                </Row>
                                                                            </>
                                                                        }

                                                                        <Col className="border-top mb-3"></Col>

                                                                        <Row className="justify-content-end">
                                                                            {
                                                                                messageShow ? <Col sm={3}><AlertMessage status={typeMessage} /></Col> :
                                                                                    <>
                                                                                        {
                                                                                            can(user, "users", "delete")
                                                                                            && userId !== user.id
                                                                                            && !userData.root
                                                                                            && <Col className="col-row">
                                                                                                <Button
                                                                                                    variant="danger"
                                                                                                    onClick={handelShowUsersDelete}
                                                                                                >
                                                                                                    Excluir
                                                                                                </Button>
                                                                                            </Col>
                                                                                        }

                                                                                        <Col className="col-row">
                                                                                            <Button variant="success" type="submit">Salvar</Button>
                                                                                        </Col>
                                                                                    </>
                                                                            }
                                                                        </Row>
                                                                    </Form>
                                                                )}
                                                            </Formik>

                                                            <Modal show={showUserDelete} onHide={handleCloseUsersDelete}>
                                                                <Modal.Header closeButton>
                                                                    <Modal.Title>Excluir pessoa</Modal.Title>
                                                                </Modal.Header>
                                                                <Modal.Body>
                                                                    Você tem certeza que deseja excluir o usuário <b>{userData.name}</b>? Essa ação não poderá ser desfeita.
                                                                </Modal.Body>
                                                                <Modal.Footer>
                                                                    <Row>
                                                                        {
                                                                            deletingMessageShow ? <Col><AlertMessage status={typeMessage} /></Col> :
                                                                                <>
                                                                                    {
                                                                                        can(user, "users", "delete")
                                                                                        && userId !== user.id
                                                                                        && !userData.root
                                                                                        && <Col className="col-row">
                                                                                            <Button
                                                                                                variant="danger"
                                                                                                type="button"
                                                                                                onClick={handleUserDelete}
                                                                                            >
                                                                                                Excluir
                                                                                            </Button>
                                                                                        </Col>
                                                                                    }

                                                                                    <Col className="col-row">
                                                                                        <Button

                                                                                            variant="outline-secondary"
                                                                                            onClick={handleCloseUsersDelete}
                                                                                        >
                                                                                            Cancelar
                                                                                        </Button>
                                                                                    </Col>
                                                                                </>
                                                                        }
                                                                    </Row>
                                                                </Modal.Footer>
                                                            </Modal>
                                                        </>
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

export default UserEdit;

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