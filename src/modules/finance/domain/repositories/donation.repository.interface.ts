import { IRepository } from 'src/shared/interfaces/repository.interface';
import { Donation, DonationStatus, DonationType } from '../model/donation.model';

export interface IDonationRepository extends IRepository<Donation, string> {
  findById(id: string): Promise<Donation | null>;
  findByDonorId(donorId: string): Promise<Donation[]>;
  findByStatus(status: DonationStatus): Promise<Donation[]>;
  findByType(type: DonationType): Promise<Donation[]>;
  findPendingRegularDonations(): Promise<Donation[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Donation[]>;
  create(donation: Donation): Promise<Donation>;
  update(id: string, donation: Donation): Promise<Donation>;
  delete(id: string): Promise<void>;
  findAll(filter?: any): Promise<Donation[]>;
}

export const DONATION_REPOSITORY = Symbol('DONATION_REPOSITORY');
