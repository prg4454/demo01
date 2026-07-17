import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ServicesComponent } from './services/services.component';
import { CatsComponent } from './cats/cats.component';
import { DogsComponent } from './dogs/dogs.component';
import { SayingsComponent } from './sayings/sayings.component';
import { JokesComponent } from './jokes/jokes.component';
import { AddressBookComponent } from './address-book/address-book.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'home', component: HomeComponent },
    { path: 'about', component: AboutComponent },
    { path: 'services', component: ServicesComponent },
    { path: 'sayings', component: SayingsComponent },
    { path: 'jokes', component: JokesComponent },
    { path: 'address-book', component: AddressBookComponent },
    { path: 'cats', component: CatsComponent },
    { path: 'dogs', component: DogsComponent }
];
