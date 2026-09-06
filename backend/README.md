# Backend API with Sequelize ORM

Express & Node.js backend server with Sequelize ORM for `demo01`.

## Features

- **Express.js** REST API with CORS and JSON support.
- **Sequelize ORM** integrated with models and associations.
- **SQLite** default database for zero-config local development (stored in
  `database.sqlite`).
- Easily configurable via `.env` to connect to **PostgreSQL** or **MySQL**.
- Full CRUD endpoints for the sample `Item` model.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)

## Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment Configuration: The `.env` file defaults to:
   ```env
   PORT=5000
   NODE_ENV=development
   DB_DIALECT=sqlite
   DB_STORAGE=./database.sqlite
   ```
   To use PostgreSQL or MySQL instead, update `DB_DIALECT`, `DB_HOST`,
   `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.

## Running the Server

- **Development Mode (with auto-reload):**
  ```bash
  npm run dev
  ```

- **Production / Standard Mode:**
  ```bash
  npm start
  ```

## API Endpoints

### System Endpoints

| Method | Endpoint      | Description                       |
| :----- | :------------ | :-------------------------------- |
| `GET`  | `/`           | Root status message               |
| `GET`  | `/api/health` | Service and database health check |

### Cats Endpoint (Sequelize)

`GET /api/cats` returns all cats as a JSON array, ordered by ID descending.
Each cat has `id`, `name`, `breed`, `owner`, `reason`, `checkIn`, `status`,
`vet`, and `nextAppointment` fields. The `cats` table is created automatically
on server startup. An empty table returns `[]`; browser IndexedDB cats are
not automatically imported into SQLite.

### Item CRUD Endpoints (Sequelize)

| Method   | Endpoint         | Description             | Sample Body                                                                          |
| :------- | :--------------- | :---------------------- | :----------------------------------------------------------------------------------- |
| `GET`    | `/api/items`     | List all items          | -                                                                                    |
| `GET`    | `/api/items/:id` | Get item by ID          | -                                                                                    |
| `POST`   | `/api/items`     | Create a new item       | `{"title": "Buy groceries", "description": "Milk, eggs, bread", "completed": false}` |
| `PUT`    | `/api/items/:id` | Update an existing item | `{"completed": true}`                                                                |
| `DELETE` | `/api/items/:id` | Delete an item          | -                                                                                    |
