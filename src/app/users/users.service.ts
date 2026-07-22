import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';

export type UserRecord = {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string;
    website: string;
    company: {
        name: string;
        catchPhrase: string;
    };
    address: {
        street: string;
        suite: string;
        city: string;
        zipcode: string;
    };
};

@Injectable({ providedIn: 'root' })
export class UsersService {
    private http = inject(HttpClient);

    getUsers(): Observable<UserRecord[]> {
        return this.http.get<UserRecord[]>('https://jsonplaceholder.typicode.com/users').pipe(retry(3));
    }
}