const express = require('express');
const app = express();
const authRoutes = require('../routes/authRoute');
const state = {
    "port": 3000
}

app.use('/api/auth', authRoutes);

app.listen(state.port, () => {
    console.log(`App listening at http://localhost:${state.port}`);
});
