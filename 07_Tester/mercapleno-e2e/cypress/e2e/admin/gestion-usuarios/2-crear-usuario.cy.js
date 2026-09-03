describe('Gestión de Usuarios - 2. Crear Nuevo Usuario', () => {

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();

    cy.intercept('GET', '**/api/admin/users/roles*', {
      statusCode: 200,
      body: {
        roles: [
          { id: 1, nombre: 'Administrador' },
          { id: 2, nombre: 'Empleado' },
          { id: 3, nombre: 'Cliente' }
        ]
      }
    }).as('getRoles');

    cy.intercept('GET', '**/api/auth/document-types*', {
      statusCode: 200,
      body: {
        tipos_identificacion: [
          { id: 1, nombre: 'Cédula de Ciudadanía' },
          { id: 2, nombre: 'Tarjeta de Identidad' }
        ]
      }
    }).as('getDocTypes');

    cy.intercept('GET', '**/api/admin/users*', {
      statusCode: 200,
      body: {
        usuarios: [
          { id: 1, nombre: 'Juan', apellido: 'Perez', email: 'juan@ejemplo.com', id_rol: 1, id_tipo_identificacion: 1, numero_identificacion: '10987654' },
          { id: 2, nombre: 'Maria', apellido: 'Gomez', email: 'maria@ejemplo.com', id_rol: 2, id_tipo_identificacion: 1, numero_identificacion: '98765432' },
          { id: 3, nombre: 'Carlos', apellido: 'Rojas', email: 'carlos@ejemplo.com', id_rol: 3, id_tipo_identificacion: 2, numero_identificacion: '45678901' }
        ]
      }
    }).as('getUsersList');

    cy.visit('/admin/users', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user', JSON.stringify({ id: 1, nombre: 'Admin', apellido: 'User', email: 'admin@ejemplo.com', id_rol: 1 }));
      }
    });
  });


  it('1. Debe abrir el modal de "Nuevo Usuario" al presionar el botón correspondiente', () => {
    cy.get('.btn-crear').contains('Nuevo Usuario').click();
    cy.get('.modal-overlay').should('be.visible');
    cy.get('.modal-header h2').should('contain.text', 'Nuevo Usuario');
  });

  it('2. ERROR VALIDACIÓN: Muestra toast si faltan campos requeridos', () => {
    cy.get('.btn-crear').contains('Nuevo Usuario').click();
    cy.get('.btn-guardar').click();

    cy.get('.toast.error').should('contain.text', 'Nombre es obligatorio.');
  });

  it('3. ERROR VALIDACIÓN: Muestra toast si la contraseña tiene menos de 6 caracteres', () => {
    cy.get('.btn-crear').contains('Nuevo Usuario').click();

    cy.get('.modal-body .form-group').contains('label', 'nombre').siblings('input').type('Carlos');
    cy.get('.modal-body .form-group').contains('label', 'apellido').siblings('input').type('Lopez');
    cy.get('.modal-body .form-group').contains('label', 'email').siblings('input').type('carlos@ejemplo.com');
    cy.get('.modal-body .form-group').contains('label', 'direccion').siblings('input').type('Calle 100');
    cy.get('.modal-body .form-group').contains('label', 'numero identificacion').siblings('input').type('12345678');
    cy.get('.modal-body input[type="date"]').type('1990-01-01');
    cy.get('.modal-body input[type="password"]').type('123');

    cy.get('.btn-guardar').click();
    cy.get('.toast.error').should('contain.text', 'La contrasena debe tener al menos 6 caracteres.');
  });

  it('4. ERROR BACKEND: Captura error cuando el servidor retorna un fallo al crear (HTTP 400)', () => {
    cy.intercept('POST', '**/api/admin/users', {
      statusCode: 400,
      body: { success: false, message: 'El correo electronico ya existe en el sistema.' }
    }).as('createUserFail');

    cy.get('.btn-crear').contains('Nuevo Usuario').click();

    cy.get('.modal-body .form-group').contains('label', 'nombre').siblings('input').type('Carlos');
    cy.get('.modal-body .form-group').contains('label', 'apellido').siblings('input').type('Lopez');
    cy.get('.modal-body .form-group').contains('label', 'email').siblings('input').type('duplicado@ejemplo.com');
    cy.get('.modal-body .form-group').contains('label', 'direccion').siblings('input').type('Calle 100');
    cy.get('.modal-body .form-group').contains('label', 'numero identificacion').siblings('input').type('12345678');
    cy.get('.modal-body input[type="date"]').type('1990-01-01');
    cy.get('.modal-body input[type="password"]').type('Password123!');

    cy.get('.btn-guardar').click();

    cy.wait('@createUserFail');
    cy.get('.toast.error').should('contain.text', 'El correo electronico ya existe en el sistema.');
  });

  it('5. ÉXITO: Crea un usuario correctamente y actualiza la lista', () => {
    cy.intercept('POST', '**/api/admin/users', {
      statusCode: 201,
      body: { success: true, message: 'Usuario creado exitosamente' }
    }).as('createUserSuccess');

    cy.get('.btn-crear').contains('Nuevo Usuario').click();

    cy.get('.modal-body .form-group').contains('label', 'nombre').siblings('input').type('Nuevo');
    cy.get('.modal-body .form-group').contains('label', 'apellido').siblings('input').type('Usuario');
    cy.get('.modal-body .form-group').contains('label', 'email').siblings('input').type('nuevo@ejemplo.com');
    cy.get('.modal-body .form-group').contains('label', 'direccion').siblings('input').type('Carrera 50');
    cy.get('.modal-body .form-group').contains('label', 'numero identificacion').siblings('input').type('99887766');
    cy.get('.modal-body input[type="date"]').type('1995-05-20');
    cy.get('.modal-body input[type="password"]').type('SecurePass123!');

    cy.get('.btn-guardar').click();

    cy.wait('@createUserSuccess');
    cy.get('.toast').should('contain.text', 'Usuario creado');
    cy.get('.modal-overlay').should('not.exist');
  });
});
