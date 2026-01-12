
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RhDashboardComponent } from './components/rh-dashboard/rh-dashboard.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { VacationRequestComponent } from './components/vacation-request/vacation-request.component';
import { authGuard } from './guards/auth.guard';

export const APP_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'rh', 
    component: RhDashboardComponent,
    canActivate: [authGuard],
    data: { role: 'RH' }
  },
  { 
    path: 'manager', 
    component: ManagerDashboardComponent,
    canActivate: [authGuard],
    data: { role: 'Gestor' }
  },
  { 
    path: 'request-vacation/:id', 
    component: VacationRequestComponent,
    canActivate: [authGuard],
    data: { role: 'Gestor' }
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
