# Taller TRG — Sistema de gestión moderno

Stack: **React + Vite** → **Vercel** (gratis) + **Supabase** (gratis)

---

## 🆕 Novedades en esta versión

- **Panel rediseñado**: vehículos, clientes, reparaciones del mes (con tendencia y mini-gráfico) e importe facturado del año (con tendencia y mini-gráfico)
- **Nueva reparación simplificada**: sin fecha promesa ni IVA, con importe opcional directo
- **Fotografía de vehículo** opcional, sube y cambia foto desde la ficha del vehículo

---

## 🚀 Guía de instalación paso a paso

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → **New project**
2. Elige un nombre (ej. `taller-trg`) y región **EU West**
3. Espera 1-2 min a que se cree la BD

### 2. Crear la base de datos

1. En el Dashboard → **SQL Editor** → **New query**
2. Copia y pega todo el contenido de `supabase/schema.sql`
3. Pulsa **Run** → debe mostrar "Success"

### 3. Crear usuario administrador

En Supabase → **Authentication** → **Users** → **Add user**:
- Email: el tuyo
- Password: una contraseña segura
- Marca "Auto Confirm User"

### 4. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Rellena con los valores de **Supabase → Settings → API**:
```
VITE_SUPABASE_URL=https://xxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 5. Instalar y arrancar en local

```bash
npm install
npm run dev
```

---

## ☁️ Desplegar en Vercel (gratis)

1. Entra a [vercel.com/new](https://vercel.com/new) e importa este repositorio de GitHub.
2. Vercel detecta automáticamente el preset **Vite** (build command `vite build`, output `dist`).
3. Añade las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) antes de desplegar.
4. Cada `git push` a `main` despliega automáticamente una nueva versión.

---

## ⚠️ Importante: pausa por inactividad

**Supabase** pausa los proyectos gratuitos tras ~7 días de inactividad. Para reactivarla: entra al dashboard → botón **"Restore project"**.

Vercel no requiere reactivación manual: al estar conectado directamente al repo, cada cambio se despliega solo.

---

## 📂 Estructura del proyecto

```
taller-trg/
├── supabase/
│   └── schema.sql
├── src/
│   ├── lib/supabase.js
│   ├── context/AuthContext.jsx
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── EstadoBadge.jsx
│   │   └── MiniSparkline.jsx
│   └── pages/
│       ├── LoginPage.jsx
│       ├── DashboardPage.jsx
│       ├── ReparacionesPage.jsx
│       ├── ReparacionDetallePage.jsx
│       ├── NuevaReparacionPage.jsx
│       ├── ClientesPage.jsx
│       ├── ClienteDetallePage.jsx
│       ├── VehiculosPage.jsx
│       └── VehiculoDetallePage.jsx
├── vite.config.js
├── tailwind.config.js
└── package.json
```
