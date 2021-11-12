import { ProjectStatus } from '../ProjectStatus';
import { ProjectEvent } from '../ProjectEvents';
import { ProjectAttachmentRequired } from '../ProjectAttachmentsRequired';
import { ProjectAttachment } from '../ProjectAttachments';
import { Income } from '../Incomings';
import { User } from '../Users';
import { Store } from '../Stores';

export interface Project {
    id: string;
    customer: string;
    document: string;
    phone: string;
    cellphone: string;
    contacts: string;
    email: string;
    zip_code: string;
    street: string;
    number: string;
    neighborhood: string;
    complement: string;
    city: string;
    state: string;
    energy_company: string;
    unity: string;
    months_average: number;
    average_increase: number;
    coordinates: string;
    capacity: number;
    inversor: string;
    roof_orientation: string;
    roof_type: string;
    panel: string;
    panel_amount: number;
    price: number;
    notes: string;
    financier_same: boolean;
    financier: string;
    financier_document: string;
    financier_rg: string;
    financier_cellphone: string;
    financier_email: string;
    financier_zip_code: string;
    financier_street: string;
    financier_number: string;
    financier_neighborhood: string;
    financier_complement: string;
    financier_city: string;
    financier_state: string;
    created_by: string;
    created_at: Date;
    updated_by: string;
    updated_at: Date;
    status: ProjectStatus;
    seller: User | null;
    store: Store;
    events: ProjectEvent[];
    attachmentsRequired: ProjectAttachmentRequired[];
    attachments: ProjectAttachment[];
    incomings: Income[];
}