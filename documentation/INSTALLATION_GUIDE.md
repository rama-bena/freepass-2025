# Installation Guide

## Prerequisites

- Node.js (v23.6.x or later) // not tested with lower version
- npm (v10.9.x or later) // not tested with lower version

## Steps

1. **Clone the repository:**

    ```bash
    git clone https://github.com/rama-bena/freepass-2025.git
    ```

    ```bash
    cd freepass-2025
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **TODO: Configure database, i'm using mongodb**

4. **Edit `.env` file**

    - Copy file `.env.example` and rename it `.env`.
    - Edit the configuration to your configuration

5. **Run the application:**

    ```bash
    npm start
    ```

6. **Access the API:**

    The API will be running at `http://localhost:3000`. Documentation about API is available in *TODO*

## Additional Notes

- Use tools like `Postman`, `Insomnia`, `thunder client`, or any other tools to test the API endpoints.
