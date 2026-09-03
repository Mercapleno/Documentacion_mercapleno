describe('Módulo de Autenticación - Inicio de Sesión', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/login');
  });

  it('1. Debe mostrar el formulario de inicio de sesión con sus elementos principales', () => {
    cy.get('h2').should('contain.text', 'Iniciar Sesion');
    cy.get('#email').should('be.visible');
    cy.get('#password').should('be.visible');
    cy.get('button[type="submit"]').should('contain.text', 'Ingresar');
    cy.contains('a', 'Registrate aqui').should('be.visible');
    cy.contains('a', 'Recuperala').should('be.visible');
  });

  it('2. Debe procesar credenciales incorrectas y validar la alerta', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: { success: false, message: 'Credenciales incorrectas' }
    }).as('loginInvalid');

    cy.on('window:alert', (str) => {
      expect(str).to.include('Credenciales incorrectas');
    });

    cy.get('#email').type('errado@ejemplo.com');
    cy.get('#password').type('wrongpass');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginInvalid');
  });

  it('3. Debe redirigir y validar alerta cuando el correo no está verificado (HTTP 403)', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 403,
      body: {
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Debes verificar tu correo antes de iniciar sesion.'
      }
    }).as('loginUnverified');

    cy.on('window:alert', (str) => {
      expect(str).to.include('Debes verificar tu correo antes de iniciar sesion.');
    });

    cy.get('#email').type('noverificado@ejemplo.com');
    cy.get('#password').type('Password123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginUnverified');
    cy.url().should('include', '/verificar?email=noverificado%40ejemplo.com');
  });

  it('4. ROL CLIENTE (Rol 3): Debe iniciar sesión directamente y redirigir al Catálogo (/catalogo)', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        user: { id: 10, email: 'cliente@ejemplo.com', id_rol: 3 }
      }
    }).as('loginCliente');

    cy.get('#email').type('cliente@ejemplo.com');
    cy.get('#password').type('Password123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginCliente');
    cy.url().should('include', '/catalogo');
  });

  it('5. ROL EMPLEADO (Rol 2): Simula 2FA, valida alerta de envío de código y redirección a /usuarioC', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        requiresTwoFactor: true,
        pendingToken: 'token-2fa-empleado',
        message: 'Se envio un codigo de seguridad a tu correo.',
        user: { id: 2, email: 'empleado@ejemplo.com', id_rol: 2 }
      }
    }).as('login2FAEmpleado');

    cy.intercept('POST', '**/api/auth/verify-login-code', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Inicio de sesion exitoso',
        user: { id: 2, email: 'empleado@ejemplo.com', id_rol: 2 }
      }
    }).as('verify2FAEmpleado');

    cy.get('#email').type('empleado@ejemplo.com');
    cy.get('#password').type('Password123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@login2FAEmpleado');
    cy.get('#securityCode').should('be.visible').type('123456');
    cy.get('button[type="submit"]').click();

    cy.wait('@verify2FAEmpleado');
    cy.url().should('include', '/usuarioC');
  });

  it('6. ROL ADMINISTRADOR (Rol 1): Simula 2FA y redirige a /usuarioC', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        requiresTwoFactor: true,
        pendingToken: 'token-2fa-admin',
        message: 'Se envio un codigo de seguridad a tu correo.',
        user: { id: 1, email: 'admin@ejemplo.com', id_rol: 1 }
      }
    }).as('login2FAAdmin');

    cy.intercept('POST', '**/api/auth/verify-login-code', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Inicio de sesion exitoso',
        user: { id: 1, email: 'admin@ejemplo.com', id_rol: 1 }
      }
    }).as('verify2FAAdmin');

    cy.get('#email').type('admin@ejemplo.com');
    cy.get('#password').type('Password123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@login2FAAdmin');
    cy.get('#securityCode').should('be.visible').type('654321');
    cy.get('button[type="submit"]').click();

    cy.wait('@verify2FAAdmin');
    cy.url().should('include', '/usuarioC');
  });

  it('7. Protecciones de Ruta: Intento de entrar a /catalogo sin estar autenticado redirige a /login', () => {
    cy.visit('/catalogo');
    cy.url().should('include', '/login?redirect=');
  });

  it('8. Protecciones de Ruta: Intento de entrar a /usuarioC sin autenticación redirige a /login', () => {
    cy.visit('/usuarioC');
    cy.url().should('include', '/login?redirect=');
  });

  it('9. Acceso Denegado (403): Intento de entrar a /admin/users sin autenticación', () => {
    cy.visit('/admin/users');
    cy.url().should('include', '/login?redirect=');
  });

  it('10. Debe permitir cancelar la verificación 2FA y regresar al estado inicial de login', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        requiresTwoFactor: true,
        pendingToken: 'token-temp',
        user: { email: 'admin@ejemplo.com' }
      }
    });

    cy.get('#email').type('admin@ejemplo.com');
    cy.get('#password').type('Password123!');
    cy.get('button[type="submit"]').click();

    cy.get('#securityCode').should('be.visible');
    cy.get('.secondary-btn').click();

    cy.get('#securityCode').should('not.exist');
    cy.get('#email').should('not.be.disabled');
  });
});
