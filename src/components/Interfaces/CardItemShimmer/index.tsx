import { ButtonGroup, Card, Col, Placeholder, Row } from 'react-bootstrap';

import styles from './styles.module.css';

interface CardItemShimmerProps {
    amount?: number;
}

const CardItemShimmer: React.FC<CardItemShimmerProps> = ({ amount = 5 }) => {
    return (
        <>
            {
                [...Array(amount)].map((_, index) => <Col key={index} sm={4}>
                    <div className={styles.itemContainer}>
                        <Row className="align-items-center mb-1">
                            <Placeholder as={Card.Title} animation="glow">
                                <Placeholder xs={9} bg="success" size="lg" />
                            </Placeholder>
                        </Row>

                        <Row className="align-items-center mb-2">
                            <Placeholder animation="glow">
                                <Placeholder xs={6} size="sm" /> <Placeholder xs={6} size="sm" />
                            </Placeholder>
                        </Row>

                        <Row className="align-items-center mb-2">
                            <Placeholder animation="glow">
                                <Placeholder xs={6} size="sm" />
                            </Placeholder>
                        </Row>

                        <Row className="align-items-center mb-2">
                            <Placeholder animation="glow">
                                <Placeholder xs={5} size="sm" /> <Placeholder xs={7} size="sm" />
                            </Placeholder>
                        </Row>

                        <Row className="align-items-center">
                            <ButtonGroup size="sm" className="col-12">
                                <Placeholder.Button variant="success" />

                                <Placeholder.Button variant="success" />
                            </ButtonGroup>
                        </Row>
                    </div>
                </Col>
                )
            }
        </>
    )
}

export { CardItemShimmer };