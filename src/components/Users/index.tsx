import { useState } from 'react';
import { useRouter } from 'next/router';
import { Row, Col, ListGroup, Button, Spinner } from 'react-bootstrap';
import { FaUserEdit, FaPause, FaPlay, FaUserClock, FaUserTag } from 'react-icons/fa';

import api from '../../api/api';
import { Store } from '../Stores';

type Resource = 'estimates' | 'projects' | 'services' | 'store' | 'settings' | 'finances' | 'users';
type Action = 'read:any' | 'read:own' | 'create' | 'update:any' | 'update:own' | 'delete';

export interface User {
    id: string,
    name: string;
    document: string;
    phone: string;
    email: string;
    password: string;
    active: boolean;
    paused: boolean;
    root: boolean;
    store_only: boolean;
    discountLimit: number;
    store: Store;
    created_at: Date;
    roles: UserRole[];
    grants: Grants[];
}

export interface UserRole {
    id: string;
    role: string;
    view: boolean;
    view_self: boolean;
    create: boolean;
    update: boolean;
    update_self: boolean;
    remove: boolean;
}

export interface Grants {
    role: string;
    resource: string;
    action: string;
}

interface TranslateRoles {
    role: string,
    translated: string;
}

export const translatedRoles: TranslateRoles[] = [
    {
        role: 'employees',
        translated: 'Funcionários',
    },
    {
        role: 'shifts',
        translated: 'Turnos',
    },
    {
        role: 'attendances',
        translated: 'Ponto',
    },
    {
        role: 'estimates',
        translated: 'Orçamentos',
    },
    {
        role: 'projects',
        translated: 'Projetos',
    },
    {
        role: 'services',
        translated: 'Ordens de Serviço',
    },
    {
        role: 'store',
        translated: 'Loja'
    },
    {
        role: 'settings',
        translated: 'Configurações'
    },
    {
        role: 'finances',
        translated: 'Financeiro'
    },
    {
        role: 'users',
        translated: 'Usuários',
    },
];

interface UsersProps {
    user: User;
    userAuthenticated: User;
    handleListUsers(): Promise<void>;
}

export function can(user: User, resource: Resource, action: Action) {
    const foundResource = user.grants.find(grant => {
        return grant.role === user.id && grant.resource === resource && grant.action === action
    });

    if (foundResource) return true;

    return false;
}

const Users: React.FC<UsersProps> = ({ user, userAuthenticated, handleListUsers }) => {
    const router = useRouter();

    const [userPausing, setCategoryPausing] = useState(false);

    const togglePauseUser = async () => {
        setCategoryPausing(true);

        try {
            if (userAuthenticated.id !== user.id && !user.root) {
                await api.put(`users/${user.id}`, {
                    name: user.name,
                    document: user.document,
                    phone: user.phone,
                    paused: !user.paused,
                });

                await handleListUsers();
            }
        }
        catch (err) {
            console.log("Error to pause user");
            console.log(err);
        }

        setCategoryPausing(false);
    }

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <ListGroup.Item variant={!user.active ? "secondary" : !user.paused ? "light" : "danger"}>
            <Row className="align-items-center">
                <Col><span>{user.name}</span></Col>

                {
                    !user.active && <Col className="col-row text-end">
                        <FaUserClock /> aguardando aceitação...
                    </Col>
                }

                {
                    userAuthenticated.id !== user.id
                    && can(userAuthenticated, "users", "update:any")
                    && !user.root
                    && <Col className="col-row text-end">
                        <Button
                            variant="outline-success"
                            className="button-link"
                            onClick={togglePauseUser}
                            title="Pausar usuário"
                        >
                            {
                                userPausing ? <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                /> : user.paused ? (<><FaPlay /> Pausado</>) : (<><FaPause /> Pausar</>)
                            }
                        </Button>
                    </Col>
                }

                <Col className="col-row text-end">
                    <Button
                        variant="outline-success"
                        className="button-link"
                        onClick={() => handleRoute(`/users/details/${user.id}`)}
                        title="Ver informações sobre o usuário"
                    >
                        <FaUserTag /> Detalhes
                    </Button>
                </Col>

                {
                    can(userAuthenticated, "users", "update:any")
                        || userAuthenticated.id === user.id
                        && can(userAuthenticated, "users", "update:own")
                        ? <Col className="col-row text-end">
                            <Button
                                variant="outline-success"
                                className="button-link"
                                onClick={() => handleRoute(`/users/edit/${user.id}`)}
                                title="Editar usuário"
                            >
                                <FaUserEdit /> Editar
                            </Button>
                        </Col> : <></>
                }
            </Row>
        </ListGroup.Item>
    )
}

export default Users;