import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ExportDropdownComponent } from '../export-dropdown/export-dropdown.component';
import { ModalHistoryService } from '../modal-history.service';
import { StorageService } from '../storage.service';
import { FriendRecord, FriendsEntryModalComponent, FriendsModalResult } from './friends-entry-modal.component';

@Component({
    selector: 'app-friends',
    standalone: true,
    imports: [CommonModule, NgbModalModule, ExportDropdownComponent],
    templateUrl: './friends.component.html',
    styleUrl: './friends.component.scss'
})
export class FriendsComponent implements OnInit {
    private modalService = inject(NgbModal);
    private modalHistory = inject(ModalHistoryService);
    private storageService = inject(StorageService);

    readonly pageSize = 8;
    currentPage = 1;
    exportMessage = '';

    friends: FriendRecord[] = [];

    async ngOnInit() {
        await this.loadData();
    }

    private async loadData() {
        const count = await this.storageService.getCount('friends');
        if (count === 0) {
            const initialFriends = this.getInitialFriends();
            await this.storageService.saveAll('friends', initialFriends);
        }
        this.friends = await this.storageService.getAll<FriendRecord>('friends');
        this.friends.sort((a, b) => b.id - a.id);
    }

    private getInitialFriends(): FriendRecord[] {
        return [
            { id: 1, name: 'Ava Carter', city: 'Denver', hobby: 'Trail Running', status: 'Best Friend', birthday: '1992-04-18', yearsKnown: 14 },
            { id: 2, name: 'Ethan Brooks', city: 'Austin', hobby: 'Guitar', status: 'Close Friend', birthday: '1991-09-03', yearsKnown: 11 },
            { id: 3, name: 'Mia Patel', city: 'Chicago', hobby: 'Pottery', status: 'Friend', birthday: '1994-12-26', yearsKnown: 7 },
            { id: 4, name: 'Liam Nguyen', city: 'Seattle', hobby: 'Board Games', status: 'Best Friend', birthday: '1990-02-11', yearsKnown: 15 },
            { id: 5, name: 'Noah Green', city: 'Phoenix', hobby: 'Photography', status: 'Friend', birthday: '1993-08-22', yearsKnown: 6 },
            { id: 6, name: 'Sophia Diaz', city: 'San Diego', hobby: 'Surfing', status: 'Close Friend', birthday: '1995-01-14', yearsKnown: 9 },
            { id: 7, name: 'Lucas Moore', city: 'Boston', hobby: 'Cycling', status: 'Friend', birthday: '1992-06-30', yearsKnown: 5 },
            { id: 8, name: 'Emma Ross', city: 'Nashville', hobby: 'Baking', status: 'New Friend', birthday: '1996-10-07', yearsKnown: 2 },
            { id: 9, name: 'Oliver King', city: 'Portland', hobby: 'Cooking', status: 'Close Friend', birthday: '1989-03-09', yearsKnown: 12 },
            { id: 10, name: 'Grace Turner', city: 'Miami', hobby: 'Yoga', status: 'Friend', birthday: '1994-11-19', yearsKnown: 4 },
            { id: 11, name: 'Henry Bell', city: 'Dallas', hobby: 'Woodworking', status: 'Friend', birthday: '1990-07-28', yearsKnown: 8 },
            { id: 12, name: 'Chloe Ward', city: 'Minneapolis', hobby: 'Painting', status: 'New Friend', birthday: '1997-05-16', yearsKnown: 1 }
        ];
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.friends.length / this.pageSize));
    }

    get pagedFriends(): FriendRecord[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.friends.slice(start, start + this.pageSize);
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
        const modalRef = this.modalService.open(FriendsEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => modalRef.componentInstance.handleBeforeDismiss()
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.friend = {
            id: this.getNextId(),
            name: '',
            city: '',
            hobby: '',
            status: 'Friend',
            birthday: '',
            yearsKnown: 0
        };
        modalRef.componentInstance.allowDelete = false;

        void modalRef.result
            .then(async (result: FriendsModalResult) => {
                if (!result || result.action !== 'save') {
                    return;
                }

                await this.storageService.save('friends', result.friend);
                this.friends = [result.friend, ...this.friends];
                this.currentPage = 1;
            })
            .catch(() => undefined);
    }

    openEditModal(friend: FriendRecord): void {
        const modalRef = this.modalService.open(FriendsEntryModalComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            size: 'lg',
            scrollable: true,
            beforeDismiss: () => modalRef.componentInstance.handleBeforeDismiss()
        });
        this.modalHistory.registerModal(modalRef);

        modalRef.componentInstance.friend = structuredClone(friend);
        modalRef.componentInstance.allowDelete = true;

        void modalRef.result
            .then(async (result: FriendsModalResult) => {
                if (!result) {
                    return;
                }

                if (result.action === 'delete') {
                    await this.storageService.delete('friends', result.friend.id);
                    this.friends = this.friends.filter(f => f.id !== result.friend.id);
                    if (this.currentPage > this.totalPages) {
                        this.currentPage = this.totalPages;
                    }
                    return;
                }

                await this.storageService.save('friends', result.friend);
                this.friends = this.friends.map(f => f.id === result.friend.id ? result.friend : f);
            })
            .catch(() => undefined);
    }

    private getNextId(): number {
        if (!this.friends.length) {
            return 1;
        }
        return Math.max(...this.friends.map(f => f.id)) + 1;
    }
}
