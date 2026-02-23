import { TestBed } from '@angular/core/testing';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { authGuard } from './auth-guard';
import { AuthService } from './services/auth.service';

describe('authGuard', () => {

  const executeGuard: CanActivateFn = (route, state) =>
    TestBed.runInInjectionContext(() => authGuard(route, state));

  let navigateCalled: boolean;
  let navigateCalledWith: any[];

  const mockRouter = {
    navigate: (commands: any[]) => {
      navigateCalled = true;
      navigateCalledWith = commands;
    }
  };

  // Helper per configurare il test con un dato stato di autenticazione
  function setupGuard(isAuthenticated: boolean) {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: { isAuthenticated: () => isAuthenticated } }
      ]
    });
  }
  beforeEach(() => {
    navigateCalled = false;
    navigateCalledWith = [];
  });

it('should return false and redirect if not authenticated', () => {
    setupGuard(false);
    const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

    if (result !== false) throw new Error(`Expected false, got ${result}`);
    if (!navigateCalled) throw new Error('Expected router.navigate to have been called');
    if (navigateCalledWith[0] !== '/backstage') throw new Error(`Expected navigation to /backstage, got ${navigateCalledWith[0]}`);
  });

  it('should return true if authenticated', () => {
    setupGuard(true);
    const result = executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

    if (result !== true) throw new Error(`Expected true, got ${result}`);
    if (navigateCalled) throw new Error('Expected router.navigate NOT to have been called');
  });

});

