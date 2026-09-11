import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ExportDropdownComponent } from '../export-dropdown/export-dropdown.component';
import { ModalHistoryService } from '../modal-history.service';
import {
    EmployeeRecord,
    EmployeeEntryModalComponent,
    EmployeeModalResult
} from './employee-entry-modal.component';

export type { EmployeeRecord, EmployeeModalResult };

@Component({
    selector: 'app-employees-page',
    standalone: true,
    imports: [CommonModule, FormsModule, NgbModalModule, ExportDropdownComponent],
    templateUrl: './employees.component.html',
    styleUrl: './employees.component.scss'
})
export class EmployeesPageComponent {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    readonly pageSize = 8;
    currentPage = 1;
    exportMessage = '';

    employees: EmployeeRecord[] = [
        {
            id: 'EMP-001',
            name: 'Sarah Connor',
            department: 'Operations',
            role: 'Director of Security',
            email: 's.connor@cyberdyne.corp',
            phone: '555-0191',
            hireDate: '2021-03-15',
            salary: 125000,
            status: 'Active'
        },
        {
            id: 'EMP-002',
            name: 'John Doe',
            department: 'Engineering',
            role: 'Lead Architect',
            email: 'j.doe@acme.corp',
            phone: '555-0102',
            hireDate: '2019-06-01',
            salary: 145000,
            status: 'Active'
        },
        {
            id: 'EMP-003',
            name: 'Elena Rostova',
            department: 'Finance',
            role: 'Senior Financial Analyst',
            email: 'e.rostova@acme.corp',
            phone: '555-0144',
            hireDate: '2022-01-10',
            salary: 98000,
            status: 'Active'
        },
        {
            id: 'EMP-004',
            name: 'Hank Scorpio',
            department: 'Operations',
            role: 'Chief Executive Officer',
            email: 'hank@globex.org',
            phone: '555-0177',
            hireDate: '2018-11-20',
            salary: 260000,
            status: 'Active'
        },
        {
            id: 'EMP-005',
            name: 'Peter Gibbons',
            department: 'Engineering',
            role: 'Software Engineer',
            email: 'peter@initech.corp',
            phone: '555-0133',
            hireDate: '2023-04-05',
            salary: 92000,
            status: 'On Leave'
        },
        {
            id: 'EMP-006',
            name: 'Milton Waddams',
            department: 'Operations',
            role: 'Collator',
            email: 'stapler@initech.corp',
            phone: '555-0120',
            hireDate: '2015-08-12',
            salary: 48000,
            status: 'Active'
        },
        {
            id: 'EMP-007',
            name: 'Ada Wong',
            department: 'Marketing',
            role: 'Marketing Strategist',
            email: 'ada.wong@umbrella.bio',
            phone: '555-0165',
            hireDate: '2020-09-18',
            salary: 110000,
            status: 'Active'
        },
        {
            id: 'EMP-008',
            name: 'Albert Wesker',
            department: 'Engineering',
            role: 'Director of R&D',
            email: 'wesker@umbrella.bio',
            phone: '555-0182',
            hireDate: '2017-02-28',
            salary: 175000,
            status: 'Terminated'
        },
        {
            id: 'EMP-009',
            name: 'Richard Hendricks',
            department: 'Engineering',
            role: 'Principal Algorithms Dev',
            email: 'richard@piedpiper.io',
            phone: '555-0111',
            hireDate: '2022-07-01',
            salary: 155000,
            status: 'Active'
        },
        {
            id: 'EMP-010',
            name: 'Gavin Belson',
            department: 'Operations',
            role: 'Strategic Advisor',
            email: 'gavin@hooli.xyz',
            phone: '555-0199',
            hireDate: '2016-05-14',
            salary: 220000,
            status: 'Active'
        }
    ];

    selectedStatus: string = 'All';
    readonly statuses: EmployeeRecord['status'][] = ['Active', 'On Leave', 'Terminated'];

    get filteredEmployees(): EmployeeRecord[] {
        if (!this.selectedStatus || this.selectedStatus === 'All') {
            return this.employees;
        }
        return this.employees.filter(e => e.status.toLowerCase() === this.selectedStatus.toLowerCase());
    }

    onStatusFilterChange(newStatus?: string): void {
        if (newStatus !== undefined) {
            this.selectedStatus = newStatus;
        }
        this.currentPage = 1;
    }

    get totalEmployees(): number {
        return this.filteredEmployees.length;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.filteredEmployees.length / this.pageSize));
    }

    get pagedEmployees(): EmployeeRecord[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredEmployees.slice(start, start + this.pageSize);
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
        const modalRef = this.modalService.open(EmployeeEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        const nextNum = this.employees.length + 1;
        modalRef.componentInstance.record = {
            id: `EMP-${String(nextNum).padStart(3, '0')}`,
            name: '',
            department: 'Engineering',
            role: '',
            email: '',
            phone: '',
            hireDate: new Date().toISOString().split('T')[0],
            salary: 80000,
            status: 'Active'
        };
        modalRef.componentInstance.allowDelete = false;

        void modalRef.result
            .then((result: EmployeeModalResult) => {
                if (!result || result.action !== 'save') return;
                this.employees = [result.record, ...this.employees];
                this.currentPage = 1;
            })
            .catch(() => undefined);
    }

    openEditModal(record: EmployeeRecord): void {
        const modalRef = this.modalService.open(EmployeeEntryModalComponent, {
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
            .then((result: EmployeeModalResult) => {
                if (!result) return;
                if (result.action === 'delete') {
                    this.employees = this.employees.filter(e => e.id !== result.record.id);
                    if (this.currentPage > this.totalPages) {
                        this.currentPage = this.totalPages;
                    }
                    return;
                }
                this.employees = this.employees.map(e => e.id === result.record.id ? result.record : e);
            })
            .catch(() => undefined);
    }
}

