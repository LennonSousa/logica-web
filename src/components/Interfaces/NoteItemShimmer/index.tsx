import { ButtonGroup, Card, Col, Placeholder, Row } from 'react-bootstrap';

import styles from './styles.module.css';

interface NoteItemShimmerProps {
    amount?: number;
}

const NoteItemShimmer: React.FC<NoteItemShimmerProps> = ({ amount = 5 }) => {
    return (
        <>
            {
                [...Array(amount)].map((_, index) => <Col key={index} sm={4}>
                    <div className={styles.itemContainer}>
                        <Row className="align-items-center mb-1">
                            <Placeholder as={Card.Title} animation="glow">
                                <Placeholder xs={9} bg="dark" size="lg" />
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

                        <Row className="align-items-center mb-2">
                            <Placeholder animation="glow">
                                <Placeholder xs={6} size="sm" /> <Placeholder xs={6} size="sm" />
                            </Placeholder>
                        </Row>

                        <Row className="align-items-center mb-2">
                            <Placeholder animation="glow">
                                <Placeholder xs={5} size="sm" /> <Placeholder xs={7} size="sm" />
                            </Placeholder>
                        </Row>

                        <Row className="align-items-center mb-2">
                            <Placeholder animation="glow">
                                <Placeholder xs={5} size="sm" /> <Placeholder xs={7} size="sm" />
                            </Placeholder>
                        </Row>
                    </div>
                </Col>
                )
            }
        </>
    )
}

export { NoteItemShimmer };