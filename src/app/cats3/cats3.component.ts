import { Component, inject, OnInit, OnDestroy, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../storage.service';
import { Cats3EditComponent, CatRecord } from './cats3-edit.component';

@Component({
    selector: 'app-cats3',
    standalone: true,
    imports: [CommonModule, Cats3EditComponent],
    templateUrl: './cats3.component.html',
    styleUrl: './cats3.component.scss'
})
export class Cats3Component implements OnInit, OnDestroy {
    private storageService = inject(StorageService);

    // Reference to the child editor component to control dialog overlay elements
    @ViewChild('editComp') editComp!: Cats3EditComponent;

    readonly pageSize = 8;
    currentPage = signal(1);

    cats = signal<CatRecord[]>([]);

    async ngOnInit() {
        await this.loadData();
    }

    // Standard canDeactivate hook to prompt users with the custom HTML dialog warning
    canDeactivate(): boolean | Promise<boolean> {
        if (this.editComp && this.editComp.hasUnsavedChanges()) {
            return this.editComp.confirmDiscardWithHtmlDialog();
        }
        return true;
    }

    ngOnDestroy(): void {
        if (this.editComp) {
            this.editComp.close(); // Clean up native dialogs on destroy
        }
    }

    private async loadData() {
        // Retrieve records from IndexedDB.
        let count = await this.storageService.getCount('cats3');
        if (count === 0) {
            // Generate exactly 20 sample cats.
            const initialCats = this.generateCats(20);
            await this.storageService.saveAll('cats3', initialCats);
        }
        const allCats = await this.storageService.getAll<CatRecord>('cats3');
        allCats.sort((a, b) => b.id - a.id);
        this.cats.set(allCats);
    }

    private generateCats(count: number): CatRecord[] {
        const breeds = ['Siamese', 'Persian', 'Maine Coon', 'Bengal', 'Sphynx', 'Abyssinian', 'Ragdoll'];
        const owners = ['Alice Smith', 'Bob Johnson', 'Charlie Brown', 'Diana Davis', 'Evan Garcia', 'Fiona Miller'];
        const reasons = ['Annual checkup', 'Vaccinations', 'Flea treatment', 'Dental cleaning', 'Ear infection'];
        const vets = ['Dr. Hernandez', 'Dr. Patel', 'Dr. Kim', 'Dr. Adams'];
        const catNames = ['Misty', 'Whiskers', 'Luna', 'Shadow', 'Oliver', 'Bella', 'Charlie', 'Lucy', 'Leo', 'Molly'];
        const statuses: CatRecord['status'][] = ['Waiting', 'Exam', 'Treatment', 'Ready'];

        return Array.from({ length: count }, (_, i) => ({
            id: 3000 + i,
            name: catNames[Math.floor(Math.random() * catNames.length)] + ' ' + (i + 1),
            breed: breeds[Math.floor(Math.random() * breeds.length)],
            owner: owners[Math.floor(Math.random() * owners.length)],
            reason: reasons[Math.floor(Math.random() * reasons.length)],
            checkIn: `${9 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 6)}0 AM`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            vet: vets[Math.floor(Math.random() * vets.length)],
            nextAppointment: `2026-09-${10 + Math.floor(Math.random() * 20)}`
        }));
    }

    totalCats = computed(() => this.cats().length);

    totalPages = computed(() => {
        return Math.max(1, Math.ceil(this.cats().length / this.pageSize));
    });

    pagedCats = computed(() => {
        const start = (this.currentPage() - 1) * this.pageSize;
        return this.cats().slice(start, start + this.pageSize);
    });

    previousPage(): void {
        if (this.currentPage() > 1) {
            this.currentPage.update(p => p - 1);
        }
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update(p => p + 1);
        }
    }

    // Open add dialog modal
    openAddModal(): void {
        const newCat: CatRecord = {
            id: this.getNextId(),
            name: '',
            breed: '',
            owner: '',
            reason: '',
            checkIn: '',
            status: 'Waiting',
            vet: '',
            nextAppointment: ''
        };
        this.editComp.open(newCat, false);
    }

    // Open edit dialog modal
    openEditModal(cat: CatRecord): void {
        this.editComp.open(cat, true);
    }

    // Called when the editor component emits a 'saved' event
    async onSave(cat: CatRecord) {
        await this.storageService.save('cats3', cat);
        this.cats.update(current => {
            const idx = current.findIndex(c => c.id === cat.id);
            if (idx !== -1) {
                const updated = [...current];
                updated[idx] = cat;
                return updated;
            }
            // If it's a new cat, insert it at the top of the array
            const newArray = [cat, ...current];
            this.currentPage.set(1);
            return newArray;
        });
    }

    // Called when the editor component emits a 'deleted' event
    async onDelete(cat: CatRecord) {
        await this.storageService.delete('cats3', cat.id);
        this.cats.update(current => current.filter(c => c.id !== cat.id));
        if (this.currentPage() > this.totalPages()) {
            this.currentPage.set(this.totalPages());
        }
    }

    private getNextId(): number {
        return this.cats().length > 0 ? Math.max(...this.cats().map(c => c.id)) + 1 : 3000;
    }
}

