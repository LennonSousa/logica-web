import { ChangeEvent, useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, InputGroup, ListGroup, Modal, Row } from 'react-bootstrap';
import { Field, Formik } from 'formik';
import * as Yup from 'yup';
import { FaCopy, FaPlus } from 'react-icons/fa';

import api from '../../../../api/api';
import { TokenVerify } from '../../../../utils/tokenVerify';
import { SideBarContext } from '../../../../contexts/SideBarContext';
import { AuthContext } from '../../../../contexts/AuthContext';
import { can } from '../../../../components/Users';
import { Panel } from '../../../../components/Panels';
import PanelPrices from '../../../../components/PanelPrices';
import PageBack from '../../../../components/PageBack';
import { AlertMessage, statusModal } from '../../../../components/Interfaces/AlertMessage';
import { PageWaiting, PageType } from '../../../../components/PageWaiting';
import { prettifyCurrency } from '../../../../components/InputMask/masks';

const validationSchema = Yup.object().shape({
    name: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    capacity: Yup.string().notRequired(),
});

const priceValidationSchema = Yup.object().shape({
    potency: Yup.string().notRequired(),
    price: Yup.string().notRequired(),
    inversor: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    panel: Yup.string().required('Obrigatório!'),
});

const copyPricesValidationSchema = Yup.object().shape({
    panel: Yup.string().required('Obrigatório!'),
});

const PanelEdit: NextPage = () => {
    const router = useRouter();
    const { panel } = router.query;

    const { loading, user } = useContext(AuthContext);

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);

    const [data, setData] = useState<Panel>();

    const [panelsList, setPanelsList] = useState<Panel[]>([]);
    const [selectedPanel, setSelectedPanel] = useState<Panel | undefined>(undefined);

    const [loadingData, setLoadingData] = useState(true);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');
    const [messageShow, setMessageShow] = useState(false);
    const [deletingMessageShow, setDeletingMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [newItemMessageShow, setNewItemMessageShow] = useState(false);
    const [showModalNewType, setShowModalNewType] = useState(false);

    const handleCloseModalType = () => setShowModalNewType(false);
    const handleShowModalNewType = () => setShowModalNewType(true);

    const [showItemDelete, setShowItemDelete] = useState(false);

    const handleCloseItemDelete = () => setShowItemDelete(false);
    const handelShowItemDelete = () => setShowItemDelete(true);

    const [showCopyPrices, setShowCopyPrices] = useState(false);

    const handleCloseCopyPrices = () => { setSelectedPanel(undefined); setShowCopyPrices(false); }
    const handelShowCopyPrices = () => setShowCopyPrices(true);

    useEffect(() => {
        handleItemSideBar('estimates');
        handleSelectedMenu('estimates-panels');

        if (user) {
            if (can(user, "estimates", "update:any") || can(user, "users", "update:own") && panel === user.id) {
                api.get(`panels/${panel}`).then(res => {
                    setData(res.data);

                    setLoadingData(false);

                    api.get('panels').then(panelsRes => {
                        const list: Panel[] = panelsRes.data;

                        setPanelsList(list.filter(item => { return item.id !== panel }));
                    }).catch(err => {
                        console.log('Error get panels list, ', err);
                    });
                }).catch(err => {
                    console.log('Error get panel to edit, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                });
            }
        }
    }, [user, panel]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleUserDelete() {
        if (user && data) {
            setTypeMessage("waiting");
            setDeletingMessageShow(true);

            try {
                if (can(user, "estimates", "delete")) {
                    await api.delete(`panels/${panel}`);

                    setTypeMessage("success");

                    setTimeout(() => {
                        router.push('/panels');
                    }, 1500);
                }
            }
            catch (err) {
                console.log('error deleting panel');
                console.log(err);

                setTypeMessage("error");

                setTimeout(() => {
                    setDeletingMessageShow(false);
                }, 4000);
            }
        }
    }

    async function handleListPanelPrices() {
        try {
            const res = await api.get(`panels/${panel}`);

            setData(res.data);
        }
        catch (err) {
            console.log('Error get panel to edit, ', err);

            setTypeLoadingMessage("error");
            setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
        }
    }

    return (
        <>
            <NextSeo
                title="Editar painel"
                description="Editar painel da plataforma de gerenciamento da Lógica Renováveis."
                openGraph={{
                    url: 'https://app.logicarenovaveis.com',
                    title: 'Editar painel',
                    description: 'Editar painel da plataforma de gerenciamento da Lógica Renováveis.',
                    images: [
                        {
                            url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg',
                            alt: 'Editar painel | Plataforma Lógica Renováveis',
                        },
                        { url: 'https://app.logicarenovaveis.com/assets/images/logo-logica.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "users", "update:any") || can(user, "users", "update:own") && panel === user.id ? <>
                                {
                                    loadingData ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <>
                                            {
                                                !data ? <PageWaiting status="waiting" /> :
                                                    <Container className="content-page">
                                                        <>
                                                            <Formik
                                                                initialValues={{
                                                                    name: data.name,
                                                                    capacity: prettifyCurrency(String(data.capacity)),
                                                                    order: data.order,
                                                                }}
                                                                onSubmit={async values => {
                                                                    setTypeMessage("waiting");
                                                                    setMessageShow(true);

                                                                    try {
                                                                        await api.put(`panels/${data.id}`, {
                                                                            name: values.name,
                                                                            capacity: values.capacity.replaceAll('.', '').replaceAll(',', '.'),
                                                                            order: values.order,
                                                                        });

                                                                        setTypeMessage("success");

                                                                        setTimeout(() => {
                                                                            router.push(`/estimates/panels/details/${data.id}`);
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
                                                                                <PageBack
                                                                                    href={`/estimates/panels/details/${data.id}`}
                                                                                    subTitle="Voltar para os detalhes do painel."
                                                                                />
                                                                            </Col>
                                                                        </Row>

                                                                        <Row className="mb-3">
                                                                            <Form.Group as={Col} sm={8} controlId="formGridName">
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
                                                                                <Form.Text className="text-muted text-right">{`${values.name.length}/50 caracteres.`}</Form.Text>
                                                                            </Form.Group>

                                                                            <Form.Group as={Col} sm={4} controlId="formGridCapacity">
                                                                                <Form.Label>Capacidade</Form.Label>
                                                                                <InputGroup className="mb-2">

                                                                                    <InputGroup.Text id="btnGroupCapacity">kWp</InputGroup.Text>

                                                                                    <Form.Control
                                                                                        type="text"
                                                                                        onChange={(e) => {
                                                                                            setFieldValue('capacity', prettifyCurrency(e.target.value));
                                                                                        }}
                                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                                            setFieldValue('capacity', prettifyCurrency(e.target.value));
                                                                                        }}
                                                                                        value={values.capacity}
                                                                                        name="capacity"
                                                                                        isInvalid={!!errors.capacity && touched.capacity}
                                                                                        aria-label="Capacidade"
                                                                                        aria-describedby="btnGroupCapacity"
                                                                                    />
                                                                                </InputGroup>
                                                                                <Form.Control.Feedback type="invalid">{touched.capacity && errors.capacity}</Form.Control.Feedback>
                                                                            </Form.Group>
                                                                        </Row>

                                                                        <Col className="border-top mb-3"></Col>

                                                                        <Row className="mb-3">
                                                                            <div className="member-container">
                                                                                <h6 className="text-success">Preços</h6>
                                                                            </div>

                                                                            <Col className="col-row">
                                                                                <Button
                                                                                    variant="outline-success"
                                                                                    size="sm"
                                                                                    onClick={handleShowModalNewType}
                                                                                    title="Criar um novo preço para este painel."
                                                                                >
                                                                                    <FaPlus />
                                                                                </Button>
                                                                            </Col>

                                                                            <Col className="col-row">
                                                                                <Button
                                                                                    variant="outline-success"
                                                                                    size="sm"
                                                                                    onClick={handelShowCopyPrices}
                                                                                    title="Importar valores de outro painel."
                                                                                >
                                                                                    <FaCopy />
                                                                                </Button>
                                                                            </Col>
                                                                        </Row>

                                                                        <Row>
                                                                            <Col>
                                                                                <ListGroup className="mb-3">
                                                                                    {
                                                                                        data.prices.map(panelPrice => {
                                                                                            return <PanelPrices
                                                                                                key={panelPrice.id}
                                                                                                panelPrice={panelPrice}
                                                                                                handleListPanelPrices={handleListPanelPrices}
                                                                                            />
                                                                                        })
                                                                                    }
                                                                                </ListGroup>
                                                                            </Col>
                                                                        </Row>

                                                                        <Col className="border-top mb-3"></Col>

                                                                        <Row className="justify-content-end">
                                                                            {
                                                                                messageShow ? <Col sm={3}><AlertMessage status={typeMessage} /></Col> :
                                                                                    <>
                                                                                        {
                                                                                            can(user, "estimates", "delete") && <Col className="col-row">
                                                                                                <Button
                                                                                                    variant="danger"
                                                                                                    onClick={handelShowItemDelete}
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

                                                            <Modal show={showItemDelete} onHide={handleCloseItemDelete}>
                                                                <Modal.Header closeButton>
                                                                    <Modal.Title>Excluir pessoa</Modal.Title>
                                                                </Modal.Header>
                                                                <Modal.Body>
                                                                    Você tem certeza que deseja excluir o painel <b>{data.name}</b>? Essa ação não poderá ser desfeita.
                                                                </Modal.Body>
                                                                <Modal.Footer>
                                                                    <Row>
                                                                        {
                                                                            deletingMessageShow ? <Col><AlertMessage status={typeMessage} /></Col> :
                                                                                <>
                                                                                    {
                                                                                        can(user, "users", "delete") && <Col className="col-row">
                                                                                            <Button
                                                                                                variant="danger"
                                                                                                type="button"
                                                                                                onClick={handleUserDelete}
                                                                                            >
                                                                                                Excluir
                                                                                            </Button>
                                                                                        </Col>
                                                                                    }

                                                                                    <Button
                                                                                        className="col-row"
                                                                                        variant="outline-secondary"
                                                                                        onClick={handleCloseItemDelete}
                                                                                    >
                                                                                        Cancelar
                                                                                    </Button>
                                                                                </>
                                                                        }
                                                                    </Row>
                                                                </Modal.Footer>
                                                            </Modal>

                                                            <Modal show={showModalNewType} onHide={handleCloseModalType}>
                                                                <Modal.Header closeButton>
                                                                    <Modal.Title>Criar um preço</Modal.Title>
                                                                </Modal.Header>
                                                                <Formik
                                                                    initialValues={
                                                                        {
                                                                            potency: '0',
                                                                            price: '0',
                                                                            inversor: '',
                                                                            panel: data.id,
                                                                        }
                                                                    }
                                                                    onSubmit={async values => {
                                                                        setTypeMessage("waiting");
                                                                        setNewItemMessageShow(true);

                                                                        try {
                                                                            await api.post('panels/prices', {
                                                                                potency: values.potency.replaceAll('.', '').replaceAll(',', '.'),
                                                                                price: values.price.replaceAll('.', '').replaceAll(',', '.'),
                                                                                inversor: values.inversor,
                                                                                panel: values.panel,
                                                                            });

                                                                            await handleListPanelPrices();

                                                                            setTypeMessage("success");

                                                                            setTimeout(() => {
                                                                                setNewItemMessageShow(false);
                                                                                handleCloseModalType();
                                                                            }, 1000);
                                                                        }
                                                                        catch (err) {
                                                                            setTypeMessage("error");

                                                                            setTimeout(() => {
                                                                                setNewItemMessageShow(false);
                                                                            }, 4000);

                                                                            console.log('error create customer type.');
                                                                            console.log(err);
                                                                        }

                                                                    }}
                                                                    validationSchema={priceValidationSchema}
                                                                >
                                                                    {({ handleChange, handleBlur, handleSubmit, values, setFieldValue, errors, touched }) => (
                                                                        <Form onSubmit={handleSubmit}>
                                                                            <Modal.Body>
                                                                                <Row>
                                                                                    <Form.Group as={Col} sm={6} controlId="formGridPotency">
                                                                                        <Form.Label>Potência</Form.Label>
                                                                                        <InputGroup className="mb-2">

                                                                                            <InputGroup.Text id="btnGroupPotency">kWp</InputGroup.Text>

                                                                                            <Form.Control
                                                                                                type="text"
                                                                                                onChange={(e) => {
                                                                                                    setFieldValue('potency', prettifyCurrency(e.target.value));
                                                                                                }}
                                                                                                onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                                                    setFieldValue('potency', prettifyCurrency(e.target.value));
                                                                                                }}
                                                                                                value={values.potency}
                                                                                                name="potency"
                                                                                                isInvalid={!!errors.potency && touched.potency}
                                                                                                aria-label="Potência"
                                                                                                aria-describedby="btnGroupPotency"
                                                                                            />
                                                                                        </InputGroup>
                                                                                        <Form.Control.Feedback type="invalid">{touched.potency && errors.potency}</Form.Control.Feedback>
                                                                                    </Form.Group>

                                                                                    <Form.Group as={Col} sm={6} controlId="formGridPrice">
                                                                                        <Form.Label>Valor</Form.Label>
                                                                                        <InputGroup className="mb-2">

                                                                                            <InputGroup.Text id="btnGroupPrice">R$</InputGroup.Text>

                                                                                            <Form.Control
                                                                                                type="text"
                                                                                                onChange={(e) => {
                                                                                                    setFieldValue('price', prettifyCurrency(e.target.value));
                                                                                                }}
                                                                                                onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                                                                                    setFieldValue('price', prettifyCurrency(e.target.value));
                                                                                                }}
                                                                                                value={values.price}
                                                                                                name="price"
                                                                                                isInvalid={!!errors.price && touched.price}
                                                                                                aria-label="Valor"
                                                                                                aria-describedby="btnGroupPrice"
                                                                                            />
                                                                                        </InputGroup>
                                                                                        <Form.Control.Feedback type="invalid">{touched.price && errors.price}</Form.Control.Feedback>
                                                                                    </Form.Group>
                                                                                </Row>

                                                                                <Form.Group controlId="statusFormGridInversor">
                                                                                    <Form.Label>Inversor</Form.Label>
                                                                                    <Form.Control type="text"
                                                                                        placeholder="Inversor"
                                                                                        onChange={handleChange}
                                                                                        onBlur={handleBlur}
                                                                                        value={values.inversor}
                                                                                        name="inversor"
                                                                                        isInvalid={!!errors.inversor && touched.inversor}
                                                                                    />
                                                                                    <Form.Control.Feedback type="invalid">{touched.inversor && errors.inversor}</Form.Control.Feedback>
                                                                                    <Form.Text className="text-muted text-right">{`${values.inversor.length}/50 caracteres.`}</Form.Text>
                                                                                </Form.Group>
                                                                            </Modal.Body>
                                                                            <Modal.Footer>
                                                                                {
                                                                                    newItemMessageShow ? <AlertMessage status={typeMessage} /> :
                                                                                        <>
                                                                                            <Button variant="secondary" onClick={handleCloseModalType}>
                                                                                                Cancelar
                                                                                            </Button>
                                                                                            <Button variant="success" type="submit">Salvar</Button>
                                                                                        </>

                                                                                }
                                                                            </Modal.Footer>
                                                                        </Form>
                                                                    )}
                                                                </Formik>
                                                            </Modal>

                                                            <Modal show={showCopyPrices} size="lg" onHide={handleCloseCopyPrices}>
                                                                <Modal.Header closeButton>
                                                                    <Modal.Title>Importar valores</Modal.Title>
                                                                </Modal.Header>
                                                                <Formik
                                                                    initialValues={
                                                                        {
                                                                            panel: '',
                                                                            prices: [],
                                                                        }
                                                                    }
                                                                    onSubmit={async values => {
                                                                        if (selectedPanel) {
                                                                            setTypeMessage("waiting");
                                                                            setNewItemMessageShow(true);

                                                                            try {

                                                                                values.prices.forEach(price => {
                                                                                    const pricesToCopy = selectedPanel.prices.filter(item => { return item.id === price });

                                                                                    pricesToCopy.forEach(async priceToCopy => {
                                                                                        await api.post('panels/prices', {
                                                                                            potency: priceToCopy.potency,
                                                                                            price: priceToCopy.price,
                                                                                            inversor: priceToCopy.inversor,
                                                                                            panel,
                                                                                        });
                                                                                    });
                                                                                });

                                                                                await handleListPanelPrices();

                                                                                setTypeMessage("success");

                                                                                setTimeout(() => {
                                                                                    setNewItemMessageShow(false);
                                                                                    handleCloseCopyPrices();
                                                                                }, 1000);
                                                                            }
                                                                            catch (err) {
                                                                                setTypeMessage("error");

                                                                                setTimeout(() => {
                                                                                    setNewItemMessageShow(false);
                                                                                }, 4000);

                                                                                console.log('error create customer type.');
                                                                                console.log(err);
                                                                            }
                                                                        }
                                                                    }}
                                                                    validationSchema={copyPricesValidationSchema}
                                                                >
                                                                    {({ handleBlur, handleSubmit, values, setFieldValue, errors, touched }) => (
                                                                        <Form onSubmit={handleSubmit}>
                                                                            <Modal.Body>
                                                                                <Form.Group controlId="formGridSelectPanel">
                                                                                    <Form.Label>Painel</Form.Label>
                                                                                    <Form.Control
                                                                                        as="select"
                                                                                        onChange={(e) => {
                                                                                            setFieldValue('panel', e.target.value);

                                                                                            const foundPanel = panelsList.find(item => { return item.id === e.target.value });

                                                                                            if (foundPanel) setSelectedPanel(foundPanel);
                                                                                        }}
                                                                                        onBlur={handleBlur}
                                                                                        value={values.panel}
                                                                                        name="panel"
                                                                                        isInvalid={!!errors.panel && touched.panel}
                                                                                    >
                                                                                        <option hidden>Selecione um painel</option>
                                                                                        {
                                                                                            panelsList.map((item, index) => {
                                                                                                return <option key={index} value={item.id}>{item.name}</option>
                                                                                            })
                                                                                        }
                                                                                    </Form.Control>
                                                                                    <Form.Control.Feedback type="invalid">{touched.panel && errors.panel}</Form.Control.Feedback>
                                                                                </Form.Group>

                                                                                <Col className="border-top mt-3"></Col>

                                                                                <ListGroup className="mt-3">
                                                                                    {
                                                                                        selectedPanel && selectedPanel.prices.map((item, index) => {
                                                                                            return <ListGroup.Item key={index} variant="light">
                                                                                                <Row className="align-items-center">
                                                                                                    <Form.Label column>
                                                                                                        <Field type="checkbox" name="prices" value={item.id} />
                                                                                                        <span className="col">
                                                                                                            {item.potency}
                                                                                                        </span>

                                                                                                        <span className="col">
                                                                                                            {item.inversor}
                                                                                                        </span>

                                                                                                        <span className="col">
                                                                                                            {`R$ ${prettifyCurrency(String(item.price))}`}
                                                                                                        </span>
                                                                                                    </Form.Label>
                                                                                                </Row>
                                                                                            </ListGroup.Item>
                                                                                        })
                                                                                    }
                                                                                </ListGroup>
                                                                            </Modal.Body>
                                                                            <Modal.Footer>
                                                                                {
                                                                                    newItemMessageShow ? <AlertMessage status={typeMessage} /> :
                                                                                        <>
                                                                                            <Button variant="secondary" onClick={handleCloseCopyPrices}>
                                                                                                Cancelar
                                                                                            </Button>
                                                                                            <Button variant="success" type="submit">Importar</Button>
                                                                                        </>

                                                                                }
                                                                            </Modal.Footer>
                                                                        </Form>
                                                                    )}
                                                                </Formik>
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

export default PanelEdit;

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