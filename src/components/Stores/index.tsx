import { useRouter } from 'next/router';
import { Row, Col, ListGroup, Button } from 'react-bootstrap';
import { FaPencilAlt } from 'react-icons/fa';

import { User } from '../Users';

export interface Store {
    id: string,
    title: string;
    name: string;
    avatar: string;
    phone: string;
    description: string;
    email: string;
    zip_code: string;
    street: string;
    number: string;
    neighborhood: string;
    complement: string;
    city: string;
    state: string;
    document: string;
    services_in: string;
    warranty: string;
    engineer: string;
    bank_account: string;
    active: boolean;
    users: User[];
}

interface StoreProps {
    store: Store;
    canEdit?: boolean;
}

const Stores: React.FC<StoreProps> = ({ store, canEdit = false }) => {
    const router = useRouter();

    function goToEdit() {
        router.push(`/stores/edit/${store.id}`);
    }

    return (
        <ListGroup.Item variant="light">
            <Row className="align-items-center">
                <Col sm={6}><span>{store.name}</span></Col>

                <Col><span>{store.city}</span></Col>

                <Col><span>{store.state}</span></Col>

                {
                    canEdit && <Col className="text-end">
                        <Button variant="outline-success" className="button-link" onClick={goToEdit}><FaPencilAlt /> Editar</Button>
                    </Col>
                }
            </Row>
        </ListGroup.Item>
    )
}

export { Stores }