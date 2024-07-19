const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')  // Diretório onde as imagens serão salvas
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)) // Nomeando o arquivo salvo
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), (req, res) => {
    res.json({ message: 'Imagem recebida!' });
});

app.get('/images', (req, res) => {
    const directoryPath = path.join(__dirname, 'uploads');
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            return res.status(500).send({ message: "Não foi possível acessar as imagens" });
        }
        const imageFiles = files.filter(file => file.endsWith('.jpg') || file.endsWith('.png'));
        res.json(imageFiles);
    });
});

app.use('/uploads', express.static('uploads'));

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
