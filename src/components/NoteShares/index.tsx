import { Badge, CloseButton } from 'react-bootstrap';

import { Note } from '../Notes';
import { User } from '../Users';

export interface NoteShare {
    id: string;
    can_edit: boolean;
    note?: Note;
    user: User;
}

interface ServiceBuildTypesProps {
    share: NoteShare;
    canDelete?: boolean;
    handleNoteSharesList(share: NoteShare): void;
}

const NoteShares: React.FC<ServiceBuildTypesProps> = ({ share, handleNoteSharesList, canDelete = false }) => {
    async function deleteItem() {
        handleNoteSharesList(share);
    }

    return (
        <Badge className="me-2" bg="success">
            {share.user.name} {canDelete && <CloseButton onClick={deleteItem} />}
        </Badge>
    )
}

export default NoteShares;