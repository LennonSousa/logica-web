import { useEffect, useState } from 'react';
import { Row, Col, Form, InputGroup, Button } from 'react-bootstrap';
import { FaSave } from 'react-icons/fa';

import { prettifyCurrency } from '../InputMask/masks';

export interface EstimateItem {
    id: string;
    name: string;
    amount: number;
    price: number;
    percent: number;
    order: number;
}

interface EstimateItemsProps {
    estimateItem: EstimateItem;
    estimateItemsList: EstimateItem[];
    handleListEstimateItems?: (estimateItemsList: EstimateItem[]) => void;
}

const EstimateItems: React.FC<EstimateItemsProps> = ({ estimateItem, estimateItemsList, handleListEstimateItems }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState(0);
    const [price, setPrice] = useState('0,00');
    const [totalPrice, setTotalPrice] = useState(0);

    const [fieldsFormTouched, setFieldsFormTouched] = useState(false);

    useEffect(() => {
        setName(estimateItem.name);
        setAmount(Number(estimateItem.amount));
        setPrice(prettifyCurrency(Number(estimateItem.price).toFixed(2)));
        setTotalPrice(Number(estimateItem.amount) * Number(estimateItem.price));
    }, [estimateItem]);

    function handleEstimateItem(name: string, amount: number, price: number) {
        const items = estimateItemsList.map(itemList => {
            if (itemList.id === estimateItem.id) {
                return {
                    ...itemList,
                    name,
                    amount,
                    price
                }
            }

            return itemList;
        });

        if (handleListEstimateItems) handleListEstimateItems(items);

        setFieldsFormTouched(false);
    }

    return (
        <Row>
            <Form.Group as={Col} sm={2} controlId="formGridAmount">
                <Form.Control
                    type="number"
                    onChange={e => {
                        try {
                            const newAmount = Number(e.target.value);

                            setAmount(newAmount);

                            handleEstimateItem(name, newAmount, Number(price.replaceAll('.', '').replaceAll(',', '.')));
                        }
                        catch {
                            setAmount(1);
                            setFieldsFormTouched(true);
                        }
                    }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                        try {
                            const newAmount = Number(e.target.value);

                            setAmount(newAmount);

                            handleEstimateItem(name, newAmount, Number(price.replaceAll('.', '').replaceAll(',', '.')));
                        }
                        catch {
                            setAmount(1);
                            setFieldsFormTouched(true);
                        }
                    }}
                    value={amount}
                    name="amount"
                    isInvalid={!!!amount}
                />
            </Form.Group>

            <Form.Group as={Col} sm={5} controlId="formGridName">
                <Form.Control
                    type="name"
                    onChange={e => {
                        setName(e.target.value);

                        setFieldsFormTouched(true);
                    }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                        setName(e.target.value);

                        setFieldsFormTouched(true);
                    }}
                    value={name}
                    name="name"
                    isInvalid={!!!name}
                />
            </Form.Group>

            <Form.Group as={Col} sm={2} controlId="formGridPrice">
                <InputGroup className="mb-2">
                    <InputGroup.Text id="btnGroupPrice">R$</InputGroup.Text>
                    <Form.Control
                        type="text"
                        onChange={e => {
                            try {
                                const newTotalPrice = amount * Number(prettifyCurrency(e.target.value).replaceAll('.', '').replaceAll(',', '.'));

                                setTotalPrice(newTotalPrice);

                                setPrice(prettifyCurrency(e.target.value));

                                setFieldsFormTouched(true);
                            }
                            catch {
                                setPrice('0,00');
                                setFieldsFormTouched(true);
                            }
                        }}
                        onBlur={(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                            try {
                                const newTotalPrice = amount * Number(prettifyCurrency(e.target.value).replaceAll('.', '').replaceAll(',', '.'));

                                setTotalPrice(newTotalPrice);

                                setPrice(prettifyCurrency(e.target.value));

                                setFieldsFormTouched(true);
                            }
                            catch {
                                setPrice('0,00');
                                setFieldsFormTouched(true);
                            }
                        }}
                        value={price}
                        name="price"
                        isInvalid={!!!price}
                        aria-label="Valor unitário"
                        aria-describedby="btnGroupPrice"
                    />
                </InputGroup>
            </Form.Group>

            <Form.Group as={Col} sm={2} controlId="formGridTotalPrice">
                <InputGroup className="mb-2">
                    <InputGroup.Text id="btnGroupTotalPrice">R$</InputGroup.Text>
                    <Form.Control
                        type="text"
                        value={prettifyCurrency(totalPrice.toFixed(2))}
                        name="total_price"
                        isInvalid={!!!totalPrice}
                        aria-label="Valor Total"
                        aria-describedby="btnGroupTotalPrice"
                        readOnly
                    />
                </InputGroup>
            </Form.Group>

            <Col className="col-row text-end">
                <Button
                    variant="outline-success"
                    className="button-link"
                    onClick={() => {
                        handleEstimateItem(name, amount, Number(price.replaceAll('.', '').replaceAll(',', '.')));
                    }}
                    disabled={!fieldsFormTouched}
                >
                    <FaSave />
                </Button>
            </Col>
        </Row>
    )
}

export default EstimateItems;