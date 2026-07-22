import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MenuComponent } from './menu/menu.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private router = inject(Router);

  title = 'demo01';

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (!event.urlAfterRedirects.startsWith('/home')) {
          return;
        }

        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }

        if (typeof document !== 'undefined') {
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
      });
  }
}
