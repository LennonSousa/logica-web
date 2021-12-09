import { useState, createContext } from 'react';

import { Store } from '../components/Stores';

interface StoresContextData {
    stores: Store[];
    selectedStore: Store | undefined;
    handleStores(stores: Store[]): void;
    handleSelectedStore(storeId: string): void;
}

const StoresContext = createContext<StoresContextData>({} as StoresContextData);

const StoresProvider: React.FC = ({ children }) => {
    const [stores, setStores] = useState<Store[]>([]);
    const [selectedStore, setSelectedStore] = useState<Store>();

    function handleSelectedStore(storeId: string) {
        const storeToSelect = stores.find(item => {
            return item.id === storeId;
        });

        if (storeToSelect)
            setSelectedStore(storeToSelect);
    }

    function handleStores(stores: Store[]) {
        setStores(stores);
    }

    return (
        <StoresContext.Provider value={{ stores, selectedStore, handleStores, handleSelectedStore }}>
            {children}
        </StoresContext.Provider>
    );
}

export { StoresContext, StoresProvider };