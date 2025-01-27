const API_URL = 'http://localhost:3000/api/users';

async function registerUser() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();
    if (response.status === 201) {
        alert('Registration successful!');
        window.location.href = 'index.html';
    } else {
        alert(`Error: ${data.message}`);
    }
}

async function loginUser() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
    });

    const data = await response.json();
    if (response.status === 200) {
        window.location.href = 'main.html';
    } else {
        alert(`Error: ${data.message}`);
    }
}

async function logoutUser() {
    const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
    });

    const data = await response.json();
    if (response.status === 200) {
        alert('Logout successful!');
        window.location.href = 'index.html';
    } else {
        alert(`Error: ${data.message}`);
    }
}

async function fetchUsers() {
    const response = await fetch(API_URL, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    data.forEach(user => {
        const userItem = document.createElement('div');
        userItem.textContent = `${user.username} (${user.email})`;
        userList.appendChild(userItem);
    });
}
