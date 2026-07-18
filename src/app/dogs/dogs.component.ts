import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';
import { DogRecord, DogsEntryModalComponent, DogsModalResult } from './dogs-entry-modal.component';

@Component({
    selector: 'app-dogs',
    standalone: true,
    imports: [CommonModule, NgbModalModule],
    templateUrl: './dogs.component.html',
    styleUrl: './dogs.component.scss'
})
export class DogsComponent {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    readonly pageSize = 8;
    currentPage = 1;

    dogs: DogRecord[] = [
        {
            id: 101,
            name: 'Max',
            breed: 'Golden Retriever',
            owner: 'Miller',
            reason: 'Annual checkup',
            checkIn: '8:10 AM',
            status: 'Waiting',
            vet: 'Dr. Hernandez'
        },
        {
            id: 102,
            name: 'Buddy',
            breed: 'Labrador',
            owner: 'Johnson',
            reason: 'Ear infection',
            checkIn: '8:35 AM',
            status: 'Exam',
            vet: 'Dr. Patel'
        },
        {
            id: 103,
            name: 'Charlie',
            breed: 'German Shepherd',
            owner: 'Nguyen',
            reason: 'Vaccinations',
            checkIn: '9:00 AM',
            status: 'Treatment',
            vet: 'Dr. Kim'
        },
        {
            id: 104,
            name: 'Rocky',
            breed: 'Bulldog',
            owner: 'Garcia',
            reason: 'Limping front paw',
            checkIn: '9:20 AM',
            status: 'Ready',
            vet: 'Dr. Adams'
        },
        {
            id: 105,
            name: 'Daisy',
            breed: 'Beagle',
            owner: 'Taylor',
            reason: 'Skin irritation',
            checkIn: '9:45 AM',
            status: 'Waiting',
            vet: 'Dr. Hernandez'
        },
        {
            id: 106,
            name: 'Cooper',
            breed: 'Poodle',
            owner: 'Lee',
            reason: 'Nail trim',
            checkIn: '10:00 AM',
            status: 'Exam',
            vet: 'Dr. Patel'
        }
    ];

    get totalDogs(): number {
        return this.dogs.length;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.dogs.length / this.pageSize));
    }

    get pagedDogs(): DogRecord[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.dogs.slice(start, start + this.pageSize);
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
        const modalRef = this.modalService.open(DogsEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.dog = {
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
            .then((result: DogsModalResult) => {
                if (!result || result.action !== 'save') {
                    return;
                }

                this.dogs = [result.dog, ...this.dogs];
                this.currentPage = 1;
            })
            .catch(() => undefined);
    }

    openEditModal(dog: DogRecord): void {
        const modalRef = this.modalService.open(DogsEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.dog = structuredClone(dog);
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result
            .then((result: DogsModalResult) => {
                if (!result) {
                    return;
                }

                const idx = this.dogs.findIndex(d => d.id === result.dog.id);
                if (idx < 0) {
                    return;
                }

                if (result.action === 'delete') {
                    this.dogs = this.dogs.filter(d => d.id !== result.dog.id);
                    if (this.currentPage > this.totalPages) {
                        this.currentPage = this.totalPages;
                    }
                    return;
                }

                this.dogs = this.dogs.map(d => d.id === result.dog.id ? result.dog : d);
            })
            .catch(() => undefined);
    }

    private getNextId(): number {
        if (!this.dogs.length) {
            return 1;
        }
        return Math.max(...this.dogs.map(d => d.id)) + 1;
    }
}
