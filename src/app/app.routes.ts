import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ServicesComponent } from './services/services.component';
import { CatsComponent } from './cats/cats.component';
import { CarsComponent } from './cars/cars.component';
import { DogsComponent } from './dogs/dogs.component';
import { SayingsComponent } from './sayings/sayings.component';
import { JokesComponent } from './jokes/jokes.component';
import { AddressBookComponent } from './address-book/address-book.component';
import { AutomobilesComponent } from './automobiles/automobiles.component';
import { NotebooksComponent } from './notebooks/notebooks.component';
import { MedicinesComponent } from './medicines/medicines.component';
import { BudgetComponent } from './budget/budget.component';
import { ConstructionSkillsComponent } from './construction-skills/construction-skills.component';
import { FriendsComponent } from './friends/friends.component';
import { pendingChangesGuard } from './pending-changes.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    {
        path: 'home',
        component: HomeComponent,
        canDeactivate: [pendingChangesGuard],
        children: [
            { path: 'about', component: AboutComponent, canDeactivate: [pendingChangesGuard] },
            { path: 'budget', component: BudgetComponent, canDeactivate: [pendingChangesGuard] }
        ]
    },
    { path: 'about', component: AboutComponent, canDeactivate: [pendingChangesGuard] },
    { path: 'budget', component: BudgetComponent, canDeactivate: [pendingChangesGuard] },
    { path: 'services', component: ServicesComponent, canDeactivate: [pendingChangesGuard] },
    { path: 'sayings', component: SayingsComponent, canDeactivate: [pendingChangesGuard] },
    { path: 'jokes', component: JokesComponent, canDeactivate: [pendingChangesGuard] },
    { path: 'address-book', component: AddressBookComponent, canDeactivate: [pendingChangesGuard] },
    { path: 'automobiles', component: AutomobilesComponent, canDeactivate: [pendingChangesGuard] },
    { path: 'notebooks', component: NotebooksComponent, canDeactivate: [pendingChangesGuard] },
    { path: 'cars', component: CarsComponent, canDeactivate: [pendingChangesGuard] },
    { path: 'cats', component: CatsComponent, canDeactivate: [pendingChangesGuard] },
    { path: 'dogs', component: DogsComponent, canDeactivate: [pendingChangesGuard] },
    { path: 'medicines', component: MedicinesComponent, canDeactivate: [pendingChangesGuard] },
    { path: 'construction-skills', component: ConstructionSkillsComponent, canDeactivate: [pendingChangesGuard] },
    { path: 'friends', component: FriendsComponent, canDeactivate: [pendingChangesGuard] }
];
