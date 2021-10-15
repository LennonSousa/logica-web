import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, ButtonGroup, Row, Col } from 'react-bootstrap';
import { FaPencilAlt } from 'react-icons/fa';
import { format } from 'date-fns';

import { Estimate } from '../Estimates';

import styles from './styles.module.css';

interface EstimateItemProps {
    estimate: Estimate;
}

const EstimateItem: React.FC<EstimateItemProps> = ({ estimate }) => {
    const router = useRouter();

    function goToEdit() {
        router.push(`/estimates/edit/${estimate.id}`);
    }

    return (
        <Col sm={4}>
            <div className={styles.itemContainer}>
                <Row className="align-items-center">
                    <Col>
                        <Link href={`/estimates/details/${estimate.id}`}>
                            <a>
                                <h5 className={`${styles.itemText} text-wrap`}>{estimate.customer}</h5>
                            </a>
                        </Link>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <span
                            className={`form-control-plaintext text-secondary ${styles.itemText}`}
                        >
                            {!!estimate.document ? estimate.document : <br />}
                        </span>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <span
                            className={`form-control-plaintext text-secondary text-wrap ${styles.itemText}`}
                        >
                            {!!estimate.city ? `${estimate.city} - ${estimate.state}` : <br />}
                        </span>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <span
                            className={`form-control-plaintext text-secondary text-wrap ${styles.itemText}`}
                        >
                            {`${format(new Date(estimate.updated_at), 'dd/MM/yyyy')} - ${estimate.created_by}`}
                        </span>
                    </Col>
                </Row>

                <Row>
                    <ButtonGroup size="sm" className="col-12">
                        <Button
                            variant="success"
                            title="Editar cliente."
                            onClick={goToEdit}
                        >
                            <FaPencilAlt />
                        </Button>
                    </ButtonGroup>
                </Row>
            </div>
        </Col >
    )
}

export default EstimateItem;