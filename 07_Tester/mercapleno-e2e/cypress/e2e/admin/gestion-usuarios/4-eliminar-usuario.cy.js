describe('Gestión de Usuarios - 4. Eliminar Usuario', () => {

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


  it('1. Debe cancelar la eliminación si el usuario responde Cancelar a window.confirm', () => {
    cy.wait('@getUsersList');
    cy.on('window:confirm', () => false);

    cy.get('table.tabla tbody tr').first().find('.btn-eliminar').click();
    cy.get('table.tabla tbody tr').should('have.length', 3);
  });

  it('2. ERROR BACKEND: Muestra toast si la API falla al intentar eliminar (HTTP 500)', () => {
    cy.intercept('DELETE', '**/api/admin/users/1', {
      statusCode: 500,
      body: { success: false, message: 'No se puede eliminar un usuario con registros asociados' }
    }).as('deleteFail');

    cy.wait('@getUsersList');
    cy.on('window:confirm', () => true);

    cy.get('table.tabla tbody tr').first().find('.btn-eliminar').click();

    cy.wait('@deleteFail');
    cy.get('.toast.error').should('contain.text', 'No se puede eliminar un usuario con registros asociados');
  });

  it('3. ÉXITO: Elimina el usuario al aceptar el diálogo de confirmación', () => {
    cy.intercept('DELETE', '**/api/admin/users/1', {
      statusCode: 200,
      body: { success: true, message: 'Usuario eliminado' }
    }).as('deleteSuccess');

    cy.wait('@getUsersList');
    cy.on('window:confirm', () => true);

    cy.get('table.tabla tbody tr').first().find('.btn-eliminar').click();

    cy.wait('@deleteSuccess');
    cy.get('.toast').should('contain.text', 'Usuario eliminado');
  });
});
