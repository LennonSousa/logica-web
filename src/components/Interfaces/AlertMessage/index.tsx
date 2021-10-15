import { useState, useEffect } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

import styles from './styles.module.css';

export type statusModal = 'waiting' | 'success' | 'warning' | 'error';

interface WaitingModalProps {
    status: statusModal,
    message?: string;
}

const AlertMessage: React.FC<WaitingModalProps> = ({ status, message = "" }) => {
    const [circleWaiting, setCircleWaiting] = useState(true);
    const [successWaiting, setSuccessWaiting] = useState(false);
    const [warningWaiting, setWarningWaiting] = useState(false);
    const [errorWaiting, setErrorWaiting] = useState(false);
    const [variantColor, setVariantColor] = useState<"info" | "success" | "warning" | "danger">("info");

    useEffect(() => {
        handleAlert(status);
    }, [status, message]);

    function handleAlert(status: statusModal) {
        if (status === 'waiting') {
            setVariantColor("info");
            setCircleWaiting(true);
            setSuccessWaiting(false);
            setErrorWaiting(false);
            return;
        }

        if (status === 'success') {
            setVariantColor("success");
            setCircleWaiting(false);
            setSuccessWaiting(true);
            return;
        }

        if (status === 'warning') {
            setVariantColor("warning");
            setCircleWaiting(false);
            setErrorWaiting(false);
            setWarningWaiting(true);
            return;
        }

        if (status === 'error') {
            setVariantColor("danger");
            setCircleWaiting(false);
            setSuccessWaiting(false);
            setErrorWaiting(true);
            return;
        }
    }

    return (
        <Alert className={styles.alertMessage} variant={variantColor}>
            {
                circleWaiting && <><Spinner animation="border" variant="info" size="sm" /> <span className="text-wrap">{!!message ? message : "aguarde..."}</span></>
            }
            {
                successWaiting && <><FaCheckCircle /> <span className="text-wrap">{!!message ? message : "sucesso!"}</span></>
            }
            {
                warningWaiting && <><FaTimesCircle /> <span className="text-wrap">{!!message ? message : "aviso!"}</span></>
            }
            {
                errorWaiting && <><FaTimesCircle /> <span className="text-wrap">{!!message ? message : "algo deu errado!"}</span></>
            }
        </Alert>
    )
}

export { AlertMessage };