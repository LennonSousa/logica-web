import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, ListGroup, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaKey } from 'react-icons/fa';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { UserRole, can, translatedRoles } from '../../../components/Users';
import PageBack from '../../../components/PageBack';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';
import { PageWaiting, PageType } from '../../../components/PageWaiting';

interface userRoles {
    role: string,
    grants: string[],
};

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!'),
    email: Yup.string().email('E-mail invlálido!').required('Obrigatório!'),
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

    const [usersRoles, setUsersRoles] = useState<UserRole[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');
    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const router = useRouter();

    useEffect(() => {
        handleItemSideBar('users');
        handleSelectedMenu('users-new');

        if (user && can(user, "users", "create")) {
            api.get('user/roles').then(res => {
                const roles: userRoles[] = res.data;

                setUsersRoles(roles.map(role => {
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
                                    loadingData ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <Container className="content-page">
                                            <Formik
                                                initialValues={{
                                                    name: '',
                                                    email: '',
                                                }}
                                                onSubmit={async values => {
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
                                                            email: values.email,
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
                                                {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                                                    <Form onSubmit={handleSubmit}>
                                                        <Row className="mb-3">
                                                            <Col>
                                                                <PageBack href="/users" subTitle="Voltar para a lista de usuários." />
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} sm={6} controlId="formGridName">
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

                                                            <Form.Group as={Col} sm={6} controlId="formGridEmail">
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

                                                                                    <Col>
                                                                                        <Form.Check
                                                                                            checked={role.create}
                                                                                            type="checkbox"
                                                                                            label="Criar"
                                                                                            name="type"
                                                                                            id={`formUserRoles${role.id}Create`}
                                                                                            value={`${role.id}-create`}
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
                                                                                            value={`${role.id}-update`}
                                                                                            onChange={handleChecks}
                                                                                            disabled={!role.view}
                                                                                        />
                                                                                    </Col>

                                                                                    {
                                                                                        role.id === 'users' && <Col>
                                                                                            <Form.Check
                                                                                                checked={role.update_self}
                                                                                                type="checkbox"
                                                                                                label="Editar próprio"
                                                                                                name="type"
                                                                                                id={`formUserRoles${role.id}UpdateSelf`}
                                                                                                value={`${role.id}-update_self`}
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
                                                                                            value={`${role.id}-remove`}
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