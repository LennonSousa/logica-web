import { Store } from '../Stores';
import { NoteShare } from '../NoteShares';
import { NoteAttachment } from '../NoteAttachments';

export interface Note {
    id: string;
    title: string;
    text: string;
    created_by: string;
    created_at: Date;
    updated_by: string;
    updated_at: Date;
    store_only: boolean;
    store: Store;
    shares: NoteShare[];
    attachments: NoteAttachment[];
}