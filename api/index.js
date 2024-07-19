const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors());

const serviceAccount = require('../dbchaves.json'); // Caminho para a sua chave privada do Firebase

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://imgs-7b388.appspot.com'
});

const bucket = admin.storage().bucket();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    console.error("Erro no upload da imagem: Nenhum arquivo recebido");
    return res.status(400).json({ message: 'Erro no upload da imagem: Nenhum arquivo recebido' });
  }

  const blob = bucket.file(`images/${Date.now()}_${req.file.originalname}`);
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    }
  });

  blobStream.on('error', (err) => {
    console.error("Erro ao fazer upload para o Firebase Storage:", err);
    res.status(500).json({ message: 'Erro ao fazer upload para o Firebase Storage' });
  });

  blobStream.on('finish', () => {
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
    console.log("Imagem enviada para o Firebase Storage:", publicUrl);
    res.json({ message: 'Imagem recebida!', location: publicUrl });
  });

  blobStream.end(req.file.buffer);
});

app.get('/images', async (req, res) => {
  try {
    const [files] = await bucket.getFiles({ prefix: 'images/' });
    const imageUrls = files.map(file => `https://storage.googleapis.com/${bucket.name}/${file.name}`);
    res.json(imageUrls);
  } catch (err) {
    console.error("Erro ao listar objetos no Firebase Storage:", err);
    res.status(500).json({ message: "Não foi possível acessar as imagens" });
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});

module.exports = app;
