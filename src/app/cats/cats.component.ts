import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';
import { StorageService } from '../storage.service';
import { CatRecord, CatsEntryModalComponent, CatsModalResult } from './cats-entry-modal.component';

@Component({
    selector: 'app-cats',
    standalone: true,
    imports: [CommonModule, NgbModalModule],
    templateUrl: './cats.component.html',
    styleUrl: './cats.component.scss'
})
export class CatsComponent implements OnInit {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);
    private storageService = inject(StorageService);

    readonly pageSize = 8;
    currentPage = 1;

    cats: CatRecord[] = [];

    async ngOnInit() {
        await this.loadData();
    }

    private async loadData() {
        const count = await this.storageService.getCount('cats');
        if (count === 0) {
            const initialCats = this.generateCats(50);
            await this.storageService.saveAll('cats', initialCats);
        }
        this.cats = await this.storageService.getAll<CatRecord>('cats');
        // Sort by ID descending so new adds show up first if we want
        this.cats.sort((a, b) => b.id - a.id);
    }

    private generateCats(count: number): CatRecord[] {
        const breeds = ['Siamese', 'Persian', 'Maine Coon', 'Bengal', 'Sphynx', 'Abyssinian', 'Ragdoll', 'Tabby', 'Calico', 'Savannah'];
        const owners = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
        const reasons = ['Annual checkup', 'Vaccinations', 'Flea treatment', 'Dental cleaning', 'Ear infection', 'Limping', 'Scratching', 'Coughing'];
        const vets = ['Dr. Hernandez', 'Dr. Patel', 'Dr. Kim', 'Dr. Adams', 'Dr. Brown'];
        const statuses: CatRecord['status'][] = ['Waiting', 'Exam', 'Treatment', 'Ready'];
        const catNames = ['Misty', 'Whiskers', 'Luna', 'Shadow', 'Oliver', 'Bella', 'Charlie', 'Lucy', 'Leo', 'Molly', 'Simba', 'Sophie', 'Jack', 'Chloe', 'Tiger', 'Nala', 'Smokey', 'Lily', 'Oreo', 'Coco'];

        return Array.from({ length: count }, (_, i) => ({
            id: 1000 + i,
            name: catNames[Math.floor(Math.random() * catNames.length)] + ' ' + (i + 1),
            breed: breeds[Math.floor(Math.random() * breeds.length)],
            owner: owners[Math.floor(Math.random() * owners.length)],
            reason: reasons[Math.floor(Math.random() * reasons.length)],
            checkIn: `${8 + Math.floor(Math.random() * 4)}:${Math.floor(Math.random() * 6)}0 AM`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            vet: vets[Math.floor(Math.random() * vets.length)]
        }));
    }

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
            .then(async (result: CatsModalResult) => {
                if (!result || result.action !== 'save') {
                    return;
                }

                await this.storageService.save('cats', result.cat);
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
            .then(async (result: CatsModalResult) => {
                if (!result) {
                    return;
                }

                if (result.action === 'delete') {
                    await this.storageService.delete('cats', result.cat.id);
                    this.cats = this.cats.filter(c => c.id !== result.cat.id);
                    if (this.currentPage > this.totalPages) {
                        this.currentPage = this.totalPages;
                    }
                    return;
                }

                await this.storageService.save('cats', result.cat);
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
