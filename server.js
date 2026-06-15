const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// Configurações essenciais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do Banco de Dados SQLite (database.db)
const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erro ao abrir o banco de dados:", err.message);
    } else {
        console.log("Conectado ao banco de dados SQLite em:", dbPath);
        // Cria a tabela de usuários se ela não existir
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )`);
    }
});

// 1. ROTA DE REGISTRO (CADASTRO)
app.post('/register', (req, res) => {
    console.log("Dados recebidos no Registro:", req.body);
    const { email, nome, password } = req.body;

    // Validação estrita para não salvar campos vazios
    if (!email || !nome || !password || email.trim() === "" || nome.trim() === "" || password.trim() === "") {
        return res.status(400).json({ message: "Preencha tudo!" });
    }

    // Insere o usuário no banco de dados
    const query = `INSERT INTO usuarios (nome, email, password) VALUES (?, ?, ?)`;
    db.run(query, [nome, email, password], function(err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) {
                return res.status(400).json({ message: "Este email já está cadastrado!" });
            }
            return res.status(500).json({ message: "Erro ao salvar no banco de dados." });
        }
        
        // Retorna sucesso para o front-end
        return res.status(201).json({ 
            message: "Cadastro realizado com sucesso!",
            user: { nome, email }
        });
    });
});

// 2. ROTA DE LOGIN
app.post('/login', (req, res) => {
    console.log("Tentativa de Login:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Por favor, preencha todos os campos!" });
    }

    const query = `SELECT * FROM usuarios WHERE email = ? AND password = ?`;
    db.get(query, [email, password], (err, user) => {
        if (err) {
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
        if (!user) {
            return res.status(400).json({ message: "Email ou senha incorretos!" });
        }

        // Se achou o usuário, retorna os dados dele para o Front-end logar
        return res.status(200).json({
            message: "Login efetuado com sucesso!",
            nome: user.nome,
            email: user.email
        });
    });
});

// Inicia o servidor na porta 3000
app.listen(3000, () => {
    console.log("=================================================");
    console.log("Servidor Click Gás rodando com sucesso na porta 3000!");
    console.log("=================================================");
});