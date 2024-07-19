const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors());

// Cria o diretório de uploads se ele não existir
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)  // Diretório onde as imagens serão salvas
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)) // Nomeando o arquivo salvo
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            console.error("Erro no upload da imagem: Nenhum arquivo recebido");
            return res.status(400).json({ message: 'Erro no upload da imagem: Nenhum arquivo recebido' });
        }
        console.log("Imagem recebida:", req.file);
        res.json({ message: 'Imagem recebida!' });
    } catch (error) {
        console.error("Erro no upload da imagem:", error);
        res.status(500).json({ message: 'Erro no upload da imagem' });
    }
});

app.get('/images', (req, res) => {
    console.log("Acessando o diretório:", uploadDir);

    fs.readdir(uploadDir, function (err, files) {
        if (err) {
            console.error("Erro ao ler o diretório:", err);
            return res.status(500).send({ message: "Não foi possível acessar as imagens" });
        }

        console.log("Arquivos encontrados:", files);

        const imageFiles = files.filter(file => file.endsWith('.jpg') || file.endsWith('.png'));
        console.log("Imagens filtradas:", imageFiles);
        res.json(imageFiles);
    });
});

app.use('/uploads', express.static(uploadDir));

module.exports = app;
