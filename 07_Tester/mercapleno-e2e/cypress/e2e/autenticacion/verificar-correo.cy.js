describe('Módulo de Autenticación - Verificación de Correo', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('1. Debe autocompletar el campo de correo desde el query parameter ?email=', () => {
    cy.visit('/verificar?email=usuario@ejemplo.com');
    cy.get('#verifyEmail').should('have.value', 'usuario@ejemplo.com');
    cy.get('#verificationCode').should('be.visible');
    cy.get('button[type="submit"]').should('contain.text', 'Verificar');
    cy.contains('button', 'Reenviar Codigo').should('be.visible');
  });

  it('2. ERROR BACKEND: Muestra error si el código de verificación es incorrecto (HTTP 400)', () => {
    cy.intercept('POST', '**/api/auth/verify-email', {
      statusCode: 400,
      body: { success: false, message: 'Codigo de verificacion incorrecto' }
    }).as('verifyWrongCode');

    cy.visit('/verificar?email=usuario@ejemplo.com');
    cy.get('#verificationCode').type('000000');
    cy.get('button[type="submit"]').click();

    cy.wait('@verifyWrongCode');
    cy.get('.message.error').should('contain.text', 'Codigo de verificacion incorrecto');
  });

  it('3. ÉXITO: Verifica el correo correctamente y redirige a la pantalla de login', () => {
    cy.intercept('POST', '**/api/auth/verify-email', {
      statusCode: 200,
      body: { success: true, message: 'Correo verificado correctamente.' }
    }).as('verifySuccess');

    cy.visit('/verificar?email=usuario@ejemplo.com');
    cy.get('#verificationCode').type('123456');
    cy.get('button[type="submit"]').click();

    cy.wait('@verifySuccess');
    cy.get('.message.success').should('contain.text', 'Correo verificado correctamente.');
    cy.url().should('include', '/login');
  });

  it('4. ERROR CLIENTE: Muestra error si se intenta reenviar código sin ingresar el correo', () => {
    cy.visit('/verificar');
    cy.get('#verifyEmail').clear();
    cy.contains('button', 'Reenviar Codigo').click();
    cy.get('.message.error').should('contain.text', 'Ingresa tu correo para reenviar el codigo.');
  });

  it('5. ÉXITO: Procesa correctamente la solicitud de reenvío de código', () => {
    cy.intercept('POST', '**/api/auth/resend-verification', {
      statusCode: 200,
      body: { success: true, message: 'Codigo reenviado. Revisa tu correo.' }
    }).as('resendSuccess');

    cy.visit('/verificar?email=usuario@ejemplo.com');
    cy.contains('button', 'Reenviar Codigo').click();

    cy.wait('@resendSuccess');
    cy.get('.message.success').should('contain.text', 'Codigo reenviado. Revisa tu correo.');
  });
});
