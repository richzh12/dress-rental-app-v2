# Dress Rental App v2

Base de Dia 1 para la webapp de alquiler y venta de vestidos.

## Stack inicial

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL (Neon o Supabase recomendado)

## Requisitos

- Node.js 20+
- npm 10+
- Una base PostgreSQL en la nube

## Configuracion local

1. Instala dependencias:

```bash
npm install
```

2. Crea el archivo de entorno a partir del ejemplo:

```bash
copy .env.example .env
```

3. Configura `DATABASE_URL` con tu cadena de conexion PostgreSQL.
4. Configura Cloudinary para imagenes:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_FOLDER` (opcional, por defecto `dress-rental-app/dresses`)

5. Genera el cliente de Prisma:

```bash
npx prisma generate
```

6. Levanta la app:

```bash
npm run dev
```

La app quedara disponible en `http://localhost:3000`.

## Prisma

- Esquema: `prisma/schema.prisma`
- Config: `prisma.config.ts`
- Migraciones (cuando definas modelos):

```bash
npx prisma migrate dev --name init
```

## Deploy en Vercel

1. Crea un proyecto en Vercel e importa este repositorio.
2. Agrega variables de entorno en Vercel:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_FOLDER` (opcional)
3. Despliega.

## Estado de Dia 1

- Proyecto Next.js inicializado
- Prisma configurado para PostgreSQL
- Build de produccion validado localmente
