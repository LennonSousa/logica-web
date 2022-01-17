import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, InputGroup, ListGroup, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaKey } from 'react-icons/fa';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { StoresContext } from '../../../contexts/StoresContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { UserRole, can, translatedRoles } from '../../../components/Users';
import { cpf, cnpj, prettifyCurrency } from '../../../components/InputMask/masks';
import PageBack from '../../../components/PageBack';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';
import { PageWaiting, PageType } from '../../../components/PageWaiting';

interface userRoles {
    role: string,
    grants: string[],
};

const rolesToViewSelf = [
    'estimates',
    'projects',
    'services',
];

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!'),
    document: Yup.string().required('Obrigatório!'),
    email: Yup.string().email('E-mail invlálido!').required('Obrigatório!'),
    store_only: Yup.boolean().notRequired(),
    discountLimit: Yup.string().notRequired(),
    store: Yup.string().notRequired(),
    roles: Yup.array(
        Yup.object().shape({
            role: Yup.string().required(),
            view: Yup.boolean().notRequired(),
            view_self: Yup.boolean().notRequired(),
            create: Yup.boolean().notRequired(),
            update: Yup.boolean().notRequired(),
            update_self: Yup.boolean().notRequired(),
            remove: Yup.boolean().notRequired(),
        })
    ),
});

const NewUser: NextPage = () => {
    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);
    const { stores } = useContext(StoresContext);

    const [usersRoles, setUsersRoles] = useState<UserRole[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');
    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");
    const [documentType, setDocumentType] = useState("CPF");

    const router = useRouter();

    useEffect(() => {
        handleItemSideBar('users');
        handleSelectedMenu('users-new');

        if (user && can(user, "users", "create")) {
            api.get('user/roles').then(res => {
                const roles: userRoles[] = res.data;

                setUsersRoles(roles.map(role => {
                    if (role.role === "users") {
                        return {
                            id: role.role,
                            role: role.role,
                            view: false,
                            view_self: true,
                            create: false,
                            update: false,
                            update_self: true,
                            remove: false,
                        }
                    }

                    return {
                        id: role.role,
                        role: role.role,
                        view: false,
                        view_self: false,
                        create: false,
                        update: false,
                        update_self: true,
                        remove: false,
                    }
                }));

                setLoadingData(false);
            }).catch(err => {
                console.log('Error get users roles, ', err);

                setTypeLoadingMessage("error");
                setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                setHasErrors(true);
            });
        }

    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleChecks(event: ChangeEvent<HTMLInputElement>) {
        const roleId = event.target.value.split("-", 1)[0];
        const grant = event.target.value.split("-", 2)[1];

        const updatedUsersRoles = usersRoles.map(role => {
            if (role.id === roleId) {
                if (grant === 'all') {
                    return {
                        ...role,
                        view: true,
                        view_self: false,
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

                    return { ...role, view: !role.view, view_self: false };
                }
                if (grant === 'view_self') return { ...role, view_self: !role.view_self, view: false };
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

    return (
        <>
            <NextSeo
                title="Criar usuário"
                description="Criar usuário da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Criar usuário',
                    description: 'Criar usuário da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Criar usuário | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "users", "create") ? <>
                                {
                                    loadingData || hasErrors ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <Container className="content-page">
                                            <Formik
                                                initialValues={{
                                                    name: '',
                                                    document: '',
                                                    email: '',
                                                    store_only: user.store_only,
                                                    discountLimit: process.env.NEXT_PUBLIC_DEFAULT_DISCOUNT_LIMIT ? prettifyCurrency(
                                                        Number(process.env.NEXT_PUBLIC_DEFAULT_DISCOUNT_LIMIT).toFixed(2)
                                                    ) : '0,00',
                                                    store: user.store_only ? (user.store ? user.store.id : '') : '',
                                                }}
                                                onSubmit={async values => {
                                                    if (values.store_only && !!!values.store) return;

                                                    setTypeMessage("waiting");
                                                    setMessageShow(true);

                                                    try {
                                                        const roles = usersRoles.map(role => {
                                                            return {
                                                                role: role.role,
                                                                view: role.view,
                                                                view_self: role.view_self,
                                                                create: role.create,
                                                                update: role.update,
                                                                update_self: role.update_self,
                                                                remove: role.remove,
                                                            }
                                                        });

                                                        await api.post('users', {
                                                            name: values.name,
                                                            document: values.document,
                                                            email: values.email,
                                                            store_only: values.store_only,
                                                            discountLimit: Number(values.discountLimit.replaceAll(".", "").replaceAll(",", ".")),
                                                            store: values.store,
                                                            roles,
                                                        });

                                                        setTypeMessage("success");

                                                        setTimeout(() => {
                                                            router.push('/users');
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
                                                        <Row className="mb-3">
                                                            <Col>
                                                                <PageBack href="/users" subTitle="Voltar para a lista de usuários." />
                                                            </Col>
                                                        </Row>

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

                                                            <Form.Group as={Col} sm={4} controlId="formGridEmail">
                                                                <Form.Label>E-mail</Form.Label>
                                                                <Form.Control
                                                                    type="email"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.email}
                                                                    name="email"
                                                                    isInvalid={!!errors.email && touched.email}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.email && errors.email}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-2 align-items-center">
                                                            <Form.Group as={Col} sm={3} controlId="formGridDiscountLimit">
                                                                <Form.Label>Limite de desconto</Form.Label>
                                                                <InputGroup className="mb-2">
                                                                    <InputGroup.Text id="btnGroupDiscountLimit">%</InputGroup.Text>

                                                                    <Form.Control
                                                                        type="text"
                                                                        onChange={(e) => {
                                                                            setFieldValue('discountLimit', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                            setFieldValue('discountLimit', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        value={values.discountLimit}
                                                                        name="discountLimit"
                                                                        isInvalid={!!errors.discountLimit && touched.discountLimit}
                                                                        aria-label="Limite para desconto em orçamentos."
                                                                        aria-describedby="btnGroupDiscountLimit"
                                                                    />
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">{touched.discountLimit && errors.discountLimit}</Form.Control.Feedback>
                                                            </Form.Group>

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
                                                                !!values.store_only && <Form.Group as={Col} sm={4} controlId="formGridStore">
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
                                                                                        <h6 className="text-success">{translatedRole ? translatedRole.translated : role.role} </h6>
                                                                                    </Col>

                                                                                    <Col>
                                                                                        <Form.Check
                                                                                            checked={role.view}
                                                                                            type="checkbox"
                                                                                            label="Visualizar"
                                                                                            name="type"
                                                                                            id={`formUserRoles${role.id}View`}
                                                                                            value={`${role.id}-view`}
                                                                                            onChange={handleChecks}
                                                                                        />
                                                                                    </Col>

                                                                                    {
                                                                                        rolesToViewSelf.find(item => { return item === role.id }) && <Col>
                                                                                            <Form.Check
                                                                                                checked={role.view_self}
                                                                                                type="checkbox"
                                                                                                label="Visualizar próprio"
                                                                                                name="type"
                                                                                                id={`formUserRoles${role.id}ViewSelf`}
                                                                                                value={`${role.id}-view_self`}
                                                                                                onChange={handleChecks}
                                                                                            />
                                                                                        </Col>
                                                                                    }

                                                                                    <Col>
                                                                                        <Form.Check
                                                                                            checked={role.create}
                                                                                            type="checkbox"
                                                                                            label="Criar"
                                                                                            name="type"
                                                                                            id={`formUserRoles${role.id}Create`}
                                                                                            value={`${role.id}-create`}
                                                                                            onChange={handleChecks}
                                                                                            disabled={!role.view && !role.view_self}
                                                                                        />
                                                                                    </Col>

                                                                                    <Col>
                                                                                        <Form.Check
                                                                                            checked={role.update}
                                                                                            type="checkbox"
                                                                                            label="Editar"
                                                                                            name="type"
                                                                                            id={`formUserRoles${role.id}Update`}
                                                                                            value={`${role.id}-update`}
                                                                                            onChange={handleChecks}
                                                                                            disabled={!role.view && !role.view_self}
                                                                                        />
                                                                                    </Col>

                                                                                    <Col>
                                                                                        <Form.Check
                                                                                            checked={role.remove}
                                                                                            type="checkbox"
                                                                                            label="Excluir"
                                                                                            name="type"
                                                                                            id={`formUserRoles${role.id}Remove`}
                                                                                            value={`${role.id}-remove`}
                                                                                            onChange={handleChecks}
                                                                                            disabled={!role.update}
                                                                                        />
                                                                                    </Col>

                                                                                    <Col>
                                                                                        <Form.Check
                                                                                            checked={
                                                                                                role.view &&
                                                                                                    role.create &&
                                                                                                    role.update &&
                                                                                                    role.update_self &&
                                                                                                    role.remove ? true : false
                                                                                            }
                                                                                            type="checkbox"
                                                                                            label="Tudo"
                                                                                            name="type"
                                                                                            id={`formUserRoles${role.id}All`}
                                                                                            value={`${role.id}-all`}
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

                                                        <Col className="border-top mb-3"></Col>

                                                        <Row className="justify-content-end">
                                                            {
                                                                messageShow ? <Col sm={3}><AlertMessage status={typeMessage} /></Col> :
                                                                    <Col className="col-row">
                                                                        <Button variant="success" type="submit">Convidar usuário</Button>
                                                                    </Col>

                                                            }
                                                        </Row>
                                                    </Form>
                                                )}
                                            </Formik>
                                        </Container >
                                }
                            </> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default NewUser;

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