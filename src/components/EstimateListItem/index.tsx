import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, ButtonGroup, Row, Col } from 'react-bootstrap';
import { FaPencilAlt } from 'react-icons/fa'

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

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <Col sm={4}>
            <div className={styles.itemContainer}>
                <Row className="align-items-center">
                    <Col sm={10}>
                        <Link href={`/estimates/details/${estimate.id}`}>
                            <a>
                                <h5 className={styles.itemText}>{estimate.customer}</h5>
                            </a>
                        </Link>
                    </Col>
                    {/* <Col className="text-warning" sm={1}>{estimate. && <FaExclamationCircle />}</Col> */}
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
                            className={`form-control-plaintext text-secondary ${styles.itemText}`}
                        >
                            {!!estimate.city ? estimate.city : <br />}
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