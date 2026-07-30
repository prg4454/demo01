import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ExportDropdownComponent } from '../export-dropdown/export-dropdown.component';
import { ModalHistoryService } from '../modal-history.service';
import {
    CustomerRecord,
    CustomerEntryModalComponent,
    CustomerModalResult
} from './customers-entry-modal.component';

@Component({
    selector: 'app-customers',
    standalone: true,
    imports: [CommonModule, NgbModalModule, ExportDropdownComponent],
    templateUrl: './customers.component.html',
    styleUrl: './customers.component.scss'
})
export class CustomersComponent {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    readonly pageSize = 8;
    currentPage = 1;
    exportMessage = '';

    customers: CustomerRecord[] = [
        {
            id: 1,
            name: 'Acme Supplies',
            address: '1200 Market St',
            city: 'Philadelphia',
            state: 'PA',
            zip: '19107',
            phone: '215-555-0101',
            email: 'billing@acmesupplies.com',
            status: 'Active'
        },
        {
            id: 2,
            name: 'Northstar Dental',
            address: '88 Lakeview Ave',
            city: 'Cleveland',
            state: 'OH',
            zip: '44113',
            phone: '216-555-0184',
            email: 'office@northstardental.com',
            status: 'Prospect'
        },
        {
            id: 3,
            name: 'Blue Ridge Foods',
            address: '42 River Road',
            city: 'Raleigh',
            state: 'NC',
            zip: '27601',
            phone: '919-555-0129',
            email: 'contact@blueridgefoods.com',
            status: 'Active'
        }
    ];

    get totalCustomers(): number {
        return this.customers.length;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.customers.length / this.pageSize));
    }

    get pagedCustomers(): CustomerRecord[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.customers.slice(start, start + this.pageSize);
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
        const modalRef = this.modalService.open(CustomerEntryModalComponent, {
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
            name: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            phone: '',
            email: '',
            status: 'Active'
        };
        modalRef.componentInstance.allowDelete = false;

        void modalRef.result
            .then((result: CustomerModalResult) => {
                if (!result || result.action !== 'save') {
                    return;
                }

                this.customers = [result.record, ...this.customers];
                this.currentPage = 1;
            })
            .catch(() => undefined);
    }

    openEditModal(record: CustomerRecord): void {
        const modalRef = this.modalService.open(CustomerEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.record = structuredClone(record);
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result
            .then((result: CustomerModalResult) => {
                if (!result) {
                    return;
                }

                const idx = this.customers.findIndex(r => r.id === result.record.id);
                if (idx < 0) {
                    return;
                }

                if (result.action === 'delete') {
                    this.customers = this.customers.filter(r => r.id !== result.record.id);
                    if (this.currentPage > this.totalPages) {
                        this.currentPage = this.totalPages;
                    }
                    return;
                }

                this.customers = this.customers.map(r => r.id === result.record.id ? result.record : r);
            })
            .catch(() => undefined);
    }

    private getNextId(): number {
        if (!this.customers.length) {
            return 1;
        }

        return Math.max(...this.customers.map(r => r.id)) + 1;
    }
}
