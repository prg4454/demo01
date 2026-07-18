import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';
import { CatRecord, CatsEntryModalComponent, CatsModalResult } from './cats-entry-modal.component';

@Component({
    selector: 'app-cats',
    standalone: true,
    imports: [CommonModule, NgbModalModule],
    templateUrl: './cats.component.html',
    styleUrl: './cats.component.scss'
})
export class CatsComponent {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    readonly pageSize = 8;
    currentPage = 1;

    cats: CatRecord[] = [
        {
            id: 201,
            name: 'Whiskers',
            breed: 'Tabby',
            owner: 'Miller',
            reason: 'Annual checkup',
            checkIn: '8:20 AM',
            status: 'Waiting',
            vet: 'Dr. Hernandez'
        },
        {
            id: 202,
            name: 'Luna',
            breed: 'Siamese',
            owner: 'Johnson',
            reason: 'Sneezing',
            checkIn: '8:50 AM',
            status: 'Exam',
            vet: 'Dr. Patel'
        },
        {
            id: 203,
            name: 'Mittens',
            breed: 'Calico',
            owner: 'Nguyen',
            reason: 'Vaccinations',
            checkIn: '9:10 AM',
            status: 'Treatment',
            vet: 'Dr. Kim'
        },
        {
            id: 204,
            name: 'Shadow',
            breed: 'Black',
            owner: 'Garcia',
            reason: 'Low appetite',
            checkIn: '9:35 AM',
            status: 'Ready',
            vet: 'Dr. Adams'
        },
        {
            id: 205,
            name: 'Fluffy',
            breed: 'Persian',
            owner: 'Taylor',
            reason: 'Skin irritation',
            checkIn: '9:55 AM',
            status: 'Waiting',
            vet: 'Dr. Hernandez'
        },
        {
            id: 206,
            name: 'Tiger',
            breed: 'Orange',
            owner: 'Lee',
            reason: 'Nail trim',
            checkIn: '10:10 AM',
            status: 'Exam',
            vet: 'Dr. Patel'
        }
    ];

    get totalCats(): number {
        return this.cats.length;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.cats.length / this.pageSize));
    }

    get pagedCats(): CatRecord[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.cats.slice(start, start + this.pageSize);
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
        const modalRef = this.modalService.open(CatsEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => modalRef.componentInstance.handleBeforeDismiss()
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.cat = {
            id: this.getNextId(),
            name: '',
            breed: '',
            owner: '',
            reason: '',
            checkIn: '',
            status: 'Waiting',
            vet: ''
        };
        modalRef.componentInstance.allowDelete = false;

        void modalRef.result
            .then((result: CatsModalResult) => {
                if (!result || result.action !== 'save') {
                    return;
                }

                this.cats = [result.cat, ...this.cats];
                this.currentPage = 1;
            })
            .catch(() => undefined);
    }

    openEditModal(cat: CatRecord): void {
        const modalRef = this.modalService.open(CatsEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => modalRef.componentInstance.handleBeforeDismiss()
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.cat = structuredClone(cat);
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result
            .then((result: CatsModalResult) => {
                if (!result) {
                    return;
                }

                const idx = this.cats.findIndex(c => c.id === result.cat.id);
                if (idx < 0) {
                    return;
                }

                if (result.action === 'delete') {
                    this.cats = this.cats.filter(c => c.id !== result.cat.id);
                    if (this.currentPage > this.totalPages) {
                        this.currentPage = this.totalPages;
                    }
                    return;
                }

                this.cats = this.cats.map(c => c.id === result.cat.id ? result.cat : c);
            })
            .catch(() => undefined);
    }

    private getNextId(): number {
        if (!this.cats.length) {
            return 1;
        }
        return Math.max(...this.cats.map(c => c.id)) + 1;
    }
}
