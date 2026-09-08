import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../storage.service';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ModalHistoryService } from '../modal-history.service';
import { NasalSprays2EditComponent, type NasalSpray2Record, type NasalSprays2EditResult } from './nasal-sprays2-edit.component';

export type { NasalSpray2Record, NasalSprays2EditResult };

@Component({
    selector: 'app-nasal-sprays2',
    standalone: true,
    imports: [CommonModule, NgbModalModule],
    templateUrl: './nasal-sprays2.component.html',
    styleUrl: './nasal-sprays2.component.scss'
})
export class NasalSprays2Component implements OnInit {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);
    private storageService = inject(StorageService);

    readonly pageSize = 8;
    currentPage = signal(1);

    nasalSprays = signal<NasalSpray2Record[]>([]);

    async ngOnInit() {
        await this.loadData();
    }

    private async loadData() {
        const count = await this.storageService.getCount('nasalSprays2');
        if (count === 0) {
            const initialSprays = this.generateNasalSprays(20);
            await this.storageService.saveAll('nasalSprays2', initialSprays);
        }
        const allSprays = await this.storageService.getAll<NasalSpray2Record>('nasalSprays2');
        allSprays.sort((a, b) => b.id - a.id);
        this.nasalSprays.set(allSprays);
    }

    private generateNasalSprays(count: number): NasalSpray2Record[] {
        const brandNames = ['Flonase', 'Afrin', 'Ayr Saline', 'Nasacort', 'Astelin', 'Rhinocort', 'Simply Saline', 'Dymista', 'Mucinex Sinus-Max', 'Xlear', 'Zicam', 'NeilMed'];
        const genericNames = ['Fluticasone Propionate', 'Oxymetazoline', 'Sodium Chloride', 'Triamcinolone Acetonide', 'Azelastine', 'Budesonide', 'Saline Solution', 'Azelastine/Fluticasone'];
        const strengths = ['50 mcg/spray', '0.05%', '0.65%', '55 mcg/spray', '137 mcg/spray', '32 mcg/spray', '0.9%', '0.75%'];
        const categories: NasalSpray2Record['category'][] = ['Steroid', 'Saline', 'Antihistamine', 'Decongestant'];
        const doses = ['2 sprays each nostril daily', '2 sprays each nostril every 12 hours', '1 to 2 sprays as needed', '1 spray each nostril twice daily', 'As needed'];
        const usages = ['Seasonal allergy control', 'Short-term congestion relief', 'Moisturize dry nasal passages', 'Allergy symptom prevention', 'Itchy nose and sneezing', 'Long-term allergy management'];
        const manufacturers = ['GSK', 'Bayer', 'B.F. Ascher', 'Sanofi', 'Meda', 'AstraZeneca', 'Arm & Hammer', 'Glenmark'];

        return Array.from({ length: count }, (_, i) => ({
            id: 3001 + i,
            brandName: brandNames[Math.floor(Math.random() * brandNames.length)] + ' ' + (i + 1),
            genericName: genericNames[Math.floor(Math.random() * genericNames.length)],
            strength: strengths[Math.floor(Math.random() * strengths.length)],
            category: categories[Math.floor(Math.random() * categories.length)],
            dose: doses[Math.floor(Math.random() * doses.length)],
            usage: usages[Math.floor(Math.random() * usages.length)],
            comments: `Sample comment ${i + 1}`,
            manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
            lastOpened: `2026-0${7 + Math.floor(Math.random() * 2)}-${String(10 + Math.floor(Math.random() * 20)).padStart(2, '0')}`
        }));
    }

    totalSprays = computed(() => this.nasalSprays().length);

    totalPages = computed(() => {
        return Math.max(1, Math.ceil(this.nasalSprays().length / this.pageSize));
    });

    pagedSprays = computed(() => {
        const start = (this.currentPage() - 1) * this.pageSize;
        return this.nasalSprays().slice(start, start + this.pageSize);
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

    openEditModal(spray: NasalSpray2Record): void {
        const modalRef = this.modalService.open(NasalSprays2EditComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.spray = structuredClone(spray);
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result.then(async (result: NasalSprays2EditResult) => {
            if (!result) {
                return;
            }

            if (result.action === 'save') {
                await this.storageService.save('nasalSprays2', result.spray);
                this.nasalSprays.update(current => {
                    const idx = current.findIndex(c => c.id === result.spray.id);
                    if (idx !== -1) {
                        const updated = [...current];
                        updated[idx] = result.spray;
                        return updated;
                    }
                    return current;
                });
            } else if (result.action === 'delete') {
                await this.storageService.delete('nasalSprays2', result.spray.id);
                this.nasalSprays.update(current => current.filter(c => c.id !== result.spray.id));
                if (this.currentPage() > this.totalPages()) {
                    this.currentPage.set(this.totalPages());
                }
            }
        }).catch(() => undefined);
    }

    openAddModal(): void {
        const newSpray: NasalSpray2Record = {
            id: this.getNextId(),
            brandName: '',
            genericName: '',
            strength: '',
            category: 'Steroid',
            dose: '',
            usage: '',
            comments: '',
            manufacturer: '',
            lastOpened: ''
        };

        const modalRef = this.modalService.open(NasalSprays2EditComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: true,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => this.modalHistory.handleBeforeDismiss(modalRef)
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.spray = newSpray;
        modalRef.componentInstance.allowDelete = false;

        void modalRef.result.then(async (result: NasalSprays2EditResult) => {
            if (!result || result.action !== 'save') {
                return;
            }

            await this.storageService.save('nasalSprays2', result.spray);
            this.nasalSprays.update(current => [result.spray, ...current]);
            this.currentPage.set(1);
        }).catch(() => undefined);
    }

    private getNextId(): number {
        return this.nasalSprays().length > 0 ? Math.max(...this.nasalSprays().map(c => c.id)) + 1 : 3000;
    }
}
