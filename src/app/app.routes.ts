import { Routes } from '@angular/router';
import { pendingChangesGuard } from './pending-changes.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    {
        path: 'home',
        loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
        canDeactivate: [pendingChangesGuard],
        children: [
            {
                path: 'about',
                loadComponent: () => import('./about/about.component').then((m) => m.AboutComponent),
                canDeactivate: [pendingChangesGuard]
            },
            {
                path: 'budget',
                loadComponent: () => import('./budget/budget.component').then((m) => m.BudgetComponent),
                canDeactivate: [pendingChangesGuard]
            }
        ]
    },
    {
        path: 'about',
        loadComponent: () => import('./about/about.component').then((m) => m.AboutComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'budget',
        loadComponent: () => import('./budget/budget.component').then((m) => m.BudgetComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'services',
        loadComponent: () => import('./services/services.component').then((m) => m.ServicesComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'sayings',
        loadComponent: () => import('./sayings/sayings.component').then((m) => m.SayingsComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'jokes',
        loadComponent: () => import('./jokes/jokes.component').then((m) => m.JokesComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'address-book',
        loadComponent: () => import('./address-book/address-book.component').then((m) => m.AddressBookComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'automobiles',
        loadComponent: () => import('./automobiles/automobiles.component').then((m) => m.AutomobilesComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'notebooks',
        loadComponent: () => import('./notebooks/notebooks.component').then((m) => m.NotebooksComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'cars',
        loadComponent: () => import('./cars/cars.component').then((m) => m.CarsComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'cats',
        loadComponent: () => import('./cats/cats.component').then((m) => m.CatsComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'dogs',
        loadComponent: () => import('./dogs/dogs.component').then((m) => m.DogsComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'medicines',
        loadComponent: () => import('./medicines/medicines.component').then((m) => m.MedicinesComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'construction-skills',
        loadComponent: () => import('./construction-skills/construction-skills.component').then((m) => m.ConstructionSkillsComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'friends',
        loadComponent: () => import('./friends/friends.component').then((m) => m.FriendsComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'users',
        loadComponent: () => import('./users/users.component').then((m) => m.UsersComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'company-list',
        loadComponent: () => import('./company-list/company-list.component').then((m) => m.CompanyListComponent),
        canDeactivate: [pendingChangesGuard]
    },
    {
        path: 'ui-employer-tax',
        loadComponent: () => import('./ui-employer-tax/ui-employer-tax.component').then((m) => m.UiEmployerTaxComponent),
        canDeactivate: [pendingChangesGuard]
    }
];
