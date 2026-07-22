import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { UsersService, UserRecord } from './users.service';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './users.component.html',
    styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
    private usersService = inject(UsersService);

    users: UserRecord[] = [];
    loading = true;
    errorMessage = '';

    ngOnInit(): void {
        this.usersService.getUsers().subscribe({
            next: (users) => {
                this.users = [...users].sort((left, right) => left.name.localeCompare(right.name));
                this.loading = false;
            },
            error: () => {
                this.errorMessage = 'Unable to load users right now.';
                this.loading = false;
            }
        });
    }
}