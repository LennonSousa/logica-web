import { Button } from 'react-bootstrap';
import { FaPrint } from 'react-icons/fa';

import styles from './styles.module.css';

interface PrintButtonProps {
    title?: string;
}

const PrintButton: React.FC<PrintButtonProps> = ({ title = "Imprimir" }) => {
    return (
        <div className={`d-print-none ${styles.buttonPrintContainer}`}>
            <Button
                className={styles.buttonPrint}
                variant="success"
                onClick={() => window.print()}
                title={title}
            >
                <FaPrint />
            </Button>
        </div>
    )
}

export { PrintButton };