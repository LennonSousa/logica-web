import { useRouter } from 'next/router';
import { createContext, useContext, useState } from 'react';
import Cookies from 'js-cookie';

import api from '../api/api';
import { StoresContext } from './StoresContext';
import { User, Grants } from '../components/Users';

interface AuthContextData {
    user: User | undefined;
    signed: boolean;
    loading: boolean;
    handleAuthenticated(): Promise<void>;
    handleLogin(email: string, password: string, returnTo?: string): Promise<boolean | "error">;
    handleLogout(): Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const AuthProvider: React.FC = ({ children }) => {
    const router = useRouter();
    const { handleStores } = useContext(StoresContext);

    const [user, setUser] = useState<User>();
    const [signed, setSigned] = useState(false);
    const [loading, setLoading] = useState(true);

    async function handleAuthenticated() {
        try {
            const storagedUser = Cookies.get('user');
            const storagedToken = Cookies.get('token');

            if (!storagedUser || !storagedToken) {
                handleLogout();
                return;
            }

            api.defaults.headers['Authorization'] = `Bearer ${storagedToken}`;

            const res = await api.get(`users/${storagedUser}`);

            const userRes: User = res.data;

            setSigned(true);
            setUser({ ...userRes, grants: setUserGrants(userRes) });

            try {
                const storesRes = await api.get('stores');

                handleStores(storesRes.data);
            }
            catch (err) {
                console.log('Error to get stores, ', err);
            }

            setLoading(false);
        }
        catch {
            handleLogout();
        }
    }

    async function handleLogin(emailLogin: string, password: string, returnTo?: string) {
        try {
            const res = await api.post('users/authenticate', {
                email: emailLogin,
                password
            },
                {
                    validateStatus: function (status) {
                        return status < 500; // Resolve only if the status code is less than 500
                    }
                }
            );

            if (res.status === 201) {
                const { user, token } = res.data;

                const userRes: User = user;

                setUser({ ...userRes, grants: setUserGrants(userRes) });

                api.defaults.headers['Authorization'] = `Bearer ${token}`;

                Cookies.set('user', user.id, { expires: 1, secure: true });
                Cookies.set('token', token, { expires: 1, secure: true });

                try {
                    const storesRes = await api.get('stores');

                    handleStores(storesRes.data);
                }
                catch (err) {
                    console.log('Error to get stores, ', err);
                }

                setSigned(true);
                setLoading(false);

                router.push(`${returnTo ? returnTo : '/estimates/'}`);

                return true;
            }

            return false;
        }
        catch {
            return "error";
        }
    }

    function setUserGrants(user: User) {
        let listGrants: Grants[] = [];

        user.roles.forEach(role => {
            if (role.view) {
                listGrants.push({
                    role: user.id,
                    resource: role.role,
                    action: 'read:any'
                });
            }

            if (role.view_self) {
                listGrants.push({
                    role: user.id,
                    resource: role.role,
                    action: 'read:own'
                });
            }

            if (role.create) {
                listGrants.push({
                    role: user.id,
                    resource: role.role,
                    action: 'create'
                });
            }

            if (role.update) {
                listGrants.push({
                    role: user.id,
                    resource: role.role,
                    action: 'update:any'
                });

            }

            if (role.update_self) {
                listGrants.push({
                    role: user.id,
                    resource: role.role,
                    action: 'update:own'
                });

            }

            if (role.remove) {
                listGrants.push({
                    role: user.id,
                    resource: role.role,
                    action: 'delete'
                });
            }
        });

        return listGrants;
    }

    async function handleLogout() {
        setLoading(true);
        setSigned(false);
        setUser(undefined);

        Cookies.remove('user');
        Cookies.remove('token');

        api.defaults.headers.Authorization = undefined;

        router.replace('/');

        setLoading(false);
    }

    return (
        <AuthContext.Provider value={{ user, signed, loading, handleAuthenticated, handleLogin, handleLogout }}>
            {children}
        </AuthContext.Provider>
    );
}

export { AuthContext, AuthProvider };