import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Button, Col, Container, Form, Navbar, Row, Toast } from 'react-bootstrap';
import { FaCog, FaSignOutAlt, FaRegUserCircle, FaStickyNote, FaUserTie, FaUserCog } from 'react-icons/fa';

import { can } from '../Users';
import { AuthContext } from '../../contexts/AuthContext';
import { SideNavBar } from '../Sidebar';

import styles from './styles.module.css';

export function Header() {
    const router = useRouter();
    const { signed, user, handleAuthenticated, handleLogout } = useContext(AuthContext);

    const [showPageHeader, setShowPageHeader] = useState(false);

    const pathsNotShow = ['/', '/users/new/auth', '/users/reset', '/users/reset/auth', '/404', '500'];

    const [showUserDetails, setShowUserDetails] = useState(false);

    const toggleShowUserDetails = () => setShowUserDetails(!showUserDetails);

    useEffect(() => {
        if (!pathsNotShow.find(item => { return item === router.route }))
            handleAuthenticated();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        let show = false;

        if (signed && !pathsNotShow.find(item => { return item === router.route })) show = true;

        setShowPageHeader(show);
    }, [signed, router.route]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleRoute(route: string) {
        router.push(route);
    }

    return showPageHeader ? <Navbar className="d-print-none" collapseOnSelect expand="lg" bg="dark" variant="dark">
        <Container>
            <Row className="align-items-center">
                <Col>
                    <Image
                        alt=""
                        src="/assets/images/logo-logica.svg"
                        width="40"
                        height="40"
                        className="d-inline-block align-top"
                    />
                </Col>
                <Col>
                    <span className="text-light">App</span>
                </Col>
            </Row>

            <div className={styles.sideNavBarContainer}>
                <Navbar.Toggle aria-controls="side-navbar-nav" />

                <Navbar.Collapse id="side-navbar-nav">
                    <SideNavBar />
                </Navbar.Collapse>
            </div>

            <Form>
                <Row>
                    <Col>
                        <Button
                            variant="outline-light"
                            onClick={() => handleRoute('/notes')}
                            title="Anotações"
                        >
                            <FaStickyNote />
                        </Button>
                    </Col>

                    {
                        user && <Col>
                            <Button
                                variant="outline-light"
                                onClick={toggleShowUserDetails}
                                title={user ? user.name : ''}
                            >
                                <FaRegUserCircle />
                            </Button>

                            <Toast
                                show={showUserDetails}
                                onClose={toggleShowUserDetails}
                                autohide
                                delay={5000}
                                style={{
                                    position: 'absolute',
                                    minWidth: '250px',
                                    top: 30,
                                    right: 30,
                                    zIndex: 999,
                                    width: 'auto',
                                    maxWidth: 'fit-content',
                                }}
                            >
                                <Toast.Header className="justify-content-center">
                                    <FaUserTie style={{ marginRight: '.5rem' }} /><strong className="me-auto">{user.name}</strong>
                                </Toast.Header>
                                <Toast.Body>
                                    <Row className="mb-3">
                                        <Col>
                                            <Button
                                                variant="light"
                                                type="button"
                                                onClick={() => handleRoute(`/users/details/${user.id}`)}
                                                style={{ width: '100%' }}
                                                title="Ver detalhes do usuário."
                                            >
                                                <FaUserCog style={{ marginRight: '.5rem' }} /> Detalhes
                                            </Button>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col>
                                            <Button
                                                variant="light"
                                                type="button"
                                                onClick={handleLogout}
                                                style={{ width: '100%' }}
                                                title="Sair do sistema."
                                            >
                                                <FaSignOutAlt style={{ marginRight: '.5rem' }} /> Sair
                                            </Button>
                                        </Col>
                                    </Row>
                                </Toast.Body>
                            </Toast>
                        </Col>
                    }

                    {
                        user && can(user, "projects", "read:any") && <Col>
                            <Button
                                variant="outline-light"
                                onClick={() => handleRoute('/settings')}
                                title="Configurações"
                            >
                                <FaCog />
                            </Button>
                        </Col>
                    }
                </Row>
            </Form>
        </Container>
    </Navbar > : <></>
}