import { useState } from 'react';
import { Button, Toast } from 'react-bootstrap';
import { FaUserTie } from 'react-icons/fa';

interface MemberProps {
    name: string;
}

const Members: React.FC<MemberProps> = ({ name }) => {
    const [showUserDetails, setShowUserDetails] = useState(false);

    const toggleShowUserDetails = () => setShowUserDetails(!showUserDetails);

    return (
        <div className="member-container">
            <Button
                onClick={toggleShowUserDetails}
                className="member-item"
                variant="success"
                title={name}
            >
                {name.split(' ', 1)[0]}
            </Button>

            <Toast
                show={showUserDetails}
                onClose={toggleShowUserDetails}
                delay={5000}
                autohide
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 999,
                    width: 'auto',
                    maxWidth: 'fit-content',
                }}
            >
                <Toast.Header>
                    <FaUserTie style={{ marginRight: '.5rem' }} /><strong className="me-auto">{name}</strong>
                </Toast.Header>
            </Toast>
        </div>
    )
}

export default Members;