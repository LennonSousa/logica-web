import { useState } from 'react';
import { Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import { FaCopy } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { ConsumptionCalcProps, handleFormConsumptionValues } from '../../../utils/calcEstimate';
import { AlertMessage, statusModal } from '../../Interfaces/AlertMessage';
import { prettifyCurrency } from '../../InputMask/masks';
import { RoofOrientation } from '../../RoofOrientations';
import { Panel } from '../../Panels';

interface ConsumptionModalProps {
    consumptionValuesToCalc?: ConsumptionCalcProps;
    panels: Panel[];
    roofOrientations: RoofOrientation[];
    show: boolean;
    handleConsumptionValuesToCalc: (newValues: ConsumptionCalcProps) => void;
    handleCloseConsumptionModal: () => void;
}

const consumptionValidationSchema = Yup.object().shape({
    kwh: Yup.string().required('Obrigatório!'),
    irradiation: Yup.string().required('Obrigatório!'),
    month_01: Yup.string().required('Obrigatório!'),
    month_02: Yup.string().required('Obrigatório!'),
    month_03: Yup.string().required('Obrigatório!'),
    month_04: Yup.string().required('Obrigatório!'),
    month_05: Yup.string().required('Obrigatório!'),
    month_06: Yup.string().required('Obrigatório!'),
    month_07: Yup.string().required('Obrigatório!'),
    month_08: Yup.string().required('Obrigatório!'),
    month_09: Yup.string().required('Obrigatório!'),
    month_10: Yup.string().required('Obrigatório!'),
    month_11: Yup.string().required('Obrigatório!'),
    month_12: Yup.string().required('Obrigatório!'),
    month_13: Yup.string().required('Obrigatório!'),
    average_increase: Yup.string().required('Obrigatório!'),
    panel: Yup.string().required('Obrigatório!'),
    roof_orientation: Yup.string().required('Obrigatório!'),
});

const ConsumptionModal: React.FC<ConsumptionModalProps> = (
    {
        consumptionValuesToCalc,
        panels,
        roofOrientations,
        show,
        handleConsumptionValuesToCalc,
        handleCloseConsumptionModal
    }
) => {
    const [calculatingMessageShow, setCalculatingMessageShow] = useState(false);

    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    return <Modal size="xl" show={show} onHide={handleCloseConsumptionModal}>
        <Modal.Header closeButton>
            <Modal.Title>Informações de consumo</Modal.Title>
        </Modal.Header>

        <Formik
            initialValues={{
                kwh: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.kwh.toFixed(2) : '0.00'),
                irradiation: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.irradiation.toFixed(2) : '0.00'),
                month_01: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.month_01.toFixed(2) : '0.00'),
                month_02: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.month_02.toFixed(2) : '0.00'),
                month_03: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.month_03.toFixed(2) : '0.00'),
                month_04: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.month_04.toFixed(2) : '0.00'),
                month_05: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.month_05.toFixed(2) : '0.00'),
                month_06: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.month_06.toFixed(2) : '0.00'),
                month_07: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.month_07.toFixed(2) : '0.00'),
                month_08: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.month_08.toFixed(2) : '0.00'),
                month_09: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.month_09.toFixed(2) : '0.00'),
                month_10: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.month_10.toFixed(2) : '0.00'),
                month_11: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.month_11.toFixed(2) : '0.00'),
                month_12: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.month_12.toFixed(2) : '0.00'),
                month_13: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.month_13.toFixed(2) : '0.00'),
                average_increase: prettifyCurrency(consumptionValuesToCalc ? consumptionValuesToCalc.averageIncrease.toFixed(2) : '0.00'),
                panel: consumptionValuesToCalc ? consumptionValuesToCalc.panel.id : '',
                roof_orientation: consumptionValuesToCalc ? consumptionValuesToCalc.roofOrientation.id : ''
            }}
            onSubmit={async values => {
                setTypeMessage("waiting");
                setCalculatingMessageShow(true);

                try {
                    const newConsumptionValues = handleFormConsumptionValues(values, panels, roofOrientations);

                    if (!newConsumptionValues) {
                        console.log('error calculating estimate');

                        setTypeMessage("error");

                        setTimeout(() => {
                            setCalculatingMessageShow(false);
                        }, 4000);

                        return;
                    }

                    handleConsumptionValuesToCalc(newConsumptionValues);

                    setTypeMessage("success");

                    setTimeout(() => {
                        setCalculatingMessageShow(false);
                        handleCloseConsumptionModal();
                    }, 1000);
                }
                catch (err) {
                    console.log('error calculating estimate');
                    console.log(err);

                    setTypeMessage("error");

                    setTimeout(() => {
                        setCalculatingMessageShow(false);
                    }, 4000);
                }
            }}
            validationSchema={consumptionValidationSchema}
            enableReinitialize
        >
            {({ handleSubmit, handleBlur, setFieldValue, setValues, values, errors, touched }) => (
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row className="mb-3">
                            <Form.Group as={Col} sm={3} controlId="formGridKwh">
                                <Form.Label>Quilowatts/Hora</Form.Label>
                                <InputGroup className="mb-2">
                                    <InputGroup.Text id="btnGroupKwh">R$</InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('kwh', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('kwh', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.kwh}
                                        name="kwh"
                                        isInvalid={!!errors.kwh && touched.kwh}
                                        aria-label="Valor unitário do Quilowatts/Hora."
                                        aria-describedby="btnGroupKwh"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.kwh && errors.kwh}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group as={Col} sm={3} controlId="formGridIrratiation">
                                <Form.Label>Irradiação Local</Form.Label>
                                <InputGroup className="mb-2">

                                    <InputGroup.Text id="btnGroupIrradiation">kWh/m²</InputGroup.Text>


                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('irradiation', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('irradiation', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.irradiation}
                                        name="irradiation"
                                        isInvalid={!!errors.irradiation && touched.irradiation}
                                        aria-label="Irradiação Local em [kWh/m².dia]."
                                        aria-describedby="btnGroupIrradiation"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.irradiation && errors.irradiation}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group as={Col} sm={3} controlId="formGridPanel">
                                <Form.Label>Painél fotovoltaico (W)</Form.Label>
                                <Form.Control
                                    as="select"
                                    onChange={(e) => {
                                        setFieldValue('panel', e.target.value);
                                    }}
                                    onBlur={handleBlur}
                                    value={values.panel}
                                    name="panel"
                                    isInvalid={!!errors.panel && touched.panel}
                                >
                                    <option hidden>Escolha uma opção</option>
                                    {
                                        panels.map((panel, index) => {
                                            return <option key={index} value={panel.id}>{
                                                `${panel.name} - ${prettifyCurrency(String(panel.capacity))} W`
                                            }</option>
                                        })
                                    }
                                </Form.Control>
                                <Form.Control.Feedback type="invalid">{touched.panel && errors.panel}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group as={Col} sm={3} controlId="formGridRoofOrientation">
                                <Form.Label>Orientação do telhado</Form.Label>
                                <Form.Control
                                    as="select"
                                    onChange={(e) => {
                                        setFieldValue('roof_orientation', e.target.value);
                                    }}
                                    onBlur={handleBlur}
                                    value={values.roof_orientation}
                                    name="roof_orientation"
                                    isInvalid={!!errors.roof_orientation && touched.roof_orientation}
                                >
                                    <option hidden>Escolha uma opção</option>
                                    {
                                        roofOrientations.map((orientation, index) => {
                                            return <option key={index} value={orientation.id}>{orientation.name}</option>
                                        })
                                    }
                                </Form.Control>
                                <Form.Control.Feedback type="invalid">{touched.roof_orientation && errors.roof_orientation}</Form.Control.Feedback>
                            </Form.Group>
                        </Row>

                        <Row className="mb-2">
                            <Form.Group as={Col} sm={3} controlId="formGridMonth01">
                                <Form.Label>Mês 01</Form.Label>
                                <InputGroup className="mb-2">

                                    <InputGroup.Text id="btnGroupMonth01">kWh</InputGroup.Text>


                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('month_01', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('month_01', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.month_01}
                                        name="month_01"
                                        isInvalid={!!errors.month_01 && touched.month_01}
                                        aria-label="Consumo em kWh"
                                        aria-describedby="btnGroupMonth01"
                                    />

                                    <Button
                                        id="btnGroupMonth01"
                                        variant="success"
                                        title="Copiar este valor para todos os outros meses."
                                        onClick={() => {
                                            const updatedValues = {
                                                ...values,
                                                month_02: values.month_01,
                                                month_03: values.month_01,
                                                month_04: values.month_01,
                                                month_05: values.month_01,
                                                month_06: values.month_01,
                                                month_07: values.month_01,
                                                month_08: values.month_01,
                                                month_09: values.month_01,
                                                month_10: values.month_01,
                                                month_11: values.month_01,
                                                month_12: values.month_01,
                                                month_13: values.month_01,
                                            };

                                            setValues(updatedValues);
                                        }}
                                    >
                                        <FaCopy />
                                    </Button>

                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.month_01 && errors.month_01}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group as={Col} sm={3} controlId="formGridMonth02">
                                <Form.Label>Mês 02</Form.Label>
                                <InputGroup className="mb-2">

                                    <InputGroup.Text id="btnGroupMonth02">kWh</InputGroup.Text>


                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('month_02', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('month_02', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.month_02}
                                        name="month_02"
                                        isInvalid={!!errors.month_02 && touched.month_02}
                                        aria-label="Consumo em kWh"
                                        aria-describedby="btnGroupMonth02"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.month_02 && errors.month_02}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group as={Col} sm={3} controlId="formGridMonth03">
                                <Form.Label>Mês 03</Form.Label>
                                <InputGroup className="mb-2">

                                    <InputGroup.Text id="btnGroupMonth03">kWh</InputGroup.Text>


                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('month_03', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('month_03', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.month_03}
                                        name="month_03"
                                        isInvalid={!!errors.month_03 && touched.month_03}
                                        aria-label="Consumo em kWh"
                                        aria-describedby="btnGroupMonth03"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.month_03 && errors.month_03}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group as={Col} sm={3} controlId="formGridMonth04">
                                <Form.Label>Mês 04</Form.Label>
                                <InputGroup className="mb-2">

                                    <InputGroup.Text id="btnGroupMonth04">kWh</InputGroup.Text>


                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('month_04', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('month_04', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.month_04}
                                        name="month_04"
                                        isInvalid={!!errors.month_04 && touched.month_04}
                                        aria-label="Consumo em kWh"
                                        aria-describedby="btnGroupMonth04"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.month_04 && errors.month_04}</Form.Control.Feedback>
                            </Form.Group>
                        </Row>

                        <Row className="mb-2">
                            <Form.Group as={Col} sm={3} controlId="formGridMonth05">
                                <Form.Label>Mês 05</Form.Label>
                                <InputGroup className="mb-2">

                                    <InputGroup.Text id="btnGroupMonth05">kWh</InputGroup.Text>


                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('month_05', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('month_05', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.month_05}
                                        name="month_05"
                                        isInvalid={!!errors.month_05 && touched.month_05}
                                        aria-label="Consumo em kWh"
                                        aria-describedby="btnGroupMonth05"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.month_05 && errors.month_05}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group as={Col} sm={3} controlId="formGridMonth06">
                                <Form.Label>Mês 06</Form.Label>
                                <InputGroup className="mb-2">

                                    <InputGroup.Text id="btnGroupMonth06">kWh</InputGroup.Text>


                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('month_06', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('month_06', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.month_06}
                                        name="month_06"
                                        isInvalid={!!errors.month_06 && touched.month_06}
                                        aria-label="Consumo em kWh"
                                        aria-describedby="btnGroupMonth06"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.month_06 && errors.month_06}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group as={Col} sm={3} controlId="formGridMonth07">
                                <Form.Label>Mês 07</Form.Label>
                                <InputGroup className="mb-2">

                                    <InputGroup.Text id="btnGroupMonth07">kWh</InputGroup.Text>


                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('month_07', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('month_07', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.month_07}
                                        name="month_07"
                                        isInvalid={!!errors.month_07 && touched.month_07}
                                        aria-label="Consumo em kWh"
                                        aria-describedby="btnGroupMonth07"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.month_07 && errors.month_07}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group as={Col} sm={3} controlId="formGridMonth08">
                                <Form.Label>Mês 08</Form.Label>
                                <InputGroup className="mb-2">

                                    <InputGroup.Text id="btnGroupMonth08">kWh</InputGroup.Text>


                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('month_08', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('month_08', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.month_08}
                                        name="month_08"
                                        isInvalid={!!errors.month_08 && touched.month_08}
                                        aria-label="Consumo em kWh"
                                        aria-describedby="btnGroupMonth08"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.month_08 && errors.month_08}</Form.Control.Feedback>
                            </Form.Group>
                        </Row>

                        <Row className="mb-2">
                            <Form.Group as={Col} sm={3} controlId="formGridMonth09">
                                <Form.Label>Mês 09</Form.Label>
                                <InputGroup className="mb-2">

                                    <InputGroup.Text id="btnGroupMonth09">kWh</InputGroup.Text>


                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('month_09', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('month_09', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.month_09}
                                        name="month_09"
                                        isInvalid={!!errors.month_09 && touched.month_09}
                                        aria-label="Consumo em kWh"
                                        aria-describedby="btnGroupMonth09"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.month_09 && errors.month_09}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group as={Col} sm={3} controlId="formGridMonth10">
                                <Form.Label>Mês 10</Form.Label>
                                <InputGroup className="mb-2">

                                    <InputGroup.Text id="btnGroupMonth10">kWh</InputGroup.Text>


                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('month_10', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('month_10', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.month_10}
                                        name="month_10"
                                        isInvalid={!!errors.month_10 && touched.month_10}
                                        aria-label="Consumo em kWh"
                                        aria-describedby="btnGroupMonth10"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.month_10 && errors.month_10}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group as={Col} sm={3} controlId="formGridMonth11">
                                <Form.Label>Mês 11</Form.Label>
                                <InputGroup className="mb-2">

                                    <InputGroup.Text id="btnGroupMonth11">kWh</InputGroup.Text>


                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('month_11', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('month_11', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.month_11}
                                        name="month_11"
                                        isInvalid={!!errors.month_11 && touched.month_11}
                                        aria-label="Consumo em kWh"
                                        aria-describedby="btnGroupMonth11"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.month_11 && errors.month_11}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group as={Col} sm={3} controlId="formGridMonth12">
                                <Form.Label>Mês 12</Form.Label>
                                <InputGroup className="mb-2">

                                    <InputGroup.Text id="btnGroupMonth12">kWh</InputGroup.Text>


                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('month_12', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('month_12', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.month_12}
                                        name="month_12"
                                        isInvalid={!!errors.month_12 && touched.month_12}
                                        aria-label="Consumo em kWh"
                                        aria-describedby="btnGroupMonth12"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.month_12 && errors.month_12}</Form.Control.Feedback>
                            </Form.Group>
                        </Row>

                        <Row className="mb-2">
                            <Form.Group as={Col} sm={3} controlId="formGridMonth13">
                                <Form.Label>Mês 13</Form.Label>
                                <InputGroup className="mb-2">

                                    <InputGroup.Text id="btnGroupMonth13">kWh</InputGroup.Text>

                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('month_13', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('month_13', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.month_13}
                                        name="month_13"
                                        isInvalid={!!errors.month_13 && touched.month_13}
                                        aria-label="Consumo em kWh"
                                        aria-describedby="btnGroupMonth13"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.month_13 && errors.month_13}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group as={Col} sm={3} controlId="formGridAverageIncrease">
                                <Form.Label>Previsão de aumento</Form.Label>
                                <InputGroup className="mb-2">

                                    <InputGroup.Text id="btnGroupAverageIncrease">kWh</InputGroup.Text>

                                    <Form.Control
                                        type="text"
                                        onChange={(e) => {
                                            setFieldValue('average_increase', prettifyCurrency(e.target.value));
                                        }}
                                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                                            setFieldValue('average_increase', prettifyCurrency(e.target.value));
                                        }}
                                        value={values.average_increase}
                                        name="average_increase"
                                        isInvalid={!!errors.average_increase && touched.average_increase}
                                        aria-label="Previsão de aumento"
                                        aria-describedby="btnGroupAverageIncrease"
                                    />
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{touched.average_increase && errors.average_increase}</Form.Control.Feedback>
                            </Form.Group>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Row>
                            {
                                calculatingMessageShow ? <Col><AlertMessage status={typeMessage} /></Col> :
                                    <>
                                        <Col className="col-row">
                                            <Button
                                                variant="success"
                                                type="submit"
                                            >
                                                Calcular
                                            </Button>
                                        </Col>

                                        <Col className="col-row">
                                            <Button
                                                variant="outline-secondary"
                                                onClick={handleCloseConsumptionModal}
                                            >
                                                Cancelar
                                            </Button>
                                        </Col>
                                    </>
                            }
                        </Row>
                    </Modal.Footer>
                </Form>
            )}
        </Formik>
    </Modal>
}

export default ConsumptionModal;