describe('Módulo de Autenticación - Registro de Usuarios', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.intercept('GET', '**/api/auth/document-types*', {
      statusCode: 200,
      body: {
        tipos_identificacion: [
          { id: 1, nombre: 'Cédula de Ciudadanía' },
          { id: 2, nombre: 'Tarjeta de Identidad' },
          { id: 3, nombre: 'Pasaporte' }
        ]
      }
    }).as('getDocumentTypes');

    cy.visit('/registro');
  });

  it('1. Debe mostrar todos los campos obligatorios del formulario de registro', () => {
    cy.get('#nombre').should('be.visible');
    cy.get('#apellido').should('be.visible');
    cy.get('#id_tipo_identificacion').should('be.visible');
    cy.get('#numero_identificacion').should('be.visible');
    cy.get('#fecha_nacimiento').should('be.visible');
    cy.get('#email').should('be.visible');
    cy.get('#direccion').should('be.visible');
    cy.get('#password').should('be.visible');
    cy.get('button[type="submit"]').should('contain.text', 'Enviar');
  });

  it('2. Debe mostrar error en pantalla si falla la carga de tipos de documento (HTTP 500)', () => {
    cy.intercept('GET', '**/api/auth/document-types*', {
      statusCode: 500,
      body: { message: 'Error de servidor' }
    }).as('getDocTypesFail');

    cy.visit('/registro');
    cy.wait('@getDocTypesFail');
    cy.contains('No se pudieron cargar los tipos de identificacion.').should('be.visible');
  });

  it('3. ERROR REGLA DE NEGOCIO: Menores de 10 años no pueden registrarse', () => {
    cy.wait('@getDocumentTypes');

    cy.get('#nombre').type('Carlitos');
    cy.get('#apellido').type('Perez');
    cy.get('#id_tipo_identificacion').select('1');
    cy.get('#numero_identificacion').type('1098765432');

    const today = new Date();
    const underageYear = today.getFullYear() - 5;
    cy.get('#fecha_nacimiento').type(`${underageYear}-01-01`);

    cy.get('#email').type('nino@ejemplo.com');
    cy.get('#direccion').type('Calle Falsa 123');
    cy.get('#password').type('Password123!');

    cy.get('button[type="submit"]').click();
    cy.get('.message.error').should('contain.text', 'Debes tener al menos 10 anos para registrarte');
  });

  it('4. ERROR BACKEND: Correo electrónico ya registrado previamente', () => {
    cy.wait('@getDocumentTypes');

    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 400,
      body: { success: false, message: 'El correo electronico ya se encuentra registrado.' }
    }).as('registerDupEmail');

    cy.get('#nombre').type('Juan');
    cy.get('#apellido').type('Perez');
    cy.get('#id_tipo_identificacion').select('1');
    cy.get('#numero_identificacion').type('1098765432');
    cy.get('#fecha_nacimiento').type('1995-05-15');
    cy.get('#email').type('duplicado@ejemplo.com');
    cy.get('#direccion').type('Carrera 45 # 10-20');
    cy.get('#password').type('Password123!');

    cy.get('button[type="submit"]').click();

    cy.wait('@registerDupEmail');
    cy.get('.message.error').should('contain.text', 'El correo electronico ya se encuentra registrado.');
  });

  it('5. ERROR BACKEND: Número de identificación ya registrado previamente', () => {
    cy.wait('@getDocumentTypes');

    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 400,
      body: { success: false, message: 'El numero de identificacion ya se encuentra registrado.' }
    }).as('registerDupDoc');

    cy.get('#nombre').type('Pedro');
    cy.get('#apellido').type('Gomez');
    cy.get('#id_tipo_identificacion').select('1');
    cy.get('#numero_identificacion').type('1111222333');
    cy.get('#fecha_nacimiento').type('1990-08-20');
    cy.get('#email').type('pedro@ejemplo.com');
    cy.get('#direccion').type('Calle 50');
    cy.get('#password').type('Password123!');

    cy.get('button[type="submit"]').click();

    cy.wait('@registerDupDoc');
    cy.get('.message.error').should('contain.text', 'El numero de identificacion ya se encuentra registrado.');
  });

  it('6. ERROR CONEXIÓN: Fallo del servidor de base de datos durante el registro (HTTP 500)', () => {
    cy.wait('@getDocumentTypes');

    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 500,
      body: { success: false, message: 'Error de servidor' }
    }).as('registerFail500');

    cy.get('#nombre').type('Ana');
    cy.get('#apellido').type('Rojas');
    cy.get('#id_tipo_identificacion').select('1');
    cy.get('#numero_identificacion').type('555444333');
    cy.get('#fecha_nacimiento').type('1992-11-05');
    cy.get('#email').type('ana@ejemplo.com');
    cy.get('#direccion').type('Calle 12');
    cy.get('#password').type('Password123!');

    cy.get('button[type="submit"]').click();

    cy.wait('@registerFail500');
    cy.get('.message.error').should('be.visible');
  });

  it('7. ÉXITO: Registro correcto del usuario y redirección a verificación de correo con query param', () => {
    cy.wait('@getDocumentTypes');

    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 201,
      body: {
        success: true,
        message: 'Registro exitoso. Revisa tu correo para el codigo.'
      }
    }).as('registerSuccess');

    cy.get('#nombre').type('Juan');
    cy.get('#apellido').type('Perez');
    cy.get('#id_tipo_identificacion').select('1');
    cy.get('#numero_identificacion').type('1098765432');
    cy.get('#fecha_nacimiento').type('1995-05-15');
    cy.get('#email').type('juan.perez@ejemplo.com');
    cy.get('#direccion').type('Carrera 45 # 10-20');
    cy.get('#password').type('Password123!');

    cy.get('button[type="submit"]').click();

    cy.wait('@registerSuccess');
    cy.get('.message.success').should('contain.text', 'Registro exitoso. Revisa tu correo para el codigo.');
    cy.url().should('include', '/verificar?email=juan.perez%40ejemplo.com');
  });
});
