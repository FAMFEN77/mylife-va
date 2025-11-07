import { Customer } from '@prisma/client';

export interface CustomerResponse {
  id: string;
  organisationId: string;
  companyName?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  street?: string | null;
  houseNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  kvkNumber?: string | null;
  vatNumber?: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date | null;
  createdById?: string | null;
}

export function mapCustomer(customer: Customer): CustomerResponse {
  return {
    id: customer.id,
    organisationId: customer.organisationId,
    companyName: customer.companyName,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    street: customer.street,
    houseNumber: customer.houseNumber,
    postalCode: customer.postalCode,
    city: customer.city,
    country: customer.country,
    kvkNumber: customer.kvkNumber,
    vatNumber: customer.vatNumber,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    archivedAt: customer.archivedAt,
    createdById: customer.createdById,
  };
}

