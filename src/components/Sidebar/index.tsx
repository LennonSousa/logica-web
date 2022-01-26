import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Accordion, AccordionButton, Card, Dropdown, Nav, NavDropdown, Row, Col } from 'react-bootstrap';
import {
    FaColumns,
    FaDonate,
    FaMoneyCheckAlt,
    FaUserTie,
    FaFileAlt,
    FaList,
    FaHistory,
    FaPlus,
    FaIdCard,
    FaBriefcase,
    FaPencilAlt,
    FaProjectDiagram,
    FaWarehouse,
    FaClipboardList,
    FaLayerGroup,
    FaSolarPanel,
    FaStore,
    FaUniversity,
    FaUsers,
    FaUsersCog
} from 'react-icons/fa';

import { SideBarContext } from '../../contexts/SideBarContext';
import { AuthContext } from '../../contexts/AuthContext';
import { can } from '../../components/Users';

import styles from './styles.module.css';

const Sidebar: React.FC = () => {
    const router = useRouter();
    const { itemSideBar, selectedMenu, handleItemSideBar } = useContext(SideBarContext);
    const { signed, user } = useContext(AuthContext);

    const [showPageHeader, setShowPageHeader] = useState(false);

    const pathsNotShow = ['/', '/users/new/auth', '/users/reset', '/users/reset/auth', '/404', '500'];

    useEffect(() => {
        let show = false;

        if (signed && user) {
            if (!pathsNotShow.find(item => { return item === router.route })) show = true;
        }

        setShowPageHeader(show);
    }, [signed, router.route, user]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleToDashboard() {
        router.push('/dashboard');
    }

    return (
        showPageHeader && user ? <div className={`${styles.sideBarContainer} d-print-none`}>
            <Accordion activeKey={itemSideBar} className={styles.accordionContainer}>
                {
                    (can(user, "estimates", "read:any") || can(user, "estimates", "read:own")) && <Card className={styles.menuCard}>
                        <AccordionButton
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="estimates"
                            onClick={() => handleItemSideBar('estimates')}
                        >
                            <div>
                                <FaUserTie /> <span>Orçamento</span>
                            </div>
                        </AccordionButton>

                        <Accordion.Collapse eventKey="estimates">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/estimates">
                                    <a title="Listar todos os orçamentos" data-title="Listar todos os orçamentos">
                                        <Row
                                            className={
                                                selectedMenu === 'estimates-index' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaList size={14} />
                                            </Col>
                                            <Col>
                                                <span>Lista</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                {
                                    can(user, "estimates", "create") && <Link href="/estimates/new">
                                        <a title="Criar um novo orçamento" data-title="Criar um novo orçamento">
                                            <Row
                                                className={
                                                    selectedMenu === 'estimates-new' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaPlus size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Novo</span>
                                                </Col>
                                            </Row>
                                        </a>
                                    </Link>
                                }

                                {
                                    can(user, "settings", "update:any") && <>
                                        <Dropdown.Divider />
                                        <Link href="/estimates/panels">
                                            <a title="Listar os painéis." data-title="Listar os painéis.">
                                                <Row
                                                    className={
                                                        selectedMenu === 'estimates-panels' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaSolarPanel size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Painéis</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>

                                        <Dropdown.Divider />

                                        <Link href="/estimates/status">
                                            <a title="Listar as fases." data-title="Listar as fases.">
                                                <Row
                                                    className={
                                                        selectedMenu === 'estimates-status' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaProjectDiagram size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Fases</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>

                                        {/* <Link href="/estimates/roofs/orientations">
                                            <a title="Listar orientaçõs de telhado." data-title="Listar orientaçõs de telhado.">
                                                <Row
                                                    className={
                                                        selectedMenu === 'estimates-roofs-orientations' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaCompass size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Orientações</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link> */}

                                        <Link href="/estimates/roofs/types">
                                            <a title="Listar tipos de telhados." data-title="Listar tipos de telhados.">
                                                <Row
                                                    className={
                                                        selectedMenu === 'estimates-roofs-types' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaWarehouse size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Tipos</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>
                                    </>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }

                {
                    (can(user, "projects", "read:any") || can(user, "projects", "read:own") || can(user, "projects", "read:own")) && <Card className={styles.menuCard}>
                        <AccordionButton
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="projects"
                            onClick={() => handleItemSideBar('projects')}
                        >
                            <div>
                                <FaFileAlt /> <span>Projetos</span>
                            </div>
                        </AccordionButton>

                        <Accordion.Collapse eventKey="projects">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/projects">
                                    <a title="Listar todos os projetos." data-title="Listar todos os projetos.">
                                        <Row
                                            className={
                                                selectedMenu === 'projects-index' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaList size={14} />
                                            </Col>
                                            <Col>
                                                <span>Lista</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                {
                                    can(user, "projects", "create") && <Link href="/projects/new">
                                        <a title="Criar um novo projeto" data-title="Criar um novo projeto">
                                            <Row
                                                className={
                                                    selectedMenu === 'projects-new' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaPlus size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Novo</span>
                                                </Col>
                                            </Row>
                                        </a>
                                    </Link>
                                }

                                {
                                    can(user, "settings", "update:any") && <>
                                        <Dropdown.Divider />

                                        <Link href="/projects/status">
                                            <a title="Listar as fases" data-title="Listar as fases">
                                                <Row
                                                    className={
                                                        selectedMenu === 'projects-status' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaClipboardList size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Fases</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>

                                        <Link href="/projects/events">
                                            <a title="Listar os eventos" data-title="Listar os eventos">
                                                <Row
                                                    className={
                                                        selectedMenu === 'projects-events' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaHistory size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Eventos</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>

                                        <Link href="/projects/attachments">
                                            <a title="Listar os anexos obrigatórios." data-title="Listar os anexos obrigatórios.">
                                                <Row
                                                    className={
                                                        selectedMenu === 'projects-attachments-required' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaFileAlt size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Anexos</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>
                                    </>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }

                {
                    (can(user, "services", "read:any") || can(user, "services", "read:own") || can(user, "services", "read:own")) && <Card className={styles.menuCard}>
                        <AccordionButton
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="service-orders"
                            onClick={() => handleItemSideBar('service-orders')}
                        >
                            <div>
                                <FaBriefcase /> <span>Serviços</span>
                            </div>
                        </AccordionButton>

                        <Accordion.Collapse eventKey="service-orders">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/service-orders">
                                    <a title="Listar todos as ordens de serviço." data-title="Listar todos as ordens de serviço.">
                                        <Row
                                            className={
                                                selectedMenu === 'service-orders-index' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaList size={14} />
                                            </Col>
                                            <Col>
                                                <span>Ordens</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                {
                                    can(user, "services", "create") && <Link href="/service-orders/new">
                                        <a title="Criar uma nova ordem de serviço" data-title="Criar uma nova ordem de serviço">
                                            <Row
                                                className={
                                                    selectedMenu === 'service-orders-new' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaPlus size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Novo</span>
                                                </Col>
                                            </Row>
                                        </a>
                                    </Link>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }

                {
                    can(user, "finances", "read:any") && <Card className={styles.menuCard}>
                        <AccordionButton
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="finances"
                            onClick={() => handleItemSideBar('finances')}
                        >
                            <div>
                                <FaMoneyCheckAlt /> <span>Finanças</span>
                            </div>
                        </AccordionButton>

                        <Accordion.Collapse eventKey="finances">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/finances/incomings">
                                    <a title="Listar todas as receitas." data-title="Listar todas as receitas.">
                                        <Row
                                            className={
                                                selectedMenu === 'finances-incomings' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaDonate size={14} />
                                            </Col>
                                            <Col>
                                                <span>Receitas</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                {
                                    can(user, "settings", "update:any") && <>
                                        <Dropdown.Divider />

                                        <Link href="/finances/types">
                                            <a title="Listar as fases" data-title="Listar as fases">
                                                <Row
                                                    className={
                                                        selectedMenu === 'finances-types' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaUniversity size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Tipos</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>
                                    </>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }

                {
                    can(user, "store", "read:any") && <Card className={styles.menuCard}>
                        <AccordionButton
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="stores"
                            onClick={() => handleItemSideBar('stores')}
                        >
                            <div>
                                <FaStore /> <span>Lojas</span>
                            </div>
                        </AccordionButton>

                        <Accordion.Collapse eventKey="stores">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/stores">
                                    <a title="Listar todas a lojas." data-title="Listar todas a lojas.">
                                        <Row
                                            className={
                                                selectedMenu === 'stores-index' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaList size={14} />
                                            </Col>
                                            <Col>
                                                <span>Lista</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                {
                                    can(user, "store", "create") && <Link href="/stores/new">
                                        <a title="Criar uma loja." data-title="Criar uma loja.">
                                            <Row
                                                className={
                                                    selectedMenu === 'stores-new' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaPlus size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Criar</span>
                                                </Col>
                                            </Row>
                                        </a>
                                    </Link>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }

                {
                    can(user, "users", "read:any") && <Card className={styles.menuCard}>
                        <AccordionButton
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="users"
                            onClick={() => handleItemSideBar('users')}
                        >
                            <div>
                                <FaUsers /> <span>Usuários</span>
                            </div>
                        </AccordionButton>
                        <Accordion.Collapse eventKey="users">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/users">
                                    <a title="Listar todos os usuários" data-title="Listar todos os usuários">
                                        <Row
                                            className={
                                                selectedMenu === 'users-index' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaList size={14} />
                                            </Col>
                                            <Col>
                                                <span>Lista</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                {
                                    can(user, "users", "create") && <Link href="/users/new">
                                        <a title="Criar um novo usuário" data-title="Criar um novo usuário">
                                            <Row
                                                className={
                                                    selectedMenu === 'users-new' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaPlus size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Novo</span>
                                                </Col>
                                            </Row>
                                        </a>
                                    </Link>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }
            </Accordion>
        </div > : null
    )
}

export function SideNavBar() {
    const { user } = useContext(AuthContext);

    return (
        user ? <Nav className="me-auto mb-3">
            {
                (can(user, "estimates", "read:any") || can(user, "estimates", "read:own")) && <NavDropdown title="Clientes" id="estimates-dropdown">
                    <Link href="/estimates" passHref>
                        <NavDropdown.Item ><FaList size={14} /> Lista</NavDropdown.Item>
                    </Link>

                    {
                        can(user, "estimates", "create") && <Link href="/estimates/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Novo</NavDropdown.Item>
                        </Link>
                    }

                    {
                        can(user, "settings", "update:any") && <>
                            <NavDropdown.Divider />

                            <Link href="/estimates/panels" passHref>
                                <NavDropdown.Item ><FaSolarPanel size={14} /> Painéis</NavDropdown.Item>
                            </Link>

                            <Link href="/estimates/status" passHref>
                                <NavDropdown.Item ><FaProjectDiagram size={14} /> Fases</NavDropdown.Item>
                            </Link>

                            <Link href="/estimates/roofs/types" passHref>
                                <NavDropdown.Item ><FaWarehouse size={14} /> Tipos</NavDropdown.Item>
                            </Link>
                        </>
                    }
                </NavDropdown>
            }

            {
                (can(user, "projects", "read:any") || can(user, "projects", "read:own")) && <NavDropdown title="Projetos" id="projects-dropdown">
                    <Link href="/projects" passHref>
                        <NavDropdown.Item ><FaList size={14} /> Lista</NavDropdown.Item>
                    </Link>

                    {
                        can(user, "projects", "create") && <Link href="/projects/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Novo</NavDropdown.Item>
                        </Link>
                    }

                    {
                        can(user, "settings", "update:any") && <>
                            <NavDropdown.Divider />

                            <Link href="/projects/status" passHref>
                                <NavDropdown.Item ><FaClipboardList size={14} /> Fases</NavDropdown.Item>
                            </Link>

                            <Link href="/projects/events" passHref>
                                <NavDropdown.Item ><FaHistory size={14} /> Eventos</NavDropdown.Item>
                            </Link>

                            <Link href="/projects/attachments" passHref>
                                <NavDropdown.Item ><FaFileAlt size={14} /> Anexos</NavDropdown.Item>
                            </Link>
                        </>
                    }
                </NavDropdown>
            }

            {
                (can(user, "services", "read:any") || can(user, "services", "read:own")) && <NavDropdown title="Serviços" id="services-dropdown">
                    <Link href="/service-orders" passHref>
                        <NavDropdown.Item ><FaList size={14} /> Ordens</NavDropdown.Item>
                    </Link>

                    {
                        can(user, "services", "create") && <Link href="/service-orders/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Novo</NavDropdown.Item>
                        </Link>
                    }
                </NavDropdown>
            }

            {
                (can(user, "finances", "read:any") || can(user, "finances", "read:own")) && <NavDropdown title="Finanças" id="finances-dropdown">
                    <Link href="/finances/incomings" passHref>
                        <NavDropdown.Item ><FaDonate size={14} /> Receitas</NavDropdown.Item>
                    </Link>

                    {
                        can(user, "finances", "update:any") && <Link href="/finances/types" passHref>
                            <NavDropdown.Item ><FaUniversity size={14} /> Tipos</NavDropdown.Item>
                        </Link>
                    }
                </NavDropdown>
            }

            {
                can(user, "store", "read:any") && <NavDropdown title="Lojas" id="stores-dropdown">
                    <Link href="/stores" passHref>
                        <NavDropdown.Item ><FaStore size={14} /> Lojas</NavDropdown.Item>
                    </Link>

                    {
                        can(user, "store", "create") && <Link href="/stores/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Criar</NavDropdown.Item>
                        </Link>
                    }
                </NavDropdown>
            }

            {
                can(user, "users", "read:any") && <NavDropdown title="Usuários" id="users-dropdown">
                    {
                        can(user, "users", "create") && <Link href="/users" passHref>
                            <NavDropdown.Item ><FaList size={14} /> Lista</NavDropdown.Item>
                        </Link>
                    }

                    <NavDropdown.Divider />

                    {
                        can(user, "users", "create") && <Link href="/users/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Novo</NavDropdown.Item>
                        </Link>
                    }
                </NavDropdown>
            }
        </Nav> : <></>
    )
}

export default Sidebar;