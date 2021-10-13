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
    FaCompass,
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
                <Card className={styles.menuCard}>
                    <AccordionButton
                        as={Card.Header}
                        className={styles.menuCardHeader}
                        eventKey="dashboard"
                        onClick={handleToDashboard}
                    >
                        <div>
                            <FaColumns /> <span>Painel</span>
                        </div>
                    </AccordionButton>
                </Card>

                {
                    can(user, "estimates", "read:any") && <Card className={styles.menuCard}>
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
                                    can(user, "estimates", "update:any") && <>
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
                    can(user, "projects", "read:any") && <Card className={styles.menuCard}>
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
                                    can(user, "projects", "update:any") && <>
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
                                    can(user, "finances", "update:any") && <>
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

                {
                    can(user, "store", "read:any") && <Card className={styles.menuCard}>
                        <AccordionButton
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="store"
                            onClick={() => handleItemSideBar('store')}
                        >
                            <div>
                                <FaStore /> <span>Loja</span>
                            </div>
                        </AccordionButton>

                        <Accordion.Collapse eventKey="store">
                            <Card.Body className={styles.menuCardBody}>
                                {
                                    can(user, "store", "update:any") && <Link href="/store">
                                        <a title="Editar as informações da loja." data-title="Editar as informações da loja.">
                                            <Row
                                                className={
                                                    selectedMenu === 'store-edit' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaPencilAlt size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Configurar</span>
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
            <Link href="/dashboard" passHref>
                <Nav.Link><FaColumns /> <span>Painel</span></Nav.Link>
            </Link>

            {
                can(user, "estimates", "read:any") && <NavDropdown title="Clientes" id="estimates-dropdown">
                    <Link href="/estimates" passHref>
                        <NavDropdown.Item ><FaList size={14} /> Lista</NavDropdown.Item>
                    </Link>

                    {
                        can(user, "estimates", "create") && <Link href="/estimates/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Novo</NavDropdown.Item>
                        </Link>
                    }

                    {
                        can(user, "estimates", "update:any") && <>
                            <NavDropdown.Divider />

                            <Link href="/docs/customer" passHref>
                                <NavDropdown.Item ><FaIdCard size={14} /> Documentos</NavDropdown.Item>
                            </Link>

                            <Link href="/estimates/types" passHref>
                                <NavDropdown.Item ><FaUsersCog size={14} /> Tipos</NavDropdown.Item>
                            </Link>
                        </>
                    }
                </NavDropdown>
            }

            {
                can(user, "projects", "read:any") && <NavDropdown title="Projetos" id="projects-dropdown">
                    <Link href="/projects" passHref>
                        <NavDropdown.Item ><FaList size={14} /> Lista</NavDropdown.Item>
                    </Link>

                    {
                        can(user, "projects", "create") && <Link href="/projects/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Novo</NavDropdown.Item>
                        </Link>
                    }

                    {
                        can(user, "projects", "update:any") && <>
                            <Link href="/docs/project" passHref>
                                <NavDropdown.Item ><FaIdCard size={14} /> Documentos</NavDropdown.Item>
                            </Link>

                            <NavDropdown.Divider />

                            <Link href="/projects/types" passHref>
                                <NavDropdown.Item ><FaProjectDiagram size={14} /> Tipos</NavDropdown.Item>
                            </Link>

                            <Link href="/projects/status" passHref>
                                <NavDropdown.Item ><FaClipboardList size={14} /> Fases</NavDropdown.Item>
                            </Link>

                            <Link href="/projects/lines" passHref>
                                <NavDropdown.Item ><FaLayerGroup size={14} /> Linhas</NavDropdown.Item>
                            </Link>
                        </>
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
                        can(user, "users", "read:any") && <Link href="/users/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Novo</NavDropdown.Item>
                        </Link>
                    }
                </NavDropdown>
            }
        </Nav> : <></>
    )
}

export default Sidebar;