import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
    AddressBookRecord,
    AddressBookEntryModalComponent,
    AddressBookModalResult
} from './address-book-entry-modal.component';

@Component({
    selector: 'app-address-book',
    standalone: true,
    imports: [CommonModule, NgbModalModule],
    templateUrl: './address-book.component.html',
    styleUrl: './address-book.component.scss'
})
export class AddressBookComponent {
    private modalService = inject(NgbModal);

    readonly pageSize = 8;
    currentPage = 1;

    occasions: AddressBookRecord[] = [
        {
            id: 301,
            personName: 'Emma Carter',
            relationship: 'Friend',
            phone: '555-0101',
            email: 'emma.carter@example.com',
            birthdayDate: '1994-08-14',
            anniversaryDate: '',
            notes: 'Prefers books and tea gifts.'
        },
        {
            id: 302,
            personName: 'Uncle Ravi & Aunt Mina',
            relationship: 'Relative',
            phone: '555-0142',
            email: 'ravi.mina@example.com',
            birthdayDate: '',
            anniversaryDate: '2001-11-02',
            notes: 'Call in the evening.'
        },
        {
            id: 303,
            personName: 'Jordan Blake',
            relationship: 'Friend',
            phone: '555-0188',
            email: 'jordan.blake@example.com',
            birthdayDate: '1990-07-17',
            anniversaryDate: '',
            notes: 'Send happy birthday text at noon.'
        },
        {
            id: 304,
            personName: 'Grandma June',
            relationship: 'Relative',
            phone: '555-0199',
            email: '',
            birthdayDate: '1948-04-05',
            anniversaryDate: '',
            notes: 'Visit this weekend instead.'
        }
    ];

    get totalOccasions(): number {
        return this.occasions.length;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.occasions.length / this.pageSize));
    }

    get pagedOccasions(): AddressBookRecord[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.occasions.slice(start, start + this.pageSize);
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
        const modalRef = this.modalService.open(AddressBookEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            size: 'lg',
            scrollable: true
        });

        modalRef.componentInstance.record = {
            id: this.getNextId(),
            personName: '',
            relationship: 'Friend',
            phone: '',
            email: '',
            birthdayDate: '',
            anniversaryDate: '',
            notes: ''
        };
        modalRef.componentInstance.allowDelete = false;

        void modalRef.result
            .then((result: AddressBookModalResult) => {
                if (!result || result.action !== 'save') {
                    return;
                }

                this.occasions = [result.record, ...this.occasions];
                this.currentPage = 1;
            })
            .catch(() => undefined);
    }

    openEditModal(record: AddressBookRecord): void {
        const modalRef = this.modalService.open(AddressBookEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            size: 'lg',
            scrollable: true
        });

        modalRef.componentInstance.record = structuredClone(record);
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result
            .then((result: AddressBookModalResult) => {
                if (!result) {
                    return;
                }

                const idx = this.occasions.findIndex(r => r.id === result.record.id);
                if (idx < 0) {
                    return;
                }

                if (result.action === 'delete') {
                    this.occasions = this.occasions.filter(r => r.id !== result.record.id);
                    if (this.currentPage > this.totalPages) {
                        this.currentPage = this.totalPages;
                    }
                    return;
                }

                this.occasions = this.occasions.map(r => r.id === result.record.id ? result.record : r);
            })
            .catch(() => undefined);
    }

    private getNextId(): number {
        if (!this.occasions.length) {
            return 1;
        }

        return Math.max(...this.occasions.map(r => r.id)) + 1;
    }
}
