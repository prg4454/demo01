import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ExportDropdownComponent } from '../export-dropdown/export-dropdown.component';
import { ModalHistoryService } from '../modal-history.service';
import { StorageService } from '../storage.service';
import { MedicineRecord, MedicinesEntryModalComponent, MedicinesModalResult } from './medicines-entry-modal.component';

@Component({
    selector: 'app-medicines',
    standalone: true,
    imports: [CommonModule, NgbModalModule, ExportDropdownComponent],
    templateUrl: './medicines.component.html',
    styleUrl: './medicines.component.scss'
})
export class MedicinesComponent implements OnInit {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);
    private storageService = inject(StorageService);

    readonly pageSize = 8;
    currentPage = 1;
    exportMessage = '';

    medicines: MedicineRecord[] = [];

    async ngOnInit() {
        await this.loadData();
    }

    private async loadData() {
        const count = await this.storageService.getCount('medicines');
        if (count === 0) {
            const initialMedicines = this.generateMedicines(70);
            await this.storageService.saveAll('medicines', initialMedicines);
        }

        this.medicines = (await this.storageService.getAll<MedicineRecord>('medicines')).map((medicine) => this.normalizeMedicine(medicine));
        this.medicines.sort((a, b) => b.id - a.id);
    }

    private normalizeMedicine(medicine: MedicineRecord): MedicineRecord {
        const parsedDate = medicine.lastDispensed instanceof Date
            ? medicine.lastDispensed
            : new Date(medicine.lastDispensed as unknown as string);

        return {
            ...medicine,
            lastDispensed: isNaN(parsedDate.getTime()) ? new Date() : parsedDate
        };
    }

    private generateMedicines(count: number): MedicineRecord[] {
        const names = ['Lisinopril', 'Atorvastatin', 'Metformin', 'Amoxicillin', 'Albuterol', 'Ibuprofen', 'Amlodipine', 'Omeprazole'];
        const forms: MedicineRecord['form'][] = ['Tablet', 'Capsule', 'Liquid', 'Inhaler', 'Cream'];
        const doctors = ['Dr. Smith', 'Dr. Jones', 'Dr. Patel', 'Dr. Garcia', 'Dr. Williams'];
        const instructions = ['Take one daily', 'Take two with food', 'As needed for pain', 'Inhale two puffs every 4-6 hours'];

        return Array.from({ length: count }, (_, i) => ({
            id: 1000 + i,
            name: names[Math.floor(Math.random() * names.length)],
            form: forms[Math.floor(Math.random() * forms.length)],
            strength: `${Math.floor(Math.random() * 500) + 10} mg`,
            quantity: Math.floor(Math.random() * 90) + 30,
            instructions: instructions[Math.floor(Math.random() * instructions.length)],
            doctor: doctors[Math.floor(Math.random() * doctors.length)],
            lastDispensed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        }));
    }

    get totalMedicines(): number {
        return this.medicines.length;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.medicines.length / this.pageSize));
    }

    get pagedMedicines(): MedicineRecord[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.medicines.slice(start, start + this.pageSize);
    }

    previousPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    openAddModal(): void {
        const modalRef = this.modalService.open(MedicinesEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => modalRef.componentInstance.handleBeforeDismiss()
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.medicine = {
            id: this.getNextId(),
            name: '',
            form: 'Tablet',
            strength: '',
            quantity: 30,
            instructions: '',
            doctor: '',
            lastDispensed: new Date()
        };
        modalRef.componentInstance.allowDelete = false;

        void modalRef.result
            .then(async (result: MedicinesModalResult) => {
                if (!result || result.action !== 'save') {
                    return;
                }

                await this.storageService.save('medicines', result.medicine);
                this.medicines = [result.medicine, ...this.medicines];
                this.currentPage = 1;
            })
            .catch(() => undefined);
    }

    openEditModal(medicine: MedicineRecord): void {
        const modalRef = this.modalService.open(MedicinesEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => modalRef.componentInstance.handleBeforeDismiss()
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.medicine = structuredClone(medicine);
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result
            .then(async (result: MedicinesModalResult) => {
                if (!result) {
                    return;
                }

                if (result.action === 'delete') {
                    await this.storageService.delete('medicines', result.medicine.id);
                    this.medicines = this.medicines.filter(m => m.id !== result.medicine.id);
                    if (this.currentPage > this.totalPages) {
                        this.currentPage = this.totalPages;
                    }
                    return;
                }

                await this.storageService.save('medicines', result.medicine);
                this.medicines = this.medicines.map(m => m.id === result.medicine.id ? result.medicine : m);
            })
            .catch(() => undefined);
    }

    private getNextId(): number {
        if (!this.medicines.length) {
            return 1;
        }
        return Math.max(...this.medicines.map(m => m.id)) + 1;
    }
}
