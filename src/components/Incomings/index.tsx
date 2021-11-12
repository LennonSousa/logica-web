import { useEffect, useState } from 'react';
import { Row, Col, ListGroup, Button } from 'react-bootstrap';
import { FaDonate, FaPencilAlt } from 'react-icons/fa';

import { PayType } from '../PayTypes';
import { Store } from '../Stores';
import { Project } from '../Projects';
import { IncomeItem } from '../IncomeItems';
import { IncomeAttachment } from '../IncomeAttachments';
import IncomingsModal from './Modal';
import { prettifyCurrency } from '../InputMask/masks';

export interface Income {
    id: string;
    description: string;
    value: number;
    created_at: Date;
    created_by: string;
    store: Store;
    project: Project | null;
    payType: PayType;
    items: IncomeItem[];
    attachments: IncomeAttachment[];
}

interface IncomingsProps {
    income: Income;
    canEdit?: boolean;
    handleListIncomings?(): Promise<void>;
}

const Panels: React.FC<IncomingsProps> = ({ income, canEdit = true, handleListIncomings }) => {
    const [isPaid, setIsPaid] = useState(false);

    const [showModalEdit, setShowModalEdit] = useState(false);

    const handleCloseModalEdit = () => setShowModalEdit(false);
    const handleShowModalEdit = () => setShowModalEdit(true);

    useEffect(() => {
        let isAllPaid = true;

        if (!!!income.items.length) {
            isAllPaid = false;
        } else {
            income.items.forEach(item => {
                if (!item.is_paid) isAllPaid = false;
            });
        }

        setIsPaid(isAllPaid);
    }, [income.items]);

    async function handleIncome() {
        if (handleListIncomings) await handleListIncomings();
    }

    return (
        <>
            <ListGroup.Item variant="light">
                <Row className="align-items-center">
                    <Col><span>{income.description}</span></Col>

                    <Col><span>{`R$ ${prettifyCurrency(String(income.value))}`}</span></Col>

                    <Col className="col-row"><span className={isPaid ? 'text-success' : 'text-secondary'}>
                        {
                            isPaid ? <FaDonate title="Receita paga!" /> : ''
                        }
                    </span></Col>

                    {
                        canEdit && <Col className="col-row text-end">
                            <Button
                                variant="outline-success"
                                className="button-link"
                                onClick={handleShowModalEdit}
                                title="Editar receita"
                            >
                                <FaPencilAlt /> Editar
                            </Button>
                        </Col>
                    }
                </Row>
            </ListGroup.Item>

            <IncomingsModal
                incomeId={income.id}
                show={showModalEdit}
                handleIncome={handleIncome}
                handleCloseModal={handleCloseModalEdit}
            />
        </>
    )
}

export default Panels;