describe('Gestión de Usuarios - 1. Listar y Filtrar Usuarios', () => {

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


  it('1. Debe cargar y renderizar la tabla con la lista de usuarios', () => {
    cy.wait('@getUsersList');
    cy.get('table.tabla').should('be.visible');
    cy.get('table.tabla tbody tr').should('have.length', 3);
    cy.contains('td', 'juan@ejemplo.com').should('be.visible');
    cy.contains('td', 'maria@ejemplo.com').should('be.visible');
    cy.contains('td', 'carlos@ejemplo.com').should('be.visible');
  });

  it('2. Debe filtrar la tabla por nombre o por correo electrónico', () => {
    cy.wait('@getUsersList');

    cy.get('.input-busqueda[placeholder="Buscar por nombre o email"]').type('Maria');
    cy.get('table.tabla tbody tr').should('have.length', 1);
    cy.contains('td', 'maria@ejemplo.com').should('be.visible');
    cy.contains('td', 'juan@ejemplo.com').should('not.exist');
  });

  it('3. Debe filtrar la tabla por ID o por Número de Documento', () => {
    cy.wait('@getUsersList');

    cy.get('.input-busqueda[placeholder="Documento"]').type('98765432');
    cy.get('table.tabla tbody tr').should('have.length', 1);
    cy.contains('td', 'maria@ejemplo.com').should('be.visible');
  });

  it('4. Debe filtrar la tabla según el Rol seleccionado en el dropdown', () => {
    cy.wait('@getUsersList');
    cy.wait('@getRoles');

    cy.get('.select-filtro-rol').select('1');
    cy.get('table.tabla tbody tr').should('have.length', 1);
    cy.contains('td', 'juan@ejemplo.com').should('be.visible');
  });

  it('5. Debe permitir limpiar los filtros al presionar el botón "✕ Limpiar"', () => {
    cy.wait('@getUsersList');
    cy.get('.input-busqueda[placeholder="Buscar por nombre o email"]').type('Juan');
    cy.get('table.tabla tbody tr').should('have.length', 1);

    cy.get('.btn-limpiar').click();
    cy.get('table.tabla tbody tr').should('have.length', 3);
  });

  it('6. Debe mostrar la celda "Sin usuarios" si la lista está vacía o no hay coincidencias', () => {
    cy.intercept('GET', '**/api/admin/users*', {
      statusCode: 200,
      body: { usuarios: [] }
    }).as('getEmptyUsersList');

    cy.visit('/admin/users', {
      onBeforeLoad(win) {
        win.localStorage.setItem('user', JSON.stringify({ id: 1, email: 'admin@ejemplo.com', id_rol: 1 }));
      }
    });

    cy.wait('@getEmptyUsersList');
    cy.get('.td-empty').should('contain.text', 'Sin usuarios');
  });
});
