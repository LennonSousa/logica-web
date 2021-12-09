import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, Image, Row, Spinner } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaUserTie } from 'react-icons/fa';
import cep, { CEP } from 'cep-promise';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { can } from '../../../components/Users';
import { Store } from '../../../components/Stores';

const TextEditor = dynamic(
    () => {
        return import("../../../components/Stores/TextEditor");
    },
    { ssr: false }
);

import { cpf, cnpj } from '../../../components/InputMask/masks';
import { statesCities } from '../../../components/StatesCities';
import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/Interfaces/AlertMessage';

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const validationSchema = Yup.object().shape({
    title: Yup.string().required('Obrigatório!'),
    name: Yup.string().required('Obrigatório!'),
    phone: Yup.string().notRequired(),
    description: Yup.string().notRequired().nullable(),
    email: Yup.string().email('E-mail inválido!').notRequired().nullable(),
    zip_code: Yup.string().min(8, 'Deve conter no mínimo 8 caracteres!').max(8, 'Deve conter no máximo 8 caracteres!'),
    street: Yup.string().notRequired(),
    number: Yup.string().notRequired(),
    neighborhood: Yup.string().notRequired(),
    complement: Yup.string().notRequired().nullable(),
    city: Yup.string().required('Obrigatório!'),
    state: Yup.string().required('Obrigatório!'),
    document: Yup.string().min(14, 'CPF inválido!').max(18, 'CNPJ inválido!').required('Obrigatório!'),
});

const EditStore: NextPage = () => {
    const router = useRouter();

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [imagePreview, setImagePreview] = useState('/assets/images/logo-logica.jpg');
    const [imageSelected, setImageSelected] = useState<File>();

    const [spinnerCep, setSpinnerCep] = useState(false);
    const [messageShow, setMessageShow] = useState(false);

    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");
    const [documentType, setDocumentType] = useState("CPF");
    const [cities, setCities] = useState<string[]>([]);

    useEffect(() => {
        handleItemSideBar('stores');
        handleSelectedMenu('stores-new');
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function handleSelectImage(event: ChangeEvent<HTMLInputElement>) {
        try {
            if (event.target.files) {
                const image = event.target.files[0];

                setImageSelected(image);
                setImagePreview(URL.createObjectURL(image));
            }
        }
        catch {
        }

    }

    return (
        <>
            <NextSeo
                title="Criar loja"
                description="Criar loja da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Criar loja',
                    description: 'Criar loja da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Criar loja | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "store", "update:any") ? <Container className="content-page">
                                <Row className="mb-3">
                                    <Col>
                                        <PageBack href="/stores" subTitle="Voltar para a lista de lojas" />
                                    </Col>
                                </Row>

                                <Formik
                                    initialValues={{
                                        title: '',
                                        name: '',
                                        phone: '',
                                        description: '',
                                        email: '',
                                        zip_code: '',
                                        street: '',
                                        number: '',
                                        neighborhood: '',
                                        complement: '',
                                        city: '',
                                        state: '',
                                        document: '',
                                    }}
                                    onSubmit={async values => {
                                        if (!imageSelected) return;

                                        setTypeMessage("waiting");
                                        setMessageShow(true);

                                        try {
                                            const dataToSave = new FormData();

                                            dataToSave.append('title', values.title);
                                            dataToSave.append('name', values.name);
                                            dataToSave.append('avatar', imageSelected);
                                            dataToSave.append('phone', values.phone);
                                            dataToSave.append('description', values.description);
                                            dataToSave.append('email', values.email);
                                            dataToSave.append('zip_code', values.zip_code);
                                            dataToSave.append('street', values.street);
                                            dataToSave.append('number', values.number);
                                            dataToSave.append('neighborhood', values.neighborhood);
                                            dataToSave.append('complement', values.complement);
                                            dataToSave.append('city', values.city);
                                            dataToSave.append('state', values.state);
                                            dataToSave.append('document', values.document);

                                            await api.post('stores', dataToSave);

                                            setTypeMessage("success");

                                            setTimeout(() => {
                                                router.push('/stores');
                                            }, 1000);
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
                                    {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
                                        <Form onSubmit={handleSubmit}>
                                            <Row className="mb-3">
                                                <Col>
                                                    <Row>
                                                        <Col>
                                                            <h6 className="text-success">Informações <FaUserTie /></h6>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                            </Row>

                                            <Row className="mb-3 align-items-end">
                                                <Col md={3} sm={1}>
                                                    <Image src={imagePreview} rounded fluid thumbnail />
                                                </Col>
                                                <Col md={6} sm={4}>
                                                    <Form.Group controlId="procuctImageFile" className="mb-3">
                                                        <Form.Label>Escolher imagem</Form.Label>
                                                        <Form.Control
                                                            type="file"
                                                            onChange={handleSelectImage}
                                                            isInvalid={!imageSelected && touched.title}
                                                        />
                                                        {
                                                            !imageSelected && touched.title &&
                                                            <label className="invalid-feedback" style={{ display: 'block' }}>Obrigatório!</label>
                                                        }
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Row className="mb-3">
                                                <Form.Group as={Col} sm={5} controlId="formGridTitle">
                                                    <Form.Label>Nome de fantasia</Form.Label>
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

                                                <Form.Group as={Col} sm={4} controlId="formGridName">
                                                    <Form.Label>Razão Social</Form.Label>
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
                                            </Row>

                                            <Row className="mb-3">
                                                <Form.Group as={Col} controlId="formGridDescription">
                                                    <Form.Label>Descrição</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={4}
                                                        style={{ resize: 'none' }}
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.description}
                                                        name="description"
                                                    />
                                                </Form.Group>
                                            </Row>

                                            <Row className="mb-3">
                                                <Form.Group as={Col} sm={7} controlId="formGridPhone">
                                                    <Form.Label>Telefones</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.phone}
                                                        name="phone"
                                                        isInvalid={!!errors.phone && touched.phone}
                                                    />
                                                    <Form.Control.Feedback type="invalid">{touched.phone && errors.phone}</Form.Control.Feedback>
                                                </Form.Group>

                                                <Form.Group as={Col} sm={5} controlId="formGridEmail">
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

                                            <Row className="mb-3">
                                                <Form.Group as={Col} lg={2} md={3} sm={5} controlId="formGridZipCode">
                                                    <Form.Label>CEP</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="00000000"
                                                        autoComplete="off"
                                                        onChange={(e) => {
                                                            handleChange(e);

                                                            if (e.target.value !== '' && e.target.value.length === 8) {
                                                                setSpinnerCep(true);
                                                                cep(e.target.value)
                                                                    .then((cep: CEP) => {
                                                                        const { street, neighborhood, city, state } = cep;

                                                                        const stateCities = statesCities.estados.find(item => { return item.sigla === state })

                                                                        if (stateCities)
                                                                            setCities(stateCities.cidades);

                                                                        setFieldValue('street', street);
                                                                        setFieldValue('neighborhood', neighborhood);
                                                                        setFieldValue('city', city);
                                                                        setFieldValue('state', state);

                                                                        setSpinnerCep(false);
                                                                    })
                                                                    .catch(() => {
                                                                        setSpinnerCep(false);
                                                                    });
                                                            }
                                                        }}
                                                        value={values.zip_code}
                                                        name="zip_code"
                                                        isInvalid={!!errors.zip_code && touched.zip_code}
                                                    />
                                                    <Form.Control.Feedback type="invalid">{touched.zip_code && errors.zip_code}</Form.Control.Feedback>
                                                </Form.Group>

                                                <Col style={{ display: 'flex', alignItems: 'center' }}>
                                                    {
                                                        spinnerCep && <Spinner
                                                            as="span"
                                                            animation="border"
                                                            variant="info"
                                                            role="status"
                                                            aria-hidden="true"
                                                        />
                                                    }
                                                </Col>
                                            </Row>

                                            <Row className="mb-2">
                                                <Form.Group as={Col} sm={10} controlId="formGridStreet">
                                                    <Form.Label>Rua</Form.Label>
                                                    <Form.Control
                                                        type="address"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.street}
                                                        name="street"
                                                        isInvalid={!!errors.street && touched.street}
                                                    />
                                                    <Form.Control.Feedback type="invalid">{touched.street && errors.street}</Form.Control.Feedback>
                                                </Form.Group>

                                                <Form.Group as={Col} sm={2} controlId="formGridNumber">
                                                    <Form.Label>Número</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.number}
                                                        name="number"
                                                        isInvalid={!!errors.number && touched.number}
                                                    />
                                                    <Form.Control.Feedback type="invalid">{touched.number && errors.number}</Form.Control.Feedback>
                                                </Form.Group>
                                            </Row>

                                            <Row className="mb-3">
                                                <Form.Group as={Col} controlId="formGridComplement">
                                                    <Form.Label>Complemento</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.complement}
                                                        name="complement"
                                                        isInvalid={!!errors.complement && touched.complement}
                                                    />
                                                    <Form.Control.Feedback type="invalid">{touched.complement && errors.complement}</Form.Control.Feedback>
                                                </Form.Group>
                                            </Row>

                                            <Row className="mb-2">
                                                <Form.Group as={Col} sm={6} controlId="formGridNeighborhood">
                                                    <Form.Label>Bairro</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.neighborhood}
                                                        name="neighborhood"
                                                        isInvalid={!!errors.neighborhood && touched.neighborhood}
                                                    />
                                                    <Form.Control.Feedback type="invalid">{touched.neighborhood && errors.neighborhood}</Form.Control.Feedback>
                                                </Form.Group>

                                                <Form.Group as={Col} sm={2} controlId="formGridState">
                                                    <Form.Label>Estado</Form.Label>
                                                    <Form.Control
                                                        as="select"
                                                        onChange={(e) => {
                                                            setFieldValue('state', e.target.value);

                                                            const stateCities = statesCities.estados.find(item => { return item.sigla === e.target.value })

                                                            if (stateCities)
                                                                setCities(stateCities.cidades);
                                                        }}
                                                        onBlur={handleBlur}
                                                        value={values.state ? values.state : '...'}
                                                        name="state"
                                                        isInvalid={!!errors.state && touched.state}
                                                    >
                                                        <option hidden>...</option>
                                                        {
                                                            statesCities.estados.map((estado, index) => {
                                                                return <option key={index} value={estado.sigla}>{estado.nome}</option>
                                                            })
                                                        }
                                                    </Form.Control>
                                                    <Form.Control.Feedback type="invalid">{touched.state && errors.state}</Form.Control.Feedback>
                                                </Form.Group>

                                                <Form.Group as={Col} sm={4} controlId="formGridCity">
                                                    <Form.Label>Cidade</Form.Label>
                                                    <Form.Control
                                                        as="select"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.city ? values.city : '...'}
                                                        name="city"
                                                        isInvalid={!!errors.city && touched.city}
                                                        disabled={!!!values.state}
                                                    >
                                                        <option hidden>...</option>
                                                        {
                                                            !!values.state && cities.map((city, index) => {
                                                                return <option key={index} value={city}>{city}</option>
                                                            })
                                                        }
                                                    </Form.Control>
                                                    <Form.Control.Feedback type="invalid">{touched.city && errors.city}</Form.Control.Feedback>
                                                </Form.Group>
                                            </Row>

                                            <Col className="border-top mb-3"></Col>

                                            <Row className="justify-content-end">
                                                {
                                                    messageShow ? <Col sm={3}><AlertMessage status={typeMessage} /></Col> :
                                                        <Col sm={1}>
                                                            <Button variant="success" type="submit">Salvar</Button>
                                                        </Col>

                                                }
                                            </Row>
                                        </Form>
                                    )}
                                </Formik>
                            </Container> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export default EditStore;

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