import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ExportDropdownComponent } from '../export-dropdown/export-dropdown.component';
import { ModalHistoryService } from '../modal-history.service';
import { AutomobileRecord, AutomobileEntryModalComponent, AutomobileModalResult } from './automobile-entry-modal.component';

@Component({
    selector: 'app-automobiles',
    standalone: true,
    imports: [CommonModule, NgbModalModule, ExportDropdownComponent],
    templateUrl: './automobiles.component.html',
    styleUrl: './automobiles.component.scss'
})
export class AutomobilesComponent {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    readonly pageSize = 10;
    currentPage = 1;
    exportMessage = '';

    automobiles: AutomobileRecord[] = [];

    constructor() {
        this.generateSampleData();
        this.sortAutomobilesByMake();
    }

    private generateSampleData(): void {
        const makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Audi', 'Tesla', 'Hyundai', 'Nissan'];
        const models: { [key: string]: string[] } = {
            'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius'],
            'Honda': ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey'],
            'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Focus'],
            'Chevrolet': ['Silverado', 'Malibu', 'Equinox', 'Tahoe', 'Corvette'],
            'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'M3'],
            'Mercedes': ['C-Class', 'E-Class', 'GLC', 'GLE', 'S-Class'],
            'Audi': ['A4', 'A6', 'Q5', 'Q7', 'R8'],
            'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck'],
            'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade'],
            'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Z']
        };
        const colors = ['White', 'Black', 'Silver', 'Grey', 'Red', 'Blue', 'Green', 'Yellow'];
        const statuses: AutomobileRecord['status'][] = ['Maintenance', 'Ready', 'In Use', 'Sold'];
        const owners = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Green', 'David White', 'Eve Black', 'Frank Grey'];

        for (let i = 1; i <= 50; i++) {
            const make = makes[Math.floor(Math.random() * makes.length)];
            const modelList = models[make];
            const model = modelList[Math.floor(Math.random() * modelList.length)];
            this.automobiles.push({
                id: 1000 + i,
                make,
                model,
                year: 2015 + Math.floor(Math.random() * 10),
                color: colors[Math.floor(Math.random() * colors.length)],
                vin: Math.random().toString(36).substring(2, 12).toUpperCase(),
                owner: owners[Math.floor(Math.random() * owners.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)]
            });
        }
    }

    get totalAutomobiles(): number {
        return this.automobiles.length;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.automobiles.length / this.pageSize));
    }

    get pagedAutomobiles(): AutomobileRecord[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.automobiles.slice(start, start + this.pageSize);
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
        const modalRef = this.modalService.open(AutomobileEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.record = {
            id: this.getNextId(),
            make: '',
            model: '',
            year: new Date().getFullYear(),
            color: '',
            vin: '',
            owner: '',
            status: 'Ready'
        };
        modalRef.componentInstance.allowDelete = false;

        void modalRef.result.then((result: AutomobileModalResult) => {
            if (result.action === 'save') {
                this.automobiles.unshift(result.record);
                this.sortAutomobilesByMake();
            }
        }).catch(() => { });
    }

    openEditModal(record: AutomobileRecord): void {
        const modalRef = this.modalService.open(AutomobileEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.record = record;
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result.then((result: AutomobileModalResult) => {
            if (result.action === 'save') {
                const idx = this.automobiles.findIndex(a => a.id === record.id);
                if (idx !== -1) {
                    this.automobiles[idx] = result.record;
                    this.sortAutomobilesByMake();
                }
            } else if (result.action === 'delete') {
                this.automobiles = this.automobiles.filter(a => a.id !== record.id);
                if (this.currentPage > this.totalPages) {
                    this.currentPage = this.totalPages;
                }
            }
        }).catch(() => { });
    }

    private getNextId(): number {
        return this.automobiles.length > 0 ? Math.max(...this.automobiles.map(a => a.id)) + 1 : 1001;
    }

    private sortAutomobilesByMake(): void {
        this.automobiles.sort((a, b) => a.make.localeCompare(b.make));
    }
}
