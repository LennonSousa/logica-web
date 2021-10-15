import { Project } from '../Projects';

export interface ServiceOrder {
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
    coordinates: string;
    wifi_name: string;
    wifi_password: string;
    roof_details: string;
    electric_type: string;
    inversor_brand: string;
    inversor_potency: number;
    module_brand: string;
    module_amount: number;
    test_leak: boolean;
    test_meter: boolean;
    test_monitor: boolean;
    explanation: boolean;
    start_at: Date;
    finish_at: Date;
    project: Project;
}