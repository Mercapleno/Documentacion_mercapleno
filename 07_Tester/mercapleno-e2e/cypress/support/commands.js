// ***********************************************
// cypress/support/commands.js
// Comandos personalizados reutilizables
// ***********************************************

/**
 * cy.loginAdmin()
 * Inicia sesion como Administrador usando cy.intercept (sin servidor real).
 * Util para tests que requieren sesion previa sin pasar por el flujo de login.
 */
Cypress.Commands.add('loginAdmin', () => {
  cy.intercept('POST', '**/api/auth/login', {
    statusCode: 200,
    body: {
      success: true,
      requiresTwoFactor: true,
      pendingToken: 'token-2fa-admin-mock',
      user: { id: 1, email: 'admin@ejemplo.com', id_rol: 1 }
    }
  }).as('loginAdminMock');

  cy.intercept('POST', '**/api/auth/verify-login-code', {
    statusCode: 200,
    body: {
      success: true,
      user: { id: 1, email: 'admin@ejemplo.com', id_rol: 1 }
    }
  }).as('verify2FAMock');

  cy.visit('/login');
  cy.get('#email').type('admin@ejemplo.com');
  cy.get('#password').type('Password123!');
  cy.get('button[type="submit"]').click();
  cy.wait('@loginAdminMock');
  cy.get('#securityCode').type('123456');
  cy.get('button[type="submit"]').click();
  cy.wait('@verify2FAMock');
});

/**
 * cy.setAdminSession()
 * Inyecta directamente el usuario admin en localStorage
 * para saltar el login en tests de modulos admin.
 */
Cypress.Commands.add('setAdminSession', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('user', JSON.stringify({
      id: 1,
      nombre: 'Admin',
      apellido: 'Mercapleno',
      email: 'admin@ejemplo.com',
      id_rol: 1
    }));
  });
});
