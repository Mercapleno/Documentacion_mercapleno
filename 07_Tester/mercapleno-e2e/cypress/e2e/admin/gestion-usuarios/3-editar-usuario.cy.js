describe('Gestión de Usuarios - 3. Editar Usuario Existente', () => {

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


  it('1. Debe abrir el modal "Editar Usuario" con los datos precargados del usuario seleccionado', () => {
    cy.wait('@getUsersList');
    cy.get('table.tabla tbody tr').first().find('.btn-modificar').click();

    cy.get('.modal-overlay').should('be.visible');
    cy.get('.modal-header h2').should('contain.text', 'Editar Usuario');
    cy.get('.modal-body .form-group').contains('label', 'nombre').siblings('input').should('have.value', 'Juan');
    cy.get('.modal-body .form-group').contains('label', 'email').siblings('input').should('have.value', 'juan@ejemplo.com');
  });

  it('2. ERROR VALIDACIÓN: Si se escribe una nueva contraseña, debe tener al menos 6 caracteres', () => {
    cy.wait('@getUsersList');
    cy.get('table.tabla tbody tr').first().find('.btn-modificar').click();

    cy.get('.modal-body input[type="password"]').type('123');
    cy.get('.btn-guardar').click();

    cy.get('.toast.error').should('contain.text', 'La nueva contrasena debe tener al menos 6 caracteres.');
  });

  it('3. ÉXITO: Modifica los datos del usuario y envía la petición PUT correctamente', () => {
    cy.intercept('PUT', '**/api/admin/users/1', {
      statusCode: 200,
      body: { success: true, message: 'Usuario actualizado exitosamente' }
    }).as('updateUser');

    cy.wait('@getUsersList');
    cy.get('table.tabla tbody tr').first().find('.btn-modificar').click();

    cy.get('.modal-body .form-group').contains('label', 'nombre').siblings('input').clear().type('Juan Carlos');
    cy.get('.modal-body .form-group').contains('label', 'direccion').siblings('input').clear().type('Avenida Siempre Viva 742');

    cy.get('.btn-guardar').click();

    cy.wait('@updateUser');
    cy.get('.toast').should('contain.text', 'Usuario actualizado');
    cy.get('.modal-overlay').should('not.exist');
  });

  it('4. Debe permitir cancelar la edición y cerrar el modal sin guardar cambios', () => {
    cy.wait('@getUsersList');
    cy.get('table.tabla tbody tr').first().find('.btn-modificar').click();
    cy.get('.modal-overlay').should('be.visible');

    cy.get('.btn-cancelar').click();
    cy.get('.modal-overlay').should('not.exist');
  });
});
