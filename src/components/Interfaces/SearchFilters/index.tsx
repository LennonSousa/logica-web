import { useContext } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { endOfToday, format, subDays } from 'date-fns';

import { StoresContext } from '../../../contexts/StoresContext';

export interface StatusItems {
    id: string,
    name: string,
}

export interface SearchParams {
    store: string,
    status: string,
    range: "30" | "custom" | "unlimited",
    start: Date,
    end: Date,
}

interface SearchFilterProps {
    searchParams: SearchParams,
    show: boolean,
    storeOnly?: boolean,
    statusItems?: StatusItems[],
    handleSetFilters: (newSearchParams: SearchParams) => Promise<void>;
    handleCloseSearchFiltersModal: () => void;
}

const validationSchema = Yup.object().shape({
    store: Yup.string().required('Obrigatório!'),
    status: Yup.string().required('Obrigatório!'),
    range: Yup.string().required('Obrigatório!'),
    start: Yup.date().required('Obrigatório!'),
    end: Yup.date().required('Obrigatório!'),
});

const SearchFilters: React.FC<SearchFilterProps> = (
    {
        searchParams,
        show,
        handleSetFilters,
        handleCloseSearchFiltersModal,
        statusItems,
        storeOnly = false
    }
) => {
    const { stores } = useContext(StoresContext);

    return (
        <Modal show={show} onHide={handleCloseSearchFiltersModal}>
            <Modal.Header closeButton>
                <Modal.Title>Filtrar pesquisa</Modal.Title>
            </Modal.Header>

            <Formik
                initialValues={{
                    store: searchParams.store,
                    status: searchParams.status,
                    range: searchParams.range,
                    start: format(searchParams.start, 'yyyy-MM-dd'),
                    end: format(searchParams.end, 'yyyy-MM-dd'),
                }}
                onSubmit={async values => {
                    const start = values.range === "30" ? subDays(endOfToday(), 30) : new Date(`${values.start} 12:00:00`);
                    const end = values.range === "30" ? endOfToday() : new Date(`${values.end} 12:00:00`);

                    const newSearchParams: SearchParams = {
                        store: values.store,
                        status: values.status,
                        range: values.range,
                        start,
                        end,
                    }

                    handleSetFilters(newSearchParams);

                    handleCloseSearchFiltersModal();
                }}
                validationSchema={validationSchema}
            >
                {({ handleBlur, handleChange, handleSubmit, values, errors, touched }) => (
                    <Form onSubmit={handleSubmit}>
                        <Modal.Body>
                            {
                                !storeOnly && <Form.Group className="mb-3" controlId="formGridStore">
                                    <Form.Label>Loja</Form.Label>
                                    <Form.Control
                                        as="select"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.store}
                                        name="store"
                                        isInvalid={!!errors.store && touched.store}
                                    >
                                        <option value="all">Todas as lojas</option>
                                        {
                                            stores.map((store, index) => {
                                                return <option key={index} value={store.id}>{store.name}</option>
                                            })
                                        }
                                    </Form.Control>
                                    <Form.Control.Feedback type="invalid">{touched.store && errors.store}</Form.Control.Feedback>
                                </Form.Group>
                            }

                            {
                                statusItems && <Form.Group className="mb-3" controlId="formGridStatus">
                                    <Form.Label>Situação</Form.Label>
                                    <Form.Control
                                        as="select"
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        value={values.status}
                                        name="status"
                                        isInvalid={!!errors.status && touched.status}
                                    >
                                        <option value="all">Todas</option>
                                        {
                                            statusItems.map((status, index) => {
                                                return <option key={index} value={status.id}>{status.name}</option>
                                            })
                                        }
                                    </Form.Control>
                                    <Form.Control.Feedback type="invalid">{touched.status && errors.status}</Form.Control.Feedback>
                                </Form.Group>
                            }

                            <Form.Group className="mb-3" controlId="formGridRange">
                                <Form.Label>Período</Form.Label>
                                <Form.Control
                                    as="select"
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    value={values.range}
                                    name="range"
                                    isInvalid={!!errors.range && touched.range}
                                >
                                    <option value="30">Úlitmos 30 dias</option>
                                    <option value="custom">Datas personalizadas</option>
                                    <option value="unlimited">Todas as datas</option>
                                </Form.Control>
                                <Form.Control.Feedback type="invalid">{touched.range && errors.range}</Form.Control.Feedback>
                            </Form.Group>

                            {
                                values.range === 'custom' && <Row>
                                    <Form.Group as={Col} sm={6} controlId="formGridStart">
                                        <Form.Label>Início</Form.Label>
                                        <Form.Control
                                            type="date"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.start}
                                            name="start"
                                            isInvalid={!!errors.start && touched.start}
                                        />
                                        <Form.Control.Feedback type="invalid">{touched.start && errors.start}</Form.Control.Feedback>
                                    </Form.Group>

                                    <Form.Group as={Col} sm={6} controlId="formGridEnd">
                                        <Form.Label>Final</Form.Label>
                                        <Form.Control
                                            type="date"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            value={values.end}
                                            name="end"
                                            isInvalid={!!errors.end && touched.end}
                                        />
                                        <Form.Control.Feedback type="invalid">{touched.end && errors.end}</Form.Control.Feedback>
                                    </Form.Group>
                                </Row>
                            }
                        </Modal.Body>

                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseSearchFiltersModal}>Cancelar</Button>
                            <Button variant="success" type="submit">Aplicar</Button>
                        </Modal.Footer>
                    </Form>
                )}
            </Formik>
        </Modal>
    )
}

export default SearchFilters;