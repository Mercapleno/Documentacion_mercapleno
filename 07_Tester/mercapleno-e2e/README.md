# Mercapleno E2E - Pruebas Cypress

Proyecto unificado de pruebas end-to-end con Cypress para el sistema Mercapleno.

## Requisitos previos

- Node.js >= 18
- Docker con los contenedores de Mercapleno corriendo:
  - Frontend: http://localhost:5173
  - Backend:  http://localhost:4000

## Instalacion

```bash
npm install
```

## Ejecutar pruebas

```bash
# Abrir Cypress UI (modo interactivo)
npm run cy:open

# Correr todas las pruebas en modo headless
npm run cy:run

# Solo pruebas de autenticacion
npm run cy:run:autenticacion

# Solo pruebas del modulo admin (mock)
npm run cy:run:admin

# Flujo E2E completo del Administrador (requiere backend real)
npm run cy:run:flujo-admin
```

## Estructura

```
cypress/
├── e2e/
│   ├── autenticacion/
│   │   ├── login.cy.js               # 10 casos: login, 2FA, roles, rutas protegidas
│   │   ├── registro.cy.js            # 7 casos: validaciones, errores backend, exito
│   │   ├── verificar-correo.cy.js    # 5 casos: verificacion de email
│   │   └── recuperar-contrasena.cy.js
│   └── admin/
│       ├── flujo-administrador.cy.js # E2E real: login 2FA → productos → reportes
│       └── gestion-usuarios/
│           ├── 1-listar-usuarios.cy.js   # 6 casos: listado, filtros
│           ├── 2-crear-usuario.cy.js     # 5 casos: validaciones, exito
│           ├── 3-editar-usuario.cy.js    # 4 casos: precarga, validacion, edicion
│           └── 4-eliminar-usuario.cy.js  # 3 casos: cancelar, error, exito
├── fixtures/
│   ├── usuarios.json   # Datos de usuarios de prueba por rol
│   └── example.json
└── support/
    ├── commands.js     # Comandos: cy.loginAdmin(), cy.setAdminSession()
    └── e2e.js
```

## Tipos de prueba

| Spec | Tipo | Requiere backend real |
|---|---|---|
| `autenticacion/*.cy.js` | Mock (cy.intercept) | No |
| `admin/gestion-usuarios/*.cy.js` | Mock (cy.intercept) | No |
| `admin/flujo-administrador.cy.js` | E2E real | **Si** |
