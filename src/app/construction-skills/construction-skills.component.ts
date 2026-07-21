import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ExportDropdownComponent } from '../export-dropdown/export-dropdown.component';
import { ModalHistoryService } from '../modal-history.service';
import { StorageService } from '../storage.service';
import {
    ConstructionSkillRecord,
    ConstructionSkillsEntryModalComponent,
    ConstructionSkillsModalResult
} from './construction-skills-entry-modal.component';

@Component({
    selector: 'app-construction-skills',
    standalone: true,
    imports: [CommonModule, NgbModalModule, ExportDropdownComponent],
    templateUrl: './construction-skills.component.html',
    styleUrl: './construction-skills.component.scss'
})
export class ConstructionSkillsComponent implements OnInit {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);
    private storageService = inject(StorageService);

    readonly pageSize = 8;
    currentPage = 1;
    exportMessage = '';

    skills: ConstructionSkillRecord[] = [];

    async ngOnInit() {
        await this.loadData();
    }

    private async loadData() {
        const count = await this.storageService.getCount('constructionSkills');
        if (count === 0) {
            const initialSkills = this.generateSkills(60);
            await this.storageService.saveAll('constructionSkills', initialSkills);
        }

        this.skills = await this.storageService.getAll<ConstructionSkillRecord>('constructionSkills');
        this.skills.sort((a, b) => b.id - a.id);
    }

    private generateSkills(count: number): ConstructionSkillRecord[] {
        const skillNames = [
            'Concrete Forming',
            'Rebar Placement',
            'Drywall Installation',
            'Framing',
            'Scaffolding Setup',
            'Blueprint Reading',
            'Welding',
            'Forklift Operation',
            'Rigging',
            'Masonry'
        ];
        const categories = ['Structural', 'Finishing', 'Safety', 'Equipment', 'Electrical Support'];
        const certifiers = ['NCCER', 'OSHA', 'Union Local 42', 'BuildSafe Institute', 'City Trade Board'];
        const levels: ConstructionSkillRecord['level'][] = ['Apprentice', 'Journeyman', 'Expert', 'Master'];

        return Array.from({ length: count }, (_, i) => {
            const expiresDate = new Date();
            expiresDate.setMonth(expiresDate.getMonth() + Math.floor(Math.random() * 24) + 1);

            return {
                id: 2000 + i,
                skill: skillNames[Math.floor(Math.random() * skillNames.length)],
                category: categories[Math.floor(Math.random() * categories.length)],
                level: levels[Math.floor(Math.random() * levels.length)],
                certifiedBy: certifiers[Math.floor(Math.random() * certifiers.length)],
                expiresOn: expiresDate.toISOString().split('T')[0],
                notes: Math.random() > 0.5 ? 'Field verified' : 'Refresh training annually'
            };
        });
    }

    get totalSkills(): number {
        return this.skills.length;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.skills.length / this.pageSize));
    }

    get pagedSkills(): ConstructionSkillRecord[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.skills.slice(start, start + this.pageSize);
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
        const modalRef = this.modalService.open(ConstructionSkillsEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => modalRef.componentInstance.handleBeforeDismiss()
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.skillRecord = {
            id: this.getNextId(),
            skill: '',
            category: '',
            level: 'Apprentice',
            certifiedBy: '',
            expiresOn: '',
            notes: ''
        };
        modalRef.componentInstance.allowDelete = false;

        void modalRef.result
            .then(async (result: ConstructionSkillsModalResult) => {
                if (!result || result.action !== 'save') {
                    return;
                }

                await this.storageService.save('constructionSkills', result.skillRecord);
                this.skills = [result.skillRecord, ...this.skills];
                this.currentPage = 1;
            })
            .catch(() => undefined);
    }

    openEditModal(skillRecord: ConstructionSkillRecord): void {
        const modalRef = this.modalService.open(ConstructionSkillsEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => modalRef.componentInstance.handleBeforeDismiss()
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.skillRecord = structuredClone(skillRecord);
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result
            .then(async (result: ConstructionSkillsModalResult) => {
                if (!result) {
                    return;
                }

                if (result.action === 'delete') {
                    await this.storageService.delete('constructionSkills', result.skillRecord.id);
                    this.skills = this.skills.filter(s => s.id !== result.skillRecord.id);
                    if (this.currentPage > this.totalPages) {
                        this.currentPage = this.totalPages;
                    }
                    return;
                }

                await this.storageService.save('constructionSkills', result.skillRecord);
                this.skills = this.skills.map(s => s.id === result.skillRecord.id ? result.skillRecord : s);
            })
            .catch(() => undefined);
    }

    private getNextId(): number {
        if (!this.skills.length) {
            return 1;
        }
        return Math.max(...this.skills.map(s => s.id)) + 1;
    }
}
