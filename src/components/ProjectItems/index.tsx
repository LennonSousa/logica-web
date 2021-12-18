import { useEffect, useState } from 'react';
import { Row, Col, Form, InputGroup, Button } from 'react-bootstrap';
import { FaSave } from 'react-icons/fa';

import { prettifyCurrency } from '../InputMask/masks';

export interface ProjectItem {
    id: string;
    name: string;
    amount: number;
    price: number;
    percent: number;
    order: number;
}

interface ProjectItemsProps {
    projectItem: ProjectItem;
    projectItemsList: ProjectItem[];
    handleListProjectItems?: (projectItemsList: ProjectItem[]) => void;
}

const ProjectItems: React.FC<ProjectItemsProps> = ({ projectItem, projectItemsList, handleListProjectItems }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState(0);
    const [price, setPrice] = useState('0,00');
    const [totalPrice, setTotalPrice] = useState(0);

    const [fieldsFormTouched, setFieldsFormTouched] = useState(false);

    useEffect(() => {
        setName(projectItem.name);
        setAmount(Number(projectItem.amount));
        setPrice(prettifyCurrency(Number(projectItem.price).toFixed(2)));
        setTotalPrice(Number(projectItem.amount) * Number(projectItem.price));
    }, [projectItem]);

    function handleProjectItem(name: string, amount: number, price: number) {
        const items = projectItemsList.map(itemList => {
            if (itemList.id === projectItem.id) {
                return {
                    ...itemList,
                    name,
                    amount,
                    price
                }
            }

            return itemList;
        });

        if (handleListProjectItems) handleListProjectItems(items);

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

                            handleProjectItem(name, newAmount, Number(price.replaceAll('.', '').replaceAll(',', '.')));
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

                            handleProjectItem(name, newAmount, Number(price.replaceAll('.', '').replaceAll(',', '.')));
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

            <Form.Group as={Col} sm={9} controlId="formGridName">
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

            <Col className="col-row text-end">
                <Button
                    variant="outline-success"
                    className="button-link"
                    onClick={() => {
                        handleProjectItem(name, amount, Number(price.replaceAll('.', '').replaceAll(',', '.')));
                    }}
                    disabled={!fieldsFormTouched}
                >
                    <FaSave />
                </Button>
            </Col>
        </Row>
    )
}

export default ProjectItems;