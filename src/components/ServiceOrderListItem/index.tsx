import { useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, ButtonGroup, Row, Col } from 'react-bootstrap';
import { FaPencilAlt, FaPrint } from 'react-icons/fa';
import { format } from 'date-fns';

import { AuthContext } from '../../contexts/AuthContext';
import { can } from '../../components/Users';
import { ServiceOrder } from '../ServiceOrders';

import styles from './styles.module.css';

interface ServiceOrderItemProps {
    serviceOrder: ServiceOrder;
}

const ServiceOrderItem: React.FC<ServiceOrderItemProps> = ({ serviceOrder }) => {
    const router = useRouter();

    const { user } = useContext(AuthContext);

    function goToEdit() {
        router.push(`/service-orders/edit/${serviceOrder.id}`);
    }

    function goToPrint() {
        router.push(`/service-orders/print/${serviceOrder.id}`);
    }

    return (
        <Col sm={4}>
            <div className={styles.itemContainer}>
                <Row className="align-items-center">
                    <Col>
                        <Link href={`/service-orders/details/${serviceOrder.id}`}>
                            <a>
                                <h5 className={`${styles.itemText} text-wrap`}>{serviceOrder.customer}</h5>
                            </a>
                        </Link>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <span
                            className={`form-control-plaintext text-secondary text-wrap ${styles.itemText}`}
                        >
                            {`${serviceOrder.document} ${serviceOrder.city} - ${serviceOrder.state}`}
                        </span>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <span
                            className={`form-control-plaintext text-secondary text-wrap ${styles.itemText}`}
                        >
                            {format(new Date(serviceOrder.start_at), 'dd/MM/yyyy')}
                        </span>
                    </Col>
                </Row>

                <Row>
                    <ButtonGroup size="sm" className="col-12">
                        {
                            user && can(user, "estimates", "update:any") && <Button
                                variant="success"
                                title="Editar ordem de serviço."
                                onClick={goToEdit}
                            >
                                <FaPencilAlt />
                            </Button>
                        }

                        <Button
                            variant="success"
                            title="Imprimir ordem de serviço."
                            onClick={goToPrint}
                        >
                            <FaPrint />
                        </Button>
                    </ButtonGroup>
                </Row>
            </div>
        </Col >
    )
}

export default ServiceOrderItem;