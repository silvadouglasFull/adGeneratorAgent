This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Bancos locais com Docker Compose

O projeto possui PostgreSQL e Redis locais via Docker Compose em `docker-compose.yml`.

### Variáveis de ambiente

As credenciais são lidas de um arquivo de ambiente informado no comando.
Use `.env.local` por padrão; se preferir, pode usar `.env`.

PostgreSQL:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

Redis:

- `REDIS_USERNAME`
- `REDIS_PASSWORD`
- `REDIS_PORT`

### Subir e parar os containers

```bash
docker compose --env-file .env.local up -d
docker compose --env-file .env.local down
```

Alternativa usando `.env`:

```bash
docker compose --env-file .env up -d
docker compose --env-file .env down
```

### Verificar saúde dos containers

```bash
docker ps
docker compose logs -f postgres
docker compose logs -f redis
```

### Testar autenticação no Redis

```bash
docker exec -it ad-generator-redis redis-cli --user "$REDIS_USERNAME" -a "$REDIS_PASSWORD" ping
```

Sem credenciais válidas, a conexão deve falhar.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
