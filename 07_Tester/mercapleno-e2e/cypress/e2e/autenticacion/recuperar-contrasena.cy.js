describe('Módulo de Autenticación - Recuperación de Contraseña', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/recuperar');
  });

  it('1. Debe renderizar el formulario inicial de solicitud de código', () => {
    cy.get('h2').should('contain.text', 'Recuperar Contrasena');
    cy.get('#resetEmail').should('be.visible');
    cy.get('button[type="submit"]').should('contain.text', 'Enviar Codigo');
  });

  it('2. ERROR BACKEND: Muestra error si el correo no existe en la base de datos (HTTP 404)', () => {
    cy.intercept('POST', '**/api/auth/request-password-reset', {
      statusCode: 404,
      body: { success: false, message: 'No existe una cuenta registrada con este correo' }
    }).as('requestResetError');

    cy.get('#resetEmail').type('inexistente@ejemplo.com');
    cy.get('button[type="submit"]').click();

    cy.wait('@requestResetError');
    cy.get('.message.error').should('contain.text', 'No existe una cuenta registrada con este correo');
  });

  it('3. ÉXITO PASO 1: Envía solicitud y transiciona al Paso 2 para ingresar el código y nueva contraseña', () => {
    cy.intercept('POST', '**/api/auth/request-password-reset', {
      statusCode: 200,
      body: { success: true, message: 'Si el correo existe, se envio un codigo.' }
    }).as('requestResetSuccess');

    cy.get('#resetEmail').type('usuario@ejemplo.com');
    cy.get('button[type="submit"]').click();

    cy.wait('@requestResetSuccess');
    cy.get('.message.success').should('be.visible');

    cy.get('#resetCode').should('be.visible');
    cy.get('#newPassword').should('be.visible');
    cy.get('#confirmPassword').should('be.visible');
  });

  it('4. ERROR CLIENTE: Muestra error si las contraseñas no coinciden en el Paso 2', () => {
    cy.intercept('POST', '**/api/auth/request-password-reset', {
      statusCode: 200,
      body: { success: true }
    });

    cy.get('#resetEmail').type('usuario@ejemplo.com');
    cy.get('button[type="submit"]').click();

    cy.get('#resetCode').type('123456');
    cy.get('#newPassword').type('ClaveNueva123!');
    cy.get('#confirmPassword').type('ClaveDiferente123!');

    cy.get('button[type="submit"]').click();

    cy.get('.message.error').should('contain.text', 'Las contrasenas no coinciden.');
  });

  it('5. ERROR BACKEND PASO 2: Muestra error si el código de verificación es inválido o expiró', () => {
    cy.intercept('POST', '**/api/auth/request-password-reset', {
      statusCode: 200,
      body: { success: true }
    });

    cy.intercept('POST', '**/api/auth/reset-password', {
      statusCode: 400,
      body: { success: false, message: 'El codigo ingresado es incorrecto o ya expiro' }
    }).as('resetFail');

    cy.get('#resetEmail').type('usuario@ejemplo.com');
    cy.get('button[type="submit"]').click();

    cy.get('#resetCode').type('000000');
    cy.get('#newPassword').type('ClaveNueva123!');
    cy.get('#confirmPassword').type('ClaveNueva123!');

    cy.get('button[type="submit"]').click();

    cy.wait('@resetFail');
    cy.get('.message.error').should('contain.text', 'El codigo ingresado es incorrecto o ya expiro');
  });

  it('6. ÉXITO COMPLETO: Restablece la contraseña exitosamente y redirige al inicio de sesión', () => {
    cy.intercept('POST', '**/api/auth/request-password-reset', {
      statusCode: 200,
      body: { success: true }
    });

    cy.intercept('POST', '**/api/auth/reset-password', {
      statusCode: 200,
      body: { success: true, message: 'Contrasena actualizada correctamente.' }
    }).as('resetSuccess');

    cy.get('#resetEmail').type('usuario@ejemplo.com');
    cy.get('button[type="submit"]').click();

    cy.get('#resetCode').type('654321');
    cy.get('#newPassword').type('ClaveNueva123!');
    cy.get('#confirmPassword').type('ClaveNueva123!');

    cy.get('button[type="submit"]').click();

    cy.wait('@resetSuccess');
    cy.get('.message.success').should('contain.text', 'Contrasena actualizada correctamente.');
    cy.url().should('include', '/login');
  });
});
