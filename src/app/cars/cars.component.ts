import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ExportDropdownComponent } from '../export-dropdown/export-dropdown.component';
import { ModalHistoryService } from '../modal-history.service';
import { CarRecord, CarsEntryModalComponent, CarsModalResult } from './cars-entry-modal.component';

@Component({
    selector: 'app-cars',
    standalone: true,
    imports: [CommonModule, NgbModalModule, ExportDropdownComponent],
    templateUrl: './cars.component.html',
    styleUrl: './cars.component.scss'
})
export class CarsComponent {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);

    readonly pageSize = 8;
    currentPage = 1;
    exportMessage = '';

    cars: CarRecord[] = [
        {
            id: 201,
            make: 'Toyota',
            model: 'Camry',
            owner: 'Miller',
            service: 'Oil change',
            checkIn: '8:05 AM',
            status: 'Waiting',
            advisor: 'Jamie Cruz'
        },
        {
            id: 202,
            make: 'Honda',
            model: 'Civic',
            owner: 'Johnson',
            service: 'Brake inspection',
            checkIn: '8:40 AM',
            status: 'In Service',
            advisor: 'Taylor Reed'
        },
        {
            id: 203,
            make: 'Ford',
            model: 'Explorer',
            owner: 'Nguyen',
            service: 'Battery replacement',
            checkIn: '9:10 AM',
            status: 'Parts Hold',
            advisor: 'Jordan Blake'
        },
        {
            id: 204,
            make: 'Tesla',
            model: 'Model Y',
            owner: 'Garcia',
            service: 'Tire rotation',
            checkIn: '9:25 AM',
            status: 'Ready',
            advisor: 'Jamie Cruz'
        },
        {
            id: 205,
            make: 'Subaru',
            model: 'Outback',
            owner: 'Taylor',
            service: 'Warranty diagnostic',
            checkIn: '9:50 AM',
            status: 'Waiting',
            advisor: 'Morgan Hale'
        },
        {
            id: 206,
            make: 'Chevrolet',
            model: 'Silverado',
            owner: 'Lee',
            service: 'Engine light scan',
            checkIn: '10:15 AM',
            status: 'In Service',
            advisor: 'Taylor Reed'
        }
    ];

    constructor() {
        this.sortCarsByVehicle();
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.cars.length / this.pageSize));
    }

    get pagedCars(): CarRecord[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.cars.slice(start, start + this.pageSize);
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
        const modalRef = this.modalService.open(CarsEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.car = {
            id: this.getNextId(),
            make: '',
            model: '',
            owner: '',
            service: '',
            checkIn: '',
            status: 'Waiting',
            advisor: ''
        };
        modalRef.componentInstance.allowDelete = false;

        void modalRef.result
            .then((result: CarsModalResult) => {
                if (!result || result.action !== 'save') {
                    return;
                }

                this.cars = [result.car, ...this.cars];
                this.sortCarsByVehicle();
                this.currentPage = 1;
            })
            .catch(() => undefined);
    }

    openEditModal(car: CarRecord): void {
        const modalRef = this.modalService.open(CarsEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.car = structuredClone(car);
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result
            .then((result: CarsModalResult) => {
                if (!result) {
                    return;
                }

                const idx = this.cars.findIndex(c => c.id === result.car.id);
                if (idx < 0) {
                    return;
                }

                if (result.action === 'delete') {
                    this.cars = this.cars.filter(c => c.id !== result.car.id);
                    if (this.currentPage > this.totalPages) {
                        this.currentPage = this.totalPages;
                    }
                    return;
                }

                this.cars = this.cars.map(c => c.id === result.car.id ? result.car : c);
                this.sortCarsByVehicle();
            })
            .catch(() => undefined);
    }

    private getNextId(): number {
        if (!this.cars.length) {
            return 1;
        }
        return Math.max(...this.cars.map(c => c.id)) + 1;
    }

    private sortCarsByVehicle(): void {
        this.cars.sort((a, b) => `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`));
    }
}